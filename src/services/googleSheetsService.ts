import { User, MutabaahRecord } from '../types';
import { StorageService } from '../utils/storage';

const GAS_URL_KEY = 'mutabaah_gas_url_v1';
const GAS_AUTO_SYNC_KEY = 'mutabaah_gas_auto_sync_v1';
const GAS_LAST_SYNC_KEY = 'mutabaah_gas_last_sync_v1';

export interface SyncStatusEvent {
  status: 'idle' | 'syncing' | 'success' | 'error';
  message: string;
  timestamp: string;
  action?: 'saveRecord' | 'fetchMembers' | 'batchSync' | 'testConnection';
}

type SyncListener = (event: SyncStatusEvent) => void;

class GoogleSheetsManager {
  private listeners: Set<SyncListener> = new Set();
  private lastStatus: SyncStatusEvent = {
    status: 'idle',
    message: 'Siap terhubung ke Google Sheets',
    timestamp: new Date().toISOString()
  };

  public getScriptUrl(): string {
    return localStorage.getItem(GAS_URL_KEY) || '';
  }

  public setScriptUrl(url: string): void {
    const cleanUrl = url.trim();
    if (cleanUrl) {
      localStorage.setItem(GAS_URL_KEY, cleanUrl);
    } else {
      localStorage.removeItem(GAS_URL_KEY);
    }
    this.notify({
      status: cleanUrl ? 'success' : 'idle',
      message: cleanUrl ? 'URL Google Apps Script diperbarui' : 'URL Google Apps Script dihapus',
      timestamp: new Date().toISOString()
    });
  }

  public isAutoSyncEnabled(): boolean {
    const val = localStorage.getItem(GAS_AUTO_SYNC_KEY);
    return val === null ? true : val === 'true';
  }

  public setAutoSyncEnabled(enabled: boolean): void {
    localStorage.setItem(GAS_AUTO_SYNC_KEY, String(enabled));
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
      // Append timestamp to prevent caching
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
   * Fetch members data directly from Google Sheet 'Sheet3'
   * Expected columns in Sheet3:
   * [Nomor Induk Anggota (NIA), Kode Grup / Usrah, Password, Nama Lengkap, Jenis Kelamin (opsional), No HP (opsional)]
   */
  public async fetchMembersFromSheet3(): Promise<{ 
    success: boolean; 
    membersCount?: number; 
    message: string;
    users?: User[];
  }> {
    const url = this.getScriptUrl();
    if (!url) {
      return { 
        success: false, 
        message: 'URL Google Apps Script belum dikonfigurasi. Masukkan URL Web App terlebih dahulu.' 
      };
    }

    this.notify({
      status: 'syncing',
      message: "Mengambil data anggota dari Google Sheet 'Sheet3'...",
      timestamp: new Date().toISOString(),
      action: 'fetchMembers'
    });

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
        this.notify({
          status: 'success',
          message: "Sheet3 terhubung, tetapi belum ada baris data anggota.",
          timestamp: new Date().toISOString(),
          action: 'fetchMembers'
        });
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

        // Check if existing user exists to preserve their ID
        const existing = existingUsers.find(u => u.nia.toLowerCase() === nia.toLowerCase());

        return {
          id: existing?.id || `user-gas-${idx + 1}-${Date.now()}`,
          nia,
          namaLengkap,
          jenisKelamin,
          kodeGrup,
          role: 'anggota',
          password: password || '123',
          noHp: noHp || undefined,
          createdAt: existing?.createdAt || new Date().toISOString()
        };
      });

      // Preserve admin users so Murabbi login is not lost
      const finalUserList: User[] = [...adminUsers, ...convertedUsers];
      StorageService.saveUsers(finalUserList);
      this.setLastSyncTime();

      this.notify({
        status: 'success',
        message: `Berhasil menyinkronkan ${convertedUsers.length} anggota dari Google Sheet 'Sheet3'!`,
        timestamp: new Date().toISOString(),
        action: 'fetchMembers'
      });

      return {
        success: true,
        membersCount: convertedUsers.length,
        message: `Berhasil memuat ${convertedUsers.length} anggota dari Google Sheet 'Sheet3'.`,
        users: finalUserList
      };

    } catch (err: any) {
      const errorMsg = err?.message || 'Gagal menyinkronkan data anggota dari Google Sheet';
      this.notify({
        status: 'error',
        message: `Error sinkronisasi Sheet3: ${errorMsg}`,
        timestamp: new Date().toISOString(),
        action: 'fetchMembers'
      });
      return { success: false, message: errorMsg };
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

    // Extract Spreadsheet ID
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
      // Fetch CSV of Sheet3 via Google Visualization API
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
   * Supports both explicit headers and ordered positional columns:
   * Col 1: NIA
   * Col 2: Kode Grup / Usrah
   * Col 3: Password
   * Col 4: Nama Lengkap
   * Col 5: Jenis Kelamin (opsional)
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

      // Split into lines
      const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) {
        return { success: false, message: 'Tidak ada baris data yang ditemukan.' };
      }

      // Determine delimiter (tab, comma, or semicolon)
      const firstLine = lines[0];
      let delimiter = '\t';
      if (firstLine.includes('\t')) {
        delimiter = '\t';
      } else if (firstLine.includes(',')) {
        delimiter = ',';
      } else if (firstLine.includes(';')) {
        delimiter = ';';
      }

      // Helper to parse line into tokens
      const parseLine = (line: string): string[] => {
        if (delimiter === '\t') {
          return line.split('\t').map(c => c.trim().replace(/^["']|["']$/g, ''));
        }
        // Basic CSV splitting handling quotes
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

      // Detect if first row is header
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

      let dataRows = hasHeader ? parsedRows.slice(1) : parsedRows;
      let colMap = {
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

        // Only add if at least NIA or Nama is provided
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
   * Realtime Sync: Called whenever a mutabaah record is saved, modified, or deleted in the dashboard
   */
  public async syncRecordRealtime(record: MutabaahRecord): Promise<{ success: boolean; message: string }> {
    const url = this.getScriptUrl();
    if (!url || !this.isAutoSyncEnabled()) {
      // Offline/Local only mode
      return { success: true, message: 'Tersimpan lokal (Google Sheets Sync belum diaktifkan)' };
    }

    this.notify({
      status: 'syncing',
      message: `Mengirim isian ${record.namaLengkap} (${record.tanggal}) ke Google Sheets...`,
      timestamp: new Date().toISOString(),
      action: 'saveRecord'
    });

    try {
      // Flatten record for optimal spreadsheet formatting
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

      // Use text/plain to avoid CORS preflight issues with Google Apps Script Web App
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
   * Sync a new or updated member to Google Sheet 'Sheet3'
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

      return { success: true, message: "Anggota berhasil disinkronkan ke 'Sheet3'" };
    } catch (err: any) {
      console.warn('Sync member error:', err);
      return { success: false, message: err?.message || 'Gagal sinkron anggota' };
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
 * GOOGLE APPS SCRIPT: SINKRONISASI MUTABAAH YAUMIAH KE GOOGLE SHEETS
 * Mendukung 'Sheet3' (Data Anggota: NIA, Kode Grup, Password, Nama Lengkap)
 * dan 'Rekap_Mutabaah' (Data Isian Harian Realtime)
 * =========================================================================
 * 
 * CARA PEMASANGAN (HANYA 1 MENIT):
 * 1. Buka Google Spreadsheet Anda.
 * 2. Di menu atas, klik 'Extensions' (Ekstensi) > 'Apps Script'.
 * 3. Hapus semua kode default, lalu paste SELURUH KODE INI ke editor 'Code.gs'.
 * 4. Klik tombol 'Save' (ikon disket).
 * 5. Klik tombol biru 'Deploy' (Terapkan) di kanan atas > 'New deployment' (Penerapan Baru).
 * 6. Pilih tipe: 'Web app' (Aplikasi Web).
 * 7. Isi:
 *    - Description: Mutabaah Yaumiah Sync
 *    - Execute as: Me (email Anda)
 *    - Who has access: Anyone (Siapa saja)  <-- PENTING!
 * 8. Klik 'Deploy', berikan izin (Authorize access) akun Google Anda.
 * 9. Salin 'Web app URL' (akhiran /exec) dan tempelkan ke aplikasi Mutabaah!
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getMembers';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Tes Koneksi
  if (action === 'test') {
    return createJsonResponse({
      status: 'success',
      message: 'Koneksi Google Apps Script berhasil terhubung ke Spreadsheet: ' + ss.getName()
    });
  }

  // 2. Ambil Data Anggota dari Sheet3
  // Kolom: [Nomor Induk Anggota (NIA), Kode Grup / Usrah, Password, Nama Lengkap, Jenis Kelamin, No HP]
  if (action === 'getMembers') {
    var sheet = getOrCreateSheet(ss, 'Sheet3', [
      'Nomor Induk Anggota (NIA)',
      'Kode Grup / Usrah',
      'Password',
      'Nama Lengkap',
      'Jenis Kelamin',
      'No HP'
    ]);

    var data = sheet.getDataRange().getValues();
    var members = [];

    // Jika baris hanya header, berikan data sample awal di Sheet3
    if (data.length <= 1) {
      var initialData = [
        ['NIA-2024-001', 'USRAH-ALFALAH', '123', 'Ahmad Fauzan Pratama', 'Laki-laki', '081298765431'],
        ['NIA-2024-002', 'USRAH-ANNUR', '123', 'Fathimah Az-Zahra', 'Perempuan', '081298765432'],
        ['NIA-2024-003', 'USRAH-ALFALAH', '123', 'Muhammad Ridwan Syahputra', 'Laki-laki', '081298765433'],
        ['NIA-2024-004', 'USRAH-ANNUR', '123', 'Nurul Hidayah Putri', 'Perempuan', '081298765434'],
        ['NIA-2024-005', 'USRAH-ALIKHLAS', '123', 'Zaid Abdullah Mansur', 'Laki-laki', '081298765435'],
        ['NIA-2024-006', 'USRAH-ALIKHLAS', '123', 'Aisyah Humaira', 'Perempuan', '081298765436']
      ];
      for (var i = 0; i < initialData.length; i++) {
        sheet.appendRow(initialData[i]);
      }
      data = sheet.getDataRange().getValues();
    }

    var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });

    // Petakan indeks kolom secara dinamis
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

    return createJsonResponse({
      status: 'success',
      count: members.length,
      members: members
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

    // Pastikan Sheet Rekap Mutabaah tersedia
    var rekapSheet = getOrCreateSheet(ss, 'Rekap_Mutabaah', [
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
    ]);

    // 1. Simpan / Update Isian Mutabaah Real-Time
    if (action === 'saveRecord') {
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
          targetRow = i + 1; // 1-based index
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
        message: 'Isian mutabaah ' + r.namaLengkap + ' (' + r.tanggal + ') berhasil diperbarui di Google Sheets.'
      });
    }

    // 2. Batch Sync Banyak Record Sekaligus
    if (action === 'batchSync' && Array.isArray(payload.records)) {
      var records = payload.records;
      var syncTime = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

      for (var k = 0; k < records.length; k++) {
        var rec = records[k];
        var rowData = [
          syncTime,
          rec.tanggal,
          rec.nia,
          rec.namaLengkap,
          rec.kodeGrup,
          rec.jenisKelamin,
          rec.isUdzurSyari || 'Tidak',
          rec.tilawahStatus,
          rec.tilawahCapaian,
          rec.tilawahSurat || '-',
          rec.qiamulailStatus,
          rec.qiamulailRakaat || 0,
          rec.subuhBerjamaah,
          rec.almatsurat,
          rec.puasaSunah,
          rec.materiKkpStatus,
          rec.materiKkpJudul || '-',
          rec.materiKkpDurasi || 0,
          rec.hafalanKkpStatus,
          rec.hafalanKkpSurat || '-',
          rec.hafalanKkpKelancaran || '-',
          rec.olahragaStatus,
          rec.olahragaJenis || '-',
          rec.olahragaDurasi || 0,
          rec.skorRuhiah,
          rec.skorFikriah,
          rec.skorJasadiah,
          rec.skorTotal,
          rec.catatanHarian || '-'
        ];
        rekapSheet.appendRow(rowData);
      }

      return createJsonResponse({
        status: 'success',
        message: 'Berhasil menyinkronkan ' + records.length + ' record ke Google Sheets.'
      });
    }

    // 3. Tambah Anggota Baru ke Sheet3
    if (action === 'addMember') {
      var m = payload.member;
      var memberSheet = getOrCreateSheet(ss, 'Sheet3', [
        'Nomor Induk Anggota (NIA)',
        'Kode Grup / Usrah',
        'Password',
        'Nama Lengkap',
        'Jenis Kelamin',
        'No HP'
      ]);

      memberSheet.appendRow([
        m.nia,
        m.kodeGrup,
        m.password,
        m.namaLengkap,
        m.jenisKelamin,
        m.noHp || ''
      ]);

      return createJsonResponse({
        status: 'success',
        message: 'Anggota ' + m.namaLengkap + ' berhasil ditambahkan ke Sheet3'
      });
    }

    return createJsonResponse({ status: 'error', message: 'Aksi POST tidak didukung: ' + action });

  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

// Helper: Cari atau buat sheet beserta header format
function getOrCreateSheet(ss, sheetName, defaultHeaders) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (defaultHeaders && defaultHeaders.length > 0) {
      sheet.appendRow(defaultHeaders);
      var headerRange = sheet.getRange(1, 1, 1, defaultHeaders.length);
      headerRange.setBackground('#065f46'); // Emerald gelap
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

// Helper: Cocokkan nama kolom
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

// Helper: JSON Output
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
  onAddUser: (user) => {
    GoogleSheetsService.syncMemberToSheet3(user);
  }
});

