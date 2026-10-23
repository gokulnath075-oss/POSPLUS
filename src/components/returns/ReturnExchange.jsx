import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, processReturnTransaction } from '../../db/db';
import { RotateCcw, Search, CheckCircle2, AlertCircle, Printer, FileText, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export function ReturnExchange({ settings }) {
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [foundInvoice, setFoundInvoice] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [returnReason, setReturnReason] = useState('Wrong Size / Fit Issue');
  const [refundMode, setRefundMode] = useState('credit_note'); // 'credit_note' | 'cash' | 'upi'
  const [completedReturn, setCompletedReturn] = useState(null);

  const pastReturns = useLiveQuery(() => db.returns.reverse().toArray(), []) || [];

  const handleSearchInvoice = async (e) => {
    e?.preventDefault();
    if (!invoiceQuery.trim()) return;

    const q = invoiceQuery.trim();
    const invoice = await db.sales.where('invoiceNo').equals(q).first();

    if (invoice) {
      setFoundInvoice(invoice);
      setSelectedItems({});
      setCompletedReturn(null);
    } else {
      alert(`Invoice "${q}" not found. Please verify the invoice number on the receipt.`);
      setFoundInvoice(null);
    }
  };

  const handleToggleItem = (itemKey, item) => {
    setSelectedItems(prev => {
      const copy = { ...prev };
      if (copy[itemKey]) {
        delete copy[itemKey];
      } else {
        copy[itemKey] = { ...item, returnQty: item.qty };
      }
      return copy;
    });
  };

  const handleReturnQtyChange = (itemKey, qty, maxQty) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        returnQty: Math.max(1, Math.min(maxQty, Number(qty) || 1))
      }
    }));
  };

  // Calculate refund amount
  const returnedItemsList = Object.values(selectedItems);
  const totalRefundAmount = returnedItemsList.reduce(
    (sum, i) => sum + (i.unitPrice * i.returnQty),
    0
  );

  const handleProcessReturn = async () => {
    if (returnedItemsList.length === 0) {
      alert('Please select at least one garment to return or exchange.');
      return;
    }

    const returnNo = 'RET-' + Date.now().toString().slice(-6);
    const creditNoteCode = 'CN-' + Math.floor(100000 + Math.random() * 900000);

    const returnRecord = {
      returnNo,
      originalInvoiceNo: foundInvoice.invoiceNo,
      date: new Date().toISOString(),
      customerId: foundInvoice.customerId,
      customerName: foundInvoice.customerName,
      customerPhone: foundInvoice.customerPhone,
      items: returnedItemsList.map(i => ({
        ...i,
        qty: i.returnQty,
      })),
      reason: returnReason,
      refundMethod: refundMode,
      refundAmount: totalRefundAmount,
      creditNoteCode: refundMode === 'credit_note' ? creditNoteCode : '',
    };

    await processReturnTransaction(returnRecord);

    setCompletedReturn(returnRecord);
    setFoundInvoice(null);
    setSelectedItems({});
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <RotateCcw className="w-7 h-7 text-indigo-400" />
          Garment Returns, Exchanges & Credit Notes
        </h1>
        <p className="text-sm text-slate-400">
          Process garment returns, exchanges against original bill, and issue Store Credit Notes
        </p>
      </div>

      {/* Invoice Search Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white">Find Original Sales Invoice</h2>
        <form onSubmit={handleSearchInvoice} className="flex gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="e.g. POSP-26-0001 (or scan invoice barcode)"
              value={invoiceQuery}
              onChange={(e) => setInvoiceQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
          >
            Find Bill
          </button>
        </form>
      </div>

      {/* Bill Found - Garments Selection */}
      {foundInvoice && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs px-2.5 py-0.5 rounded bg-indigo-600/20 text-indigo-400 font-mono font-bold">
                Invoice: {foundInvoice.invoiceNo}
              </span>
              <h3 className="text-base font-black text-white mt-1">
                Customer: {foundInvoice.customerName} ({foundInvoice.customerPhone || 'Walk-in'})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Billed On: {formatDateTime(foundInvoice.date)} • Mode: <span className="uppercase text-slate-300 font-semibold">{foundInvoice.paymentMethod}</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Original Total:</span>
              <div className="text-xl font-black text-white">{formatCurrency(foundInvoice.netTotal)}</div>
            </div>
          </div>

          {/* Items Selector */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-400">Select Garment(s) to Return or Exchange:</h4>
            <div className="space-y-2">
              {foundInvoice.items?.map((item, idx) => {
                const itemKey = `${item.productId}-${item.variantId || idx}`;
                const isSelected = Boolean(selectedItems[itemKey]);

                return (
                  <div
                    key={itemKey}
                    className={`p-4 rounded-xl border flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleItem(itemKey, item)}
                        className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-sm text-white">{item.name}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          {item.size && <span className="text-amber-400 font-semibold">Size: {item.size}</span>}
                          {item.color && <span>• Color: {item.color}</span>}
                          {item.brand && <span>• Brand: {item.brand}</span>}
                          <span>• Sold Qty: {item.qty} pcs</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Return Qty:</span>
                          <input
                            type="number"
                            min="1"
                            max={item.qty}
                            value={selectedItems[itemKey].returnQty}
                            onChange={(e) => handleReturnQtyChange(itemKey, e.target.value, item.qty)}
                            className="w-14 bg-slate-900 border border-slate-700 text-white text-center rounded px-2 py-1 text-xs"
                          />
                        </div>
                      )}

                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">
                          {formatCurrency(item.unitPrice * (isSelected ? selectedItems[itemKey].returnQty : item.qty))}
                        </div>
                        <div className="text-[10px] text-slate-500">Rate: ₹{item.unitPrice}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Refund Method & Reason */}
          {returnedItemsList.length > 0 && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Reason for Return / Exchange</label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="Wrong Size / Fit Issue">Wrong Size / Fit Issue</option>
                    <option value="Fabric Defect / Stitching Issue">Fabric Defect / Stitching Issue</option>
                    <option value="Color Not Liked by Family / Recipient">Color Not Liked by Family / Recipient</option>
                    <option value="Exchange for Different Garment">Exchange for Different Garment</option>
                    <option value="Mind Change">Mind Change</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Refund / Compensation Mode</label>
                  <select
                    value={refundMode}
                    onChange={(e) => setRefundMode(e.target.value)}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none font-bold"
                  >
                    <option value="credit_note">Store Credit Note (Valid for 90 Days - Recommended)</option>
                    <option value="cash">Cash Refund</option>
                    <option value="upi">UPI Refund</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Total Refund / Credit Value:</span>
                  <div className="text-2xl font-black text-amber-400">{formatCurrency(totalRefundAmount)}</div>
                </div>

                <button
                  type="button"
                  onClick={handleProcessReturn}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Return & Restock Item(s)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed Return Success Banner */}
      {completedReturn && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Return Processed Successfully</h3>
            <p className="text-xs text-slate-300">
              Return Voucher: <span className="font-mono font-bold text-emerald-400">{completedReturn.returnNo}</span>
            </p>
            {completedReturn.creditNoteCode && (
              <div className="mt-2 inline-block bg-slate-900 border border-emerald-500/40 px-4 py-2 rounded-xl">
                <span className="text-xs text-slate-400">Store Credit Note Code: </span>
                <span className="font-mono text-base font-black text-amber-400 tracking-wider">
                  {completedReturn.creditNoteCode}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">Value: {formatCurrency(completedReturn.refundAmount)}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400">Stock has been automatically updated in your inventory.</p>
        </div>
      )}

      {/* Past Returns History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Recent Returns & Credit Notes ({pastReturns.length})</h3>
        {pastReturns.length === 0 ? (
          <p className="text-xs text-slate-500">No returns recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/60 text-slate-400 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-2.5">Return No</th>
                  <th className="p-2.5">Original Invoice</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Reason</th>
                  <th className="p-2.5 text-right">Refund Mode</th>
                  <th className="p-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pastReturns.slice(0, 10).map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="p-2.5 font-mono font-bold text-white">{r.returnNo}</td>
                    <td className="p-2.5 font-mono text-slate-300">{r.originalInvoiceNo}</td>
                    <td className="p-2.5 font-medium text-slate-200">{r.customerName}</td>
                    <td className="p-2.5 text-slate-400">{formatDateTime(r.date)}</td>
                    <td className="p-2.5 text-slate-400">{r.reason}</td>
                    <td className="p-2.5 text-right uppercase font-semibold text-indigo-400">{r.refundMethod}</td>
                    <td className="p-2.5 text-right font-bold text-amber-400">{formatCurrency(r.refundAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
