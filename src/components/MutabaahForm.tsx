import React, { useState, useEffect } from 'react';
import { 
  User, 
  MutabaahRecord, 
  AspekRuhiah, 
  AspekFikriah, 
  AspekJasadiah, 
  StatusSubuh, 
  StatusMatsurat, 
  JenisMatsurat, 
  JenisPuasa, 
  JenisHafalan, 
  TingkatKelancaran 
} from '../types';
import { StorageService, getFormattedDate, calculateScore } from '../utils/storage';
import { 
  CheckCircle2, 
  Calendar, 
  Moon, 
  Sun, 
  BookOpen, 
  Flame, 
  Activity, 
  Clock, 
  Sparkles, 
  Save, 
  Check, 
  AlertCircle,
  HelpCircle,
  Award
} from 'lucide-react';

interface MutabaahFormProps {
  user: User;
  onRecordSaved?: (record: MutabaahRecord) => void;
}

export const MutabaahForm: React.FC<MutabaahFormProps> = ({ user, onRecordSaved }) => {
  const [selectedDate, setSelectedDate] = useState(getFormattedDate());
  const [isExistingRecord, setIsExistingRecord] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Udzur syar'i for akhwat
  const [isUdzur, setIsUdzur] = useState(false);

  // 1. Aspek Ruhiah State
  const [tilawahDone, setTilawahDone] = useState(true);
  const [tilawahSatuan, setTilawahSatuan] = useState<'halaman' | 'juz' | 'lembar'>('halaman');
  const [tilawahJumlah, setTilawahJumlah] = useState<number>(10);
  const [tilawahSurat, setTilawahSurat] = useState('QS. Al-Baqarah 1-50');

  const [qiamulailDone, setQiamulailDone] = useState(true);
  const [qiamulailRakaat, setQiamulailRakaat] = useState<number>(4);
  const [qiamulailCatatan, setQiamulailCatatan] = useState('Tahajjud & Witir');

  const [subuhStatus, setSubuhStatus] = useState<StatusSubuh>(
    user.jenisKelamin === 'Laki-laki' ? 'ya' : 'ya'
  );
  const [subuhKeterangan, setSubuhKeterangan] = useState('');

  const [matsuratStatus, setMatsuratStatus] = useState<StatusMatsurat>('lengkap');
  const [matsuratJenis, setMatsuratJenis] = useState<JenisMatsurat>('kubro');

  const [puasaDone, setPuasaDone] = useState(false);
  const [puasaJenis, setPuasaJenis] = useState<JenisPuasa>('senin_kamis');
  const [puasaKeterangan, setPuasaKeterangan] = useState('');

  // 2. Aspek Fikriah State
  const [materiDone, setMateriDone] = useState(true);
  const [materiJudul, setMateriJudul] = useState('Materi KKP: Urgensi Ibadah & Tazkiyatun Nafs');
  const [materiDurasi, setMateriDurasi] = useState<number>(20);
  const [materiHalaman, setMateriHalaman] = useState('Bab 2');
  const [materiCatatan, setMateriCatatan] = useState('');

  const [hafalanDone, setHafalanDone] = useState(true);
  const [hafalanJenis, setHafalanJenis] = useState<JenisHafalan>('murajaah');
  const [hafalanSurat, setHafalanSurat] = useState('QS. Al-Mulk ayat 1-15');
  const [hafalanKelancaran, setHafalanKelancaran] = useState<TingkatKelancaran>('mutqin');

  // 3. Aspek Jasadiah State
  const [olahragaDone, setOlahragaDone] = useState(true);
  const [olahragaJenis, setOlahragaJenis] = useState('Jogging / Lari Santai');
  const [olahragaDurasi, setOlahragaDurasi] = useState<number>(30);
  const [olahragaCatatan, setOlahragaCatatan] = useState('Pagi hari');

  // Catatan Harian
  const [catatanHarian, setCatatanHarian] = useState('');

  // Load existing data when user or selectedDate changes
  useEffect(() => {
    setIsSavedSuccess(false);
    const existing = StorageService.getRecordByUserAndDate(user.id, selectedDate);
    if (existing) {
      setIsExistingRecord(true);
      setIsUdzur(!!existing.isUdzurSyari);

      // Ruhiah
      setTilawahDone(existing.aspekRuhiah.tilawah.dikerjakan);
      setTilawahSatuan(existing.aspekRuhiah.tilawah.satuan);
      setTilawahJumlah(existing.aspekRuhiah.tilawah.jumlah);
      setTilawahSurat(existing.aspekRuhiah.tilawah.suratAyat || '');

      setQiamulailDone(existing.aspekRuhiah.sholatQiamulail.dikerjakan);
      setQiamulailRakaat(existing.aspekRuhiah.sholatQiamulail.rakaat);
      setQiamulailCatatan(existing.aspekRuhiah.sholatQiamulail.catatan || '');

      setSubuhStatus(existing.aspekRuhiah.sholatSubuhBerjamaahMasjid.status);
      setSubuhKeterangan(existing.aspekRuhiah.sholatSubuhBerjamaahMasjid.keterangan || '');

      setMatsuratStatus(existing.aspekRuhiah.almatsurat.status);
      setMatsuratJenis(existing.aspekRuhiah.almatsurat.jenis);

      setPuasaDone(existing.aspekRuhiah.puasaSunah.dikerjakan);
      setPuasaJenis(existing.aspekRuhiah.puasaSunah.jenisPuasa || 'senin_kamis');
      setPuasaKeterangan(existing.aspekRuhiah.puasaSunah.keterangan || '');

      // Fikriah
      setMateriDone(existing.aspekFikriah.membacaMateriKkp.dikerjakan);
      setMateriJudul(existing.aspekFikriah.membacaMateriKkp.judulMateri);
      setMateriDurasi(existing.aspekFikriah.membacaMateriKkp.durasiMenit);
      setMateriHalaman(existing.aspekFikriah.membacaMateriKkp.halaman || '');
      setMateriCatatan(existing.aspekFikriah.membacaMateriKkp.catatanRefleksi || '');

      setHafalanDone(existing.aspekFikriah.hafalanSuratKkp.dikerjakan);
      setHafalanJenis(existing.aspekFikriah.hafalanSuratKkp.jenis);
      setHafalanSurat(existing.aspekFikriah.hafalanSuratKkp.namaSuratAyat);
      setHafalanKelancaran(existing.aspekFikriah.hafalanSuratKkp.tingkatKelancaran);

      // Jasadiah
      setOlahragaDone(existing.aspekJasadiah.olahraga.dikerjakan);
      setOlahragaJenis(existing.aspekJasadiah.olahraga.jenisOlahraga);
      setOlahragaDurasi(existing.aspekJasadiah.olahraga.durasiMenit);
      setOlahragaCatatan(existing.aspekJasadiah.olahraga.keterangan || '');

      setCatatanHarian(existing.catatanHarian || '');
    } else {
      setIsExistingRecord(false);
      setIsUdzur(false);
      // Reset defaults for fresh entry
      setTilawahDone(true);
      setTilawahJumlah(10);
      setTilawahSatuan('halaman');
      setTilawahSurat('');
      setQiamulailDone(true);
      setQiamulailRakaat(4);
      setSubuhStatus(user.jenisKelamin === 'Laki-laki' ? 'ya' : 'ya');
      setSubuhKeterangan('');
      setMatsuratStatus('lengkap');
      setMatsuratJenis('kubro');
      setPuasaDone(false);
      setMateriDone(true);
      setMateriJudul('Materi KKP: Urgensi Ibadah & Tazkiyatun Nafs');
      setMateriDurasi(20);
      setHafalanDone(true);
      setHafalanSurat('');
      setOlahragaDone(true);
      setOlahragaDurasi(30);
      setCatatanHarian('');
    }
  }, [selectedDate, user.id, user.jenisKelamin]);

  // Construct current state for live score preview
  const currentRuhiah: AspekRuhiah = {
    tilawah: {
      dikerjakan: tilawahDone,
      satuan: tilawahSatuan,
      jumlah: Number(tilawahJumlah) || 0,
      suratAyat: tilawahSurat
    },
    sholatQiamulail: {
      dikerjakan: qiamulailDone,
      rakaat: Number(qiamulailRakaat) || 0,
      catatan: qiamulailCatatan
    },
    sholatSubuhBerjamaahMasjid: {
      status: isUdzur ? 'udzur' : subuhStatus,
      keterangan: subuhKeterangan
    },
    almatsurat: {
      status: matsuratStatus,
      jenis: matsuratJenis
    },
    puasaSunah: {
      dikerjakan: isUdzur ? false : puasaDone,
      jenisPuasa: puasaJenis,
      keterangan: puasaKeterangan
    }
  };

  const currentFikriah: AspekFikriah = {
    membacaMateriKkp: {
      dikerjakan: materiDone,
      judulMateri: materiJudul,
      durasiMenit: Number(materiDurasi) || 0,
      halaman: materiHalaman,
      catatanRefleksi: materiCatatan
    },
    hafalanSuratKkp: {
      dikerjakan: hafalanDone,
      jenis: hafalanJenis,
      namaSuratAyat: hafalanSurat,
      tingkatKelancaran: hafalanKelancaran
    }
  };

  const currentJasadiah: AspekJasadiah = {
    olahraga: {
      dikerjakan: olahragaDone,
      jenisOlahraga: olahragaJenis,
      durasiMenit: Number(olahragaDurasi) || 0,
      keterangan: olahragaCatatan
    }
  };

  const liveScore = calculateScore(currentRuhiah, currentFikriah, currentJasadiah, isUdzur);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const record: MutabaahRecord = {
      id: `rec-${user.id}-${selectedDate}`,
      userId: user.id,
      nia: user.nia,
      namaLengkap: user.namaLengkap,
      jenisKelamin: user.jenisKelamin,
      kodeGrup: user.kodeGrup,
      tanggal: selectedDate,
      isUdzurSyari: isUdzur,
      aspekRuhiah: currentRuhiah,
      aspekFikriah: currentFikriah,
      aspekJasadiah: currentJasadiah,
      catatanHarian: catatanHarian.trim(),
      ...liveScore,
      updatedAt: new Date().toISOString()
    };

    StorageService.saveRecord(record);
    setIsExistingRecord(true);
    setIsSavedSuccess(true);
    if (onRecordSaved) {
      onRecordSaved(record);
    }

    setTimeout(() => {
      setIsSavedSuccess(false);
    }, 4000);
  };

  // Helper date display in Indonesian
  const formatIndonesianDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      const dObj = new Date(Number(y), Number(m) - 1, Number(d));
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(dObj);
    } catch {
      return dateStr;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {/* 1. Header & Identity Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif">
                Formulir Mutabaah Yaumiah
              </h2>
              {isExistingRecord && (
                <span className="bg-emerald-600/80 text-emerald-100 text-xs px-2.5 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sudah Terisi
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-100/90 mt-1">
              Catat dan evaluasi amalan harian dengan ikhlas & jujur mengharap ridho Allah SWT.
            </p>
          </div>

          {/* Date Selector */}
          <div className="bg-emerald-900/60 p-2 rounded-xl border border-emerald-600/50 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-300 ml-1" />
            <div className="text-left">
              <label htmlFor="tanggal-mutabaah" className="block text-[10px] text-emerald-200 uppercase font-semibold">
                Tanggal Mutabaah
              </label>
              <input
                id="tanggal-mutabaah"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Member Info Strip (Nomor Induk, Nama Lengkap, Jenis Kelamin, Kode Grup) */}
        <div className="p-4 sm:p-5 bg-emerald-50/50 border-b border-slate-200">
          <div className="text-xs font-semibold text-emerald-900 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Data Induk Anggota:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Nomor Induk (NIA)</span>
              <span className="font-bold text-slate-800 text-sm">{user.nia}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Nama Lengkap</span>
              <span className="font-bold text-slate-800 text-sm truncate block" title={user.namaLengkap}>
                {user.namaLengkap}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Jenis Kelamin</span>
              <span className="font-bold text-slate-800 text-sm">{user.jenisKelamin}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block font-medium">Kode Grup / Usrah</span>
              <span className="font-bold text-emerald-700 text-sm">{user.kodeGrup}</span>
            </div>
          </div>

          {/* Special Toggle for Akhwat: Udzur Syar'i */}
          {user.jenisKelamin === 'Perempuan' && (
            <div className="mt-3.5 pt-3 border-t border-emerald-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Kondisi Udzur Syar'i (Haid / Nifas):
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  (Penilaian sholat & puasa disesuaikan secara adil)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUdzur}
                  onChange={(e) => setIsUdzur(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          )}
        </div>

        {/* Live Score Bar */}
        <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Hari:</span>
            <span className="font-bold text-slate-800">{formatIndonesianDate(selectedDate)}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Estimasi Skor Capaian:</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-base font-extrabold ${
                  liveScore.skorTotal >= 80 ? 'text-emerald-600' :
                  liveScore.skorTotal >= 60 ? 'text-amber-600' : 'text-slate-600'
                }`}>
                  {liveScore.skorTotal}
                </span>
                <span className="text-slate-400 font-medium">/ 100 Poin</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500">
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                Ruhiah: {liveScore.skorRuhiah}/50
              </span>
              <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-medium">
                Fikriah: {liveScore.skorFikriah}/30
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                Jasadiah: {liveScore.skorJasadiah}/20
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {isSavedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Alhamdulillah, Mutabaah Berhasil Disimpan!</p>
              <p className="text-xs text-emerald-700">
                Data untuk {formatIndonesianDate(selectedDate)} telah diperbarui dengan skor capaian {liveScore.skorTotal}/100.
              </p>
            </div>
          </div>
          <span className="text-xs text-emerald-600 font-semibold px-2.5 py-1 bg-emerald-100 rounded-lg">
            Tersimpan
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ASPEK RUHIAH */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
        <div className="bg-emerald-50/80 px-5 py-3.5 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-950 text-base font-serif">
                1. Aspek Ruhiah
              </h3>
              <p className="text-[11px] text-emerald-700">
                Peningkatan hubungan spiritual kepada Allah SWT (Bobot 50%)
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-emerald-200">
            {liveScore.skorRuhiah} / 50 Poin
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-6 divide-y divide-slate-100">
          
          {/* A. TILAWAH */}
          <div className="pt-2 first:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>📖 Tilawah Al-Qur'an</span>
                </label>
                <p className="text-xs text-slate-500">Membaca ayat-ayat suci Al-Qur'an setiap hari</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTilawahDone(!tilawahDone)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    tilawahDone 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{tilawahDone ? 'Sudah Tilawah' : 'Belum Tilawah'}</span>
                </button>
              </div>
            </div>

            {tilawahDone && (
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Satuan Bacaan
                  </label>
                  <select
                    value={tilawahSatuan}
                    onChange={(e) => setTilawahSatuan(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="halaman">Halaman</option>
                    <option value="juz">Juz</option>
                    <option value="lembar">Lembar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jumlah ({tilawahSatuan})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="604"
                    value={tilawahJumlah}
                    onChange={(e) => setTilawahJumlah(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Surat & Ayat yang Dibaca
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: QS. Al-Baqarah 1-50"
                    value={tilawahSurat}
                    onChange={(e) => setTilawahSurat(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* B. SHOLAT QIAMULAIL */}
          <div className="pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>🌙 Sholat Qiamulail (Tahajjud & Witir)</span>
                </label>
                <p className="text-xs text-slate-500">Menghidupkan sepertiga malam dengan sholat sunah</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQiamulailDone(!qiamulailDone)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    qiamulailDone 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{qiamulailDone ? 'Dikerjakan' : 'Tidak Dikerjakan'}</span>
                </button>
              </div>
            </div>

            {qiamulailDone && (
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jumlah Rakaat Total
                  </label>
                  <div className="flex gap-2">
                    {[2, 4, 8, 11].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setQiamulailRakaat(r)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          qiamulailRakaat === r
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {r} Rakaat
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Catatan (Tahajjud / Witir / Waktu)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 4 rakaat tahajjud + 3 rakaat witir"
                    value={qiamulailCatatan}
                    onChange={(e) => setQiamulailCatatan(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* C. SHOLAT SUBUH BERJAMAAH DI MASJID */}
          <div className="pt-5">
            <div className="mb-3">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>🕌 Sholat Subuh Berjamaah di Masjid</span>
                {user.jenisKelamin === 'Perempuan' && (
                  <span className="text-[11px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    (Akhwat: Di Awal Waktu / Musholla)
                  </span>
                )}
              </label>
              <p className="text-xs text-slate-500">
                {user.jenisKelamin === 'Laki-laki'
                  ? 'Keutamaan sholat subuh berjamaah langsung di masjid'
                  : "Keutamaan sholat subuh di awal waktu / berjamaah bersama keluarga / udzur syar'i"}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {user.jenisKelamin === 'Laki-laki' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setSubuhStatus('ya')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                      subuhStatus === 'ya'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>✓ Di Masjid Berjamaah</span>
                    <span className="text-[10px] opacity-80 mt-0.5 font-normal">Tepat waktu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubuhStatus('masbuq')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                      subuhStatus === 'masbuq'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>Masbuq di Masjid</span>
                    <span className="text-[10px] opacity-80 mt-0.5 font-normal">Tertinggal rakaat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubuhStatus('munfarid_awal_waktu')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                      subuhStatus === 'munfarid_awal_waktu'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>Sendiri di Rumah</span>
                    <span className="text-[10px] opacity-80 mt-0.5 font-normal">Awal waktu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubuhStatus('terlambat')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                      subuhStatus === 'terlambat'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>Terlambat</span>
                    <span className="text-[10px] opacity-80 mt-0.5 font-normal">Kesiangan / Lewat</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSubuhStatus('ya')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                      subuhStatus === 'ya'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>✓ Di Awal Waktu</span>
                    <span className="text-[10px] opacity-80 mt-0.5 font-normal">Rumah / Musholla</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubuhStatus('munfarid_awal_waktu')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                      subuhStatus === 'munfarid_awal_waktu'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>Berjamaah di Masjid</span>
                    <span className="text-[10px] opacity-80 mt-0.5 font-normal">Bersama jamaah</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubuhStatus('terlambat')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                      subuhStatus === 'terlambat'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>Terlambat</span>
                    <span className="text-[10px] opacity-80 mt-0.5 font-normal">Lewat awal waktu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubuhStatus('udzur')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                      subuhStatus === 'udzur' || isUdzur
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>Udzur Syar'i</span>
                    <span className="text-[10px] opacity-80 mt-0.5 font-normal">Haid / Nifas</span>
                  </button>
                </>
              )}
            </div>

            <div className="mt-2">
              <input
                type="text"
                placeholder={user.jenisKelamin === 'Laki-laki' ? 'Nama masjid (Opsional, contoh: Masjid Al-Ikhlas)' : 'Keterangan tambahan (Opsional)'}
                value={subuhKeterangan}
                onChange={(e) => setSubuhKeterangan(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* D. AL-MATSURAT */}
          <div className="pt-5">
            <div className="mb-3">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>📿 Dzikir Al-Ma'tsurat</span>
              </label>
              <p className="text-xs text-slate-500">Membaca dzikir pagi dan petang sesuai sunnah Rasulullah SAW</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setMatsuratStatus('lengkap')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                  matsuratStatus === 'lengkap'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Lengkap (Pagi & Petang)</span>
              </button>

              <button
                type="button"
                onClick={() => setMatsuratStatus('pagi_saja')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                  matsuratStatus === 'pagi_saja'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Pagi Saja</span>
              </button>

              <button
                type="button"
                onClick={() => setMatsuratStatus('petang_saja')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                  matsuratStatus === 'petang_saja'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Petang Saja</span>
              </button>

              <button
                type="button"
                onClick={() => setMatsuratStatus('tidak')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                  matsuratStatus === 'tidak'
                    ? 'bg-slate-600 text-white border-slate-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Belum Membaca</span>
              </button>
            </div>

            {matsuratStatus !== 'tidak' && (
              <div className="mt-2.5 flex items-center gap-3 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-medium">Jenis Al-Matsurat:</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="matsuratJenis"
                    checked={matsuratJenis === 'kubro'}
                    onChange={() => setMatsuratJenis('kubro')}
                    className="text-emerald-600"
                  />
                  <span className="font-semibold text-slate-800">Kubro (Lengkap)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="matsuratJenis"
                    checked={matsuratJenis === 'sughro'}
                    onChange={() => setMatsuratJenis('sughro')}
                    className="text-emerald-600"
                  />
                  <span className="font-semibold text-slate-800">Sughro (Ringkas)</span>
                </label>
              </div>
            )}
          </div>

          {/* E. PUASA SUNAH */}
          <div className="pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>✨ Puasa Sunah</span>
                </label>
                <p className="text-xs text-slate-500">Menjalankan puasa sunah (Senin/Kamis, Ayyamul Bidh, Daud, dll.)</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPuasaDone(!puasaDone)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    puasaDone 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{puasaDone ? 'Sedang / Telah Puasa' : 'Tidak Puasa Hari Ini'}</span>
                </button>
              </div>
            </div>

            {puasaDone && (
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jenis Puasa Sunah
                  </label>
                  <select
                    value={puasaJenis}
                    onChange={(e) => setPuasaJenis(e.target.value as JenisPuasa)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="senin_kamis">Puasa Senin - Kamis</option>
                    <option value="ayyamul_bidh">Puasa Ayyamul Bidh (13, 14, 15 Hijriah)</option>
                    <option value="daud">Puasa Daud (Sehari Puasa Sehari Tidak)</option>
                    <option value="qadha_nadzar">Puasa Qadha / Nadzar</option>
                    <option value="syawal">Puasa Sunah Syawal</option>
                    <option value="arafah_tarwiyah">Puasa Arafah / Tarwiyah</option>
                    <option value="lainnya">Puasa Sunah Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Niat puasa sunah Kamis"
                    value={puasaKeterangan}
                    onChange={(e) => setPuasaKeterangan(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ASPEK FIKRIAH */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
        <div className="bg-sky-50/80 px-5 py-3.5 border-b border-sky-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sky-950 text-base font-serif">
                2. Aspek Fikriah
              </h3>
              <p className="text-[11px] text-sky-800">
                Peningkatan wawasan keilmuan Islam dan Kurikulum Kajian Pembinaan (Bobot 30%)
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-sky-800 bg-white px-2.5 py-1 rounded-full border border-sky-200">
            {liveScore.skorFikriah} / 30 Poin
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-6 divide-y divide-slate-100">
          
          {/* A. MEMBACA MATERI KKP */}
          <div className="pt-2 first:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>📚 Membaca Materi KKP</span>
                </label>
                <p className="text-xs text-slate-500">Membaca materi pembinaan dari silabus / modul kurikulum KKP</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMateriDone(!materiDone)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    materiDone 
                      ? 'bg-sky-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{materiDone ? 'Sudah Membaca' : 'Belum Membaca'}</span>
                </button>
              </div>
            </div>

            {materiDone && (
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Judul / Topik Materi KKP yang Dibaca
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Bab Urgensi Ibadah & Tazkiyatun Nafs"
                      value={materiJudul}
                      onChange={(e) => setMateriJudul(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Durasi Membaca (Menit)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={materiDurasi}
                      onChange={(e) => setMateriDurasi(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Halaman / Bagian (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Halaman 12-25"
                      value={materiHalaman}
                      onChange={(e) => setMateriHalaman(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Poin Inti / Catatan Refleksi
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Memperkuat komitmen dakwah dan keikhlasan"
                      value={materiCatatan}
                      onChange={(e) => setMateriCatatan(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* B. HAFALAN SURAT SESUAI KKP */}
          <div className="pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>🧠 Hafalan Surat Sesuai KKP</span>
                </label>
                <p className="text-xs text-slate-500">Ziyadah (menambah hafalan baru) atau muraja'ah surat target KKP</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHafalanDone(!hafalanDone)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    hafalanDone 
                      ? 'bg-sky-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{hafalanDone ? 'Ada Hafalan' : 'Tidak Ada Hari Ini'}</span>
                </button>
              </div>
            </div>

            {hafalanDone && (
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kategori Hafalan
                    </label>
                    <select
                      value={hafalanJenis}
                      onChange={(e) => setHafalanJenis(e.target.value as JenisHafalan)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-600"
                    >
                      <option value="ziyadah">Ziyadah (Tambah Baru)</option>
                      <option value="murajaah">Muraja'ah (Mengulang)</option>
                      <option value="keduanya">Ziyadah & Muraja'ah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Surat & Rentang Ayat
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: QS. Al-Mulk ayat 1-15"
                      value={hafalanSurat}
                      onChange={(e) => setHafalanSurat(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tingkat Kelancaran
                    </label>
                    <select
                      value={hafalanKelancaran}
                      onChange={(e) => setHafalanKelancaran(e.target.value as TingkatKelancaran)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-sky-600"
                    >
                      <option value="mutqin">Mutqin (Sangat Lancar)</option>
                      <option value="lancar">Lancar (Cukup Bagus)</option>
                      <option value="perlu_tahsin">Perlu Perbaikan / Bimbingan</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ASPEK JASADIAH */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
        <div className="bg-amber-50/80 px-5 py-3.5 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-amber-950 text-base font-serif">
                3. Aspek Jasadiah
              </h3>
              <p className="text-[11px] text-amber-800">
                Kebugaran fisik dan kesehatan tubuh mukmin yang kuat (Bobot 20%)
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-white px-2.5 py-1 rounded-full border border-amber-200">
            {liveScore.skorJasadiah} / 20 Poin
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>🏃 Olahraga & Aktivitas Fisik</span>
              </label>
              <p className="text-xs text-slate-500">Menjaga kebugaran jasmani minimal 15-30 menit</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOlahragaDone(!olahragaDone)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  olahragaDone 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{olahragaDone ? 'Berolahraga' : 'Istirahat / Tidak Olahraga'}</span>
              </button>
            </div>
          </div>

          {olahragaDone && (
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Jenis Olahraga
                </label>
                <select
                  value={olahragaJenis}
                  onChange={(e) => setOlahragaJenis(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-amber-600"
                >
                  <option value="Jogging / Lari Santai">Jogging / Lari Santai</option>
                  <option value="Jalan Cepat / Jalan Pagi">Jalan Cepat / Jalan Pagi</option>
                  <option value="Senam / Workout / Push-up">Senam / Workout / Push-up</option>
                  <option value="Bersepeda">Bersepeda</option>
                  <option value="Renang">Renang</option>
                  <option value="Futsal / Sepakbola">Futsal / Sepakbola</option>
                  <option value="Bulu Tangkis">Bulu Tangkis</option>
                  <option value="Bela Diri">Bela Diri</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Durasi Latihan (Menit)
                </label>
                <div className="flex gap-1.5">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setOlahragaDurasi(mins)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        olahragaDurasi === mins
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mins} m
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pagi hari bersama rekan usrah"
                  value={olahragaCatatan}
                  onChange={(e) => setOlahragaCatatan(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-amber-600"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Catatan Harian & Muhasabah */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <label className="block text-sm font-bold text-slate-800 mb-1">
          📝 Catatan Harian / Muhasabah Tambahan (Opsional)
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Tuliskan refleksi, kendala ibadah, atau komitmen perbaikan untuk esok hari.
        </p>
        <textarea
          rows={3}
          value={catatanHarian}
          onChange={(e) => setCatatanHarian(e.target.value)}
          placeholder="Contoh: Alhamdulillah hari ini tilawah mencapai target, esok insya Allah qiamulail lebih awal..."
          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
        />
      </div>

      {/* 6. Sticky Submit Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-emerald-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
            <Award className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block font-medium">
              Skor Total Hari Ini
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-emerald-800">
                {liveScore.skorTotal}
              </span>
              <span className="text-xs text-slate-400 font-semibold">/ 100 Poin</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          id="btn-simpan-mutabaah"
          className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{isExistingRecord ? 'Perbarui Mutabaah' : 'Simpan Mutabaah Yaumiah'}</span>
        </button>
      </div>

    </form>
  );
};
