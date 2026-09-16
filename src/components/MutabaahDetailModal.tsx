import React from 'react';
import { MutabaahRecord } from '../types';
import { 
  X, 
  Calendar, 
  User, 
  Users, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Moon, 
  BookOpen, 
  Activity,
  Flame,
  Clock,
  Pencil,
  Trash2
} from 'lucide-react';

interface MutabaahDetailModalProps {
  record: MutabaahRecord | null;
  onClose: () => void;
  onEdit?: (record: MutabaahRecord) => void;
  onDelete?: (record: MutabaahRecord) => void;
}

export const MutabaahDetailModal: React.FC<MutabaahDetailModalProps> = ({ 
  record, 
  onClose,
  onEdit,
  onDelete
}) => {
  if (!record) return null;

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

  const getSubuhLabel = (status: string, jk: string) => {
    switch (status) {
      case 'ya':
        return jk === 'Laki-laki' ? 'Berjamaah di Masjid' : 'Tepat Waktu (Awal Waktu)';
      case 'masbuq':
        return 'Masbuq di Masjid';
      case 'munfarid_awal_waktu':
        return jk === 'Laki-laki' ? 'Sendiri di Rumah (Awal Waktu)' : 'Berjamaah di Musholla/Masjid';
      case 'terlambat':
        return 'Terlambat / Kesiangan';
      case 'udzur':
        return 'Udzur Syar\'i (Haid / Nifas)';
      default:
        return 'Tidak Sholat';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-700">
                Detail Evaluasi Harian
              </span>
              <span className="text-xs text-emerald-300">
                {record.kodeGrup}
              </span>
            </div>
            <h3 className="text-lg font-bold font-serif mt-1">
              {record.namaLengkap} ({record.nia})
            </h3>
            <p className="text-xs text-emerald-200 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatIndonesianDate(record.tanggal)}</span>
              <span>•</span>
              <span>{record.jenisKelamin}</span>
              {record.isUdzurSyari && (
                <span className="bg-purple-800 text-purple-200 px-1.5 py-0.2 rounded text-[10px]">
                  Udzur Syar'i
                </span>
              )}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Ribbon */}
        <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-900">Total Skor Capaian:</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-emerald-800">
              {record.skorTotal} / 100
            </span>
            <div className="flex gap-1 text-[10px]">
              <span className="bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800">
                Ruhiah: {record.skorRuhiah}/50
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-sky-200 text-sky-800">
                Fikriah: {record.skorFikriah}/30
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800">
                Jasadiah: {record.skorJasadiah}/20
              </span>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
          
          {/* Aspek Ruhiah */}
          <div className="border border-emerald-100 rounded-xl p-4 bg-emerald-50/30">
            <h4 className="font-bold text-emerald-900 text-sm mb-3 flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-emerald-700" />
              <span>Aspek Ruhiah</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium block">Tilawah Al-Qur'an</span>
                <span className="font-bold text-slate-800">
                  {record.aspekRuhiah.tilawah.dikerjakan 
                    ? `✓ ${record.aspekRuhiah.tilawah.jumlah} ${record.aspekRuhiah.tilawah.satuan}` 
                    : '✗ Belum Tilawah'}
                </span>
                {record.aspekRuhiah.tilawah.suratAyat && (
                  <span className="text-[11px] text-emerald-700 block mt-0.5">
                    {record.aspekRuhiah.tilawah.suratAyat}
                  </span>
                )}
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium block">Sholat Qiamulail</span>
                <span className="font-bold text-slate-800">
                  {record.aspekRuhiah.sholatQiamulail.dikerjakan 
                    ? `✓ Dikerjakan (${record.aspekRuhiah.sholatQiamulail.rakaat} Rakaat)` 
                    : '✗ Tidak Dikerjakan'}
                </span>
                {record.aspekRuhiah.sholatQiamulail.catatan && (
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    {record.aspekRuhiah.sholatQiamulail.catatan}
                  </span>
                )}
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium block">Sholat Subuh Berjamaah</span>
                <span className="font-bold text-slate-800">
                  {getSubuhLabel(record.aspekRuhiah.sholatSubuhBerjamaahMasjid.status, record.jenisKelamin)}
                </span>
                {record.aspekRuhiah.sholatSubuhBerjamaahMasjid.keterangan && (
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    {record.aspekRuhiah.sholatSubuhBerjamaahMasjid.keterangan}
                  </span>
                )}
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium block">Al-Ma'tsurat & Puasa</span>
                <span className="font-bold text-slate-800 block">
                  Matsurat: {record.aspekRuhiah.almatsurat.status.replace('_', ' ')} ({record.aspekRuhiah.almatsurat.jenis})
                </span>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Puasa: {record.aspekRuhiah.puasaSunah.dikerjakan 
                    ? `✓ ${record.aspekRuhiah.puasaSunah.jenisPuasa || 'Puasa Sunah'}` 
                    : 'Tidak Puasa'}
                </span>
              </div>
            </div>
          </div>

          {/* Aspek Fikriah */}
          <div className="border border-sky-100 rounded-xl p-4 bg-sky-50/30">
            <h4 className="font-bold text-sky-900 text-sm mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-700" />
              <span>Aspek Fikriah</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium block">Membaca Materi KKP</span>
                <span className="font-bold text-slate-800 block">
                  {record.aspekFikriah.membacaMateriKkp.dikerjakan 
                    ? `✓ ${record.aspekFikriah.membacaMateriKkp.judulMateri}` 
                    : '✗ Belum Membaca'}
                </span>
                {record.aspekFikriah.membacaMateriKkp.durasiMenit > 0 && (
                  <span className="text-[11px] text-sky-700 block mt-0.5">
                    Durasi: {record.aspekFikriah.membacaMateriKkp.durasiMenit} Menit
                    {record.aspekFikriah.membacaMateriKkp.halaman ? ` (${record.aspekFikriah.membacaMateriKkp.halaman})` : ''}
                  </span>
                )}
                {record.aspekFikriah.membacaMateriKkp.catatanRefleksi && (
                  <p className="text-[11px] text-slate-600 mt-1 italic">
                    "{record.aspekFikriah.membacaMateriKkp.catatanRefleksi}"
                  </p>
                )}
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-medium block">Hafalan Surat Sesuai KKP</span>
                <span className="font-bold text-slate-800 block">
                  {record.aspekFikriah.hafalanSuratKkp.dikerjakan 
                    ? `✓ ${record.aspekFikriah.hafalanSuratKkp.jenis.toUpperCase()}` 
                    : '✗ Tidak Ada'}
                </span>
                {record.aspekFikriah.hafalanSuratKkp.namaSuratAyat && (
                  <span className="text-[11px] text-sky-700 block mt-0.5">
                    {record.aspekFikriah.hafalanSuratKkp.namaSuratAyat}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                  Tingkat: {record.aspekFikriah.hafalanSuratKkp.tingkatKelancaran}
                </span>
              </div>
            </div>
          </div>

          {/* Aspek Jasadiah */}
          <div className="border border-amber-100 rounded-xl p-4 bg-amber-50/30">
            <h4 className="font-bold text-amber-900 text-sm mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-700" />
              <span>Aspek Jasadiah</span>
            </h4>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 font-medium block">Olah Raga & Jasmani</span>
              <span className="font-bold text-slate-800 block">
                {record.aspekJasadiah.olahraga.dikerjakan 
                  ? `✓ ${record.aspekJasadiah.olahraga.jenisOlahraga} (${record.aspekJasadiah.olahraga.durasiMenit} Menit)` 
                  : '✗ Tidak Berolahraga Hari Ini'}
              </span>
              {record.aspekJasadiah.olahraga.keterangan && (
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Catatan: {record.aspekJasadiah.olahraga.keterangan}
                </span>
              )}
            </div>
          </div>

          {/* Catatan Harian */}
          {record.catatanHarian && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">Catatan / Muhasabah Pribadi:</span>
              <p className="text-slate-600 italic">
                "{record.catatanHarian}"
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(record);
                  onClose();
                }}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Data</span>
              </button>
            )}

            {onEdit && (
              <button
                onClick={() => {
                  onEdit(record);
                  onClose();
                }}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 border border-amber-300"
              >
                <Pencil className="w-3.5 h-3.5 text-amber-700" />
                <span>Edit Data</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
