import React, { useState, useEffect } from 'react';
import { User } from './types';
import { StorageService } from './utils/storage';
import { GoogleSheetsService } from './services/googleSheetsService';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { MemberDashboard } from './components/MemberDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { SyncStatusToast } from './components/SyncStatusToast';
import { BookOpen, Heart } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showGoogleSheetsModal, setShowGoogleSheetsModal] = useState(false);
  const [appRefreshKey, setAppRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize current user from storage (defaults to sample admin or member for instant preview)
    const active = StorageService.getCurrentUser();
    setCurrentUser(active);
    setIsLoading(false);

    // If Google Apps Script Web App URL is configured, pull latest members and records in real-time
    if (GoogleSheetsService.getScriptUrl()) {
      GoogleSheetsService.fetchAllRealtime(true).catch((e) => {
        console.warn('Initial real-time fetch notice:', e);
      });
    }

    const handleRealtimeDataChange = () => {
      const current = StorageService.getCurrentUser();
      setCurrentUser(current);
      setAppRefreshKey(prev => prev + 1);
    };

    window.addEventListener('mutabaah_data_updated', handleRealtimeDataChange);
    return () => {
      window.removeEventListener('mutabaah_data_updated', handleRealtimeDataChange);
    };
  }, []);

  const handleUserChange = (user: User | null) => {
    setCurrentUser(user);
    setAppRefreshKey(prev => prev + 1);
  };

  const handleDataUpdated = () => {
    // Re-sync current user if updated
    const active = StorageService.getCurrentUser();
    setCurrentUser(active);
    setAppRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600 font-sans">
            Memuat Mutabaah Yaumiah...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div key={appRefreshKey} className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Top Navigation */}
      <Navbar 
        currentUser={currentUser}
        onUserChange={handleUserChange}
        onOpenGoogleSheets={() => setShowGoogleSheetsModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!currentUser ? (
          <AuthScreen 
            onLoginSuccess={handleUserChange} 
            onOpenGoogleSheets={() => setShowGoogleSheetsModal(true)}
          />
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard 
            adminUser={currentUser} 
            onOpenGoogleSheets={() => setShowGoogleSheetsModal(true)}
          />
        ) : (
          <MemberDashboard user={currentUser} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-800 text-emerald-200 flex items-center justify-center font-serif text-xs font-bold">
              م
            </div>
            <span className="font-serif font-bold text-slate-800 text-sm">
              Mutabaah Yaumiah
            </span>
            <span className="text-slate-300">•</span>
            <span>Evaluasi Ruhiah, Fikriah & Jasadiah</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Tersambung Google Sheets Realtime & Sheet3
            </span>
            <span>Sistem Pembinaan & Tarbiyah Berkelanjutan</span>
          </div>
        </div>
      </footer>

      {/* Google Sheets Integration & Sync Modal */}
      <GoogleSheetsModal
        isOpen={showGoogleSheetsModal}
        onClose={() => setShowGoogleSheetsModal(false)}
        onDataUpdated={handleDataUpdated}
      />

      {/* Real-time sync floating toast notifier */}
      <SyncStatusToast onOpenModal={() => setShowGoogleSheetsModal(true)} />
    </div>
  );
}
