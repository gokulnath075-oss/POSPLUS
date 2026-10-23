import React, { useState, useEffect } from 'react';
import { initializeDatabase, getStoreSettings } from './db/db';
import { Navbar } from './components/Navbar';
import { PosScreen } from './components/pos/PosScreen';
import { BarcodeTagGenerator } from './components/barcode/BarcodeTagGenerator';
import { ProductList } from './components/inventory/ProductList';
import { CustomerManager } from './components/customers/CustomerManager';
import { ReturnExchange } from './components/returns/ReturnExchange';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { StoreSettings } from './components/settings/StoreSettings';
import { initRealtimeCloudSync, pullCloudDataToLocal } from './services/cloudSync';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'barcode' | 'inventory' | 'customers' | 'returns' | 'reports' | 'settings'
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState(null);

  // Initialize offline database and settings
  useEffect(() => {
    async function setup() {
      try {
        await initializeDatabase();
        const loadedSettings = await getStoreSettings();
        setSettings(loadedSettings);
      } catch (err) {
        console.error('Database setup failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    setup();
  }, []);

  // Real-time Multi-Counter Cloud Sync Listener
  useEffect(() => {
    if (settings?.enableCloudSync && settings?.supabaseUrl && settings?.supabaseAnonKey) {
      const subInstance = initRealtimeCloudSync(settings.supabaseUrl, settings.supabaseAnonKey, (table, payload) => {
        pullCloudDataToLocal(settings.supabaseUrl, settings.supabaseAnonKey).catch(err => console.warn('Sync refresh err:', err));
      });
      return () => {
        subInstance?.unsubscribe?.();
      };
    }
  }, [settings?.enableCloudSync, settings?.supabaseUrl, settings?.supabaseAnonKey]);

  // Global Function Keys (F1: POS, F2: Barcode Tag, F3: Inventory, F4: Khata, F5: Returns, F6: Reports)
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      // Don't intercept if user is typing in an input unless it's a dedicated function key
      if (['F1', 'F2', 'F3', 'F5', 'F6'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'F1') setActiveTab('pos');
        else if (e.key === 'F2') setActiveTab('barcode');
        else if (e.key === 'F3') setActiveTab('inventory');
        else if (e.key === 'F5') setActiveTab('returns');
        else if (e.key === 'F6') setActiveTab('reports');
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  const handleNavigateToBarcodeTag = (productId) => {
    setSelectedProductForBarcode(productId);
    setActiveTab('barcode');
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <div className="text-center">
          <h2 className="text-lg font-black tracking-wide">POS PLUS APPARELS</h2>
          <p className="text-xs text-slate-400 mt-1">Starting offline database and POS engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        settings={settings}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {activeTab === 'pos' && (
          <PosScreen settings={settings} />
        )}

        {activeTab === 'barcode' && (
          <BarcodeTagGenerator
            settings={settings}
            preselectedProductId={selectedProductForBarcode}
          />
        )}

        {activeTab === 'inventory' && (
          <ProductList
            onNavigateToBarcodeTag={handleNavigateToBarcodeTag}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerManager />
        )}

        {activeTab === 'returns' && (
          <ReturnExchange settings={settings} />
        )}

        {activeTab === 'reports' && (
          <ReportsDashboard settings={settings} />
        )}

        {activeTab === 'settings' && (
          <StoreSettings
            settings={settings}
            onSettingsUpdated={(updated) => setSettings(updated)}
          />
        )}
      </main>

      {/* Mobile Navigation bar for smaller screens */}
      <div className="md:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 py-2 no-print">
        <button
          onClick={() => setActiveTab('pos')}
          className={`text-xs flex flex-col items-center ${activeTab === 'pos' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          Billing
        </button>
        <button
          onClick={() => setActiveTab('barcode')}
          className={`text-xs flex flex-col items-center ${activeTab === 'barcode' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          Tags
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`text-xs flex flex-col items-center ${activeTab === 'inventory' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          Garments
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`text-xs flex flex-col items-center ${activeTab === 'customers' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          Khata
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`text-xs flex flex-col items-center ${activeTab === 'reports' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          Reports
        </button>
      </div>
    </div>
  );
}
