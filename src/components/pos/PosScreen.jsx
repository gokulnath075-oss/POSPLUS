import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, findByBarcode, getNextInvoiceNo, processSaleTransaction } from '../../db/db';
import {
  Barcode, Search, ShoppingBag, Plus, Minus, Trash2, User, UserPlus,
  PauseCircle, PlayCircle, CreditCard, Banknote, QrCode, Tag, ArrowRight,
  Layers, Check, Sparkles, AlertCircle
} from 'lucide-react';
import { CartItemRow } from './CartItemRow';
import { PaymentModal } from './PaymentModal';
import { HoldBillsModal } from './HoldBillsModal';
import { CustomerSelectModal } from './CustomerSelectModal';
import { PrintModal } from '../print/PrintModal';
import { calculateCartTotals } from '../../utils/gst';
import { formatCurrency } from '../../utils/formatters';
import { playScanSound, playErrorSound, playSuccessSound } from '../../utils/sound';

export function PosScreen({ settings, currentUser }) {
  // Live products & categories from Dexie
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const heldBillsCount = useLiveQuery(() => db.heldBills.count(), []) || 0;

  // Active Cart State
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed'); // 'fixed' | '%'
  const [isInterstate, setIsInterstate] = useState(false);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState('');

  // Selected product for size picker popup
  const [sizePickerProduct, setSizePickerProduct] = useState(null);

  const barcodeInputRef = useRef(null);

  // Auto focus barcode input on load
  useEffect(() => {
    barcodeInputRef.current?.focus();
    async function loadInvNo() {
      const nextNo = await getNextInvoiceNo();
      setCurrentInvoiceNo(nextNo);
    }
    loadInvNo();
  }, []);

  // Global Keybindings (F4: Hold, F8: Pay, F2: Focus scanner)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) setShowPaymentModal(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) handleHoldBill();
      } else if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Real-time GST & Cart calculations
  const cartTotals = calculateCartTotals(
    cart,
    overallDiscount,
    discountType,
    isInterstate,
    true // Tax Inclusive (Standard Indian Apparel Retail)
  );

  // Handle Barcode Scan / Enter
  const handleBarcodeSubmit = async (e) => {
    e?.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const match = await findByBarcode(code);
    if (match) {
      playScanSound();
      addItemToCart(match.product, match.variant);
      setBarcodeInput('');
    } else {
      playErrorSound();
      alert(`No clothing item found for barcode: "${code}"`);
    }
  };

  // Add Item + Variant to Cart
  const addItemToCart = (product, variant) => {
    setCart(prevCart => {
      const cartItemId = `${product.id}-${variant.id}`;
      const existing = prevCart.find(i => i.cartItemId === cartItemId);

      if (existing) {
        return prevCart.map(i =>
          i.cartItemId === cartItemId ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        return [
          ...prevCart,
          {
            cartItemId,
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            size: variant.size,
            color: variant.color,
            barcode: variant.barcode,
            sku: variant.sku,
            hsn: product.hsn || '6205',
            taxRate: product.taxRate || 5,
            mrp: variant.mrp || variant.sellingPrice,
            unitPrice: variant.sellingPrice,
            qty: 1,
            discountType: 'fixed',
            discountValue: 0,
          }
        ];
      }
    });
  };

  // Update item quantity in cart
  const handleUpdateQty = (cartItemId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(cartItemId);
    } else {
      setCart(prev => prev.map(i => (i.cartItemId === cartItemId ? { ...i, qty: newQty } : i)));
    }
  };

  // Update item discount
  const handleUpdateDiscount = (cartItemId, discountValue, discountType) => {
    setCart(prev =>
      prev.map(i =>
        i.cartItemId === cartItemId ? { ...i, discountValue, discountType } : i
      )
    );
  };

  // Remove item
  const handleRemoveItem = (cartItemId) => {
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  // Hold current bill
  const handleHoldBill = async () => {
    if (cart.length === 0) return;
    const note = prompt('Enter a quick note for this held bill (e.g. Trying another shirt):', '');
    
    await db.heldBills.add({
      cart,
      customer,
      totals: cartTotals,
      note: note || '',
      heldAt: new Date().toISOString(),
    });

    // Reset current cart
    setCart([]);
    setCustomer(null);
    setOverallDiscount(0);
    playScanSound();
  };

  // Resume a held bill
  const handleResumeBill = (heldBill) => {
    setCart(heldBill.cart || []);
    setCustomer(heldBill.customer || null);
    setShowHoldModal(false);
    playScanSound();
  };

  // Process Completed Checkout
  const handleCheckoutComplete = async (paymentResult) => {
    const invoiceNo = currentInvoiceNo || await getNextInvoiceNo();
    
    const saleRecord = {
      invoiceNo,
      date: new Date().toISOString(),
      customerId: customer?.id || null,
      customerName: customer?.name || 'Walk-in Customer',
      customerPhone: customer?.phone || '',
      customerGstin: customer?.gstin || '',
      cashierName: currentUser?.name || 'Admin',
      counterName: currentUser?.counterName || settings?.counterName || 'Counter 1',
      salesperson: currentUser?.username || 'admin',
      items: cartTotals.items,
      subtotal: cartTotals.subtotal,
      taxableSubtotal: cartTotals.taxableSubtotal,
      totalCGST: cartTotals.totalCGST,
      totalSGST: cartTotals.totalSGST,
      totalIGST: cartTotals.totalIGST,
      totalTax: cartTotals.totalTax,
      billDiscount: cartTotals.billDiscount,
      roundOff: cartTotals.roundOff,
      netTotal: paymentResult.netTotal,
      paymentMethod: paymentResult.paymentMethod,
      paymentDetails: paymentResult.paymentDetails,
      tenderedAmount: paymentResult.tenderedAmount,
      changeAmount: paymentResult.changeAmount,
      loyaltyPointsEarned: Math.floor(paymentResult.netTotal / 100) * (settings?.pointsPer100 || 1),
      loyaltyPointsRedeemed: paymentResult.loyaltyPointsRedeemed || 0,
      hsnSummary: cartTotals.hsnSummary,
      isInterstate,
      status: 'completed',
    };

    await processSaleTransaction(saleRecord);

    setCompletedSale(saleRecord);
    setShowPaymentModal(false);
    setShowPrintModal(true);

    // Reset cart for next customer
    setCart([]);
    setCustomer(null);
    setOverallDiscount(0);

    // Load next invoice number
    const nextNo = await getNextInvoiceNo();
    setCurrentInvoiceNo(nextNo);
  };

  // Filtered Catalog
  const filteredProducts = products.filter(p => {
    const matchesGender = selectedGender === 'All' || p.gender === selectedGender;
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesQuery = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.variants && p.variants.some(v => v.size.toLowerCase().includes(searchQuery.toLowerCase()) || (v.barcode && v.barcode.includes(searchQuery))));
    return matchesGender && matchesCat && matchesQuery;
  });

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950">
      {/* LEFT SECTION: Garment Catalog & Quick Barcode Scanner (7 cols equivalent) */}
      <div className="flex-1 flex flex-col border-r border-slate-800 overflow-hidden">
        {/* Top Scanner & Search Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3">
          <div className="flex gap-2">
            {/* Barcode Scan Input */}
            <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
              <Barcode className="w-5 h-5 absolute left-3 top-3 text-indigo-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan Barcode or Enter Barcode No... (Press Enter)"
                className="w-full bg-slate-950 border-2 border-indigo-500/40 focus:border-indigo-500 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono tracking-wider focus:outline-none placeholder:text-slate-500 shadow-inner"
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-mono px-2 py-1 bg-slate-800 text-slate-400 rounded border border-slate-700">
                F2 Scanner
              </span>
            </form>

            {/* Quick Text Filter */}
            <div className="relative w-64 hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter clothes..."
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>

          {/* Department / Gender & Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 flex-shrink-0">
              {['All', 'Men', 'Women', 'Boys', 'Girls'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGender(g)}
                  className={`px-3 py-1 rounded-md font-semibold transition ${
                    selectedGender === g ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-800 flex-shrink-0"></div>

            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto flex-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition border ${
                    selectedCategory === cat
                      ? 'bg-slate-800 border-indigo-500 text-white'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map(product => {
              const totalStock = product.variants?.reduce((s, v) => s + (v.stock || 0), 0) || 0;
              const minPrice = Math.min(...(product.variants?.map(v => v.sellingPrice) || [0]));

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (product.variants?.length === 1) {
                      addItemToCart(product, product.variants[0]);
                      playScanSound();
                    } else {
                      setSizePickerProduct(product);
                    }
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/60 p-3 rounded-xl cursor-pointer transition flex flex-col justify-between group hover:shadow-lg hover:shadow-indigo-500/5"
                >
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 truncate">
                        {product.brand || product.category}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        totalStock > 5 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {totalStock} in stock
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mt-1 line-clamp-2 group-hover:text-indigo-300 transition">
                      {product.name}
                    </h4>

                    {/* Available Sizes preview */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.variants?.slice(0, 4).map(v => (
                        <span key={v.id} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 font-mono">
                          {v.size}
                        </span>
                      ))}
                      {(product.variants?.length || 0) > 4 && (
                        <span className="text-[9px] text-slate-500">+{product.variants.length - 4}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400">from </span>
                      <span className="text-sm font-black text-emerald-400">₹{minPrice}</span>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white rounded-lg transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Active Bill / Cart Counter (5 cols equivalent) */}
      <div className="w-full lg:w-[460px] xl:w-[500px] flex flex-col bg-slate-900 border-l border-slate-800">
        {/* Bill Counter Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-slate-400">Bill: {currentInvoiceNo}</span>
              <h3 className="text-sm font-black text-white">Active Order</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Held Bills Recall Button */}
            <button
              type="button"
              onClick={() => setShowHoldModal(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
            >
              <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Held</span>
              {heldBillsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-bold text-[10px]">
                  {heldBillsCount}
                </span>
              )}
            </button>

            {/* Clear Cart */}
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Discard current cart items?')) {
                    setCart([]);
                    setCustomer(null);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                title="Discard Bill"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Customer Attachment Bar */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          {customer ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                  {customer.name[0]}
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    {customer.name}
                    {customer.creditBalance > 0 && (
                      <span className="text-[10px] text-amber-400 font-normal">
                        (Khata: ₹{customer.creditBalance})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {customer.phone} {customer.loyaltyPoints > 0 ? `• ⭐ ${customer.loyaltyPoints} Pts` : ''}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCustomer(null)}
                className="text-[11px] text-slate-400 hover:text-red-400"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition w-full"
            >
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>Attach Customer (Mobile / Loyalty / Khata)</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-800">
                <Barcode className="w-8 h-8 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400">Cart is empty</p>
                <p className="text-xs text-slate-600 mt-1">
                  Scan barcode with your scanner or click any garment on the left to add items
                </p>
              </div>
            </div>
          ) : (
            cartTotals.items.map((item, idx) => (
              <CartItemRow
                key={item.cartItemId}
                item={item}
                index={idx}
                onUpdateQty={handleUpdateQty}
                onUpdateDiscount={handleUpdateDiscount}
                onRemove={handleRemoveItem}
              />
            ))
          )}
        </div>

        {/* Cart Calculation & Checkout Area */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          {/* Bill-wide Discount & Interstate Tax Toggle */}
          <div className="flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-1.5 flex-1 bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-800">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-[11px]">Bill Disc:</span>
              <input
                type="number"
                min="0"
                value={overallDiscount || ''}
                onChange={(e) => setOverallDiscount(Number(e.target.value))}
                placeholder="0"
                className="w-14 bg-transparent text-white font-bold focus:outline-none text-right text-xs"
              />
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="bg-transparent text-slate-400 text-[11px] focus:outline-none"
              >
                <option value="fixed" className="bg-slate-900">₹</option>
                <option value="%" className="bg-slate-900">%</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="checkbox"
                id="interstateCheck"
                checked={isInterstate}
                onChange={(e) => setIsInterstate(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              <label htmlFor="interstateCheck" className="text-[11px] text-slate-400 cursor-pointer">
                Interstate (IGST)
              </label>
            </div>
          </div>

          {/* Subtotals Breakdown */}
          <div className="space-y-1 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
            <div className="flex justify-between">
              <span>Items / Pieces:</span>
              <span className="text-white font-mono">
                {cart.length} items ({cart.reduce((s, i) => s + (i.qty || 1), 0)} pcs)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Taxable Value:</span>
              <span className="text-white font-mono">{formatCurrency(cartTotals.taxableSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST Total:</span>
              <span className="text-white font-mono">
                {isInterstate ? `IGST: ${formatCurrency(cartTotals.totalIGST)}` : `CGST+SGST: ${formatCurrency(cartTotals.totalTax)}`}
              </span>
            </div>
            {cartTotals.roundOff !== 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Round Off:</span>
                <span className="font-mono">{cartTotals.roundOff > 0 ? `+${cartTotals.roundOff}` : cartTotals.roundOff}</span>
              </div>
            )}
          </div>

          {/* Grand Net Total Banner */}
          <div className="bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-500/30 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-indigo-400">Net Payable</p>
              <div className="text-2xl font-black text-white tracking-tight">
                {formatCurrency(cartTotals.netPayable)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleHoldBill}
                disabled={cart.length === 0}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 transition"
                title="Hold Bill (F4)"
              >
                Hold (F4)
              </button>

              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <span>Pay & Print</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SIZE / VARIANT PICKER POPUP (When a product has multiple sizes/colors) */}
      {sizePickerProduct && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div>
              <span className="text-xs uppercase font-bold text-indigo-400">{sizePickerProduct.brand}</span>
              <h3 className="text-base font-black text-white mt-0.5">{sizePickerProduct.name}</h3>
              <p className="text-xs text-slate-400 mt-1">Select Size & Color to add to bill:</p>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {sizePickerProduct.variants?.map(v => (
                <div
                  key={v.id}
                  onClick={() => {
                    addItemToCart(sizePickerProduct, v);
                    playScanSound();
                    setSizePickerProduct(null);
                  }}
                  className="bg-slate-950 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 p-3 rounded-xl cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded bg-slate-900 group-hover:bg-black/30 text-amber-400 group-hover:text-white font-mono font-bold text-xs">
                      {v.size}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">{v.color}</div>
                      <div className="text-[10px] text-slate-500 group-hover:text-slate-200 font-mono">
                        Barcode: {v.barcode}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400 group-hover:text-white">
                      ₹{v.sellingPrice}
                    </div>
                    <div className="text-[10px] text-slate-500 group-hover:text-slate-200">
                      {v.stock} in stock
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSizePickerProduct(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <PaymentModal
          cartTotals={cartTotals}
          customer={customer}
          settings={settings}
          invoiceNo={currentInvoiceNo}
          onComplete={handleCheckoutComplete}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* HOLD BILLS MODAL */}
      {showHoldModal && (
        <HoldBillsModal
          onResume={handleResumeBill}
          onClose={() => setShowHoldModal(false)}
        />
      )}

      {/* CUSTOMER SELECT MODAL */}
      {showCustomerModal && (
        <CustomerSelectModal
          onSelect={(c) => {
            setCustomer(c);
            setShowCustomerModal(false);
          }}
          onClose={() => setShowCustomerModal(false)}
        />
      )}

      {/* PRINT MODAL (Immediately after sale) */}
      {showPrintModal && completedSale && (
        <PrintModal
          sale={completedSale}
          settings={settings}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
