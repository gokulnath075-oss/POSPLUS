import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Delete, ArrowRight, Lock, Sparkles, AlertCircle, Laptop } from 'lucide-react';
import { authenticateUser } from '../../db/db';

export function LoginModal({ onLoginSuccess, availableUsers = [] }) {
  const [selectedUser, setSelectedUser] = useState(availableUsers[0] || null);
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDigitClick = (digit) => {
    if (pin.length < 8) {
      setPin(prev => prev + digit);
      setErrorMessage('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedUser) {
      setErrorMessage('Please select an account to log in.');
      return;
    }
    if (!pin) {
      setErrorMessage('Please enter your 4-digit PIN.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authenticateUser(selectedUser.username, pin);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch (err) {
      setErrorMessage('Login failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-click bypass for instant login during testing
  const handleQuickLogin = async (user) => {
    setIsLoading(true);
    try {
      const res = await authenticateUser(user.username, user.pin);
      if (res.success) {
        onLoginSuccess(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-6 text-center border-b border-slate-800">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-lg font-black tracking-tight text-white">POS<span className="text-emerald-400">+</span></span>
            </div>
          </div>
          <h1 className="text-xl font-black text-white tracking-wide uppercase">
            Clothing & Apparel POS
          </h1>
          <p className="text-xs text-slate-400 mt-1">Select terminal role to begin billing</p>
        </div>

        <div className="p-6 space-y-6">
          {/* User Account Cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Login Role:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {availableUsers.map(u => {
                const isSelected = selectedUser?.username === u.username;
                const isAdmin = u.role === 'admin';

                return (
                  <div
                    key={u.username}
                    onClick={() => {
                      setSelectedUser(u);
                      setPin('');
                      setErrorMessage('');
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col items-center text-center group ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-600/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                      isAdmin ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                    </div>

                    <div className="font-bold text-xs text-white group-hover:text-indigo-300">
                      {u.name}
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1 uppercase ${
                      isAdmin
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PIN Display & Input */}
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center">
              <span className="text-[11px] font-semibold text-slate-400 mb-2">
                Enter Security PIN for <strong className="text-white">{selectedUser?.name || 'Selected Account'}</strong>
              </span>

              {/* Masked PIN bubbles */}
              <div className="flex gap-3 h-8 items-center">
                {[0, 1, 2, 3].map(index => (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                      pin.length > index
                        ? 'bg-indigo-500 scale-125 shadow-md shadow-indigo-500/50'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                  />
                ))}
              </div>

              {errorMessage && (
                <div className="mt-3 text-xs text-red-400 flex items-center gap-1 font-medium animate-shake">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Touch Numpad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigitClick(num.toString())}
                  className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-white font-mono text-lg font-bold rounded-xl transition cursor-pointer"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="py-3 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition"
              >
                CLEAR
              </button>

              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-white font-mono text-lg font-bold rounded-xl transition cursor-pointer"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="py-3 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center rounded-xl transition"
                title="Backspace"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            disabled={isLoading || pin.length < 3}
            onClick={handleSubmit}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black rounded-2xl text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Login to Terminal</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Hint */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-400">
              💡 <strong>Default PINs:</strong> Admin = <code className="text-amber-400 font-mono font-bold">1234</code> | Counter 1 = <code className="text-indigo-400 font-mono font-bold">1111</code> | Counter 2 = <code className="text-indigo-400 font-mono font-bold">2222</code>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
