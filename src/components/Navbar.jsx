import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Tag, Package, Users, RotateCcw, BarChart3,
  Settings, Clock, Sparkles, ShieldCheck, Keyboard
} from 'lucide-react';

export function Navbar({ activeTab, onTabChange, settings }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'pos', label: 'POS Billing', icon: ShoppingBag, hotkey: 'F1' },
    { id: 'barcode', label: 'Barcode Tags', icon: Tag, hotkey: 'F2' },
    { id: 'inventory', label: 'Garments & Stock', icon: Package, hotkey: 'F3' },
    { id: 'customers', label: 'Customers & Khata', icon: Users, hotkey: 'F4' },
    { id: 'returns', label: 'Returns & Exchange', icon: RotateCcw, hotkey: 'F5' },
    { id: 'reports', label: 'Reports & GST', icon: BarChart3, hotkey: 'F6' },
    { id: 'settings', label: 'Settings', icon: Settings, hotkey: '' },
  ];

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
                Cloud Synced ({settings?.counterName || 'Counter 1'})
              </span>
            ) : (
              <span
                onClick={() => onTabChange('settings')}
                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold flex items-center gap-1 cursor-pointer hover:text-white"
                title="Running locally offline. Click to configure Cloud Sync."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                {settings?.counterName || 'Counter 1'} (Local DB)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 truncate max-w-xs">{settings?.tagline || 'Fashion & Lifestyle Retail'}</p>
        </div>
      </div>

      {/* Navigation Pills */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
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

      {/* Right Controls: Clock & Status */}
      <div className="flex items-center gap-4">
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
