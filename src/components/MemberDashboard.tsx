import React, { useState } from 'react';
import { User, MutabaahRecord } from '../types';
import { StorageService, getFormattedDate } from '../utils/storage';
import { MutabaahForm } from './MutabaahForm';
import { MutabaahDetailModal } from './MutabaahDetailModal';
import { EditMutabaahModal } from './EditMutabaahModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { 
  PenTool, 
  History, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Award, 
  Calendar, 
  Flame, 
  Eye, 
  Pencil,
  Trash2,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Moon,
  Activity,
  Sparkles
} from 'lucide-react';

interface MemberDashboardProps {
  user: User;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'stats'>('form');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<MutabaahRecord | null>(null);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<MutabaahRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<MutabaahRecord | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const todayStr = getFormattedDate();
  const allRecords = StorageService.getRecords();
  const myRecords = allRecords
    .filter(r => r.userId === user.id)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const todayRecord = myRecords.find(r => r.tanggal === todayStr);

  // Calculate streak & stats
  const totalEntries = myRecords.length;
  const avgScore = totalEntries > 0 
    ? Math.round(myRecords.reduce((acc, r) => acc + r.skorTotal, 0) / totalEntries) 
    : 0;

  const totalTilawahPages = myRecords.reduce((acc, r) => {
    if (r.aspekRuhiah.tilawah.dikerjakan) {
      const mult = r.aspekRuhiah.tilawah.satuan === 'juz' ? 20 : r.aspekRuhiah.tilawah.satuan === 'lembar' ? 2 : 1;
      return acc + (r.aspekRuhiah.tilawah.jumlah * mult);
    }
    return acc;
  }, 0);

  const formatIndonesianDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      const dObj = new Date(Number(y), Number(m) - 1, Number(d));
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(dObj);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-md border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-700/70 text-emerald-200 border border-emerald-500/30">
                Portal Anggota
              </span>
              <span className="text-xs text-emerald-300">
                {user.kodeGrup} • {user.jenisKelamin}
              </span>
            </div>
            <h1 className="text-2xl font-bold font-serif">
              Ahlan wa Sahlan, {user.namaLengkap}
            </h1>
            <p className="text-xs text-emerald-200/90 mt-1 max-w-xl">
              "Sebaik-baik amalan adalah yang paling istiqomah (kontinu) meskipun sedikit." (HR. Bukhari & Muslim)
            </p>
          </div>

          {/* Quick Status Pill */}
          <div className="bg-emerald-950/60 backdrop-blur-xs p-3.5 rounded-xl border border-emerald-700/60 flex items-center gap-4 text-xs">
            <div>
              <span className="text-[11px] text-emerald-300 block">Status Hari Ini:</span>
              {todayRecord ? (
                <span className="font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Sudah Terisi ({todayRecord.skorTotal} Poin)
                </span>
              ) : (
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Belum Diisi
                </span>
              )}
            </div>
            <div className="h-8 w-px bg-emerald-800" />
            <div>
              <span className="text-[11px] text-emerald-300 block">Rata-rata Skor:</span>
              <span className="font-bold text-white text-sm">
                {avgScore} / 100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Isian</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-800">{totalEntries} Hari</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tercatat di sistem</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Capaian Tilawah</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-800">~{totalTilawahPages} Hal</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total dibaca</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Skor Terbaik</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-800">
            {myRecords.length > 0 ? Math.max(...myRecords.map(r => r.skorTotal)) : 0} / 100
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Rekor capaian</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Kelompok Usrah</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-emerald-800 truncate" title={user.kodeGrup}>
            {user.kodeGrup}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">NIA: {user.nia}</p>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2">
        <button
          onClick={() => setActiveTab('form')}
          className={`py-3 px-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'form'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>Isi Mutabaah Yaumiah</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Isian ({myRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`py-3 px-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'stats'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Statistik Capaian</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'form' && (
          <MutabaahForm 
            user={user} 
            onRecordSaved={() => setRefreshTrigger(prev => prev + 1)} 
          />
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Riwayat Isian Mutabaah Yaumiah
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar rekapitulasi amalan harian yang telah disimpan.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600">
                {myRecords.length} Catatan
              </span>
            </div>

            {myRecords.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700 text-sm">Belum Ada Riwayat Mutabaah</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Silakan buka tab "Isi Mutabaah Yaumiah" untuk mencatat ibadah harian Anda.
                </p>
                <button
                  onClick={() => setActiveTab('form')}
                  className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
                >
                  Isi Mutabaah Sekarang
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myRecords.map((rec) => (
                  <div 
                    key={rec.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {formatIndonesianDate(rec.tanggal)}
                        </span>
                        {rec.tanggal === todayStr && (
                          <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.2 rounded-full text-[10px]">
                            Hari Ini
                          </span>
                        )}
                        {rec.isUdzurSyari && (
                          <span className="bg-purple-100 text-purple-800 font-semibold px-2 py-0.2 rounded-full text-[10px]">
                            Udzur Syar'i
                          </span>
                        )}
                      </div>

                      {/* Aspect Badges */}
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <span className={`px-2 py-0.5 rounded font-medium ${
                          rec.aspekRuhiah.tilawah.dikerjakan 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          📖 Tilawah {rec.aspekRuhiah.tilawah.jumlah} {rec.aspekRuhiah.tilawah.satuan}
                        </span>

                        <span className={`px-2 py-0.5 rounded font-medium ${
                          rec.aspekRuhiah.sholatQiamulail.dikerjakan 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          🌙 Qiamulail ({rec.aspekRuhiah.sholatQiamulail.rakaat} R)
                        </span>

                        <span className={`px-2 py-0.5 rounded font-medium ${
                          rec.aspekRuhiah.sholatSubuhBerjamaahMasjid.status === 'ya'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          🕌 Subuh: {rec.aspekRuhiah.sholatSubuhBerjamaahMasjid.status}
                        </span>

                        <span className={`px-2 py-0.5 rounded font-medium ${
                          rec.aspekFikriah.membacaMateriKkp.dikerjakan 
                            ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          📚 KKP Materi
                        </span>

                        <span className={`px-2 py-0.5 rounded font-medium ${
                          rec.aspekJasadiah.olahraga.dikerjakan 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          🏃 Olahraga ({rec.aspekJasadiah.olahraga.durasiMenit}m)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Skor Total</span>
                        <span className={`text-base font-extrabold ${
                          rec.skorTotal >= 80 ? 'text-emerald-700' :
                          rec.skorTotal >= 60 ? 'text-amber-600' : 'text-slate-600'
                        }`}>
                          {rec.skorTotal} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedRecordForDetail(rec)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Detail</span>
                        </button>

                        <button
                          onClick={() => setSelectedRecordForEdit(rec)}
                          className="p-1.5 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 rounded-lg text-xs transition-colors"
                          title="Edit Data Mutabaah Ini"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setRecordToDelete(rec)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg text-xs transition-colors"
                          title="Hapus Data Mutabaah Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Target & Ringkasan */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Capaian Mutabaah Pekanan</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>1. Aspek Ruhiah (Target 50 Poin)</span>
                    <span className="text-emerald-700 font-bold">
                      Rata-rata: {myRecords.length > 0 
                        ? Math.round(myRecords.reduce((a, b) => a + b.skorRuhiah, 0) / myRecords.length) 
                        : 0} / 50
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-2.5 rounded-full" 
                      style={{ 
                        width: `${myRecords.length > 0 ? (myRecords.reduce((a, b) => a + b.skorRuhiah, 0) / (myRecords.length * 50)) * 100 : 0}%` 
                      }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>2. Aspek Fikriah (Target 30 Poin)</span>
                    <span className="text-sky-700 font-bold">
                      Rata-rata: {myRecords.length > 0 
                        ? Math.round(myRecords.reduce((a, b) => a + b.skorFikriah, 0) / myRecords.length) 
                        : 0} / 30
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-sky-600 h-2.5 rounded-full" 
                      style={{ 
                        width: `${myRecords.length > 0 ? (myRecords.reduce((a, b) => a + b.skorFikriah, 0) / (myRecords.length * 30)) * 100 : 0}%` 
                      }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>3. Aspek Jasadiah (Target 20 Poin)</span>
                    <span className="text-amber-700 font-bold">
                      Rata-rata: {myRecords.length > 0 
                        ? Math.round(myRecords.reduce((a, b) => a + b.skorJasadiah, 0) / myRecords.length) 
                        : 0} / 20
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-2.5 rounded-full" 
                      style={{ 
                        width: `${myRecords.length > 0 ? (myRecords.reduce((a, b) => a + b.skorJasadiah, 0) / (myRecords.length * 20)) * 100 : 0}%` 
                      }} 
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 text-xs">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Nasihat Tazkiyah & Istiqomah:
                </p>
                <p className="text-[11px] text-emerald-800 mt-1 italic">
                  "Jadikan mutabaah ini sarana muhasabah diri sebelum kita dihisab di hadapan Allah SWT. Pertahankan kejujuran dan keikhlasan dalam setiap amalan."
                </p>
              </div>
            </div>

            {/* Checklist Indikator Target */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">
                Target Standar Mutabaah Yaumiah
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-slate-800">Tilawah 1 Juz / 10-20 Halaman per Hari</span>
                    <p className="text-[11px] text-slate-500">Mengkhatamkan Al-Qur'an minimal 1 kali setiap bulan.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-slate-800">Sholat Subuh Berjamaah di Masjid</span>
                    <p className="text-[11px] text-slate-500">Khusus Ikhwan di masjid, Akhwat di awal waktu.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-slate-800">Membaca Materi KKP & Hafalan Surat</span>
                    <p className="text-[11px] text-slate-500">Menjaga kelancaran hafalan dan pemahaman tarbawi.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                    4
                  </span>
                  <div>
                    <span className="font-bold text-slate-800">Olahraga Minimal 15-30 Menit</span>
                    <p className="text-[11px] text-slate-500">Menjaga jasmani yang kuat (Qawiyyul Jismi).</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Detail Modal */}
      <MutabaahDetailModal 
        record={selectedRecordForDetail} 
        onClose={() => setSelectedRecordForDetail(null)} 
        onEdit={(rec) => setSelectedRecordForEdit(rec)}
        onDelete={(rec) => setRecordToDelete(rec)}
      />

      {/* Edit Mutabaah Modal */}
      <EditMutabaahModal
        record={selectedRecordForEdit}
        onClose={() => setSelectedRecordForEdit(null)}
        onRecordUpdated={() => setRefreshTrigger(prev => prev + 1)}
        onDeleteRequest={(rec) => setRecordToDelete(rec)}
      />

      {/* Confirm Delete Record Modal */}
      <ConfirmDeleteModal
        isOpen={!!recordToDelete}
        title="Hapus Catatan Mutabaah"
        message={recordToDelete ? `Apakah Anda yakin ingin menghapus catatan mutabaah tanggal ${recordToDelete.tanggal}? Data yang dihapus tidak dapat dipulihkan.` : ''}
        itemDetails={recordToDelete ? [
          { label: 'Tanggal', value: recordToDelete.tanggal },
          { label: 'Skor Total', value: `${recordToDelete.skorTotal} / 100` }
        ] : []}
        onConfirm={() => {
          if (recordToDelete) {
            StorageService.deleteRecord(recordToDelete.id);
            setRecordToDelete(null);
            setRefreshTrigger(prev => prev + 1);
          }
        }}
        onCancel={() => setRecordToDelete(null)}
      />

    </div>
  );
};
