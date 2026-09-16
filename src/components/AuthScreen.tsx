import React, { useState } from 'react';
import { User } from '../types';
import { StorageService } from '../utils/storage';
import { 
  BookOpen, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  AlertCircle,
  ArrowRight,
  FileSpreadsheet,
  Check
} from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  onOpenGoogleSheets?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, onOpenGoogleSheets }) => {
  const [loginRole, setLoginRole] = useState<'anggota' | 'admin'>('anggota');
  
  // Login State - Clean and empty without automatic fill
  const [niaOrUsername, setNiaOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const users = StorageService.getUsers();
  const matchedUser = niaOrUsername.trim() ? users.find(u => 
    u.nia.toLowerCase() === niaOrUsername.trim().toLowerCase() ||
    (loginRole === 'admin' && (niaOrUsername.trim().toLowerCase() === 'admin' || u.nia.toLowerCase() === niaOrUsername.trim().toLowerCase()))
  ) : null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const allUsers = StorageService.getUsers();
    const query = niaOrUsername.trim().toLowerCase();

    // Find matching user by NIA or username or ID
    const foundUser = allUsers.find(u => {
      const matchIdentity = 
        u.nia.toLowerCase() === query || 
        u.namaLengkap.toLowerCase() === query ||
        (u.role === 'admin' && (query === 'admin' || u.nia.toLowerCase() === query));
      return matchIdentity;
    });

    if (!foundUser) {
      setErrorMessage(
        loginRole === 'admin'
          ? 'Akun admin tidak ditemukan. Silakan masukkan username atau NIA admin yang valid.'
          : `Nomor Induk Anggota (NIA) "${niaOrUsername}" tidak ditemukan pada data Sheet3.`
      );
      return;
    }

    // Role check
    if (loginRole === 'admin' && foundUser.role !== 'admin') {
      setErrorMessage('Akun ini terdaftar sebagai Anggota, bukan Administrator.');
      return;
    }

    // Password validation
    if (foundUser.password && foundUser.password !== password) {
      setErrorMessage('Kata sandi yang Anda masukkan salah. Silakan periksa kembali kata sandi di Sheet3.');
      return;
    }

    StorageService.setCurrentUser(foundUser);
    onLoginSuccess(foundUser);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8 bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-emerald-800 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-700/50 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-8 -top-8 w-32 h-32 bg-emerald-600/30 rounded-full blur-xl pointer-events-none" />

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-700/80 border border-emerald-500/50 shadow-inner mb-3">
            <BookOpen className="w-7 h-7 text-emerald-200" />
          </div>
          <h1 className="text-2xl font-bold font-serif tracking-tight text-white">
            Mutabaah Yaumiah
          </h1>
          <p className="text-xs text-emerald-200/90 mt-1 max-w-xs mx-auto">
            Sistem Evaluasi Ibadah Harian: Ruhiah, Fikriah, dan Jasadiah
          </p>

          {/* Google Sheets Sheet3 sync note */}
          <div className="mt-4 flex items-center justify-between text-[11px] bg-emerald-950/70 py-1.5 px-3 rounded-lg border border-emerald-700/50 text-emerald-200">
            <span className="flex items-center gap-1.5 truncate">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>Autentikasi terhubung <strong>Sheet3</strong></span>
            </span>
            {onOpenGoogleSheets && (
              <button
                type="button"
                onClick={onOpenGoogleSheets}
                className="text-[10px] text-amber-300 hover:text-amber-200 underline font-semibold shrink-0 ml-2"
              >
                Atur Sheets
              </button>
            )}
          </div>
        </div>

        {/* Title bar */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <UserCheck className="w-4 h-4 text-emerald-700" />
            <span>Masuk ke Akun</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {loginRole === 'admin' ? 'Akses Administrator' : 'Akses Anggota / Santri'}
          </span>
        </div>

        {/* Body content */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Role Toggle */}
            <div className="p-1 bg-slate-100 rounded-lg flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setLoginRole('anggota');
                  setNiaOrUsername('');
                  setPassword('');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  loginRole === 'anggota'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Anggota (Santri/Binaan)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginRole('admin');
                  setNiaOrUsername('');
                  setPassword('');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${
                  loginRole === 'admin'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Admin / Murabbi</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {loginRole === 'admin' ? 'Nomor Induk / Username Admin' : 'Nomor Induk Anggota (NIA)'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={niaOrUsername}
                  onChange={(e) => setNiaOrUsername(e.target.value)}
                  placeholder={loginRole === 'admin' ? 'Masukkan ADM-001 atau username admin' : 'Masukkan NIA (misal: NIA-2024-001)'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-slate-800"
                />
              </div>
              
              {matchedUser ? (
                <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium truncate">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      <strong>{matchedUser.namaLengkap}</strong> • {matchedUser.kodeGrup}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-200/70 text-emerald-800 font-semibold px-1.5 py-0.2 rounded shrink-0 ml-2">
                    Sheet3 Terverifikasi
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">
                  {loginRole === 'admin' 
                    ? 'Gunakan username admin dan kata sandi Anda' 
                    : 'Gunakan Nomor Induk Anggota (NIA) yang terdaftar pada tab Sheet3'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-slate-800"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow transition-all flex items-center justify-center space-x-2"
            >
              <span>Masuk Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            © Mutabaah Yaumiah. Menjaga istiqomah dalam ibadah & pembinaan.
          </p>
        </div>

      </div>
    </div>
  );
};
