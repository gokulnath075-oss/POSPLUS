import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Users, Search, UserPlus, Phone, Star, Wallet, X, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export function CustomerSelectModal({ onSelect, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New customer form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');

  const customers = useLiveQuery(async () => {
    if (!searchQuery.trim()) {
      return await db.customers.limit(15).toArray();
    }
    const q = searchQuery.toLowerCase().trim();
    return await db.customers
      .filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .toArray();
  }, [searchQuery]) || [];

  const handleAddNew = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Name and Phone Number are required.');
      return;
    }

    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    const existing = await db.customers.where('phone').equals(cleanPhone).first();
    if (existing) {
      alert('A customer with this phone number already exists!');
      onSelect(existing);
      return;
    }

    const newCustomer = {
      name: name.trim(),
      phone: cleanPhone,
      email: email.trim(),
      address: address.trim(),
      gstin: gstin.trim().toUpperCase(),
      loyaltyPoints: 0,
      creditBalance: 0,
      totalSpent: 0,
      visitCount: 0,
      createdAt: new Date().toISOString(),
    };

    const id = await db.customers.add(newCustomer);
    newCustomer.id = id;
    onSelect(newCustomer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-black text-white">Select Customer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Mode Switch */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex gap-2">
          {!isAddingNew ? (
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                autoFocus
                placeholder="Search by Mobile Number or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          ) : (
            <span className="text-sm font-semibold text-indigo-400 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" /> Add New Customer
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsAddingNew(!isAddingNew)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isAddingNew
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            {isAddingNew ? 'Back to Search' : <><UserPlus className="w-4 h-4" /> New Customer</>}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto flex-1">
          {isAddingNew ? (
            <form onSubmit={handleAddNew} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Customer Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Vikram Malhotra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Mobile Number (10 Digits) *</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">GSTIN (Optional, for B2B)</label>
                  <input
                    type="text"
                    placeholder="29AAAAA0000A1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Address / City (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore, Karnataka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30"
                >
                  Save & Select Customer
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              {customers.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No customers found matching "{searchQuery}".
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPhone(searchQuery);
                        setIsAddingNew(true);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs"
                    >
                      + Add "{searchQuery}" as new customer
                    </button>
                  </div>
                </div>
              ) : (
                customers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => onSelect(c)}
                    className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 p-3 rounded-xl cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm group-hover:text-indigo-300 transition">
                          {c.name}
                        </span>
                        {c.creditBalance > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                            Khata: ₹{c.creditBalance}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-500" /> {c.phone}
                        </span>
                        {c.loyaltyPoints > 0 && (
                          <span className="flex items-center gap-1 text-amber-400 font-medium">
                            <Star className="w-3 h-3 fill-amber-400" /> {c.loyaltyPoints} Pts
                          </span>
                        )}
                        <span>Total Spent: {formatCurrency(c.totalSpent || 0)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white rounded-lg text-xs font-bold transition"
                    >
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
