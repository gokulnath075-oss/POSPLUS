import React from 'react';
import { Plus, Minus, Trash2, Tag, Percent } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export function CartItemRow({ item, index, onUpdateQty, onUpdateDiscount, onRemove }) {
  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 transition">
      {/* Product Details & Variant */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500 w-5">#{index + 1}</span>
          <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
          {item.brand && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
              {item.brand}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
          {item.size && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
              Size: {item.size}
            </span>
          )}
          {item.color && (
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
              Color: {item.color}
            </span>
          )}
          {item.hsn && (
            <span className="font-mono text-[11px] text-slate-500">
              HSN: {item.hsn} ({item.taxRate}% GST)
            </span>
          )}
          {item.barcode && (
            <span className="font-mono text-[11px] text-slate-500">
              🏷️ {item.barcode}
            </span>
          )}
        </div>
      </div>

      {/* Unit Rate & MRP */}
      <div className="text-right px-2">
        <div className="text-sm font-bold text-slate-200">
          {formatCurrency(item.unitPrice)}
        </div>
        {item.mrp && item.mrp > item.unitPrice && (
          <div className="text-xs text-slate-500 line-through">
            MRP: ₹{item.mrp}
          </div>
        )}
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => onUpdateQty(item.cartItemId, Math.max(1, item.qty - 1))}
          className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <input
          type="number"
          min="1"
          value={item.qty}
          onChange={(e) => onUpdateQty(item.cartItemId, Math.max(1, parseInt(e.target.value) || 1))}
          className="w-12 text-center bg-transparent text-sm font-bold text-white focus:outline-none"
        />

        <button
          type="button"
          onClick={() => onUpdateQty(item.cartItemId, item.qty + 1)}
          className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Line Item Discount */}
      <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
        <Tag className="w-3.5 h-3.5 text-slate-500" />
        <input
          type="number"
          placeholder="Disc"
          value={item.discountValue || ''}
          onChange={(e) => onUpdateDiscount(item.cartItemId, Number(e.target.value), item.discountType || 'fixed')}
          className="w-14 bg-transparent text-xs text-white focus:outline-none text-right"
        />
        <select
          value={item.discountType || 'fixed'}
          onChange={(e) => onUpdateDiscount(item.cartItemId, item.discountValue || 0, e.target.value)}
          className="bg-transparent text-[11px] text-slate-400 focus:outline-none cursor-pointer"
        >
          <option value="fixed" className="bg-slate-900">₹</option>
          <option value="%" className="bg-slate-900">%</option>
        </select>
      </div>

      {/* Row Total & Delete Button */}
      <div className="flex items-center justify-between md:justify-end gap-3 min-w-[110px]">
        <div className="text-right">
          <div className="text-base font-black text-emerald-400">
            {formatCurrency(item.totalAmount)}
          </div>
          <div className="text-[10px] text-slate-500">
            incl. ₹{item.totalTax} GST
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.cartItemId)}
          title="Remove item"
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
