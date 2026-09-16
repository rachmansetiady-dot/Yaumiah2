import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { StorageService } from '../utils/storage';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { 
  BookOpen, 
  User as UserIcon, 
  LogOut, 
  Users, 
  ShieldCheck, 
  ChevronDown,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  Zap
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  onOpenGoogleSheets?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentUser, 
  onUserChange,
  onOpenGoogleSheets
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasSheetsUrl, setHasSheetsUrl] = useState(false);
  const [isQuickSyncing, setIsQuickSyncing] = useState(false);
  const users = StorageService.getUsers();

  useEffect(() => {
    const checkUrl = () => {
      setHasSheetsUrl(!!GoogleSheetsService.getScriptUrl());
    };
    checkUrl();
    const unsub = GoogleSheetsService.subscribe((event) => {
      checkUrl();
      if (event.status === 'syncing') {
        setIsQuickSyncing(true);
      } else {
        setIsQuickSyncing(false);
      }
    });
    return unsub;
  }, []);

  const handleQuickSync = async () => {
    if (!GoogleSheetsService.getScriptUrl()) {
      if (onOpenGoogleSheets) onOpenGoogleSheets();
      return;
    }
    setIsQuickSyncing(true);
    try {
      await GoogleSheetsService.fetchAllRealtime();
    } finally {
      setIsQuickSyncing(false);
    }
  };

  const handleSwitchAccount = (user: User) => {
    StorageService.setCurrentUser(user);
    onUserChange(user);
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    onUserChange(null);
    setShowUserMenu(false);
  };

  return (
    <header className="bg-emerald-900 text-white border-b border-emerald-800 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center shadow-inner text-emerald-200">
              <BookOpen className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-serif">
                  Mutabaah Yaumiah
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-800/80 text-emerald-200 border border-emerald-700">
                  Harian
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 hidden sm:block">
                Evaluasi & Peningkatan Ibadah Harian
              </p>
            </div>
          </div>

          {/* User Section & Google Sheets Action */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Realtime Sync Trigger */}
            {hasSheetsUrl && (
              <button
                onClick={handleQuickSync}
                disabled={isQuickSyncing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/60 shadow-xs transition-all disabled:opacity-60"
                title="Tarik data real-time dari Sheet3 dan Rekap Mutabaah"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-300 ${isQuickSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isQuickSyncing ? 'Menarik...' : 'Sync Sheet3'}</span>
              </button>
            )}

            {/* Google Sheets Sync Indicator & Button */}
            {onOpenGoogleSheets && (
              <button
                onClick={onOpenGoogleSheets}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-xs ${
                  hasSheetsUrl
                    ? 'bg-emerald-800/90 hover:bg-emerald-700/90 text-emerald-100 border-emerald-500/50'
                    : 'bg-emerald-950/80 hover:bg-emerald-800 text-emerald-200 border-emerald-700/60'
                }`}
                title="Integrasi Google Sheets & Real-Time Sync (Sheet3)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="hidden sm:inline">Google Sheets</span>
                <span className="inline sm:hidden">Sheets</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  hasSheetsUrl ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`} />
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Quick Account Switcher Dropdown */}
                <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  id="user-menu-btn"
                  className="flex items-center space-x-2.5 bg-emerald-800/80 hover:bg-emerald-700/80 transition-colors border border-emerald-700 rounded-lg px-3 py-1.5 text-left text-sm"
                  aria-expanded={showUserMenu}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs border border-emerald-400/40">
                    {currentUser.role === 'admin' ? (
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                    ) : (
                      currentUser.namaLengkap.charAt(0)
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1.5">
                      <span>{currentUser.namaLengkap}</span>
                      <span className={`text-[10px] uppercase px-1.5 py-0.2 rounded font-bold ${
                        currentUser.role === 'admin' 
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                          : 'bg-emerald-600/50 text-emerald-100'
                      }`}>
                        {currentUser.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-300">
                      {currentUser.role === 'admin' ? currentUser.kodeGrup : `${currentUser.nia} • ${currentUser.kodeGrup}`}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-emerald-300 ml-1" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Akun Aktif
                      </p>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {currentUser.namaLengkap}
                      </p>
                      <p className="text-xs text-slate-500">
                        {currentUser.role === 'admin' ? 'Administrator / Murabbi' : `${currentUser.nia} (${currentUser.jenisKelamin})`}
                      </p>
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">
                        Grup: {currentUser.kodeGrup}
                      </p>
                    </div>

                    {/* Switcher if multiple accounts exist */}
                    {users.length > 1 && (
                      <div className="px-3 py-2 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 text-emerald-600" />
                            Ganti Akun:
                          </span>
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {users.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => handleSwitchAccount(u)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                currentUser.id === u.id
                                  ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <div className="truncate">
                                <span className="truncate block font-medium">{u.namaLengkap}</span>
                                <span className="text-[10px] text-slate-400">
                                  {u.role === 'admin' ? 'Admin' : `${u.nia} • ${u.jenisKelamin}`}
                                </span>
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {u.kodeGrup}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Logout direct button */}
              <button
                onClick={handleLogout}
                title="Keluar"
                className="p-2 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-emerald-300 font-medium">Silakan Masuk</span>
            </div>
          )}

          </div>
        </div>
      </div>
    </header>
  );
};
