import React, { useState } from 'react';
import { User, JenisKelamin } from '../types';
import { StorageService, DEFAULT_GROUPS } from '../utils/storage';
import { X, User as UserIcon, Shield, Lock, Phone, Users, Save, Check } from 'lucide-react';

interface EditMemberModalProps {
  user: User | null;
  onClose: () => void;
  onMemberUpdated: (updatedUser: User) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  user,
  onClose,
  onMemberUpdated
}) => {
  if (!user) return null;

  const [namaLengkap, setNamaLengkap] = useState(user.namaLengkap);
  const [nia, setNia] = useState(user.nia);
  const [kodeGrup, setKodeGrup] = useState(user.kodeGrup);
  const [isCustomGroup, setIsCustomGroup] = useState(!DEFAULT_GROUPS.includes(user.kodeGrup));
  const [customGrup, setCustomGrup] = useState(!DEFAULT_GROUPS.includes(user.kodeGrup) ? user.kodeGrup : '');
  const [jenisKelamin, setJenisKelamin] = useState<JenisKelamin>(user.jenisKelamin);
  const [password, setPassword] = useState(user.password || '123');
  const [noHp, setNoHp] = useState(user.noHp || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap.trim() || !nia.trim()) return;

    const finalGrup = isCustomGroup && customGrup.trim() ? customGrup.trim().toUpperCase() : kodeGrup;

    const updatedUser: User = {
      ...user,
      namaLengkap: namaLengkap.trim(),
      nia: nia.trim(),
      kodeGrup: finalGrup,
      jenisKelamin,
      password: password.trim() || '123',
      noHp: noHp.trim()
    };

    StorageService.updateUser(updatedUser);
    setIsSaved(true);
    setTimeout(() => {
      onMemberUpdated(updatedUser);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
              <UserIcon className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif">
                Edit Data Anggota
              </h3>
              <p className="text-xs text-emerald-200">
                Perbarui biodata, kelompok usrah, dan kata sandi anggota
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1.5 rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
              placeholder="Contoh: Muhammad Fulan"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Induk Anggota (NIA) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nia}
                onChange={(e) => setNia(e.target.value)}
                placeholder="Contoh: NIA-2024-001"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi (Sheet3) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kata sandi anggota"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Kelamin <span className="text-rose-500">*</span>
              </label>
              <select
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value as JenisKelamin)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="Laki-laki">Laki-laki (Ikhwan)</option>
                <option value="Perempuan">Perempuan (Akhwat)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. WhatsApp / Handphone
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Grup / Usrah <span className="text-rose-500">*</span>
            </label>
            {!isCustomGroup ? (
              <div className="flex gap-2">
                <select
                  value={kodeGrup}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomGroup(true);
                    } else {
                      setKodeGrup(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  {DEFAULT_GROUPS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                  <option value="__custom__">+ Tulis Grup Lain...</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={customGrup}
                  onChange={(e) => setCustomGrup(e.target.value)}
                  placeholder="Nama Grup Baru (misal: USRAH-ALHIKMAH)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none uppercase"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomGroup(false)}
                  className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium shrink-0"
                >
                  Pilih Daftar
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaved}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
