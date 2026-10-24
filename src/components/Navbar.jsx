import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Tag, Package, Users, RotateCcw, BarChart3,
  Settings, Clock, Sparkles, ShieldCheck, Keyboard, LogOut, Lock, Laptop, User
} from 'lucide-react';

export function Navbar({ activeTab, onTabChange, settings, currentUser, onLogout, onAdminUnlockPrompt }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    { id: 'pos', label: 'POS Billing', icon: ShoppingBag, hotkey: 'F1', adminOnly: false },
    { id: 'barcode', label: 'Barcode Tags', icon: Tag, hotkey: 'F2', adminOnly: false },
    { id: 'inventory', label: 'Garments & Stock', icon: Package, hotkey: 'F3', adminOnly: false },
    { id: 'customers', label: 'Customers & Khata', icon: Users, hotkey: 'F4', adminOnly: false },
    { id: 'returns', label: 'Returns & Exchange', icon: RotateCcw, hotkey: 'F5', adminOnly: false },
    { id: 'reports', label: 'Reports & GST', icon: BarChart3, hotkey: 'F6', adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings, hotkey: '', adminOnly: true },
  ];

  const handleNavClick = (item) => {
    if (item.adminOnly && !isAdmin) {
      if (onAdminUnlockPrompt) {
        onAdminUnlockPrompt(item.id);
      } else {
        alert('Admin Access Required. Please login with an Admin PIN to view this section.');
      }
      return;
    }
    onTabChange(item.id);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between select-none no-print">
      {/* Brand & Store Name */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <span className="text-sm font-black tracking-tight text-white">POS<span className="text-emerald-400">+</span></span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black text-white tracking-wide uppercase">
              {settings?.storeName || 'POS PLUS APPARELS'}
            </h1>
            {settings?.enableCloudSync && settings?.supabaseUrl ? (
              <span
                onClick={() => onTabChange('settings')}
                className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1 cursor-pointer hover:bg-emerald-500/20"
                title="Realtime Multi-Counter Cloud Sync Active"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Cloud Synced
              </span>
            ) : (
              <span
                onClick={() => onTabChange('settings')}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold flex items-center gap-1 cursor-pointer hover:text-white"
                title="Running locally offline. Click to configure Cloud Sync."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Local DB
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-xs">{settings?.tagline || 'Fashion & Lifestyle Retail'}</p>
        </div>
      </div>

      {/* Navigation Pills */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isLockedForCashier = item.adminOnly && !isAdmin;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow'
                  : isLockedForCashier
                  ? 'text-slate-500 hover:text-amber-300 hover:bg-slate-900'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              {isLockedForCashier && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
              {item.hotkey && (
                <kbd className={`text-[10px] px-1 rounded font-mono ${
                  isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-900 text-slate-500'
                }`}>
                  {item.hotkey}
                </kbd>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: User Badge, Lock & Clock */}
      <div className="flex items-center gap-3">
        {/* Active User Session Pill */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
            isAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
          }`}>
            {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
          </div>

          <div className="text-left">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{currentUser?.name || 'User'}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                isAdmin ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-slate-800 text-slate-300'
              }`}>
                {currentUser?.role || 'cashier'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {currentUser?.counterName || 'Counter 1'}
            </div>
          </div>

          {/* Switch User / Lock Button */}
          <button
            type="button"
            onClick={onLogout}
            className="ml-1 p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
            title="Lock Counter / Switch User"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Clock */}
        <div className="hidden sm:flex flex-col items-end text-right">
          <div className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <div className="text-[10px] text-slate-400">
            {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>
    </header>
  );
}
