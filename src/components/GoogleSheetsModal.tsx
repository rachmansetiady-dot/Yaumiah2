import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Check, 
  Copy, 
  RefreshCw, 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Download, 
  Upload, 
  Zap, 
  Info, 
  X,
  Database,
  ArrowRight,
  ShieldCheck,
  Users,
  Sparkles
} from 'lucide-react';
import { GoogleSheetsService, SyncStatusEvent } from '../services/googleSheetsService';
import { StorageService } from '../utils/storage';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdated?: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({ 
  isOpen, 
  onClose,
  onDataUpdated 
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'sheet3_direct' | 'code' | 'guide'>('settings');
  const [scriptUrl, setScriptUrl] = useState('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [rawSheet3Text, setRawSheet3Text] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [pollInterval, setPollInterval] = useState(25);
  const [isCopied, setIsCopied] = useState(false);
  
  // Action Loading States
  const [isTesting, setIsTesting] = useState(false);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [isFetchingDirectUrl, setIsFetchingDirectUrl] = useState(false);
  const [isPushingRecords, setIsPushingRecords] = useState(false);
  
  // Feedback Messages
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncStatusEvent[]>([]);

  useEffect(() => {
    if (isOpen) {
      setScriptUrl(GoogleSheetsService.getScriptUrl());
      setAutoSync(GoogleSheetsService.isAutoSyncEnabled());
      setPollInterval(GoogleSheetsService.getPollIntervalSeconds());
      setFeedback(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = GoogleSheetsService.subscribe((event) => {
      setSyncHistory(prev => [event, ...prev.slice(0, 4)]);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    GoogleSheetsService.setScriptUrl(scriptUrl);
    setFeedback({
      type: 'success',
      text: scriptUrl.trim() 
        ? 'URL Google Apps Script berhasil disimpan!' 
        : 'URL Google Apps Script telah dikosongkan.'
    });
  };

  const handleToggleAutoSync = (val: boolean) => {
    setAutoSync(val);
    GoogleSheetsService.setAutoSyncEnabled(val);
    setFeedback({
      type: 'info',
      text: val 
        ? 'Sinkronisasi real-time otomatis AKTIF. Setiap isian di dashboard akan langsung masuk ke spreadsheet.' 
        : 'Sinkronisasi real-time otomatis DINONAKTIFKAN.'
    });
  };

  const handleTestConnection = async () => {
    if (!scriptUrl.trim()) {
      setFeedback({ type: 'error', text: 'Masukkan URL Web App Google Apps Script terlebih dahulu.' });
      return;
    }
    handleSaveUrl();
    setIsTesting(true);
    setFeedback(null);
    const res = await GoogleSheetsService.testConnection(scriptUrl);
    setIsTesting(false);
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message
    });
  };

  const handleFetchMembersFromSheet3 = async () => {
    if (!scriptUrl.trim()) {
      setFeedback({ type: 'error', text: 'Simpan URL Web App terlebih dahulu sebelum menarik data Sheet3.' });
      return;
    }
    handleSaveUrl();
    setIsFetchingMembers(true);
    setFeedback(null);
    const res = await GoogleSheetsService.fetchMembersFromSheet3();
    setIsFetchingMembers(false);
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message
    });
    if (res.success && onDataUpdated) {
      onDataUpdated();
    }
  };

  const handleFetchAllRealtime = async () => {
    if (!scriptUrl.trim()) {
      setFeedback({ type: 'error', text: 'Simpan URL Web App terlebih dahulu sebelum menarik data.' });
      return;
    }
    handleSaveUrl();
    setIsFetchingAll(true);
    setFeedback(null);
    const res = await GoogleSheetsService.fetchAllRealtime();
    setIsFetchingAll(false);
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message
    });
    if (res.success && onDataUpdated) {
      onDataUpdated();
    }
  };

  const handleChangePollInterval = (sec: number) => {
    setPollInterval(sec);
    GoogleSheetsService.setPollIntervalSeconds(sec);
    setFeedback({
      type: 'info',
      text: `Frekuensi penarikan real-time di latar belakang diatur ke setiap ${sec} detik.`
    });
  };

  const handleFetchFromSpreadsheetUrl = async () => {
    if (!spreadsheetUrl.trim()) {
      setFeedback({ type: 'error', text: 'Masukkan Link atau ID Google Spreadsheet.' });
      return;
    }
    setIsFetchingDirectUrl(true);
    setFeedback(null);
    const res = await GoogleSheetsService.fetchMembersFromSpreadsheetUrl(spreadsheetUrl);
    setIsFetchingDirectUrl(false);
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message
    });
    if (res.success && onDataUpdated) {
      onDataUpdated();
    }
  };

  const handleImportRawText = () => {
    if (!rawSheet3Text.trim()) {
      setFeedback({ type: 'error', text: 'Tempelkan data baris dari Google Sheet Sheet3 terlebih dahulu.' });
      return;
    }
    const res = GoogleSheetsService.importMembersFromRawText(rawSheet3Text);
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message
    });
    if (res.success && onDataUpdated) {
      onDataUpdated();
    }
  };

  const handleFillSampleText = () => {
    const sample = `Nomor Induk Anggota (NIA)\tKode Grup / Usrah\tPassword\tNama Lengkap\tJenis Kelamin\nNIA-2024-001\tUSRAH-ALFALAH\t123\tAhmad Fauzan Pratama\tLaki-laki\nNIA-2024-002\tUSRAH-ANNUR\t123\tFathimah Az-Zahra\tPerempuan\nNIA-2024-003\tUSRAH-ALFALAH\t123\tMuhammad Ridwan Syahputra\tLaki-laki\nNIA-2024-004\tUSRAH-ANNUR\t123\tNurul Hidayah Putri\tPerempuan\nNIA-2024-005\tUSRAH-ALFALAH\t123\tZaid Abdullah Mansur\tLaki-laki\nNIA-2024-006\tUSRAH-ANNUR\t123\tAisyah Humaira\tPerempuan`;
    setRawSheet3Text(sample);
  };

  const handlePushAllRecords = async () => {
    if (!scriptUrl.trim()) {
      setFeedback({ type: 'error', text: 'Simpan URL Web App terlebih dahulu sebelum mengirim rekap.' });
      return;
    }
    handleSaveUrl();
    setIsPushingRecords(true);
    setFeedback(null);
    const res = await GoogleSheetsService.batchSyncAllRecords();
    setIsPushingRecords(false);
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message
    });
  };

  const handleCopyCode = () => {
    const code = GoogleSheetsService.getScriptTemplateCode();
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const isConnected = !!GoogleSheetsService.getScriptUrl();
  const lastSync = GoogleSheetsService.getLastSyncTime();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-emerald-200 shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-serif">
                  Integrasi Google Sheets & Google Apps Script
                </h2>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                  isConnected 
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' 
                    : 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                }`}>
                  <Zap className="w-3 h-3" />
                  {isConnected ? 'Real-Time Sync Siap' : 'Belum Terhubung'}
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Data Anggota (Sheet3) & Rekap Mutabaah Harian tersinkronisasi otomatis secara dua arah.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-5 border-b border-emerald-700/60 -mb-5 sm:-mb-6 overflow-x-auto pb-0.5">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'settings'
                  ? 'border-emerald-300 text-white bg-white/10 rounded-t-lg'
                  : 'border-transparent text-emerald-200/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>Realtime Apps Script</span>
            </button>

            <button
              onClick={() => setActiveTab('sheet3_direct')}
              className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'sheet3_direct'
                  ? 'border-emerald-300 text-white bg-white/10 rounded-t-lg'
                  : 'border-transparent text-emerald-200/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>Tarik / Tempel Sheet3</span>
              <span className="bg-emerald-500 text-[10px] text-white px-1.5 py-0.2 rounded font-bold">Instan</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'code'
                  ? 'border-emerald-300 text-white bg-white/10 rounded-t-lg'
                  : 'border-transparent text-emerald-200/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <Copy className="w-4 h-4" />
              <span>Salin Kode Apps Script (Code.gs)</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'guide'
                  ? 'border-emerald-300 text-white bg-white/10 rounded-t-lg'
                  : 'border-transparent text-emerald-200/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Format Kolom Sheet3</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Global Alert / Feedback */}
          {feedback && (
            <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : feedback.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />}
              {feedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />}
              {feedback.type === 'info' && <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />}
              <div className="flex-1 font-medium">{feedback.text}</div>
            </div>
          )}

          {/* TAB 1: PENGATURAN & SINKRONISASI */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* Web App URL Input Card */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="gas-web-url" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-emerald-600" />
                    <span>URL Web App Google Apps Script</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Berakhiran <code className="text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded font-mono">/exec</code>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    id="gas-web-url"
                    type="url"
                    value={scriptUrl}
                    onChange={(e) => setScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-slate-800"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveUrl}
                      className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      Simpan URL
                    </button>
                    <button
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Menguji...' : 'Tes Koneksi'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Didapatkan dari Google Spreadsheet &gt; <strong>Extensions</strong> &gt; <strong>Apps Script</strong> &gt; <strong>Deploy</strong> &gt; <strong>New Deployment</strong> (Web App, Anyone).
                </p>
              </div>

              {/* Real-Time Auto Sync Option */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        Sinkronisasi Real-Time Otomatis
                        <span className="bg-emerald-200 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Rekomendasi
                        </span>
                      </h4>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Setiap perubahan isian mutabaah atau data anggota di dashboard langsung disinkronkan ke Google Sheets secara real-time.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => handleToggleAutoSync(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Polling Interval Setting */}
                {autoSync && (
                  <div className="pt-3 border-t border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-medium">
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Interval Tarik Data Latar Belakang (Real-time polling):</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[15, 25, 60].map((sec) => (
                        <button
                          key={sec}
                          onClick={() => handleChangePollInterval(sec)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            pollInterval === sec
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-white text-emerald-900 hover:bg-emerald-100 border border-emerald-300'
                          }`}
                        >
                          {sec} Detik
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Master Real-Time Pull Button */}
              <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      <h4 className="text-sm font-bold text-white">
                        Tarik Seluruh Data Real-Time Sekarang
                      </h4>
                      <span className="bg-emerald-500/30 text-emerald-200 text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/30 font-semibold">
                        Sheet3 + Rekap Mutabaah
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200/80">
                      Menarik data anggota terbaru dari tab <strong className="text-white">Sheet3</strong> dan rekaman evaluasi dari <strong className="text-white">Rekap_Mutabaah</strong> dalam 1 kali klik.
                    </p>
                  </div>
                  <button
                    onClick={handleFetchAllRealtime}
                    disabled={isFetchingAll}
                    className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingAll ? 'animate-spin' : ''}`} />
                    <span>{isFetchingAll ? 'Menarik Data...' : 'Tarik Real-Time'}</span>
                  </button>
                </div>
              </div>

              {/* Manual Direct Sync Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Pull Sheet3 Members */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Tarik Data Anggota dari 'Sheet3'
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Ambil NIA, Kode Grup, Password, dan Nama Lengkap dari Google Sheet
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Memperbarui daftar anggota aplikasi agar persis sama dengan tab <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-700">Sheet3</code> di spreadsheet Anda.
                  </p>

                  <button
                    onClick={handleFetchMembersFromSheet3}
                    disabled={isFetchingMembers}
                    className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className={`w-3.5 h-3.5 ${isFetchingMembers ? 'animate-bounce' : ''}`} />
                    <span>{isFetchingMembers ? 'Mengunduh Sheet3...' : 'Tarik Data dari Sheet3 Sekarang'}</span>
                  </button>
                </div>

                {/* 2. Push All Records to Rekap_Mutabaah */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Kirim Semua Rekap Mutabaah
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Kirim seluruh isian harian ke tab 'Rekap_Mutabaah'
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Mengekspor seluruh rekap ibadah anggota ke spreadsheet untuk pengarsipan lengkap dan analisis pembina.
                  </p>

                  <button
                    onClick={handlePushAllRecords}
                    disabled={isPushingRecords}
                    className="w-full py-2.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Upload className={`w-3.5 h-3.5 ${isPushingRecords ? 'animate-bounce' : ''}`} />
                    <span>{isPushingRecords ? 'Mengirim Data...' : 'Kirim Semua Rekap ke Spreadsheet'}</span>
                  </button>
                </div>

              </div>

              {/* Status Info Strip */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>
                    Status: <strong className="text-slate-800">{isConnected ? 'Terkoneksi ke Google Apps Script' : 'Mode Offline / Penyimpanan Lokal'}</strong>
                  </span>
                </div>
                {lastSync && (
                  <div className="text-[11px] text-slate-500">
                    Sinkronisasi terakhir: {new Date(lastSync).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: TARIK / TEMPEL SHEET3 SECARA LANGSUNG */}
          {activeTab === 'sheet3_direct' && (
            <div className="space-y-6">
              
              {/* Info Card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      Integrasi Data Anggota dari Google Sheet 'Sheet3'
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      Sistem menggunakan data <strong>Nomor Induk Anggota (NIA)</strong>, <strong>Kode Grup / Usrah</strong>, <strong>Password</strong>, dan <strong>Nama Lengkap</strong> yang ada pada tab <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900">Sheet3</code> untuk autentikasi dan mutabaah.
                    </p>
                  </div>
                </div>
              </div>

              {/* METODE 1: Link Google Spreadsheet */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">1</span>
                    <h4 className="text-xs font-bold text-slate-800">Tarik Otomatis via Link Google Spreadsheet</h4>
                  </div>
                  <span className="text-[11px] text-slate-500">Akses Viewer Publik</span>
                </div>
                <p className="text-xs text-slate-500">
                  Tempel link spreadsheet Anda (pastikan pengaturan Berbagi disetel ke <em>"Siapa saja yang memiliki link dapat melihat"</em>). Sistem akan langsung membaca tab <strong>Sheet3</strong>.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="url"
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit"
                    className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-slate-800"
                  />
                  <button
                    onClick={handleFetchFromSpreadsheetUrl}
                    disabled={isFetchingDirectUrl}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {isFetchingDirectUrl ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Tarik dari Sheet3</span>
                  </button>
                </div>
              </div>

              {/* METODE 2: Tempel Data Baris Langsung (Copy-Paste) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">2</span>
                    <h4 className="text-xs font-bold text-slate-800">Tempel Data Langsung dari Sheet3 (Copy-Paste)</h4>
                  </div>
                  <button
                    onClick={handleFillSampleText}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    + Masukkan Contoh Data
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Salin tabel dari Google Sheet tab <strong>Sheet3</strong> (tekan <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">Ctrl+C</kbd> di spreadsheet), lalu tempel (<kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">Ctrl+V</kbd>) pada kotak di bawah ini:
                </p>

                <textarea
                  rows={5}
                  value={rawSheet3Text}
                  onChange={(e) => setRawSheet3Text(e.target.value)}
                  placeholder={`Nomor Induk Anggota (NIA)\tKode Grup / Usrah\tPassword\tNama Lengkap\tJenis Kelamin\nNIA-2024-001\tUSRAH-ALFALAH\t123\tAhmad Fauzan Pratama\tLaki-laki`}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-slate-800 resize-y"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Mendukung format tabulasi otomatis dari Google Sheets maupun CSV.
                  </span>
                  <button
                    onClick={handleImportRawText}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Terapkan Data Sheet3</span>
                  </button>
                </div>
              </div>

              {/* PRATINJAU DATA ANGGOTA SAAT INI */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Data Anggota Aktif ({StorageService.getUsers().filter(u => u.role === 'anggota').length} Orang)</span>
                  </h4>
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Siap Login dengan NIA & Password
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-52 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">NIA</th>
                        <th className="p-2">Kode Grup / Usrah</th>
                        <th className="p-2">Password</th>
                        <th className="p-2">Nama Lengkap</th>
                        <th className="p-2">Jenis Kelamin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {StorageService.getUsers().filter(u => u.role === 'anggota').map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-emerald-700">{u.nia}</td>
                          <td className="p-2 font-semibold text-slate-700">{u.kodeGrup}</td>
                          <td className="p-2 font-mono text-slate-600 bg-slate-50/50">{u.password || '123'}</td>
                          <td className="p-2 font-medium text-slate-900">{u.namaLengkap}</td>
                          <td className="p-2 text-slate-500">{u.jenisKelamin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SALIN KODE GOOGLE APPS SCRIPT */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Petunjuk Pemasangan Google Apps Script (Hanya 1 Menit):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-emerald-800 pl-1">
                  <li>Buka Google Spreadsheet yang Anda gunakan untuk mutabaah.</li>
                  <li>Di menu atas Google Sheets, klik <strong>Extensions (Ekstensi)</strong> &gt; <strong>Apps Script</strong>.</li>
                  <li>Hapus kode bawaan, lalu <strong>tempelkan seluruh kode di bawah ini</strong> ke editor <code className="bg-white px-1 py-0.5 rounded font-mono">Code.gs</code>.</li>
                  <li>Klik tombol ikon <strong>Disket / Save</strong>.</li>
                  <li>Klik tombol biru <strong>Deploy (Terapkan)</strong> di pojok kanan atas &gt; <strong>New deployment (Penerapan baru)</strong>.</li>
                  <li>Pilih jenis <strong>Web app (Aplikasi web)</strong>:
                    <ul className="list-disc list-inside pl-4 text-emerald-900 font-medium">
                      <li>Execute as: <strong>Me (email Anda)</strong></li>
                      <li>Who has access: <strong>Anyone (Siapa saja)</strong> &larr; <em>Wajib dipilih</em></li>
                    </ul>
                  </li>
                  <li>Klik <strong>Deploy</strong>, izinkan akses akun Google (Authorize access), lalu salin URL Web App yang berakhiran <code className="bg-white px-1 py-0.5 rounded font-mono">/exec</code>.</li>
                  <li>Kembali ke tab <strong>Pengaturan</strong> dan tempelkan URL tersebut. Selesai!</li>
                </ol>
              </div>

              {/* Code Box with Copy Button */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 text-slate-100">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700 text-xs">
                  <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4" />
                    Code.gs (Google Apps Script)
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white" />
                        <span>Salin Seluruh Kode</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-96 text-emerald-200/90 select-all">
                  {GoogleSheetsService.getScriptTemplateCode()}
                </pre>
              </div>

            </div>
          )}

          {/* TAB 3: FORMAT KOLOM SHEET3 & PANDUAN */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Format Struktur Tab 'Sheet3' (Data Induk Anggota)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sesuai permintaan Anda, data login & profil anggota dibaca langsung dari tab 'Sheet3'
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-emerald-900 text-white font-semibold">
                        <th className="p-2.5 border-r border-emerald-800">Kolom A</th>
                        <th className="p-2.5 border-r border-emerald-800">Kolom B</th>
                        <th className="p-2.5 border-r border-emerald-800">Kolom C</th>
                        <th className="p-2.5 border-r border-emerald-800">Kolom D</th>
                        <th className="p-2.5 border-r border-emerald-800">Kolom E (Opsional)</th>
                        <th className="p-2.5">Kolom F (Opsional)</th>
                      </tr>
                      <tr className="bg-emerald-800/90 text-emerald-100 text-[11px]">
                        <th className="p-2 border-r border-emerald-700">Nomor Induk Anggota (NIA)</th>
                        <th className="p-2 border-r border-emerald-700">Kode Grup / Usrah</th>
                        <th className="p-2 border-r border-emerald-700">Password</th>
                        <th className="p-2 border-r border-emerald-700">Nama Lengkap</th>
                        <th className="p-2 border-r border-emerald-700">Jenis Kelamin</th>
                        <th className="p-2">No HP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px] text-slate-700 bg-white">
                      <tr>
                        <td className="p-2.5 font-bold text-emerald-700 border-r border-slate-200">NIA-2024-001</td>
                        <td className="p-2.5 border-r border-slate-200">USRAH-ALFALAH</td>
                        <td className="p-2.5 border-r border-slate-200">123</td>
                        <td className="p-2.5 font-sans font-medium text-slate-900 border-r border-slate-200">Ahmad Fauzan Pratama</td>
                        <td className="p-2.5 border-r border-slate-200 font-sans">Laki-laki</td>
                        <td className="p-2.5">081298765431</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-2.5 font-bold text-emerald-700 border-r border-slate-200">NIA-2024-002</td>
                        <td className="p-2.5 border-r border-slate-200">USRAH-ANNUR</td>
                        <td className="p-2.5 border-r border-slate-200">123</td>
                        <td className="p-2.5 font-sans font-medium text-slate-900 border-r border-slate-200">Fathimah Az-Zahra</td>
                        <td className="p-2.5 border-r border-slate-200 font-sans">Perempuan</td>
                        <td className="p-2.5">081298765432</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-emerald-700 border-r border-slate-200">NIA-2024-003</td>
                        <td className="p-2.5 border-r border-slate-200">USRAH-ALFALAH</td>
                        <td className="p-2.5 border-r border-slate-200">123</td>
                        <td className="p-2.5 font-sans font-medium text-slate-900 border-r border-slate-200">Muhammad Ridwan Syahputra</td>
                        <td className="p-2.5 border-r border-slate-200 font-sans">Laki-laki</td>
                        <td className="p-2.5">081298765433</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Keunggulan Otomatisasi Script:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                    <li>Jika tab <code className="text-emerald-700 font-semibold font-mono">Sheet3</code> belum ada, script Google Apps Script akan <strong>secara otomatis membuatnya</strong> beserta baris header dan sampelnya!</li>
                    <li>Tab <code className="text-emerald-700 font-semibold font-mono">Rekap_Mutabaah</code> juga akan otomatis dibuat saat isian mutabaah pertama kali dikirimkan dari dashboard.</li>
                    <li>Sistem mengenali variasi nama kolom (seperti "NIA", "Nomor Induk", "Grup", "Usrah", "Nama", dll.) secara fleksibel dan pintar.</li>
                  </ul>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
            <span>{isConnected ? 'Sinkronisasi Realtime Siap' : 'Menunggu Konfigurasi Web App URL'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
