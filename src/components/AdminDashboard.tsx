import React, { useState } from 'react';
import { User, MutabaahRecord, JenisKelamin } from '../types';
import { StorageService, getFormattedDate, DEFAULT_GROUPS } from '../utils/storage';
import { MutabaahDetailModal } from './MutabaahDetailModal';
import { 
  Users, 
  CheckCircle2, 
  Award, 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  UserPlus, 
  Trash2, 
  Eye, 
  Sparkles, 
  BarChart3, 
  FileSpreadsheet,
  Moon,
  BookOpen,
  Activity,
  ShieldCheck,
  Check,
  X,
  Zap,
  KeyRound
} from 'lucide-react';

interface AdminDashboardProps {
  adminUser: User;
  onOpenGoogleSheets?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminUser, onOpenGoogleSheets }) => {
  const [selectedDate, setSelectedDate] = useState(getFormattedDate());
  const [selectedGrup, setSelectedGrup] = useState<string>('all');
  const [selectedJk, setSelectedJk] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'rekap' | 'grup' | 'anggota'>('rekap');

  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<MutabaahRecord | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const users = StorageService.getUsers();
  const anggotaList = users.filter(u => u.role === 'anggota');
  const allRecords = StorageService.getRecords();

  // Filter records for selected date
  const dateRecords = allRecords.filter(r => r.tanggal === selectedDate);

  // Filtered members list based on filters
  const filteredAnggota = anggotaList.filter(u => {
    if (selectedGrup !== 'all' && u.kodeGrup !== selectedGrup) return false;
    if (selectedJk !== 'all' && u.jenisKelamin !== selectedJk) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.namaLengkap.toLowerCase().includes(q);
      const matchNia = u.nia.toLowerCase().includes(q);
      if (!matchName && !matchNia) return false;
    }
    return true;
  });

  // Calculate high-level KPIs for selected date
  const totalAnggotaInFilter = filteredAnggota.length;
  const submittedRecordsInFilter = filteredAnggota.map(u => {
    return dateRecords.find(r => r.userId === u.id);
  }).filter(Boolean) as MutabaahRecord[];

  const completionCount = submittedRecordsInFilter.length;
  const completionPercentage = totalAnggotaInFilter > 0 
    ? Math.round((completionCount / totalAnggotaInFilter) * 100) 
    : 0;

  const avgScore = submittedRecordsInFilter.length > 0
    ? Math.round(submittedRecordsInFilter.reduce((acc, r) => acc + r.skorTotal, 0) / submittedRecordsInFilter.length)
    : 0;

  const subuhMasjidCount = submittedRecordsInFilter.filter(
    r => r.aspekRuhiah.sholatSubuhBerjamaahMasjid.status === 'ya'
  ).length;

  const qiamulailCount = submittedRecordsInFilter.filter(
    r => r.aspekRuhiah.sholatQiamulail.dikerjakan
  ).length;

  const handleExportCsv = () => {
    // Export either current filtered records or all records for selected date
    const csvContent = StorageService.exportToCsv(submittedRecordsInFilter.length > 0 ? submittedRecordsInFilter : dateRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap-mutabaah-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteMember = (userId: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus anggota "${nama}"? Semua riwayat mutabaah anggota ini juga akan dihapus.`)) {
      StorageService.deleteUser(userId);
      setRefreshKey(prev => prev + 1);
    }
  };

  const formatIndonesianDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      const dObj = new Date(Number(y), Number(m) - 1, Number(d));
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(dObj);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Panel Admin & Murabbi
              </span>
              <span className="text-xs text-emerald-300">
                Pusat Rekapitulasi Pembinaan
              </span>
            </div>
            <h1 className="text-2xl font-bold font-serif text-white">
              Rekapitulasi Mutabaah Yaumiah
            </h1>
            <p className="text-xs text-emerald-200/90 mt-1 max-w-xl">
              Evaluasi ketercapaian aspek Ruhiah, Fikriah, dan Jasadiah santri/anggota kelompok usrah & halaqah.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenGoogleSheets && (
              <button
                onClick={onOpenGoogleSheets}
                className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-teal-100 border border-teal-500/60 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-300" />
                <span>Google Sheets & Sheet3</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            )}

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-600 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Export CSV (Excel)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-600 text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Cetak Laporan"
            >
              <Printer className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Tingkat Pengisian</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-slate-800">{completionPercentage}%</p>
            <span className="text-xs text-slate-500">
              ({completionCount}/{totalAnggotaInFilter})
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Pada {formatIndonesianDate(selectedDate)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Rata-rata Skor</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{avgScore} <span className="text-xs text-slate-400 font-normal">/ 100</span></p>
          <p className="text-[11px] text-slate-400 mt-0.5">Dari anggota yang mengisi</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Subuh Berjamaah</span>
            <Moon className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{subuhMasjidCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Jamaah masjid / awal waktu</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Qiamulail</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{qiamulailCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Anggota bangun malam</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-700" />
            <span>Filter Rekapitulasi</span>
          </span>
          <span className="text-[11px] text-slate-500">
            Menampilkan {totalAnggotaInFilter} Anggota
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Pilih Tanggal Mutabaah
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Group Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Kode Grup / Usrah
            </label>
            <select
              value={selectedGrup}
              onChange={(e) => setSelectedGrup(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600"
            >
              <option value="all">Semua Grup Usrah</option>
              {DEFAULT_GROUPS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Jenis Kelamin
            </label>
            <select
              value={selectedJk}
              onChange={(e) => setSelectedJk(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600"
            >
              <option value="all">Semua (Ikhwan & Akhwat)</option>
              <option value="Laki-laki">Laki-laki (Ikhwan)</option>
              <option value="Perempuan">Perempuan (Akhwat)</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Cari Nama atau NIA
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari anggota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2">
        <button
          onClick={() => setActiveTab('rekap')}
          className={`py-3 px-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'rekap'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Rekapitulasi Harian ({completionCount}/{totalAnggotaInFilter})</span>
        </button>

        <button
          onClick={() => setActiveTab('grup')}
          className={`py-3 px-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'grup'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analisis Performa Usrah</span>
        </button>

        <button
          onClick={() => setActiveTab('anggota')}
          className={`py-3 px-4 text-xs font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'anggota'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kelola Anggota ({anggotaList.length})</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="mt-4">
        
        {/* ========================================================================= */}
        {/* TAB 1: REKAPITULASI TABEL DETAIL */}
        {/* ========================================================================= */}
        {activeTab === 'rekap' && (
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Matriks Mutabaah Yaumiah — {formatIndonesianDate(selectedDate)}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Detail isian aspek Ruhiah, Fikriah, dan Jasadiah seluruh anggota.
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-emerald-800">
                {completionCount} dari {totalAnggotaInFilter} Anggota Telah Mengisi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 select-none text-[11px]">
                  <tr>
                    <th className="p-3">Anggota</th>
                    <th className="p-3">Grup & JK</th>
                    <th className="p-3 text-center">Tilawah</th>
                    <th className="p-3 text-center">Qiamulail</th>
                    <th className="p-3 text-center">Subuh Berjamaah</th>
                    <th className="p-3 text-center">Al-Ma'tsurat</th>
                    <th className="p-3 text-center">Puasa</th>
                    <th className="p-3 text-center">Materi KKP</th>
                    <th className="p-3 text-center">Hafalan KKP</th>
                    <th className="p-3 text-center">Olahraga</th>
                    <th className="p-3 text-center">Skor Total</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAnggota.map((u) => {
                    const rec = dateRecords.find(r => r.userId === u.id);

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Member Identity */}
                        <td className="p-3">
                          <div className="font-bold text-slate-900 truncate max-w-[150px]" title={u.namaLengkap}>
                            {u.namaLengkap}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {u.nia}
                          </div>
                        </td>

                        {/* Group & Gender */}
                        <td className="p-3">
                          <div className="font-medium text-emerald-800 truncate max-w-[120px]">
                            {u.kodeGrup}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {u.jenisKelamin}
                          </div>
                        </td>

                        {/* Aspect Status Columns */}
                        {rec ? (
                          <>
                            {/* Tilawah */}
                            <td className="p-3 text-center">
                              {rec.aspekRuhiah.tilawah.dikerjakan ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  ✓ {rec.aspekRuhiah.tilawah.jumlah} {rec.aspekRuhiah.tilawah.satuan.charAt(0)}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-bold">✕</span>
                              )}
                            </td>

                            {/* Qiamulail */}
                            <td className="p-3 text-center">
                              {rec.aspekRuhiah.sholatQiamulail.dikerjakan ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  ✓ {rec.aspekRuhiah.sholatQiamulail.rakaat} R
                                </span>
                              ) : (
                                <span className="text-slate-300 font-bold">✕</span>
                              )}
                            </td>

                            {/* Subuh Berjamaah */}
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.aspekRuhiah.sholatSubuhBerjamaahMasjid.status === 'ya'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : rec.aspekRuhiah.sholatSubuhBerjamaahMasjid.status === 'masbuq'
                                  ? 'bg-amber-100 text-amber-800'
                                  : rec.aspekRuhiah.sholatSubuhBerjamaahMasjid.status === 'udzur'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {rec.aspekRuhiah.sholatSubuhBerjamaahMasjid.status}
                              </span>
                            </td>

                            {/* Al-Matsurat */}
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                rec.aspekRuhiah.almatsurat.status === 'lengkap'
                                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                                  : rec.aspekRuhiah.almatsurat.status !== 'tidak'
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'text-slate-300'
                              }`}>
                                {rec.aspekRuhiah.almatsurat.status.replace('_saja', '')}
                              </span>
                            </td>

                            {/* Puasa */}
                            <td className="p-3 text-center">
                              {rec.aspekRuhiah.puasaSunah.dikerjakan ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  ✓ Puasa
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>

                            {/* Materi KKP */}
                            <td className="p-3 text-center">
                              {rec.aspekFikriah.membacaMateriKkp.dikerjakan ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                                  ✓ {rec.aspekFikriah.membacaMateriKkp.durasiMenit}m
                                </span>
                              ) : (
                                <span className="text-slate-300 font-bold">✕</span>
                              )}
                            </td>

                            {/* Hafalan KKP */}
                            <td className="p-3 text-center">
                              {rec.aspekFikriah.hafalanSuratKkp.dikerjakan ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold" title={rec.aspekFikriah.hafalanSuratKkp.namaSuratAyat}>
                                  ✓ {rec.aspekFikriah.hafalanSuratKkp.jenis.charAt(0).toUpperCase()}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-bold">✕</span>
                              )}
                            </td>

                            {/* Olahraga */}
                            <td className="p-3 text-center">
                              {rec.aspekJasadiah.olahraga.dikerjakan ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  ✓ {rec.aspekJasadiah.olahraga.durasiMenit}m
                                </span>
                              ) : (
                                <span className="text-slate-300 font-bold">✕</span>
                              )}
                            </td>

                            {/* Skor Total */}
                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 rounded-lg text-xs font-extrabold ${
                                rec.skorTotal >= 80 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                rec.skorTotal >= 60 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {rec.skorTotal}
                              </span>
                            </td>

                            {/* Detail Action */}
                            <td className="p-3 text-center">
                              <button
                                onClick={() => setSelectedRecordForDetail(rec)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 transition-colors"
                                title="Lihat Detail Lengkap"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td colSpan={8} className="p-3 text-center text-slate-400 italic text-[11px]">
                              Belum mengisi mutabaah pada tanggal ini
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 font-bold text-[10px]">
                                0
                              </span>
                            </td>
                            <td className="p-3 text-center text-slate-400">
                              -
                            </td>
                          </>
                        )}

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredAnggota.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                Tidak ada data anggota yang sesuai dengan filter.
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ANALISIS KELOMPOK USRAH */}
        {/* ========================================================================= */}
        {activeTab === 'grup' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_GROUPS.map((grp) => {
              const membersInGrp = anggotaList.filter(u => u.kodeGrup === grp);
              const recsInGrp = dateRecords.filter(r => r.kodeGrup === grp);
              const pct = membersInGrp.length > 0 ? Math.round((recsInGrp.length / membersInGrp.length) * 100) : 0;
              const avg = recsInGrp.length > 0 
                ? Math.round(recsInGrp.reduce((acc, r) => acc + r.skorTotal, 0) / recsInGrp.length) 
                : 0;

              return (
                <div key={grp} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm font-serif">
                        {grp}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {membersInGrp.length} Anggota Terdaftar
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                      Rata-rata: {avg} Poin
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Kepatuhan Pengisian ({recsInGrp.length}/{membersInGrp.length})</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>

                  {/* Quick summary of group members */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px]">
                    {membersInGrp.map(m => {
                      const hasSubmitted = recsInGrp.some(r => r.userId === m.id);
                      return (
                        <span 
                          key={m.id}
                          className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                            hasSubmitted 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {hasSubmitted ? '✓' : '✕'} {m.namaLengkap.split(' ')[0]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: KELOLA ANGGOTA */}
        {/* ========================================================================= */}
        {activeTab === 'anggota' && (
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Daftar Seluruh Anggota Terdaftar
                </h3>
                <p className="text-xs text-slate-500">
                  Kelola data Nomor Induk Anggota (NIA), nama, kelompok usrah, dan jenis kelamin.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {onOpenGoogleSheets && (
                  <button
                    onClick={onOpenGoogleSheets}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sinkronisasi Data Sheet3</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Nomor Induk (NIA)</th>
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">Kode Grup / Usrah</th>
                    <th className="p-3">Password (Sheet3)</th>
                    <th className="p-3">Jenis Kelamin</th>
                    <th className="p-3">No. WhatsApp</th>
                    <th className="p-3 text-center">Total Isian</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {anggotaList.map((u) => {
                    const userRecordCount = allRecords.filter(r => r.userId === u.id).length;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-800 font-mono">{u.nia}</td>
                        <td className="p-3 font-semibold text-slate-900">{u.namaLengkap}</td>
                        <td className="p-3 text-emerald-800 font-medium">{u.kodeGrup}</td>
                        <td className="p-3 font-mono text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                            {u.password || '123'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            u.jenisKelamin === 'Laki-laki' 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            {u.jenisKelamin}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{u.noHp || '-'}</td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          {userRecordCount} Hari
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteMember(u.id, u.namaLengkap)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Anggota"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      <MutabaahDetailModal 
        record={selectedRecordForDetail} 
        onClose={() => setSelectedRecordForDetail(null)} 
      />

    </div>
  );
};
