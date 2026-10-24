import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveOrUpdateCustomer } from '../../db/db';
import { Users, Search, Plus, Phone, Star, Wallet, ArrowDownLeft, History, X, Check } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

export function CustomerManager({ settings }) {
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const sales = useLiveQuery(() => db.sales.toArray(), []) || [];

  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [khataPaymentAmount, setKhataPaymentAmount] = useState('');

  // New customer form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newGstin, setNewGstin] = useState('');

  const filteredCustomers = customers.filter(c => {
    const q = search.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const totalOutstandingKhata = customers.reduce((sum, c) => sum + (c.creditBalance || 0), 0);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    const cleanPhone = newPhone.trim().replace(/[^0-9]/g, '');
    if (!newName.trim() || !cleanPhone) {
      alert('Name and Phone Number are required.');
      return;
    }

    const existing = await db.customers.where('phone').equals(cleanPhone).first();
    if (existing) {
      alert('A customer with this phone number already exists.');
      return;
    }

    await saveOrUpdateCustomer({
      name: newName.trim(),
      phone: cleanPhone,
      email: newEmail.trim(),
      address: newAddress.trim(),
      gstin: newGstin.trim().toUpperCase(),
      loyaltyPoints: 0,
      creditBalance: 0,
      totalSpent: 0,
      visitCount: 0,
    });

    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    setNewGstin('');
    setShowAddModal(false);
  };

  const handleReceiveKhataPayment = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const amt = Number(khataPaymentAmount) || 0;
    if (amt <= 0) {
      alert('Enter a valid payment amount.');
      return;
    }

    const currentBalance = selectedCustomer.creditBalance || 0;
    const newBalance = Math.max(0, currentBalance - amt);

    await saveOrUpdateCustomer({
      ...selectedCustomer,
      creditBalance: newBalance,
    });

    setSelectedCustomer(prev => ({ ...prev, creditBalance: newBalance }));
    setKhataPaymentAmount('');
    setShowPaymentModal(false);
    alert(`Received payment of ₹${amt} from ${selectedCustomer.name}. Remaining Khata: ₹${newBalance}`);
  };

  const customerInvoices = selectedCustomer
    ? sales.filter(s => s.customerPhone === selectedCustomer.phone)
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-400" />
            Customers & Khata (Store Credit) Ledger
          </h1>
          <p className="text-sm text-slate-400">
            Track customer purchase history, loyalty reward points, and outstanding store credit
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl text-xs">
            <span className="text-slate-400">Total Khata Outstanding: </span>
            <span className="font-bold text-amber-400 text-sm">{formatCurrency(totalOutstandingKhata)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Main Grid: Customer List (Left) + Detail & History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Directory (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3 max-h-[75vh]">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or mobile number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No customers found matching "{search}".
              </div>
            ) : (
              filteredCustomers.map(c => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {c.name}
                        {c.creditBalance > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            Khata ₹{c.creditBalance}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-500" /> {c.phone}
                        {c.loyaltyPoints > 0 && (
                          <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                            • <Star className="w-3 h-3 fill-amber-400" /> {c.loyaltyPoints} Pts
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-300">
                        {formatCurrency(c.totalSpent || 0)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {c.visitCount || 0} visits
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Customer Details & Past Invoices (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col max-h-[75vh] overflow-y-auto">
          {selectedCustomer ? (
            <div className="space-y-6">
              {/* Customer Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xl font-black">
                    {selectedCustomer.name[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{selectedCustomer.name}</h3>
                    <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                      <span>{selectedCustomer.phone}</span>
                      {selectedCustomer.email && <span>• {selectedCustomer.email}</span>}
                    </p>
                    {selectedCustomer.gstin && (
                      <p className="text-[11px] font-mono text-indigo-400 mt-0.5">GSTIN: {selectedCustomer.gstin}</p>
                    )}
                  </div>
                </div>

                {/* Khata Payment Button */}
                {selectedCustomer.creditBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20"
                  >
                    <ArrowDownLeft className="w-4 h-4" /> Receive Khata Payment
                  </button>
                )}
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400">Khata Outstanding</span>
                  <div className="text-xl font-black text-amber-400 mt-1">
                    {formatCurrency(selectedCustomer.creditBalance || 0)}
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400">Loyalty Points</span>
                  <div className="text-xl font-black text-yellow-400 mt-1 flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400" />
                    {selectedCustomer.loyaltyPoints || 0}
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400">Total Purchase</span>
                  <div className="text-xl font-black text-emerald-400 mt-1">
                    {formatCurrency(selectedCustomer.totalSpent || 0)}
                  </div>
                </div>
              </div>

              {/* Purchase History */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  Past Purchases & Invoices ({customerInvoices.length})
                </h4>

                {customerInvoices.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No previous invoices found for this customer.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {customerInvoices.map(inv => (
                      <div
                        key={inv.id}
                        className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white font-mono">{inv.invoiceNo}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {formatDateTime(inv.date)} • {inv.items?.length} items • <span className="uppercase text-slate-300 font-semibold">{inv.paymentMethod}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-sm text-emerald-400">
                            {formatCurrency(inv.netTotal)}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase">{inv.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-12">
              <Users className="w-12 h-12 text-slate-700 mb-2" />
              <p className="text-sm font-bold text-slate-400">No Customer Selected</p>
              <p className="text-xs text-slate-600 mt-1">
                Click any customer on the left to view their profile, Khata balance, and invoice history
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Mobile Number (10 Digits) *</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="ramesh@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">GSTIN (Optional, for B2B Wholesale)</label>
                <input
                  type="text"
                  placeholder="29AAAAA0000A1Z5"
                  value={newGstin}
                  onChange={(e) => setNewGstin(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm uppercase focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Address (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. MG Road, Bangalore"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Khata Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Receive Khata Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1">
              <p className="text-slate-300">Customer: <strong>{selectedCustomer.name}</strong></p>
              <p className="text-slate-300">Outstanding: <strong className="text-amber-400 text-sm">₹{selectedCustomer.creditBalance}</strong></p>
            </div>

            <form onSubmit={handleReceiveKhataPayment} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Payment Amount Received (₹)</label>
                <input
                  type="number"
                  autoFocus
                  required
                  max={selectedCustomer.creditBalance}
                  placeholder={selectedCustomer.creditBalance.toString()}
                  value={khataPaymentAmount}
                  onChange={(e) => setKhataPaymentAmount(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 text-white text-xl font-black rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setKhataPaymentAmount(selectedCustomer.creditBalance.toString())}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                >
                  Pay Full (₹{selectedCustomer.creditBalance})
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
