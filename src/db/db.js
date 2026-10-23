import Dexie from 'dexie';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SETTINGS } from './seedData';
import { syncSaleToCloud } from '../services/cloudSync';

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
      }
    }

    // 4. Background sync to Supabase Cloud if configured
    getStoreSettings().then(settings => {
      if (settings?.enableCloudSync && settings?.supabaseUrl && settings?.supabaseAnonKey) {
        syncSaleToCloud(saleData, settings.supabaseUrl, settings.supabaseAnonKey);
      }
    });

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
