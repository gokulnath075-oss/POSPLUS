import React, { useState, useEffect } from 'react';
import { db, getAllUsers, saveUser, deleteUser } from '../../db/db';
import { Users, UserPlus, ShieldCheck, Laptop, Key, Trash2, Edit, Check, X, AlertCircle } from 'lucide-react';

export function StaffManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('cashier'); // 'admin' | 'cashier'
  const [pin, setPin] = useState('');
  const [counterName, setCounterName] = useState('Counter 1');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadUsers = async () => {
    try {
      const all = await getAllUsers();
      setUsers(all);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleResetForm = () => {
    setName('');
    setUsername('');
    setRole('cashier');
    setPin('');
    setCounterName('Counter 1');
    setIsAdding(false);
    setEditingId(null);
    setErrorMsg('');
  };

  const handleStartEdit = (u) => {
    setEditingId(u.id);
    setName(u.name);
    setUsername(u.username);
    setRole(u.role);
    setPin(u.pin);
    setCounterName(u.counterName || 'Counter 1');
    setIsAdding(true);
    setErrorMsg('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !pin.trim()) {
      setErrorMsg('Name, Username and PIN are required.');
      return;
    }

    if (pin.length < 3) {
      setErrorMsg('PIN must be at least 3 digits.');
      return;
    }

    try {
      await saveUser({
        ...(editingId ? { id: editingId } : {}),
        name: name.trim(),
        username: username.trim().toLowerCase(),
        role,
        pin: pin.trim(),
        counterName: counterName.trim(),
        updatedAt: new Date().toISOString(),
      });

      setSuccessMsg(editingId ? 'User updated successfully!' : 'New staff member added!');
      setTimeout(() => setSuccessMsg(''), 3000);
      handleResetForm();
      loadUsers();
    } catch (err) {
      setErrorMsg('Save error: ' + err.message);
    }
  };

  const handleDelete = async (u) => {
    if (u.username === 'admin') {
      alert('The primary Admin account cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete ${u.name} (${u.username})?`)) {
      try {
        await deleteUser(u.id);
        loadUsers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Staff & Cashier PIN Management
          </h2>
          <p className="text-xs text-slate-400">
            Create cashier accounts, manage terminal access PINs, and assign counters
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => {
              handleResetForm();
              setIsAdding(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20"
          >
            <UserPlus className="w-4 h-4" /> Add Cashier / Staff
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Add / Edit Form Modal or Inline Box */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 animate-in fade-in">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              {editingId ? 'Edit Staff Account' : 'New Cashier / Staff Account'}
            </h3>
            <button type="button" onClick={handleResetForm} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Staff Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Login Username (Unique) *</label>
              <input
                type="text"
                required
                placeholder="e.g. counter1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">System Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none font-bold"
              >
                <option value="cashier">Cashier / Counter Staff (POS Only)</option>
                <option value="admin">Store Admin / Manager (Full Access)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Login Security PIN (4 Digits) *</label>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="e.g. 1111"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                className="mt-1 w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono tracking-widest text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Assigned Counter / Station Name</label>
              <input
                type="text"
                placeholder="e.g. Counter 1 (Ground Floor)"
                value={counterName}
                onChange={(e) => setCounterName(e.target.value)}
                className="mt-1 w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Appears on receipts printed by this cashier</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              {editingId ? 'Update Staff Account' : 'Save Staff Member'}
            </button>
          </div>
        </form>
      )}

      {/* Staff Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {users.map(u => {
          const isAdmin = u.role === 'admin';
          return (
            <div
              key={u.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isAdmin ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
                  }`}>
                    {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{u.name}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">@{u.username}</p>
                  </div>
                </div>

                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                }`}>
                  {u.role}
                </span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs flex justify-between items-center font-mono">
                <span className="text-slate-400 text-[11px]">Security PIN:</span>
                <span className="font-bold text-emerald-400">•••• ({u.pin})</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-900">
                <span className="truncate max-w-[140px] text-[11px]">{u.counterName || 'Counter 1'}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(u)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    title="Edit User or PIN"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {u.username !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(u)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Delete User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
