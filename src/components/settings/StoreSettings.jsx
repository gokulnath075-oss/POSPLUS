import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, saveStoreSettings } from '../../db/db';
import {
  Settings, Store, QrCode, Printer, FileText, Download,
  Upload, RefreshCw, Check, ShieldCheck, Globe,
  Database, Sparkles, CheckCircle2, AlertCircle, Laptop,
  Package, Users, Receipt, HardDrive, Cloud, Copy
} from 'lucide-react';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SETTINGS } from '../../db/seedData';
import { getEffectiveCloudCredentials } from '../../config/databaseConfig';
import {
  testCloudConnection,
  pushLocalDataToCloud,
  pullCloudDataToLocal,
  SUPABASE_SCHEMA_SQL,
} from '../../services/cloudSync';
import { StaffManagement } from './StaffManagement';

export function StoreSettings({ settings, onSettingsUpdated, currentUser }) {
  const [formData, setFormData] = useState(settings || INITIAL_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Cloud Sync state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Live database records
  const productCount = useLiveQuery(() => db.products.count(), []) ?? 0;
  const customerCount = useLiveQuery(() => db.customers.count(), []) ?? 0;
  const salesCount = useLiveQuery(() => db.sales.count(), []) ?? 0;
  const heldCount = useLiveQuery(() => db.heldBills.count(), []) ?? 0;

  const { isConfigured: isCloudActive } = getEffectiveCloudCredentials(formData);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    await saveStoreSettings(formData);
    onSettingsUpdated(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Test Supabase Connection & Auto Push
  const handleTestAndSyncCloud = async () => {
    if (!formData.supabaseUrl || !formData.supabaseAnonKey) {
      setTestResult({ success: false, message: 'Please enter both your Supabase Project URL and Anon Public Key.' });
      return;
    }
    setTestingConnection(true);
    setTestResult(null);
    const result = await testCloudConnection(formData.supabaseUrl, formData.supabaseAnonKey);
    setTestingConnection(false);
    setTestResult(result);

    if (result.success) {
      await saveStoreSettings(formData);
      onSettingsUpdated(formData);

      setSyncInProgress(true);
      setSyncStatusMsg('Pushing local products, customers, and sales to Supabase Cloud...');
      try {
        const pushRes = await pushLocalDataToCloud(formData.supabaseUrl, formData.supabaseAnonKey);
        setSyncStatusMsg(`Synchronized ${pushRes.pushedProducts} products, ${pushRes.pushedCustomers} customers, and ${pushRes.pushedSales || 0} sales with Cloud!`);
        setTimeout(() => setSyncStatusMsg(''), 6000);
      } catch (err) {
        console.warn('Auto push err:', err);
      } finally {
        setSyncInProgress(false);
      }
    }
  };

  // Copy SQL script to clipboard
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Manual pull from cloud
  const handleManualPull = async () => {
    if (!formData.supabaseUrl || !formData.supabaseAnonKey) return;
    setSyncInProgress(true);
    setSyncStatusMsg('Pulling latest cloud data down to this counter...');
    try {
      const res = await pullCloudDataToLocal(formData.supabaseUrl, formData.supabaseAnonKey);
      setSyncStatusMsg(`Updated! Pulled ${res.pulledProducts} products, ${res.pulledCustomers} customers, ${res.pulledSales} sales.`);
      setTimeout(() => setSyncStatusMsg(''), 5000);
    } catch (err) {
      alert('Pull error: ' + err.message);
    } finally {
      setSyncInProgress(false);
    }
  };

  // Full Database Backup to JSON
  const handleBackupDatabase = async () => {
    const products = await db.products.toArray();
    const customers = await db.customers.toArray();
    const sales = await db.sales.toArray();
    const returns = await db.returns.toArray();
    const heldBills = await db.heldBills.toArray();
    const storeSettings = await db.settings.get('store_settings');

    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      storeName: formData.storeName,
      data: {
        products,
        customers,
        sales,
        returns,
        heldBills,
        settings: storeSettings,
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `POS_PLUS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Restore Database from JSON
  const handleRestoreDatabase = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target.result);
        if (!backup.data) {
          alert('Invalid backup file format.');
          return;
        }

        if (confirm('Restoring will replace all current database records. Do you wish to continue?')) {
          await db.transaction('rw', db.products, db.customers, db.sales, db.returns, db.heldBills, db.settings, async () => {
            await db.products.clear();
            await db.customers.clear();
            await db.sales.clear();
            await db.returns.clear();
            await db.heldBills.clear();

            if (backup.data.products) await db.products.bulkAdd(backup.data.products);
            if (backup.data.customers) await db.customers.bulkAdd(backup.data.customers);
            if (backup.data.sales) await db.sales.bulkAdd(backup.data.sales);
            if (backup.data.returns) await db.returns.bulkAdd(backup.data.returns);
            if (backup.data.heldBills) await db.heldBills.bulkAdd(backup.data.heldBills);
            if (backup.data.settings) await db.settings.put(backup.data.settings);
          });

          alert('Database restored successfully! The page will now reload.');
          window.location.reload();
        }
      } catch (err) {
        alert('Failed to read or parse backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Reset to Demo Clothing Store
  const handleResetDemoData = async () => {
    if (confirm('Are you sure you want to reset everything back to the default Demo Indian Clothing catalog?')) {
      await db.products.clear();
      await db.customers.clear();
      await db.sales.clear();
      await db.returns.clear();
      await db.heldBills.clear();
      await db.products.bulkAdd(INITIAL_PRODUCTS);
      await db.customers.bulkAdd(INITIAL_CUSTOMERS);
      await db.settings.put({ key: 'store_settings', value: INITIAL_SETTINGS });
      alert('Reset to demo catalog complete!');
      window.location.reload();
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-indigo-400" />
            Store Profile, Multi-Device Cloud Sync & Database
          </h1>
          <p className="text-sm text-slate-400">
            Configure your shop profile, multi-device cloud synchronization, billing counters, and UPI payments
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4" /> Settings Saved!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION: AUTOMATIC BUILT-IN DATABASE & HEALTH */}
        <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-6 space-y-5 shadow-xl shadow-emerald-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Automatic Built-in Database
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold flex items-center gap-1 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Auto-Saving Active
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Zero latency offline-first engine. All billing, garment barcodes, Khata ledgers, and sales are protected locally in real time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Engine:</span>
              <span className="text-xs px-2.5 py-1 bg-slate-950 text-indigo-300 border border-slate-800 rounded-lg font-mono font-semibold">
                IndexedDB v2 (Offline-First)
              </span>
            </div>
          </div>

          {/* Live Records Health Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{productCount}</div>
                <div className="text-[11px] text-slate-400">Garment Catalog</div>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{customerCount}</div>
                <div className="text-[11px] text-slate-400">Customer Records</div>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{salesCount}</div>
                <div className="text-[11px] text-slate-400">Sales Invoices</div>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-white">{heldCount}</div>
                <div className="text-[11px] text-slate-400">Held / Parked Bills</div>
              </div>
            </div>
          </div>

          {/* Counter Name & Auto-Save Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-indigo-400" /> This Counter / Terminal Name
              </label>
              <input
                type="text"
                placeholder="e.g. Counter 1 (Ground Floor)"
                value={formData.counterName || 'Counter 1'}
                onChange={(e) => handleChange('counterName', e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-semibold"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Printed on thermal receipts and invoice headers</span>
            </div>

            <div className="md:col-span-2 bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-center space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                Automatic Real-time Data Protection
              </div>
              <p className="text-[11px] text-slate-400">
                Every sale transaction, barcode scan, customer Khata repayment, and price tag change is committed automatically into this terminal's persistent storage without relying on external cloud servers.
              </p>
            </div>
          </div>

          {/* Database Actions: Backup, Restore & Reset */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              Database Backup & Disaster Recovery
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleBackupDatabase}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Complete JSON Backup
              </button>

              <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer border border-slate-700">
                <Upload className="w-4 h-4" /> Restore from Backup File
                <input type="file" accept=".json" onChange={handleRestoreDatabase} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleResetDemoData}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs transition border border-red-500/20 ml-auto cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Reset Demo Indian Catalog
              </button>
            </div>
          </div>
        </div>

        {/* SECTION: MULTI-DEVICE REAL-TIME CLOUD SYNCHRONIZATION */}
        <div className={`border-2 rounded-2xl p-6 space-y-4 shadow-xl transition ${
          isCloudActive
            ? 'bg-slate-900 border-indigo-500/40 shadow-indigo-950/20'
            : 'bg-slate-900 border-amber-500/40 shadow-amber-950/20'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${
                isCloudActive
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Multi-Device Cloud Synchronization
                  {isCloudActive ? (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold flex items-center gap-1 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      All Counters Synchronized
                    </span>
                  ) : (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-semibold flex items-center gap-1 border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Connect to Sync Counter 1 & 2
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  Connect your free Supabase database so Counter 1, Counter 2, and Mobile share the same stock, sales, and customers in real time.
                </p>
              </div>
            </div>

            {isCloudActive && (
              <button
                type="button"
                disabled={syncInProgress}
                onClick={handleManualPull}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncInProgress ? 'animate-spin' : ''}`} />
                Pull Latest from Cloud
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={formData.supabaseUrl || ''}
                onChange={(e) => handleChange('supabaseUrl', e.target.value.trim())}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Found in Supabase &rarr; Project Settings &rarr; API &rarr; Project URL</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">
                Supabase Anon Public API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={formData.supabaseAnonKey || ''}
                onChange={(e) => handleChange('supabaseAnonKey', e.target.value.trim())}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Found in Supabase &rarr; Project Settings &rarr; API &rarr; anon public key</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={testingConnection || syncInProgress}
                  onClick={handleTestAndSyncCloud}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection || syncInProgress ? 'animate-spin' : ''}`} />
                  {testingConnection ? 'Testing Connection...' : syncInProgress ? 'Synchronizing Data...' : 'Connect & Sync All Counters Now'}
                </button>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  title="Run this SQL in your open Supabase tab once to create tables"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Copied 1-Click SQL Script!' : 'Copy 1-Click SQL Script (Run in Supabase)'}
                </button>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Once connected, all sales, stock, and customers sync across devices automatically!
              </div>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            {syncStatusMsg && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-medium">
                {syncStatusMsg}
              </div>
            )}
          </div>
        </div>

        {/* SECTION: VERCEL & NETLIFY DEPLOYMENT GUIDE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" /> Online Web Hosting (Vercel & Netlify Ready)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              100% Free SSL & Custom Domains
            </span>
          </div>

          <p className="text-xs text-slate-300">
            This software is fully compiled and configured with <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-indigo-300">vercel.json</code> and <code className="bg-slate-950 px-1 py-0.5 rounded font-mono text-indigo-300">netlify.toml</code>. You can deploy it in 2 minutes:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center justify-between">
                <span>Deploy to Vercel</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">vercel.com</span>
              </div>
              <p className="text-slate-400">
                1. Push this folder to your GitHub / GitLab account.<br />
                2. Go to <strong>vercel.com</strong> &rarr; Click <strong>"Add New Project"</strong>.<br />
                3. Select your repository &rarr; Click <strong>Deploy</strong>.<br />
                4. Done! You get an instant live HTTPS link like <code className="text-emerald-400">https://your-shop.vercel.app</code>
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center justify-between">
                <span>Deploy to Netlify (Drag & Drop)</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">app.netlify.com/drop</span>
              </div>
              <p className="text-slate-400">
                1. Run <code className="text-indigo-400">npm run build</code> in this folder to generate the <code className="text-indigo-300">dist/</code> folder.<br />
                2. Open <strong>app.netlify.com/drop</strong> in your browser.<br />
                3. Drag & drop the <strong>dist</strong> folder into Netlify.<br />
                4. Instant live website with custom domain support!
              </p>
            </div>
          </div>
        </div>

        {/* SECTION: STAFF & CASHIER PIN MANAGEMENT */}
        <StaffManagement currentUser={currentUser} />

        {/* Store Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Store className="w-4 h-4 text-indigo-400" /> Store Profile & Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Store / Brand Name *</label>
              <input
                type="text"
                required
                value={formData.storeName || ''}
                onChange={(e) => handleChange('storeName', e.target.value)}
                placeholder="POS PLUS APPARELS"
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Tagline / Subtitle</label>
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
                placeholder="Fashion & Lifestyle Store"
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Shop Address</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Shop #12, Ground Floor, Fashion Street Market"
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">City</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Bangalore"
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">State & State Code (for GST)</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="Karnataka"
                  className="col-span-2 bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={formData.stateCode || '29'}
                  onChange={(e) => handleChange('stateCode', e.target.value)}
                  placeholder="29"
                  className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm text-center font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Phone Number (Printed on bill)</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+91 98765 00000"
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">GSTIN (Indian GST Number)</label>
              <input
                type="text"
                value={formData.gstin || ''}
                onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                placeholder="29ABCDE1234F1Z5"
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* UPI QR Payment Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <QrCode className="w-4 h-4 text-teal-400" /> Dynamic UPI Payment Settings
          </h2>
          <p className="text-xs text-slate-400">
            Enables instant customer payment by displaying a dynamic QR code pre-filled with the exact bill amount.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">UPI ID / VPA *</label>
              <input
                type="text"
                required
                value={formData.upiId || ''}
                onChange={(e) => handleChange('upiId', e.target.value)}
                placeholder="e.g. yourshop@oksbi or 9876543210@upi"
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">UPI Payee Business Name</label>
              <input
                type="text"
                value={formData.upiPayeeName || ''}
                onChange={(e) => handleChange('upiPayeeName', e.target.value)}
                placeholder="e.g. POS PLUS APPARELS"
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Printer & Receipt Preferences */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Printer className="w-4 h-4 text-indigo-400" /> Receipt & Invoice Format
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">Default Receipt Size</label>
              <select
                value={formData.thermalSize || '80mm'}
                onChange={(e) => handleChange('thermalSize', e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="80mm">80mm (3-Inch Standard Thermal POS Roll)</option>
                <option value="58mm">58mm (2-Inch Compact Thermal Roll)</option>
                <option value="A4">A4 / A5 Full GST Tax Invoice</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Invoice Number Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix || 'POSP-26-'}
                onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                placeholder="POSP-26-"
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Exchange / Return Policy Note (Printed on Bill)</label>
              <textarea
                rows={2}
                value={formData.exchangePolicy || ''}
                onChange={(e) => handleChange('exchangePolicy', e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Footer Thank You Message</label>
              <input
                type="text"
                value={formData.defaultTerms || ''}
                onChange={(e) => handleChange('defaultTerms', e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Check className="w-5 h-5" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
