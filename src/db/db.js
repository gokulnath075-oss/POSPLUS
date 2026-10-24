import Dexie from 'dexie';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SETTINGS, INITIAL_USERS } from './seedData';
import { getEffectiveCloudCredentials } from '../config/databaseConfig';
import { syncSaleToCloud, syncCustomerToCloud } from '../services/cloudSync';

export const db = new Dexie('PosPlusClothingDB');

db.version(1).stores({
  products: '++id, name, brand, category, gender, hsn',
  customers: '++id, name, &phone, loyaltyPoints, creditBalance, totalSpent',
  sales: '++id, &invoiceNo, date, customerPhone, paymentMethod, netTotal, status',
  heldBills: '++id, heldAt, customerPhone',
  returns: '++id, &returnNo, originalInvoiceNo, date',
  expenses: '++id, date, category, amount',
  settings: 'key',
});

db.version(2).stores({
  products: '++id, name, brand, category, gender, hsn',
  customers: '++id, name, &phone, loyaltyPoints, creditBalance, totalSpent',
  sales: '++id, &invoiceNo, date, customerPhone, paymentMethod, netTotal, status',
  heldBills: '++id, heldAt, customerPhone',
  returns: '++id, &returnNo, originalInvoiceNo, date',
  expenses: '++id, date, category, amount',
  settings: 'key',
  users: '++id, &username, role, pin',
});

// Seed initial data if database is fresh
export async function initializeDatabase() {
  const productCount = await db.products.count();
  if (productCount === 0) {
    await db.products.bulkAdd(INITIAL_PRODUCTS);
  }

  const customerCount = await db.customers.count();
  if (customerCount === 0) {
    await db.customers.bulkAdd(INITIAL_CUSTOMERS);
  }

  const settingsExist = await db.settings.get('store_settings');
  if (!settingsExist) {
    await db.settings.put({ key: 'store_settings', value: INITIAL_SETTINGS });
  }

  const userCount = await db.users.count();
  if (userCount === 0) {
    await db.users.bulkAdd(INITIAL_USERS);
  }
}

// User Authentication & Management
export async function authenticateUser(usernameOrRole, pin) {
  const cleanInput = (usernameOrRole || '').trim().toLowerCase();
  const cleanPin = (pin || '').trim();

  const user = await db.users
    .filter(u => u.username.toLowerCase() === cleanInput || (u.role.toLowerCase() === cleanInput && u.pin === cleanPin))
    .first();

  if (user && user.pin === cleanPin) {
    return { success: true, user };
  }
  return { success: false, message: 'Invalid Username or PIN' };
}

export async function getAllUsers() {
  return await db.users.toArray();
}

export async function saveUser(userData) {
  if (userData.id) {
    await db.users.update(userData.id, userData);
    return userData.id;
  } else {
    return await db.users.add(userData);
  }
}

export async function deleteUser(id) {
  const user = await db.users.get(id);
  if (user && user.username === 'admin') {
    throw new Error('Cannot delete primary Admin account.');
  }
  await db.users.delete(id);
}


// Get store settings
export async function getStoreSettings() {
  const row = await db.settings.get('store_settings');
  return row ? row.value : INITIAL_SETTINGS;
}

// Save store settings
export async function saveStoreSettings(settings) {
  await db.settings.put({ key: 'store_settings', value: settings });
}

// Save or update customer locally and push to cloud
export async function saveOrUpdateCustomer(customerData) {
  let customerId = customerData.id;
  const cleanPhone = customerData.phone?.trim()?.replace(/[^0-9]/g, '');
  if (!cleanPhone) throw new Error('Customer mobile number is required.');

  const existing = await db.customers.where('phone').equals(cleanPhone).first();
  const payload = {
    ...customerData,
    phone: cleanPhone,
    loyaltyPoints: Number(customerData.loyaltyPoints) || 0,
    creditBalance: Number(customerData.creditBalance) || 0,
    totalSpent: Number(customerData.totalSpent) || 0,
    visitCount: Number(customerData.visitCount) || 0,
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    await db.customers.update(existing.id, payload);
    customerId = existing.id;
  } else {
    customerId = await db.customers.add(payload);
  }

  // Auto-sync customer to cloud if configured
  getStoreSettings().then(settings => {
    const { url, key, isConfigured } = getEffectiveCloudCredentials(settings);
    if (isConfigured) {
      syncCustomerToCloud(payload, url, key);
    }
  }).catch(() => {});

  return { ...payload, id: customerId };
}

// Rapid barcode lookup: finds product and matching variant
export async function findByBarcode(barcodeQuery) {
  if (!barcodeQuery) return null;
  const clean = barcodeQuery.trim().toLowerCase();
  
  const allProducts = await db.products.toArray();
  for (const product of allProducts) {
    if (product.variants && Array.isArray(product.variants)) {
      const variant = product.variants.find(
        v => (v.barcode && v.barcode.toLowerCase() === clean) || (v.sku && v.sku.toLowerCase() === clean)
      );
      if (variant) {
        return {
          product,
          variant,
        };
      }
    }
  }
  return null;
}

// Generate Next Invoice Number (e.g. POSP-26-0001)
export async function getNextInvoiceNo() {
  const settings = await getStoreSettings();
  const prefix = settings.invoicePrefix || 'POSP-26-';
  const totalSales = await db.sales.count();
  const nextNum = (totalSales + 1).toString().padStart(4, '0');
  return `${prefix}${nextNum}`;
}

// Complete checkout transaction: save sale, reduce stock, update customer loyalty & credit
export async function processSaleTransaction(saleData) {
  return await db.transaction('rw', db.sales, db.products, db.customers, async () => {
    // 1. Insert sale invoice
    const saleId = await db.sales.add(saleData);

    // 2. Reduce variant stock in products
    for (const item of saleData.items) {
      if (item.productId && item.variantId) {
        const product = await db.products.get(item.productId);
        if (product && product.variants) {
          const updatedVariants = product.variants.map(v => {
            if (v.id === item.variantId) {
              const currentStock = Number(v.stock) || 0;
              const newStock = Math.max(0, currentStock - item.qty);
              return { ...v, stock: newStock };
            }
            return v;
          });
          await db.products.update(item.productId, { variants: updatedVariants });
        }
      }
    }

    // 3. Update customer loyalty points & Khata if applicable
    if (saleData.customerPhone) {
      const customer = await db.customers.where('phone').equals(saleData.customerPhone).first();
      if (customer) {
        const pointsEarned = Number(saleData.loyaltyPointsEarned) || 0;
        const pointsRedeemed = Number(saleData.loyaltyPointsRedeemed) || 0;
        const newPoints = Math.max(0, (customer.loyaltyPoints || 0) + pointsEarned - pointsRedeemed);
        const newTotalSpent = (customer.totalSpent || 0) + saleData.netTotal;
        const newVisits = (customer.visitCount || 0) + 1;
        
        let newCreditBalance = customer.creditBalance || 0;
        if (saleData.paymentMethod === 'credit' || (saleData.paymentDetails && saleData.paymentDetails.credit > 0)) {
          const creditAmount = saleData.paymentMethod === 'credit' ? saleData.netTotal : saleData.paymentDetails.credit;
          newCreditBalance += creditAmount;
        }

        await db.customers.update(customer.id, {
          loyaltyPoints: newPoints,
          totalSpent: newTotalSpent,
          visitCount: newVisits,
          creditBalance: newCreditBalance,
        });

        // Auto-sync customer update to cloud
        getStoreSettings().then(settings => {
          const { url, key, isConfigured } = getEffectiveCloudCredentials(settings);
          if (isConfigured) {
            syncCustomerToCloud({
              ...customer,
              loyaltyPoints: newPoints,
              totalSpent: newTotalSpent,
              visitCount: newVisits,
              creditBalance: newCreditBalance,
            }, url, key);
          }
        }).catch(() => {});
      }
    }

    // Auto-sync sale to cloud
    getStoreSettings().then(settings => {
      const { url, key, isConfigured } = getEffectiveCloudCredentials(settings);
      if (isConfigured) {
        syncSaleToCloud(saleData, url, key);
      }
    }).catch(() => {});

    return saleId;
  });
}

// Process Return / Exchange
export async function processReturnTransaction(returnData) {
  return await db.transaction('rw', db.returns, db.sales, db.products, db.customers, async () => {
    // 1. Save Return record
    const returnId = await db.returns.add(returnData);

    // 2. Restock returned items
    for (const item of returnData.items) {
      if (item.productId && item.variantId) {
        const product = await db.products.get(item.productId);
        if (product && product.variants) {
          const updatedVariants = product.variants.map(v => {
            if (v.id === item.variantId) {
              return { ...v, stock: (Number(v.stock) || 0) + item.qty };
            }
            return v;
          });
          await db.products.update(item.productId, { variants: updatedVariants });
        }
      }
    }

    // 3. If original invoice exists, mark status
    if (returnData.originalInvoiceNo) {
      const sale = await db.sales.where('invoiceNo').equals(returnData.originalInvoiceNo).first();
      if (sale) {
        await db.sales.update(sale.id, { status: 'returned' });
      }
    }

    return returnId;
  });
}
