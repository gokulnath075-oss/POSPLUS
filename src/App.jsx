import React, { useState, useEffect } from 'react';
import { initializeDatabase, getStoreSettings, getAllUsers, authenticateUser } from './db/db';
import { Navbar } from './components/Navbar';
import { PosScreen } from './components/pos/PosScreen';
import { BarcodeTagGenerator } from './components/barcode/BarcodeTagGenerator';
import { ProductList } from './components/inventory/ProductList';
import { CustomerManager } from './components/customers/CustomerManager';
import { ReturnExchange } from './components/returns/ReturnExchange';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { StoreSettings } from './components/settings/StoreSettings';
import { LoginModal } from './components/auth/LoginModal';
import { initRealtimeCloudSync, pullCloudDataToLocal } from './services/cloudSync';
import { Loader2, ShieldAlert, X, ArrowRight, Lock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'barcode' | 'inventory' | 'customers' | 'returns' | 'reports' | 'settings'
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [availableUsers, setAvailableUsers] = useState([]);

  // Admin PIN prompt state (when cashier tries to access Reports or Settings)
  const [adminPromptTargetTab, setAdminPromptTargetTab] = useState(null);
  const [adminPromptPin, setAdminPromptPin] = useState('');
  const [adminPromptError, setAdminPromptError] = useState('');

  // Initialize offline database and settings
  useEffect(() => {
    async function setup() {
      try {
        await initializeDatabase();
        const loadedSettings = await getStoreSettings();
        setSettings(loadedSettings);

        const users = await getAllUsers();
        setAvailableUsers(users);
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
      if (!currentUser) return;

      if (['F1', 'F2', 'F3', 'F5', 'F6'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'F1') setActiveTab('pos');
        else if (e.key === 'F2') setActiveTab('barcode');
        else if (e.key === 'F3') setActiveTab('inventory');
        else if (e.key === 'F5') setActiveTab('returns');
        else if (e.key === 'F6') {
          if (currentUser.role === 'admin') {
            setActiveTab('reports');
          } else {
            handleAdminUnlockPrompt('reports');
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [currentUser]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('pos_current_user', JSON.stringify(user));
    if (user.role === 'cashier') {
      setActiveTab('pos');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pos_current_user');
    setCurrentUser(null);
  };

  const handleAdminUnlockPrompt = (targetTab) => {
    setAdminPromptTargetTab(targetTab);
    setAdminPromptPin('');
    setAdminPromptError('');
  };

  const handleVerifyAdminPin = async (e) => {
    e.preventDefault();
    if (!adminPromptPin) return;

    try {
      const res = await authenticateUser('admin', adminPromptPin);
      if (res.success) {
        const target = adminPromptTargetTab;
        setAdminPromptTargetTab(null);
        setAdminPromptPin('');
        setActiveTab(target);
      } else {
        setAdminPromptError('Incorrect Admin PIN.');
        setAdminPromptPin('');
      }
    } catch (err) {
      setAdminPromptError('Verification error: ' + err.message);
    }
  };

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

  // If not logged in, show Login Screen
  if (!currentUser) {
    return (
      <LoginModal
        availableUsers={availableUsers}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        settings={settings}
        currentUser={currentUser}
        onLogout={handleLogout}
        onAdminUnlockPrompt={handleAdminUnlockPrompt}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {activeTab === 'pos' && (
          <PosScreen settings={settings} currentUser={currentUser} />
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
            currentUser={currentUser}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerManager />
        )}

        {activeTab === 'returns' && (
          <ReturnExchange settings={settings} />
        )}

        {activeTab === 'reports' && (
          isAdmin ? (
            <ReportsDashboard settings={settings} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <Lock className="w-12 h-12 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Admin Permission Required</h2>
              <p className="text-xs text-slate-400 max-w-sm">
                Sales turnover, profits, and GST analytics are restricted to Store Admins.
              </p>
              <button
                onClick={() => handleAdminUnlockPrompt('reports')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
              >
                Enter Admin PIN to Unlock
              </button>
            </div>
          )
        )}

        {activeTab === 'settings' && (
          isAdmin ? (
            <StoreSettings
              settings={settings}
              currentUser={currentUser}
              onSettingsUpdated={(updated) => setSettings(updated)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <Lock className="w-12 h-12 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Admin Permission Required</h2>
              <p className="text-xs text-slate-400 max-w-sm">
                Store configuration, cloud credentials, and database backups are restricted to Store Admins.
              </p>
              <button
                onClick={() => handleAdminUnlockPrompt('settings')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
              >
                Enter Admin PIN to Unlock
              </button>
            </div>
          )
        )}
      </main>

      {/* Admin Unlock Modal (When Cashier attempts to open Admin section) */}
      {adminPromptTargetTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">Admin Authorization</h3>
              </div>
              <button
                onClick={() => setAdminPromptTargetTab(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Please enter the <strong>Store Admin PIN</strong> to access the <strong>{adminPromptTargetTab.toUpperCase()}</strong> section.
            </p>

            <form onSubmit={handleVerifyAdminPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  autoFocus
                  maxLength={6}
                  placeholder="Enter Admin PIN (Default: 1234)"
                  value={adminPromptPin}
                  onChange={(e) => {
                    setAdminPromptPin(e.target.value.replace(/[^0-9]/g, ''));
                    setAdminPromptError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-center font-mono text-xl tracking-widest rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500"
                />
                {adminPromptError && (
                  <p className="text-xs text-red-400 text-center mt-1.5 font-medium">{adminPromptError}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdminPromptTargetTab(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!adminPromptPin}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold"
                >
                  Verify & Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Navigation bar for smaller screens */}
      <div className="lg:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 py-2 no-print">
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
        {isAdmin && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`text-xs flex flex-col items-center ${activeTab === 'reports' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            Reports
          </button>
        )}
      </div>
    </div>
  );
}
