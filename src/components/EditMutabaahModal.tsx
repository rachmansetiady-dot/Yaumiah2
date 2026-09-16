import React, { useState } from 'react';
import { 
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
import { StorageService, calculateScore } from '../utils/storage';
import { 
  X, 
  Save, 
  Check, 
  Calendar, 
  User, 
  Award, 
  BookOpen, 
  Moon, 
  Activity, 
  Clock, 
  Sparkles,
  Trash2
} from 'lucide-react';

interface EditMutabaahModalProps {
  record: MutabaahRecord | null;
  onClose: () => void;
  onRecordUpdated: (updatedRecord: MutabaahRecord) => void;
  onDeleteRequest?: (record: MutabaahRecord) => void;
}

export const EditMutabaahModal: React.FC<EditMutabaahModalProps> = ({
  record,
  onClose,
  onRecordUpdated,
  onDeleteRequest
}) => {
  if (!record) return null;

  const isAkhwat = record.jenisKelamin === 'Perempuan';

  // State initialization from record
  const [isUdzur, setIsUdzur] = useState(!!record.isUdzurSyari);

  // 1. Ruhiah
  const [tilawahDone, setTilawahDone] = useState(record.aspekRuhiah.tilawah.dikerjakan);
  const [tilawahSatuan, setTilawahSatuan] = useState<'halaman' | 'juz' | 'lembar'>(record.aspekRuhiah.tilawah.satuan || 'halaman');
  const [tilawahJumlah, setTilawahJumlah] = useState(record.aspekRuhiah.tilawah.jumlah || 0);
  const [tilawahSurat, setTilawahSurat] = useState(record.aspekRuhiah.tilawah.suratAyat || '');

  const [qiamulailDone, setQiamulailDone] = useState(record.aspekRuhiah.sholatQiamulail.dikerjakan);
  const [qiamulailRakaat, setQiamulailRakaat] = useState(record.aspekRuhiah.sholatQiamulail.rakaat || 0);
  const [qiamulailCatatan, setQiamulailCatatan] = useState(record.aspekRuhiah.sholatQiamulail.catatan || '');

  const [subuhStatus, setSubuhStatus] = useState<StatusSubuh>(record.aspekRuhiah.sholatSubuhBerjamaahMasjid.status || 'ya');
  const [subuhKeterangan, setSubuhKeterangan] = useState(record.aspekRuhiah.sholatSubuhBerjamaahMasjid.keterangan || '');

  const [matsuratStatus, setMatsuratStatus] = useState<StatusMatsurat>(record.aspekRuhiah.almatsurat.status || 'lengkap');
  const [matsuratJenis, setMatsuratJenis] = useState<JenisMatsurat>(record.aspekRuhiah.almatsurat.jenis || 'kubro');

  const [puasaDone, setPuasaDone] = useState(record.aspekRuhiah.puasaSunah.dikerjakan);
  const [puasaJenis, setPuasaJenis] = useState<JenisPuasa>(record.aspekRuhiah.puasaSunah.jenisPuasa || 'senin_kamis');
  const [puasaKeterangan, setPuasaKeterangan] = useState(record.aspekRuhiah.puasaSunah.keterangan || '');

  // 2. Fikriah
  const [materiDone, setMateriDone] = useState(record.aspekFikriah.membacaMateriKkp.dikerjakan);
  const [materiJudul, setMateriJudul] = useState(record.aspekFikriah.membacaMateriKkp.judulMateri || '');
  const [materiDurasi, setMateriDurasi] = useState(record.aspekFikriah.membacaMateriKkp.durasiMenit || 0);
  const [materiHalaman, setMateriHalaman] = useState(record.aspekFikriah.membacaMateriKkp.halaman || '');
  const [materiCatatan, setMateriCatatan] = useState(record.aspekFikriah.membacaMateriKkp.catatanRefleksi || '');

  const [hafalanDone, setHafalanDone] = useState(record.aspekFikriah.hafalanSuratKkp.dikerjakan);
  const [hafalanJenis, setHafalanJenis] = useState<JenisHafalan>(record.aspekFikriah.hafalanSuratKkp.jenis || 'murajaah');
  const [hafalanSurat, setHafalanSurat] = useState(record.aspekFikriah.hafalanSuratKkp.namaSuratAyat || '');
  const [hafalanKelancaran, setHafalanKelancaran] = useState<TingkatKelancaran>(record.aspekFikriah.hafalanSuratKkp.tingkatKelancaran || 'mutqin');

  // 3. Jasadiah
  const [olahragaDone, setOlahragaDone] = useState(record.aspekJasadiah.olahraga.dikerjakan);
  const [olahragaJenis, setOlahragaJenis] = useState(record.aspekJasadiah.olahraga.jenisOlahraga || '');
  const [olahragaDurasi, setOlahragaDurasi] = useState(record.aspekJasadiah.olahraga.durasiMenit || 0);
  const [olahragaCatatan, setOlahragaCatatan] = useState(record.aspekJasadiah.olahraga.keterangan || '');

  // Catatan Harian
  const [catatanHarian, setCatatanHarian] = useState(record.catatanHarian || '');
  const [isSaved, setIsSaved] = useState(false);

  // Recalculate live score
  const ruhiahObj: AspekRuhiah = {
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
      status: subuhStatus,
      keterangan: subuhKeterangan
    },
    almatsurat: {
      status: matsuratStatus,
      jenis: matsuratJenis
    },
    puasaSunah: {
      dikerjakan: puasaDone,
      jenisPuasa: puasaJenis,
      keterangan: puasaKeterangan
    }
  };

  const fikriahObj: AspekFikriah = {
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

  const jasadiahObj: AspekJasadiah = {
    olahraga: {
      dikerjakan: olahragaDone,
      jenisOlahraga: olahragaJenis,
      durasiMenit: Number(olahragaDurasi) || 0,
      keterangan: olahragaCatatan
    }
  };

  const liveScores = calculateScore(ruhiahObj, fikriahObj, jasadiahObj, isUdzur);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedRecord: MutabaahRecord = {
      ...record,
      isUdzurSyari: isAkhwat ? isUdzur : false,
      aspekRuhiah: ruhiahObj,
      aspekFikriah: fikriahObj,
      aspekJasadiah: jasadiahObj,
      catatanHarian: catatanHarian.trim(),
      skorRuhiah: liveScores.skorRuhiah,
      skorFikriah: liveScores.skorFikriah,
      skorJasadiah: liveScores.skorJasadiah,
      skorTotal: liveScores.skorTotal,
      updatedAt: new Date().toISOString()
    };

    StorageService.updateRecord(updatedRecord);
    setIsSaved(true);
    setTimeout(() => {
      onRecordUpdated(updatedRecord);
      onClose();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40">
                Mode Edit Data Mutabaah
              </span>
              <span className="text-xs text-emerald-300">
                {record.kodeGrup}
              </span>
            </div>
            <h3 className="text-lg font-bold font-serif mt-1">
              Edit Isian: {record.namaLengkap} ({record.nia})
            </h3>
            <p className="text-xs text-emerald-200 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Tanggal: <strong>{record.tanggal}</strong></span>
              <span>•</span>
              <span>{record.jenisKelamin}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Score Strip */}
        <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-700" />
            <span className="text-xs font-bold text-slate-800">Skor Terhitung:</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-emerald-800">Ruhiah: <strong>{liveScores.skorRuhiah}/50</strong></span>
            <span className="text-sky-800">Fikriah: <strong>{liveScores.skorFikriah}/30</strong></span>
            <span className="text-amber-800">Jasadiah: <strong>{liveScores.skorJasadiah}/20</strong></span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-extrabold text-sm">
              Total: {liveScores.skorTotal}/100
            </span>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-6 overflow-y-auto flex-1">
          
          {/* Udzur Syar'i (Akhwat only) */}
          {isAkhwat && (
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-purple-950 text-xs block">Status Udzur Syar'i (Haid / Nifas)</span>
                <span className="text-[11px] text-purple-700">Penyesuaian otomatis skor ibadah sholat dan tilawah</span>
              </div>
              <input
                type="checkbox"
                checked={isUdzur}
                onChange={(e) => setIsUdzur(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
            </div>
          )}

          {/* 1. ASPEK RUHIAH */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Moon className="w-4 h-4 text-emerald-600" />
              <span>1. Aspek Ruhiah (Maksimal 50 Poin)</span>
            </h4>

            {/* Tilawah */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">Tilawah Al-Qur'an</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Dikerjakan?</span>
                  <input
                    type="checkbox"
                    checked={tilawahDone}
                    onChange={(e) => setTilawahDone(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </div>
              </div>
              {tilawahDone && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Jumlah</label>
                    <input
                      type="number"
                      min="0"
                      value={tilawahJumlah}
                      onChange={(e) => setTilawahJumlah(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Satuan</label>
                    <select
                      value={tilawahSatuan}
                      onChange={(e) => setTilawahSatuan(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                    >
                      <option value="halaman">Halaman</option>
                      <option value="juz">Juz</option>
                      <option value="lembar">Lembar</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Surat & Ayat</label>
                    <input
                      type="text"
                      value={tilawahSurat}
                      onChange={(e) => setTilawahSurat(e.target.value)}
                      placeholder="Misal: QS. Al-Baqarah 1-50"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Qiamulail */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">Sholat Qiamulail / Tahajjud</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Dikerjakan?</span>
                  <input
                    type="checkbox"
                    checked={qiamulailDone}
                    onChange={(e) => setQiamulailDone(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </div>
              </div>
              {qiamulailDone && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Jumlah Rakaat</label>
                    <input
                      type="number"
                      min="2"
                      value={qiamulailRakaat}
                      onChange={(e) => setQiamulailRakaat(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Catatan</label>
                    <input
                      type="text"
                      value={qiamulailCatatan}
                      onChange={(e) => setQiamulailCatatan(e.target.value)}
                      placeholder="Tahajjud & Witir"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Subuh */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-xs font-semibold text-slate-800 block">Sholat Subuh</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block">Status Pelaksanaan</label>
                  <select
                    value={subuhStatus}
                    onChange={(e) => setSubuhStatus(e.target.value as StatusSubuh)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                  >
                    <option value="ya">Tepat Waktu / Berjamaah di Masjid</option>
                    <option value="masbuq">Masbuq di Masjid</option>
                    <option value="munfarid_awal_waktu">Sendiri Awal Waktu</option>
                    <option value="terlambat">Terlambat / Kesiangan</option>
                    <option value="udzur">Udzur Syar'i</option>
                    <option value="tidak">Tidak Mengerjakan</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Keterangan Tambahan</label>
                  <input
                    type="text"
                    value={subuhKeterangan}
                    onChange={(e) => setSubuhKeterangan(e.target.value)}
                    placeholder="Nama masjid / alasan"
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Al-Matsurat */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-xs font-semibold text-slate-800 block">Dzikir Al-Ma'tsurat</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block">Kelengkapan Waktu</label>
                  <select
                    value={matsuratStatus}
                    onChange={(e) => setMatsuratStatus(e.target.value as StatusMatsurat)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                  >
                    <option value="lengkap">Lengkap (Pagi & Petang)</option>
                    <option value="pagi_saja">Pagi Saja</option>
                    <option value="petang_saja">Petang Saja</option>
                    <option value="tidak">Belum / Tidak Membaca</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Jenis Bacaan</label>
                  <select
                    value={matsuratJenis}
                    onChange={(e) => setMatsuratJenis(e.target.value as JenisMatsurat)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                  >
                    <option value="kubro">Kubro (Lengkap)</option>
                    <option value="sughro">Sughro (Ringkas)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Puasa Sunah */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">Puasa Sunah</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Berpuasa?</span>
                  <input
                    type="checkbox"
                    checked={puasaDone}
                    onChange={(e) => setPuasaDone(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </div>
              </div>
              {puasaDone && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Jenis Puasa</label>
                    <select
                      value={puasaJenis}
                      onChange={(e) => setPuasaJenis(e.target.value as JenisPuasa)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                    >
                      <option value="senin_kamis">Senin - Kamis</option>
                      <option value="ayyamul_bidh">Ayyamul Bidh (13,14,15 Hijriyah)</option>
                      <option value="daud">Puasa Daud</option>
                      <option value="qadha_nadzar">Qadha / Nadzar</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Keterangan</label>
                    <input
                      type="text"
                      value={puasaKeterangan}
                      onChange={(e) => setPuasaKeterangan(e.target.value)}
                      placeholder="Catatan puasa"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 2. ASPEK FIKRIAH */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-sky-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>2. Aspek Fikriah (Maksimal 30 Poin)</span>
            </h4>

            {/* Membaca Materi KKP */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">Membaca Materi KKP</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Membaca?</span>
                  <input
                    type="checkbox"
                    checked={materiDone}
                    onChange={(e) => setMateriDone(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                </div>
              </div>
              {materiDone && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Judul Materi</label>
                    <input
                      type="text"
                      value={materiJudul}
                      onChange={(e) => setMateriJudul(e.target.value)}
                      placeholder="Judul materi atau kitab"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Durasi (Menit)</label>
                    <input
                      type="number"
                      min="1"
                      value={materiDurasi}
                      onChange={(e) => setMateriDurasi(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hafalan KKP */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">Hafalan Surat KKP</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Menyetor/Menghafal?</span>
                  <input
                    type="checkbox"
                    checked={hafalanDone}
                    onChange={(e) => setHafalanDone(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                </div>
              </div>
              {hafalanDone && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Jenis Hafalan</label>
                    <select
                      value={hafalanJenis}
                      onChange={(e) => setHafalanJenis(e.target.value as JenisHafalan)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                    >
                      <option value="ziyadah">Ziyadah (Tambah Baru)</option>
                      <option value="murajaah">Muraja'ah (Mengulang)</option>
                      <option value="keduanya">Keduanya</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Surat / Ayat</label>
                    <input
                      type="text"
                      value={hafalanSurat}
                      onChange={(e) => setHafalanSurat(e.target.value)}
                      placeholder="Misal: QS. Al-Mulk 1-15"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Tingkat Kelancaran</label>
                    <select
                      value={hafalanKelancaran}
                      onChange={(e) => setHafalanKelancaran(e.target.value as TingkatKelancaran)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                    >
                      <option value="mutqin">Mutqin (Sangat Lancar - 15 Pts)</option>
                      <option value="lancar">Lancar (12 Pts)</option>
                      <option value="perlu_tahsin">Perlu Tahsin (9 Pts)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 3. ASPEK JASADIAH */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-amber-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Activity className="w-4 h-4 text-amber-600" />
              <span>3. Aspek Jasadiah (Maksimal 20 Poin)</span>
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">Olahraga / Riyadhah</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Berolahraga?</span>
                  <input
                    type="checkbox"
                    checked={olahragaDone}
                    onChange={(e) => setOlahragaDone(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                </div>
              </div>
              {olahragaDone && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Jenis Olahraga</label>
                    <input
                      type="text"
                      value={olahragaJenis}
                      onChange={(e) => setOlahragaJenis(e.target.value)}
                      placeholder="Jogging, push-up, jalan cepat..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Durasi (Menit)</label>
                    <input
                      type="number"
                      min="1"
                      value={olahragaDurasi}
                      onChange={(e) => setOlahragaDurasi(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-medium"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Catatan Harian */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 block">Catatan Tambahan / Refleksi</label>
            <textarea
              rows={2}
              value={catatanHarian}
              onChange={(e) => setCatatanHarian(e.target.value)}
              placeholder="Catatan harian..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

        </form>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            {onDeleteRequest && (
              <button
                type="button"
                onClick={() => {
                  onDeleteRequest(record);
                  onClose();
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-rose-200"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Hapus Data Ini</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
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
        </div>

      </div>
    </div>
  );
};
