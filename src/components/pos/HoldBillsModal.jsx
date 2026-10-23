import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { PauseCircle, PlayCircle, Trash2, Clock, X, ShoppingBag } from 'lucide-react';
import { formatCurrency, formatTime } from '../../utils/formatters';

export function HoldBillsModal({ onResume, onClose }) {
  const heldBills = useLiveQuery(() => db.heldBills.reverse().toArray(), []) || [];

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this held bill?')) {
      await db.heldBills.delete(id);
    }
  };

  const handleResumeBill = async (bill) => {
    // Delete from heldBills and pass to cart
    await db.heldBills.delete(bill.id);
    onResume(bill);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">Held / Suspended Bills</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
              {heldBills.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {heldBills.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              No bills are currently on hold.
            </div>
          ) : (
            heldBills.map(bill => (
              <div
                key={bill.id}
                onClick={() => handleResumeBill(bill)}
                className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm group-hover:text-amber-300 transition">
                      {bill.customer?.name || 'Walk-in Customer'}
                    </span>
                    {bill.customer?.phone && (
                      <span className="text-xs text-slate-400 font-mono">
                        ({bill.customer.phone})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1 font-mono text-slate-500">
                      <Clock className="w-3.5 h-3.5" /> {formatTime(bill.heldAt)}
                    </span>
                    <span>{bill.cart?.length} items ({bill.cart?.reduce((s, i) => s + (i.qty || 1), 0)} pcs)</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(bill.totals?.netPayable || 0)}</span>
                  </div>

                  {bill.note && (
                    <p className="text-[11px] text-amber-400/80 italic mt-1">
                      Note: "{bill.note}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleResumeBill(bill)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 group-hover:bg-amber-500 group-hover:text-black rounded-lg text-xs font-bold transition"
                  >
                    <PlayCircle className="w-4 h-4" /> Resume
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, bill.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
