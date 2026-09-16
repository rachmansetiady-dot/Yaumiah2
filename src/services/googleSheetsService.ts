import { User, MutabaahRecord } from '../types';
import { StorageService } from '../utils/storage';

const GAS_URL_KEY = 'mutabaah_gas_url_v1';
const GAS_AUTO_SYNC_KEY = 'mutabaah_gas_auto_sync_v1';
const GAS_LAST_SYNC_KEY = 'mutabaah_gas_last_sync_v1';
const GAS_POLL_INTERVAL_KEY = 'mutabaah_gas_poll_interval_v1';

export interface SyncStatusEvent {
  status: 'idle' | 'syncing' | 'success' | 'error';
  message: string;
  timestamp: string;
  action?: 'saveRecord' | 'deleteRecord' | 'fetchMembers' | 'fetchRecords' | 'fetchAll' | 'batchSync' | 'testConnection' | 'syncMember';
}

type SyncListener = (event: SyncStatusEvent) => void;

class GoogleSheetsManager {
  private listeners: Set<SyncListener> = new Set();
  private pollingTimer: any = null;
  private isPollingRunning: boolean = false;
  private lastStatus: SyncStatusEvent = {
    status: 'idle',
    message: 'Siap terhubung secara real-time ke Google Sheets (Sheet3)',
    timestamp: new Date().toISOString()
  };

  constructor() {
    // Start background real-time sync polling if URL is set and auto sync is enabled
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        if (this.getScriptUrl() && this.isAutoSyncEnabled()) {
          this.startRealtimePolling();
        }
      }, 1500);

      // Listen for window focus / visibility change to instantly pull latest data
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.getScriptUrl() && this.isAutoSyncEnabled()) {
          this.fetchAllRealtime(true).catch(e => console.warn('Focus sync notice:', e));
        }
      });
    }
  }

  public getScriptUrl(): string {
    return localStorage.getItem(GAS_URL_KEY) || '';
  }

  public setScriptUrl(url: string): void {
    const cleanUrl = url.trim();
    if (cleanUrl) {
      localStorage.setItem(GAS_URL_KEY, cleanUrl);
      this.startRealtimePolling();
    } else {
      localStorage.removeItem(GAS_URL_KEY);
      this.stopRealtimePolling();
    }
    this.notify({
      status: cleanUrl ? 'success' : 'idle',
      message: cleanUrl ? 'URL Google Apps Script diperbarui (Real-time aktif)' : 'URL Google Apps Script dihapus',
      timestamp: new Date().toISOString()
    });
  }

  public isAutoSyncEnabled(): boolean {
    const val = localStorage.getItem(GAS_AUTO_SYNC_KEY);
    return val === null ? true : val === 'true';
  }

  public setAutoSyncEnabled(enabled: boolean): void {
    localStorage.setItem(GAS_AUTO_SYNC_KEY, String(enabled));
    if (enabled) {
      this.startRealtimePolling();
    } else {
      this.stopRealtimePolling();
    }
  }

  public getPollIntervalSeconds(): number {
    const val = localStorage.getItem(GAS_POLL_INTERVAL_KEY);
    return val ? parseInt(val, 10) : 25; // default 25s for high real-time responsiveness
  }

  public setPollIntervalSeconds(seconds: number): void {
    const valid = Math.max(10, Math.min(300, seconds));
    localStorage.setItem(GAS_POLL_INTERVAL_KEY, String(valid));
    if (this.isPollingActive()) {
      this.stopRealtimePolling();
      this.startRealtimePolling();
    }
  }

  public getLastSyncTime(): string | null {
    return localStorage.getItem(GAS_LAST_SYNC_KEY);
  }

  private setLastSyncTime(): void {
    localStorage.setItem(GAS_LAST_SYNC_KEY, new Date().toISOString());
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.lastStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: SyncStatusEvent) {
    this.lastStatus = event;
    this.listeners.forEach(fn => {
      try {
        fn(event);
      } catch (err) {
        console.error('Error in sync listener', err);
      }
    });
  }

  private triggerDataRefreshed() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mutabaah_data_updated', {
        detail: { timestamp: new Date().toISOString() }
      }));
    }
  }

  public isPollingActive(): boolean {
    return this.pollingTimer !== null;
  }

  public startRealtimePolling(): void {
    this.stopRealtimePolling();
    const intervalMs = this.getPollIntervalSeconds() * 1000;

    this.pollingTimer = setInterval(async () => {
      if (this.isPollingRunning) return;
      if (!this.getScriptUrl() || !this.isAutoSyncEnabled()) {
        this.stopRealtimePolling();
        return;
      }
      this.isPollingRunning = true;
      try {
        await this.fetchAllRealtime(true);
      } catch (err) {
        console.warn('Background real-time sync poll notice:', err);
      } finally {
        this.isPollingRunning = false;
      }
    }, intervalMs);
  }

  public stopRealtimePolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Test connection to the Google Apps Script Web App
   */
  public async testConnection(customUrl?: string): Promise<{ success: boolean; message: string }> {
    const url = (customUrl || this.getScriptUrl()).trim();
    if (!url) {
      return { success: false, message: 'URL Google Apps Script belum dimasukkan.' };
    }

    this.notify({
      status: 'syncing',
      message: 'Menguji koneksi ke Google Apps Script...',
      timestamp: new Date().toISOString(),
      action: 'testConnection'
    });

    try {
      const testUrl = `${url}${url.includes('?') ? '&' : '?'}action=test&t=${Date.now()}`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      this.setLastSyncTime();
      this.notify({
        status: 'success',
        message: 'Koneksi ke Google Apps Script & Spreadsheet berhasil!',
        timestamp: new Date().toISOString(),
        action: 'testConnection'
      });
      return { 
        success: true, 
        message: result.message || 'Koneksi Google Apps Script berhasil terhubung!' 
      };
    } catch (err: any) {
      const errorMsg = err?.message || 'Gagal menghubungi Google Apps Script';
      this.notify({
        status: 'error',
        message: `Gagal tes koneksi: ${errorMsg}`,
        timestamp: new Date().toISOString(),
        action: 'testConnection'
      });
      return { success: false, message: errorMsg };
    }
  }

  /**
   * Fetch members directly from Google Sheet 'Sheet3' in real-time
   * Expected columns in Sheet3:
   * [Nomor Induk Anggota (NIA), Kode Grup / Usrah, Password, Nama Lengkap, Jenis Kelamin, No HP]
   */
  public async fetchMembersFromSheet3(silent = false): Promise<{ 
    success: boolean; 
    membersCount?: number; 
    message: string;
    users?: User[];
  }> {
    const url = this.getScriptUrl();
    if (!url) {
      return { 
        success: false, 
        message: 'URL Google Apps Script belum dikonfigurasi.' 
      };
    }

    if (!silent) {
      this.notify({
        status: 'syncing',
        message: "Menarik data anggota real-time dari Sheet3...",
        timestamp: new Date().toISOString(),
        action: 'fetchMembers'
      });
    }

    try {
      const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}action=getMembers&sheet=Sheet3&t=${Date.now()}`;
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} saat membaca data`);
      }

      const resData = await response.json();
      
      if (!resData || (!Array.isArray(resData.members) && !Array.isArray(resData.data))) {
        throw new Error("Format respon tidak valid: data anggota 'Sheet3' tidak ditemukan");
      }

      const rawMembers: any[] = resData.members || resData.data || [];
      if (rawMembers.length === 0) {
        if (!silent) {
          this.notify({
            status: 'success',
            message: "Sheet3 terhubung, tetapi belum ada baris data anggota.",
            timestamp: new Date().toISOString(),
            action: 'fetchMembers'
          });
        }
        return { 
          success: true, 
          membersCount: 0, 
          message: "Sheet 'Sheet3' ditemukan namun baris data anggota masih kosong." 
        };
      }

      // Map Sheet3 rows into application User objects
      const existingUsers = StorageService.getUsers();
      const adminUsers = existingUsers.filter(u => u.role === 'admin');

      const convertedUsers: User[] = rawMembers.map((row, idx) => {
        const nia = String(row.nia || row.NIA || row['Nomor Induk Anggota'] || `NIA-${idx + 1}`).trim();
        const namaLengkap = String(row.namaLengkap || row.nama || row['Nama Lengkap'] || row.name || 'Anggota').trim();
        const kodeGrup = String(row.kodeGrup || row.grup || row.usrah || row['Kode Grup / Usrah'] || row['Kode Grup'] || 'USRAH-ALFALAH').trim();
        const password = String(row.password || row.Password || row.sandi || '123').trim();
        const rawJk = String(row.jenisKelamin || row.jk || row['Jenis Kelamin'] || '').trim().toLowerCase();
        const jenisKelamin = (rawJk.includes('perempuan') || rawJk.includes('akhwat') || rawJk.startsWith('p')) ? 'Perempuan' : 'Laki-laki';
        const noHp = String(row.noHp || row.hp || row.whatsapp || row['No HP'] || '').trim();

        // Preserve local user ID and createdAt if previously mapped
        const existing = existingUsers.find(u => u.nia.toLowerCase() === nia.toLowerCase());

        return {
          id: existing?.id || `user-gas-${idx + 1}-${Date.now()}`,
          nia,
          namaLengkap,
          jenisKelamin,
          kodeGrup,
          role: 'anggota' as const,
          password: password || '123',
          noHp: noHp || undefined,
          createdAt: existing?.createdAt || new Date().toISOString()
        };
      });

      // Preserve admin users so Murabbi login is never overwritten
      const finalUserList: User[] = [...adminUsers, ...convertedUsers];
      StorageService.saveUsers(finalUserList);
      this.setLastSyncTime();

      if (!silent) {
        this.notify({
          status: 'success',
          message: `Berhasil menarik ${convertedUsers.length} data anggota dari Sheet3 secara real-time!`,
          timestamp: new Date().toISOString(),
          action: 'fetchMembers'
        });
      }

      this.triggerDataRefreshed();

      return {
        success: true,
        membersCount: convertedUsers.length,
        message: `Berhasil memuat ${convertedUsers.length} anggota dari Google Sheet 'Sheet3'.`,
        users: finalUserList
      };

    } catch (err: any) {
      const errorMsg = err?.message || 'Gagal menyinkronkan data anggota dari Google Sheet';
      if (!silent) {
        this.notify({
          status: 'error',
          message: `Error sinkronisasi Sheet3: ${errorMsg}`,
          timestamp: new Date().toISOString(),
          action: 'fetchMembers'
        });
      }
      return { success: false, message: errorMsg };
    }
  }

  /**
   * Fetch mutabaah records directly from Google Sheet 'Rekap_Mutabaah'
   */
  public async fetchRecordsFromSheet(silent = false): Promise<{
    success: boolean;
    recordsCount?: number;
    message: string;
  }> {
    const url = this.getScriptUrl();
    if (!url) return { success: false, message: 'URL belum diisi' };

    try {
      const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}action=getRecords&targetSheet=Rekap_Mutabaah&t=${Date.now()}`;
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const resData = await response.json();
      const rawRecords: any[] = resData.records || resData.data || [];
      if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
        return { success: true, recordsCount: 0, message: 'Belum ada catatan mutabaah di Google Sheets.' };
      }

      const users = StorageService.getUsers();
      const localRecords = StorageService.getRecords();

      // Convert and merge records
      const parsedRecords: MutabaahRecord[] = rawRecords.map((r, idx) => {
        const user = users.find(u => u.nia.toLowerCase() === String(r.nia || '').trim().toLowerCase());
        const userId = user?.id || `user-${r.nia}`;
        const tanggal = String(r.tanggal || '').trim();

        return {
          id: r.id || `rec-${r.nia}-${tanggal}`,
          userId,
          nia: String(r.nia || user?.nia || '').trim(),
          namaLengkap: String(r.namaLengkap || user?.namaLengkap || 'Anggota').trim(),
          jenisKelamin: r.jenisKelamin === 'Perempuan' ? 'Perempuan' : 'Laki-laki',
          kodeGrup: String(r.kodeGrup || user?.kodeGrup || 'USRAH-ALFALAH').trim(),
          tanggal,
          isUdzurSyari: r.isUdzurSyari === 'Ya' || r.isUdzurSyari === true,
          aspekRuhiah: {
            tilawah: {
              dikerjakan: r.tilawahStatus === 'Ya' || r.tilawahStatus === true,
              jumlah: parseFloat(r.tilawahJumlah || r.tilawahCapaian) || 1,
              satuan: String(r.tilawahCapaian || '').includes('juz') ? 'juz' : 'lembar',
              suratAyat: r.tilawahSurat || undefined
            },
            sholatQiamulail: {
              dikerjakan: r.qiamulailStatus === 'Ya' || r.qiamulailStatus === true,
              rakaat: parseInt(r.qiamulailRakaat, 10) || 8
            },
            sholatSubuhBerjamaahMasjid: {
              status: (r.subuhBerjamaah === 'ya' || r.subuhBerjamaah === 'uzur') ? r.subuhBerjamaah : 'tidak'
            },
            almatsurat: {
              status: (r.almatsurat === 'lengkap' || r.almatsurat === 'pagi_petang' || r.almatsurat === 'pagi_saja' || r.almatsurat === 'petang_saja') 
                ? (r.almatsurat === 'pagi_petang' ? 'lengkap' : r.almatsurat as any) 
                : 'tidak',
              jenis: 'sughro'
            },
            puasaSunah: {
              dikerjakan: r.puasaSunah !== 'Tidak' && r.puasaSunah !== false && !!r.puasaSunah,
              jenisPuasa: (r.puasaSunah && r.puasaSunah !== 'Tidak' && r.puasaSunah !== 'Ya') ? r.puasaSunah : undefined
            }
          },
          aspekFikriah: {
            membacaMateriKkp: {
              dikerjakan: r.materiKkpStatus === 'Ya' || r.materiKkpStatus === true,
              judulMateri: r.materiKkpJudul || undefined,
              durasiMenit: parseInt(r.materiKkpDurasi, 10) || 15
            },
            hafalanSuratKkp: {
              dikerjakan: r.hafalanKkpStatus === 'Ya' || r.hafalanKkpStatus === true,
              jenis: 'ziyadah',
              namaSuratAyat: r.hafalanKkpSurat || undefined,
              tingkatKelancaran: (r.hafalanKkpKelancaran as any) || 'lancar'
            }
          },
          aspekJasadiah: {
            olahraga: {
              dikerjakan: r.olahragaStatus === 'Ya' || r.olahragaStatus === true,
              jenisOlahraga: r.olahragaJenis || undefined,
              durasiMenit: parseInt(r.olahragaDurasi, 10) || 20
            }
          },
          skorRuhiah: Number(r.skorRuhiah) || 0,
          skorFikriah: Number(r.skorFikriah) || 0,
          skorJasadiah: Number(r.skorJasadiah) || 0,
          skorTotal: Number(r.skorTotal) || 0,
          catatanHarian: r.catatanHarian || undefined,
          updatedAt: r.updatedAt || new Date().toISOString()
        };
      });

      // Merge remote records with local records
      const mergedMap = new Map<string, MutabaahRecord>();
      localRecords.forEach(r => mergedMap.set(`${r.nia}-${r.tanggal}`, r));
      parsedRecords.forEach(r => mergedMap.set(`${r.nia}-${r.tanggal}`, r));

      const mergedList = Array.from(mergedMap.values());
      StorageService.saveRecords(mergedList);

      if (!silent) {
        this.notify({
          status: 'success',
          message: `Berhasil menarik ${parsedRecords.length} catatan mutabaah real-time!`,
          timestamp: new Date().toISOString(),
          action: 'fetchRecords'
        });
      }

      this.triggerDataRefreshed();

      return {
        success: true,
        recordsCount: parsedRecords.length,
        message: `Berhasil memperbarui ${parsedRecords.length} catatan mutabaah dari Google Sheets.`
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal membaca rekap mutabaah' };
    }
  }

  /**
   * Pull all real-time data: Sheet3 (members) AND Rekap_Mutabaah (records)
   */
  public async fetchAllRealtime(silent = false): Promise<{
    success: boolean;
    membersCount?: number;
    recordsCount?: number;
    message: string;
  }> {
    const url = this.getScriptUrl();
    if (!url) return { success: false, message: 'URL belum dikonfigurasi' };

    if (!silent) {
      this.notify({
        status: 'syncing',
        message: 'Menarik seluruh data real-time dari Google Sheet (Sheet3 & Rekap)...',
        timestamp: new Date().toISOString(),
        action: 'fetchAll'
      });
    }

    try {
      // 1. Fetch Members
      const membersRes = await this.fetchMembersFromSheet3(true);
      // 2. Fetch Records
      const recordsRes = await this.fetchRecordsFromSheet(true);

      this.setLastSyncTime();

      if (!silent) {
        this.notify({
          status: 'success',
          message: `Sinkronisasi real-time berhasil! (${membersRes.membersCount || 0} Anggota Sheet3, ${recordsRes.recordsCount || 0} Isian Rekap)`,
          timestamp: new Date().toISOString(),
          action: 'fetchAll'
        });
      }

      this.triggerDataRefreshed();

      return {
        success: true,
        membersCount: membersRes.membersCount,
        recordsCount: recordsRes.recordsCount,
        message: 'Seluruh data Google Sheet berhasil diperbarui secara real-time.'
      };
    } catch (err: any) {
      if (!silent) {
        this.notify({
          status: 'error',
          message: `Gagal sinkron real-time: ${err?.message}`,
          timestamp: new Date().toISOString(),
          action: 'fetchAll'
        });
      }
      return { success: false, message: err?.message || 'Gagal sinkronisasi' };
    }
  }

  /**
   * Fetch members directly from a Google Spreadsheet link or ID using Sheet3 CSV endpoint
   * (Works instantly if the sheet link sharing is set to "Anyone with the link can view")
   */
  public async fetchMembersFromSpreadsheetUrl(urlOrId: string): Promise<{
    success: boolean;
    membersCount?: number;
    message: string;
    users?: User[];
  }> {
    const trimmed = urlOrId.trim();
    if (!trimmed) {
      return { success: false, message: 'Masukkan URL Google Spreadsheet atau Spreadsheet ID.' };
    }

    let sheetId = trimmed;
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      sheetId = match[1];
    }

    this.notify({
      status: 'syncing',
      message: "Mengambil data Sheet3 dari Google Spreadsheet...",
      timestamp: new Date().toISOString(),
      action: 'fetchMembers'
    });

    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Sheet3&t=${Date.now()}`;
      const response = await fetch(csvUrl);

      if (!response.ok) {
        throw new Error(`Gagal mengakses spreadsheet (${response.status}). Pastikan hak akses Spreadsheet disetel ke "Siapa saja yang memiliki link dapat melihat".`);
      }

      const csvText = await response.text();
      return this.importMembersFromRawText(csvText);
    } catch (err: any) {
      const errorMsg = err?.message || 'Gagal membaca tab Sheet3 dari Google Spreadsheet';
      this.notify({
        status: 'error',
        message: `Error Sheet3: ${errorMsg}`,
        timestamp: new Date().toISOString(),
        action: 'fetchMembers'
      });
      return { success: false, message: errorMsg };
    }
  }

  /**
   * Parse and import members directly from raw text (CSV, TSV, or copied directly from Sheet3)
   */
  public importMembersFromRawText(rawText: string): {
    success: boolean;
    membersCount?: number;
    message: string;
    users?: User[];
  } {
    try {
      const clean = rawText.trim();
      if (!clean) {
        return { success: false, message: 'Data teks Sheet3 masih kosong.' };
      }

      const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) {
        return { success: false, message: 'Tidak ada baris data yang ditemukan.' };
      }

      const firstLine = lines[0];
      let delimiter = '\t';
      if (firstLine.includes('\t')) {
        delimiter = '\t';
      } else if (firstLine.includes(',')) {
        delimiter = ',';
      } else if (firstLine.includes(';')) {
        delimiter = ';';
      }

      const parseLine = (line: string): string[] => {
        if (delimiter === '\t') {
          return line.split('\t').map(c => c.trim().replace(/^["']|["']$/g, ''));
        }
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delimiter && !inQuotes) {
            result.push(cur.trim().replace(/^["']|["']$/g, ''));
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim().replace(/^["']|["']$/g, ''));
        return result;
      };

      const parsedRows = lines.map(parseLine).filter(r => r.length > 0 && r.some(c => c.length > 0));
      if (parsedRows.length === 0) {
        return { success: false, message: 'Tidak dapat mengurai data baris Sheet3.' };
      }

      const headerCandidates = parsedRows[0].map(c => c.toLowerCase());
      const hasHeader = headerCandidates.some(c => 
        c.includes('nia') || 
        c.includes('nomor induk') || 
        c.includes('nama') || 
        c.includes('grup') || 
        c.includes('usrah') || 
        c.includes('password') || 
        c.includes('sandi')
      );

      const dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;
      const colMap = {
        nia: 0,
        grup: 1,
        password: 2,
        nama: 3,
        jk: 4,
        nohp: 5
      };

      if (hasHeader) {
        const h = headerCandidates;
        const findCol = (terms: string[]) => h.findIndex(col => terms.some(t => col.includes(t)));
        const niaIdx = findCol(['nia', 'nomor induk', 'induk', 'id']);
        const grupIdx = findCol(['grup', 'usrah', 'halaqah', 'kelompok']);
        const passIdx = findCol(['password', 'sandi', 'pass']);
        const namaIdx = findCol(['nama', 'name']);
        const jkIdx = findCol(['jenis kelamin', 'kelamin', 'gender', 'jk']);
        const hpIdx = findCol(['hp', 'whatsapp', 'wa', 'telepon', 'telp']);

        if (niaIdx !== -1) colMap.nia = niaIdx;
        if (grupIdx !== -1) colMap.grup = grupIdx;
        if (passIdx !== -1) colMap.password = passIdx;
        if (namaIdx !== -1) colMap.nama = namaIdx;
        if (jkIdx !== -1) colMap.jk = jkIdx;
        if (hpIdx !== -1) colMap.nohp = hpIdx;
      }

      const existingUsers = StorageService.getUsers();
      const adminUsers = existingUsers.filter(u => u.role === 'admin');

      const convertedUsers: User[] = [];
      dataRows.forEach((cols, idx) => {
        const rawNia = cols[colMap.nia] || '';
        const rawNama = cols[colMap.nama] || '';
        const rawGrup = cols[colMap.grup] || '';
        const rawPass = cols[colMap.password] || '';
        const rawJk = (cols[colMap.jk] || '').toLowerCase();
        const rawHp = cols[colMap.nohp] || '';

        if (!rawNia && !rawNama) return;

        const nia = rawNia || `NIA-${Date.now()}-${idx + 1}`;
        const namaLengkap = rawNama || `Anggota ${idx + 1}`;
        const kodeGrup = rawGrup || 'USRAH-ALFALAH';
        const password = rawPass || '123';
        const jenisKelamin = (rawJk.includes('perempuan') || rawJk.includes('akhwat') || rawJk.startsWith('p')) ? 'Perempuan' : 'Laki-laki';

        const existing = existingUsers.find(u => u.nia.toLowerCase() === nia.toLowerCase());

        convertedUsers.push({
          id: existing?.id || `user-sheet3-${Date.now()}-${idx + 1}`,
          nia,
          namaLengkap,
          kodeGrup,
          password,
          jenisKelamin,
          role: 'anggota',
          noHp: rawHp || undefined,
          createdAt: existing?.createdAt || new Date().toISOString()
        });
      });

      if (convertedUsers.length === 0) {
        return { success: false, message: 'Tidak ada baris data anggota yang valid ditemukan di Sheet3.' };
      }

      const finalUserList = [...adminUsers, ...convertedUsers];
      StorageService.saveUsers(finalUserList);
      this.setLastSyncTime();

      this.notify({
        status: 'success',
        message: `Berhasil memuat ${convertedUsers.length} anggota dari data Sheet3!`,
        timestamp: new Date().toISOString(),
        action: 'fetchMembers'
      });

      this.triggerDataRefreshed();

      return {
        success: true,
        membersCount: convertedUsers.length,
        message: `Berhasil menyimpan ${convertedUsers.length} data anggota dari Sheet3.`,
        users: finalUserList
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal memproses data Sheet3' };
    }
  }

  /**
   * Realtime Sync: Saves or updates a mutabaah record to Google Sheets in real-time
   */
  public async syncRecordRealtime(record: MutabaahRecord): Promise<{ success: boolean; message: string }> {
    const url = this.getScriptUrl();
    if (!url || !this.isAutoSyncEnabled()) {
      return { success: true, message: 'Tersimpan lokal (Google Sheets Sync belum diaktifkan)' };
    }

    this.notify({
      status: 'syncing',
      message: `Mengirim isian ${record.namaLengkap} (${record.tanggal}) ke Google Sheets...`,
      timestamp: new Date().toISOString(),
      action: 'saveRecord'
    });

    try {
      const payload = {
        action: 'saveRecord',
        targetSheet: 'Rekap_Mutabaah',
        record: {
          id: record.id,
          tanggal: record.tanggal,
          nia: record.nia,
          namaLengkap: record.namaLengkap,
          kodeGrup: record.kodeGrup,
          jenisKelamin: record.jenisKelamin,
          isUdzurSyari: record.isUdzurSyari ? 'Ya' : 'Tidak',
          // Ruhiah
          tilawahStatus: record.aspekRuhiah.tilawah.dikerjakan ? 'Ya' : 'Tidak',
          tilawahCapaian: record.aspekRuhiah.tilawah.dikerjakan 
            ? `${record.aspekRuhiah.tilawah.jumlah} ${record.aspekRuhiah.tilawah.satuan}` 
            : '0',
          tilawahSurat: record.aspekRuhiah.tilawah.suratAyat || '-',
          qiamulailStatus: record.aspekRuhiah.sholatQiamulail.dikerjakan ? 'Ya' : 'Tidak',
          qiamulailRakaat: record.aspekRuhiah.sholatQiamulail.dikerjakan ? record.aspekRuhiah.sholatQiamulail.rakaat : 0,
          subuhBerjamaah: record.aspekRuhiah.sholatSubuhBerjamaahMasjid.status,
          almatsurat: record.aspekRuhiah.almatsurat.status,
          puasaSunah: record.aspekRuhiah.puasaSunah.dikerjakan 
            ? (record.aspekRuhiah.puasaSunah.jenisPuasa || 'Ya') 
            : 'Tidak',
          // Fikriah
          materiKkpStatus: record.aspekFikriah.membacaMateriKkp.dikerjakan ? 'Ya' : 'Tidak',
          materiKkpJudul: record.aspekFikriah.membacaMateriKkp.judulMateri || '-',
          materiKkpDurasi: record.aspekFikriah.membacaMateriKkp.durasiMenit || 0,
          hafalanKkpStatus: record.aspekFikriah.hafalanSuratKkp.dikerjakan ? 'Ya' : 'Tidak',
          hafalanKkpSurat: record.aspekFikriah.hafalanSuratKkp.namaSuratAyat || '-',
          hafalanKkpKelancaran: record.aspekFikriah.hafalanSuratKkp.tingkatKelancaran || '-',
          // Jasadiah
          olahragaStatus: record.aspekJasadiah.olahraga.dikerjakan ? 'Ya' : 'Tidak',
          olahragaJenis: record.aspekJasadiah.olahraga.jenisOlahraga || '-',
          olahragaDurasi: record.aspekJasadiah.olahraga.durasiMenit || 0,
          // Scores
          skorRuhiah: record.skorRuhiah,
          skorFikriah: record.skorFikriah,
          skorJasadiah: record.skorJasadiah,
          skorTotal: record.skorTotal,
          catatanHarian: record.catatanHarian || '-',
          updatedAt: record.updatedAt || new Date().toISOString()
        }
      };

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      this.setLastSyncTime();
      this.notify({
        status: 'success',
        message: `Tersinkronkan ke Google Sheets secara real-time! (${record.tanggal})`,
        timestamp: new Date().toISOString(),
        action: 'saveRecord'
      });

      return { success: true, message: 'Tersinkronkan ke Google Sheets secara real-time' };
    } catch (err: any) {
      console.warn('Realtime sync warning (saved locally):', err);
      this.notify({
        status: 'error',
        message: `Gagal sinkron real-time: ${err?.message || 'Koneksi terputus'}. Data tetap aman di penyimpanan lokal.`,
        timestamp: new Date().toISOString(),
        action: 'saveRecord'
      });
      return { success: false, message: err?.message || 'Gagal sinkronisasi' };
    }
  }

  /**
   * Delete a record in Google Sheets 'Rekap_Mutabaah' in real-time
   */
  public async deleteRecordRealtime(recordId: string, tanggal?: string, nia?: string): Promise<{ success: boolean; message: string }> {
    const url = this.getScriptUrl();
    if (!url || !this.isAutoSyncEnabled()) return { success: true, message: 'Tersimpan lokal' };

    try {
      const payload = {
        action: 'deleteRecord',
        targetSheet: 'Rekap_Mutabaah',
        record: {
          id: recordId,
          tanggal: tanggal || '',
          nia: nia || ''
        }
      };

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      this.notify({
        status: 'success',
        message: `Catatan mutabaah dihapus dari Google Sheets secara real-time.`,
        timestamp: new Date().toISOString(),
        action: 'deleteRecord'
      });

      return { success: true, message: 'Berhasil dihapus dari Google Sheets' };
    } catch (err: any) {
      console.warn('Delete record realtime error:', err);
      return { success: false, message: err?.message || 'Gagal menghapus di remote' };
    }
  }

  /**
   * Sync a new member to Google Sheet 'Sheet3'
   */
  public async syncMemberToSheet3(user: User): Promise<{ success: boolean; message: string }> {
    const url = this.getScriptUrl();
    if (!url || !this.isAutoSyncEnabled()) return { success: true, message: 'Tersimpan lokal' };

    try {
      const payload = {
        action: 'addMember',
        sheet: 'Sheet3',
        member: {
          nia: user.nia,
          namaLengkap: user.namaLengkap,
          kodeGrup: user.kodeGrup,
          password: user.password || '123',
          jenisKelamin: user.jenisKelamin,
          noHp: user.noHp || ''
        }
      };

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      return { success: true, message: "Anggota baru tersinkronkan ke 'Sheet3'" };
    } catch (err: any) {
      console.warn('Sync member error:', err);
      return { success: false, message: err?.message || 'Gagal sinkron anggota' };
    }
  }

  /**
   * Update an existing member in Google Sheet 'Sheet3'
   */
  public async updateMemberInSheet3(user: User): Promise<{ success: boolean; message: string }> {
    const url = this.getScriptUrl();
    if (!url || !this.isAutoSyncEnabled()) return { success: true, message: 'Tersimpan lokal' };

    try {
      const payload = {
        action: 'updateMember',
        sheet: 'Sheet3',
        member: {
          nia: user.nia,
          namaLengkap: user.namaLengkap,
          kodeGrup: user.kodeGrup,
          password: user.password || '123',
          jenisKelamin: user.jenisKelamin,
          noHp: user.noHp || ''
        }
      };

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      return { success: true, message: "Pembaruan anggota tersinkronkan ke 'Sheet3'" };
    } catch (err: any) {
      console.warn('Update member in Sheet3 error:', err);
      return { success: false, message: err?.message || 'Gagal memperbarui anggota di Sheet3' };
    }
  }

  /**
   * Delete a member in Google Sheet 'Sheet3'
   */
  public async deleteMemberFromSheet3(nia: string): Promise<{ success: boolean; message: string }> {
    const url = this.getScriptUrl();
    if (!url || !this.isAutoSyncEnabled()) return { success: true, message: 'Tersimpan lokal' };

    try {
      const payload = {
        action: 'deleteMember',
        sheet: 'Sheet3',
        nia
      };

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      return { success: true, message: "Anggota dihapus dari 'Sheet3'" };
    } catch (err: any) {
      console.warn('Delete member from Sheet3 error:', err);
      return { success: false, message: err?.message || 'Gagal menghapus anggota dari Sheet3' };
    }
  }

  /**
   * Batch push all records from local to Google Sheets
   */
  public async batchSyncAllRecords(): Promise<{ success: boolean; message: string; count?: number }> {
    const url = this.getScriptUrl();
    if (!url) {
      return { success: false, message: 'URL Google Apps Script belum diisi.' };
    }

    const records = StorageService.getRecords();
    if (records.length === 0) {
      return { success: true, message: 'Tidak ada catatan untuk dikirim.', count: 0 };
    }

    this.notify({
      status: 'syncing',
      message: `Mengirim ${records.length} catatan mutabaah ke Google Sheets...`,
      timestamp: new Date().toISOString(),
      action: 'batchSync'
    });

    try {
      const payload = {
        action: 'batchSync',
        targetSheet: 'Rekap_Mutabaah',
        records: records.map(record => ({
          id: record.id,
          tanggal: record.tanggal,
          nia: record.nia,
          namaLengkap: record.namaLengkap,
          kodeGrup: record.kodeGrup,
          jenisKelamin: record.jenisKelamin,
          isUdzurSyari: record.isUdzurSyari ? 'Ya' : 'Tidak',
          tilawahStatus: record.aspekRuhiah.tilawah.dikerjakan ? 'Ya' : 'Tidak',
          tilawahCapaian: record.aspekRuhiah.tilawah.dikerjakan 
            ? `${record.aspekRuhiah.tilawah.jumlah} ${record.aspekRuhiah.tilawah.satuan}` 
            : '0',
          tilawahSurat: record.aspekRuhiah.tilawah.suratAyat || '-',
          qiamulailStatus: record.aspekRuhiah.sholatQiamulail.dikerjakan ? 'Ya' : 'Tidak',
          qiamulailRakaat: record.aspekRuhiah.sholatQiamulail.dikerjakan ? record.aspekRuhiah.sholatQiamulail.rakaat : 0,
          subuhBerjamaah: record.aspekRuhiah.sholatSubuhBerjamaahMasjid.status,
          almatsurat: record.aspekRuhiah.almatsurat.status,
          puasaSunah: record.aspekRuhiah.puasaSunah.dikerjakan ? (record.aspekRuhiah.puasaSunah.jenisPuasa || 'Ya') : 'Tidak',
          materiKkpStatus: record.aspekFikriah.membacaMateriKkp.dikerjakan ? 'Ya' : 'Tidak',
          materiKkpJudul: record.aspekFikriah.membacaMateriKkp.judulMateri || '-',
          materiKkpDurasi: record.aspekFikriah.membacaMateriKkp.durasiMenit || 0,
          hafalanKkpStatus: record.aspekFikriah.hafalanSuratKkp.dikerjakan ? 'Ya' : 'Tidak',
          hafalanKkpSurat: record.aspekFikriah.hafalanSuratKkp.namaSuratAyat || '-',
          hafalanKkpKelancaran: record.aspekFikriah.hafalanSuratKkp.tingkatKelancaran || '-',
          olahragaStatus: record.aspekJasadiah.olahraga.dikerjakan ? 'Ya' : 'Tidak',
          olahragaJenis: record.aspekJasadiah.olahraga.jenisOlahraga || '-',
          olahragaDurasi: record.aspekJasadiah.olahraga.durasiMenit || 0,
          skorRuhiah: record.skorRuhiah,
          skorFikriah: record.skorFikriah,
          skorJasadiah: record.skorJasadiah,
          skorTotal: record.skorTotal,
          catatanHarian: record.catatanHarian || '-',
          updatedAt: record.updatedAt || new Date().toISOString()
        }))
      };

      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      this.setLastSyncTime();
      this.notify({
        status: 'success',
        message: `Seluruh (${records.length}) rekap mutabaah berhasil disinkronkan ke Google Sheets!`,
        timestamp: new Date().toISOString(),
        action: 'batchSync'
      });

      return {
        success: true,
        message: `Berhasil mengekspor ${records.length} data ke Google Sheets.`,
        count: records.length
      };
    } catch (err: any) {
      this.notify({
        status: 'error',
        message: `Gagal kirim batch: ${err?.message || 'Koneksi gagal'}`,
        timestamp: new Date().toISOString(),
        action: 'batchSync'
      });
      return { success: false, message: err?.message || 'Gagal kirim data' };
    }
  }

  /**
   * Ready-to-copy Google Apps Script Code (Code.gs)
   */
  public getScriptTemplateCode(): string {
    return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: SINKRONISASI REAL-TIME MUTABAAH YAUMIAH KE GOOGLE SHEETS
 * Mendukung 'Sheet3' (Data Anggota: NIA, Kode Grup, Password, Nama Lengkap)
 * dan 'Rekap_Mutabaah' (Data Isian Harian Real-time Dua Arah)
 * =========================================================================
 * 
 * CARA PEMASANGAN MUDAH (1 MENIT):
 * 1. Buka Google Spreadsheet Anda.
 * 2. Di menu atas, klik 'Extensions' (Ekstensi) > 'Apps Script'.
 * 3. Hapus semua kode default, lalu tempel SELURUH KODE INI ke editor 'Code.gs'.
 * 4. Klik tombol 'Save' (ikon disket).
 * 5. Klik tombol biru 'Deploy' (Terapkan) di kanan atas > 'New deployment' (Penerapan Baru).
 * 6. Pilih tipe: 'Web app' (Aplikasi Web).
 * 7. Konfigurasi penting:
 *    - Description: Mutabaah Yaumiah Realtime Sync
 *    - Execute as: Me (email Anda)
 *    - Who has access: Anyone (Siapa saja)  <-- WAJIB PILIH INI!
 * 8. Klik 'Deploy', izinkan akses akun Google Anda jika diminta.
 * 9. Salin 'Web app URL' (akhiran /exec) dan tempelkan ke aplikasi Mutabaah!
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAll';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Tes Koneksi
  if (action === 'test') {
    return createJsonResponse({
      status: 'success',
      message: 'Koneksi Google Apps Script berhasil terhubung ke Spreadsheet: ' + ss.getName()
    });
  }

  // 2. Tarik Data Anggota dari Sheet3
  if (action === 'getMembers') {
    var members = getMembersFromSheet3(ss);
    return createJsonResponse({
      status: 'success',
      count: members.length,
      members: members
    });
  }

  // 3. Tarik Data Rekap Mutabaah
  if (action === 'getRecords') {
    var records = getRecordsFromSheet(ss);
    return createJsonResponse({
      status: 'success',
      count: records.length,
      records: records
    });
  }

  // 4. Tarik Semua Data (Sheet3 + Rekap) Sekaligus Secara Real-time
  if (action === 'getAll') {
    var allMembers = getMembersFromSheet3(ss);
    var allRecords = getRecordsFromSheet(ss);
    return createJsonResponse({
      status: 'success',
      membersCount: allMembers.length,
      recordsCount: allRecords.length,
      members: allMembers,
      records: allRecords
    });
  }

  return createJsonResponse({ status: 'error', message: 'Aksi GET tidak dikenali: ' + action });
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var payload = JSON.parse(contents);
    var action = payload.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Simpan / Perbarui Isian Mutabaah Real-Time
    if (action === 'saveRecord') {
      var rekapSheet = getOrCreateRekapSheet(ss);
      var r = payload.record;
      var syncTime = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

      var rowValues = [
        syncTime,
        r.tanggal,
        r.nia,
        r.namaLengkap,
        r.kodeGrup,
        r.jenisKelamin,
        r.isUdzurSyari || 'Tidak',
        r.tilawahStatus,
        r.tilawahCapaian,
        r.tilawahSurat || '-',
        r.qiamulailStatus,
        r.qiamulailRakaat || 0,
        r.subuhBerjamaah,
        r.almatsurat,
        r.puasaSunah,
        r.materiKkpStatus,
        r.materiKkpJudul || '-',
        r.materiKkpDurasi || 0,
        r.hafalanKkpStatus,
        r.hafalanKkpSurat || '-',
        r.hafalanKkpKelancaran || '-',
        r.olahragaStatus,
        r.olahragaJenis || '-',
        r.olahragaDurasi || 0,
        r.skorRuhiah,
        r.skorFikriah,
        r.skorJasadiah,
        r.skorTotal,
        r.catatanHarian || '-'
      ];

      // Cek apakah tanggal + NIA sudah ada di sheet (untuk update baris)
      var data = rekapSheet.getDataRange().getValues();
      var targetRow = -1;

      for (var i = 1; i < data.length; i++) {
        var tgl = String(data[i][1]).trim();
        var nia = String(data[i][2]).trim();
        if (tgl === String(r.tanggal).trim() && nia.toLowerCase() === String(r.nia).trim().toLowerCase()) {
          targetRow = i + 1;
          break;
        }
      }

      if (targetRow > 0) {
        rekapSheet.getRange(targetRow, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        rekapSheet.appendRow(rowValues);
      }

      return createJsonResponse({
        status: 'success',
        message: 'Isian mutabaah ' + r.namaLengkap + ' (' + r.tanggal + ') tersimpan real-time.'
      });
    }

    // 2. Hapus Catatan Mutabaah Real-Time
    if (action === 'deleteRecord') {
      var rekapSheetDel = ss.getSheetByName('Rekap_Mutabaah');
      if (rekapSheetDel) {
        var rec = payload.record || {};
        var dataDel = rekapSheetDel.getDataRange().getValues();
        for (var d = 1; d < dataDel.length; d++) {
          var tglDel = String(dataDel[d][1]).trim();
          var niaDel = String(dataDel[d][2]).trim();
          if (tglDel === String(rec.tanggal).trim() && niaDel.toLowerCase() === String(rec.nia).trim().toLowerCase()) {
            rekapSheetDel.deleteRow(d + 1);
            break;
          }
        }
      }
      return createJsonResponse({ status: 'success', message: 'Catatan mutabaah berhasil dihapus' });
    }

    // 3. Batch Sync Banyak Record
    if (action === 'batchSync' && Array.isArray(payload.records)) {
      var rekapSheetBatch = getOrCreateRekapSheet(ss);
      var records = payload.records;
      var syncTimeB = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

      for (var k = 0; k < records.length; k++) {
        var rb = records[k];
        rekapSheetBatch.appendRow([
          syncTimeB,
          rb.tanggal,
          rb.nia,
          rb.namaLengkap,
          rb.kodeGrup,
          rb.jenisKelamin,
          rb.isUdzurSyari || 'Tidak',
          rb.tilawahStatus,
          rb.tilawahCapaian,
          rb.tilawahSurat || '-',
          rb.qiamulailStatus,
          rb.qiamulailRakaat || 0,
          rb.subuhBerjamaah,
          rb.almatsurat,
          rb.puasaSunah,
          rb.materiKkpStatus,
          rb.materiKkpJudul || '-',
          rb.materiKkpDurasi || 0,
          rb.hafalanKkpStatus,
          rb.hafalanKkpSurat || '-',
          rb.hafalanKkpKelancaran || '-',
          rb.olahragaStatus,
          rb.olahragaJenis || '-',
          rb.olahragaDurasi || 0,
          rb.skorRuhiah,
          rb.skorFikriah,
          rb.skorJasadiah,
          rb.skorTotal,
          rb.catatanHarian || '-'
        ]);
      }

      return createJsonResponse({
        status: 'success',
        message: 'Berhasil batch sync ' + records.length + ' catatan.'
      });
    }

    // 4. Tambah Anggota Baru ke Sheet3
    if (action === 'addMember') {
      var memberSheet = getOrCreateSheet3(ss);
      var m = payload.member;
      memberSheet.appendRow([
        m.nia,
        m.kodeGrup,
        m.password,
        m.namaLengkap,
        m.jenisKelamin,
        m.noHp || ''
      ]);
      return createJsonResponse({ status: 'success', message: 'Anggota berhasil ditambahkan ke Sheet3' });
    }

    // 5. Update Anggota di Sheet3
    if (action === 'updateMember') {
      var sheet3Upd = getOrCreateSheet3(ss);
      var mu = payload.member;
      var data3 = sheet3Upd.getDataRange().getValues();
      var foundRow = -1;
      for (var u = 1; u < data3.length; u++) {
        if (String(data3[u][0]).trim().toLowerCase() === String(mu.nia).trim().toLowerCase()) {
          foundRow = u + 1;
          break;
        }
      }
      if (foundRow > 0) {
        sheet3Upd.getRange(foundRow, 1, 1, 6).setValues([[
          mu.nia,
          mu.kodeGrup,
          mu.password,
          mu.namaLengkap,
          mu.jenisKelamin,
          mu.noHp || ''
        ]]);
      }
      return createJsonResponse({ status: 'success', message: 'Data anggota di Sheet3 diperbarui' });
    }

    // 6. Hapus Anggota di Sheet3
    if (action === 'deleteMember') {
      var sheet3Del = getOrCreateSheet3(ss);
      var delNia = String(payload.nia || '').trim().toLowerCase();
      var data3Del = sheet3Del.getDataRange().getValues();
      for (var dm = 1; dm < data3Del.length; dm++) {
        if (String(data3Del[dm][0]).trim().toLowerCase() === delNia) {
          sheet3Del.deleteRow(dm + 1);
          break;
        }
      }
      return createJsonResponse({ status: 'success', message: 'Anggota dihapus dari Sheet3' });
    }

    return createJsonResponse({ status: 'error', message: 'Aksi POST tidak didukung: ' + action });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

// Helper: Ambil data anggota dari Sheet3
function getMembersFromSheet3(ss) {
  var sheet = getOrCreateSheet3(ss);
  var data = sheet.getDataRange().getValues();
  var members = [];

  // Jika baris masih kosong / hanya ada header, kembalikan array kosong (tanpa akun demo)
  if (data.length <= 1) {
    return [];
  }

  var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
  var colNia = findColumnIndex(headers, ['nia', 'nomor induk', 'nomor induk anggota']);
  var colGrup = findColumnIndex(headers, ['kode grup', 'usrah', 'grup', 'kode grup / usrah']);
  var colPass = findColumnIndex(headers, ['password', 'sandi', 'pass']);
  var colNama = findColumnIndex(headers, ['nama lengkap', 'nama', 'name']);
  var colJk = findColumnIndex(headers, ['jenis kelamin', 'gender', 'jk']);
  var colHp = findColumnIndex(headers, ['no hp', 'hp', 'whatsapp', 'no. hp']);

  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var nia = String(row[colNia !== -1 ? colNia : 0] || '').trim();
    if (!nia) continue;

    members.push({
      nia: nia,
      kodeGrup: String(row[colGrup !== -1 ? colGrup : 1] || 'USRAH-ALFALAH').trim(),
      password: String(row[colPass !== -1 ? colPass : 2] || '123').trim(),
      namaLengkap: String(row[colNama !== -1 ? colNama : 3] || 'Anggota').trim(),
      jenisKelamin: String(row[colJk !== -1 ? colJk : 4] || 'Laki-laki').trim(),
      noHp: String(row[colHp !== -1 ? colHp : 5] || '').trim()
    });
  }
  return members;
}

// Helper: Ambil data mutabaah dari Rekap_Mutabaah
function getRecordsFromSheet(ss) {
  var sheet = ss.getSheetByName('Rekap_Mutabaah');
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var records = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var tgl = String(row[1] || '').trim();
    var nia = String(row[2] || '').trim();
    if (!tgl || !nia) continue;

    records.push({
      tanggal: tgl,
      nia: nia,
      namaLengkap: String(row[3] || '').trim(),
      kodeGrup: String(row[4] || '').trim(),
      jenisKelamin: String(row[5] || 'Laki-laki').trim(),
      isUdzurSyari: String(row[6] || '').trim() === 'Ya',
      tilawahStatus: String(row[7] || '').trim(),
      tilawahCapaian: String(row[8] || '').trim(),
      tilawahSurat: String(row[9] || '').trim(),
      qiamulailStatus: String(row[10] || '').trim(),
      qiamulailRakaat: row[11] || 0,
      subuhBerjamaah: String(row[12] || '').trim(),
      almatsurat: String(row[13] || '').trim(),
      puasaSunah: String(row[14] || '').trim(),
      materiKkpStatus: String(row[15] || '').trim(),
      materiKkpJudul: String(row[16] || '').trim(),
      materiKkpDurasi: row[17] || 0,
      hafalanKkpStatus: String(row[18] || '').trim(),
      hafalanKkpSurat: String(row[19] || '').trim(),
      hafalanKkpKelancaran: String(row[20] || '').trim(),
      olahragaStatus: String(row[21] || '').trim(),
      olahragaJenis: String(row[22] || '').trim(),
      olahragaDurasi: row[23] || 0,
      skorRuhiah: Number(row[24]) || 0,
      skorFikriah: Number(row[25]) || 0,
      skorJasadiah: Number(row[26]) || 0,
      skorTotal: Number(row[27]) || 0,
      catatanHarian: String(row[28] || '').trim()
    });
  }
  return records;
}

function getOrCreateSheet3(ss) {
  var sheet = ss.getSheetByName('Sheet3');
  if (!sheet) {
    sheet = ss.insertSheet('Sheet3');
    var headers = [
      'Nomor Induk Anggota (NIA)',
      'Kode Grup / Usrah',
      'Password',
      'Nama Lengkap',
      'Jenis Kelamin',
      'No HP'
    ];
    sheet.appendRow(headers);
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setBackground('#065f46');
    range.setFontColor('#ffffff');
    range.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateRekapSheet(ss) {
  var sheet = ss.getSheetByName('Rekap_Mutabaah');
  if (!sheet) {
    sheet = ss.insertSheet('Rekap_Mutabaah');
    var headers = [
      'Waktu Sync',
      'Tanggal Mutabaah',
      'NIA',
      'Nama Lengkap',
      'Kode Grup / Usrah',
      'Jenis Kelamin',
      'Udzur Syar\\'i',
      'Tilawah (Ya/Tidak)',
      'Capaian Tilawah',
      'Surat / Ayat Tilawah',
      'Qiamulail',
      'Rakaat Qiamulail',
      'Subuh Berjamaah Masjid',
      'Al-Ma\\'tsurat',
      'Puasa Sunah',
      'Materi KKP',
      'Judul Materi KKP',
      'Durasi KKP (Menit)',
      'Hafalan KKP',
      'Surat Hafalan',
      'Tingkat Kelancaran',
      'Olahraga',
      'Jenis Olahraga',
      'Durasi Olahraga (Menit)',
      'Skor Ruhiah (50)',
      'Skor Fikriah (30)',
      'Skor Jasadiah (20)',
      'TOTAL SKOR (100)',
      'Catatan Harian'
    ];
    sheet.appendRow(headers);
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setBackground('#065f46');
    range.setFontColor('#ffffff');
    range.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findColumnIndex(headers, candidateNames) {
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i];
    for (var j = 0; j < candidateNames.length; j++) {
      if (h.indexOf(candidateNames[j]) !== -1) {
        return i;
      }
    }
  }
  return -1;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
  }
}

export const GoogleSheetsService = new GoogleSheetsManager();

// Wire realtime sync handlers to StorageService
StorageService.setRealtimeSyncHandlers({
  onSaveRecord: (record) => {
    GoogleSheetsService.syncRecordRealtime(record);
  },
  onDeleteRecord: (rec) => {
    GoogleSheetsService.deleteRecordRealtime(rec.id, rec.tanggal, rec.nia);
  },
  onAddUser: (user) => {
    GoogleSheetsService.syncMemberToSheet3(user);
  },
  onUpdateUser: (user) => {
    GoogleSheetsService.updateMemberInSheet3(user);
  },
  onDeleteUser: (user) => {
    GoogleSheetsService.deleteMemberFromSheet3(user.nia);
  }
});
