import React, { useState } from 'react';
import { User, JenisKelamin } from '../types';
import { StorageService, DEFAULT_GROUPS } from '../utils/storage';
import { X, UserPlus, AlertCircle, Check, Lock, Eye, EyeOff } from 'lucide-react';

interface AddMemberModalProps {
  onClose: () => void;
  onMemberAdded: (user: User) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose, onMemberAdded }) => {
  const [nia, setNia] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<JenisKelamin>('Laki-laki');
  const [kodeGrup, setKodeGrup] = useState(DEFAULT_GROUPS[0]);
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [noHp, setNoHp] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nia.trim() || !namaLengkap.trim()) {
      setError('NIA dan Nama Lengkap wajib diisi.');
      return;
    }

    const users = StorageService.getUsers();
    if (users.some(u => u.nia.toLowerCase() === nia.trim().toLowerCase())) {
      setError(`NIA ${nia} sudah ada di database.`);
      return;
    }

    const newUser = StorageService.addUser({
      nia: nia.trim().toUpperCase(),
      namaLengkap: namaLengkap.trim(),
      jenisKelamin,
      kodeGrup,
      role: 'anggota',
      password: password.trim() || '123',
      noHp: noHp.trim()
    });

    onMemberAdded(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold font-serif text-base">Tambah Anggota Baru</h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nomor Induk Anggota (NIA) *
            </label>
            <input
              type="text"
              required
              value={nia}
              onChange={(e) => setNia(e.target.value)}
              placeholder="Contoh: NIA-001"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nama Lengkap *
            </label>
            <input
              type="text"
              required
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              placeholder="Contoh: Abdullah Azzam"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jenis Kelamin *
              </label>
              <select
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value as JenisKelamin)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Laki-laki">Laki-laki (Ikhwan)</option>
                <option value="Perempuan">Perempuan (Akhwat)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kode Grup *
              </label>
              <select
                value={kodeGrup}
                onChange={(e) => setKodeGrup(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600"
              >
                {DEFAULT_GROUPS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kata Sandi Awal
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Default: 123"
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  className="absolute right-2 top-1.5 p-1 text-slate-400 hover:text-emerald-700 focus:outline-none rounded transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                No. WhatsApp (Opsional)
              </label>
              <input
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="0812..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Anggota</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
