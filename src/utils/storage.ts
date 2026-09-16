import { User, MutabaahRecord, AspekRuhiah, AspekFikriah, AspekJasadiah } from '../types';

const USERS_STORAGE_KEY = 'mutabaah_users_v1';
const RECORDS_STORAGE_KEY = 'mutabaah_records_v1';
const CURRENT_USER_KEY = 'mutabaah_current_user_v1';

export const DEFAULT_GROUPS = [
  'USRAH-ALFALAH',
  'USRAH-ANNUR',
  'USRAH-ALIKHLAS',
  'HALAQAH-FIRDAUS',
  'HALAQAH-MUJAHID'
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    nia: 'ADM-001',
    namaLengkap: 'Administrator',
    jenisKelamin: 'Laki-laki',
    kodeGrup: 'PUSAT',
    role: 'admin',
    password: 'bkapjakpus',
    noHp: '081234567890',
    createdAt: '2024-01-01T00:00:00.000Z'
  }
];

// Helper to format date YYYY-MM-DD
export function getFormattedDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateScore(
  ruhiah: AspekRuhiah,
  fikriah: AspekFikriah,
  jasadiah: AspekJasadiah,
  isUdzur: boolean = false
): { skorTotal: number; skorRuhiah: number; skorFikriah: number; skorJasadiah: number } {
  let skorRuhiah = 0;
  let skorFikriah = 0;
  let skorJasadiah = 0;

  // 1. Ruhiah (Total 50 pts)
  if (isUdzur) {
    // If akhwat has udzur syar'i, prayer & fasting & tilawah without touch are compensated
    skorRuhiah += 30; // base score for udzur
    if (ruhiah.almatsurat.status === 'lengkap') skorRuhiah += 10;
    else if (ruhiah.almatsurat.status !== 'tidak') skorRuhiah += 6;
    if (ruhiah.tilawah.dikerjakan) skorRuhiah += 10; // tilawah digital / istima'
  } else {
    // Tilawah (10 pts)
    if (ruhiah.tilawah.dikerjakan && ruhiah.tilawah.jumlah > 0) {
      skorRuhiah += 10;
    }

    // Sholat Qiamulail (10 pts)
    if (ruhiah.sholatQiamulail.dikerjakan && ruhiah.sholatQiamulail.rakaat >= 2) {
      skorRuhiah += 10;
    }

    // Sholat Subuh Berjamaah di Masjid / Awal Waktu (10 pts)
    if (ruhiah.sholatSubuhBerjamaahMasjid.status === 'ya') {
      skorRuhiah += 10;
    } else if (ruhiah.sholatSubuhBerjamaahMasjid.status === 'masbuq') {
      skorRuhiah += 8;
    } else if (ruhiah.sholatSubuhBerjamaahMasjid.status === 'munfarid_awal_waktu') {
      skorRuhiah += 6;
    } else if (ruhiah.sholatSubuhBerjamaahMasjid.status === 'udzur') {
      skorRuhiah += 10;
    }

    // Al-Ma'tsurat (10 pts)
    if (ruhiah.almatsurat.status === 'lengkap') {
      skorRuhiah += 10;
    } else if (ruhiah.almatsurat.status === 'pagi_saja' || ruhiah.almatsurat.status === 'petang_saja') {
      skorRuhiah += 6;
    }

    // Puasa Sunah (10 pts)
    if (ruhiah.puasaSunah.dikerjakan) {
      skorRuhiah += 10;
    }
  }

  // 2. Fikriah (Total 30 pts)
  // Membaca Materi KKP (15 pts)
  if (fikriah.membacaMateriKkp.dikerjakan) {
    skorFikriah += 15;
  }

  // Hafalan Surat Sesuai KKP (15 pts)
  if (fikriah.hafalanSuratKkp.dikerjakan) {
    if (fikriah.hafalanSuratKkp.tingkatKelancaran === 'mutqin') {
      skorFikriah += 15;
    } else if (fikriah.hafalanSuratKkp.tingkatKelancaran === 'lancar') {
      skorFikriah += 12;
    } else {
      skorFikriah += 9;
    }
  }

  // 3. Jasadiah (Total 20 pts)
  if (jasadiah.olahraga.dikerjakan) {
    if (jasadiah.olahraga.durasiMenit >= 30) {
      skorJasadiah += 20;
    } else if (jasadiah.olahraga.durasiMenit >= 15) {
      skorJasadiah += 15;
    } else {
      skorJasadiah += 10;
    }
  }

  // Caps
  skorRuhiah = Math.min(50, Math.max(0, skorRuhiah));
  skorFikriah = Math.min(30, Math.max(0, skorFikriah));
  skorJasadiah = Math.min(20, Math.max(0, skorJasadiah));
  const skorTotal = skorRuhiah + skorFikriah + skorJasadiah;

  return {
    skorTotal,
    skorRuhiah,
    skorFikriah,
    skorJasadiah
  };
}

let onRecordSavedCallback: ((record: MutabaahRecord) => void) | null = null;
let onDeleteRecordCallback: ((record: { id: string; tanggal?: string; nia?: string }) => void) | null = null;
let onUserAddedCallback: ((user: User) => void) | null = null;
let onUserUpdatedCallback: ((user: User) => void) | null = null;
let onUserDeletedCallback: ((user: { id: string; nia: string; namaLengkap: string }) => void) | null = null;

const DEMO_USER_IDS = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005', 'user-006'];
const isDemoNia = (nia?: string) => !!nia && /^NIA-2024-00[1-6]$/i.test(nia.trim());

export const StorageService = {
  setRealtimeSyncHandlers(handlers: {
    onSaveRecord?: (record: MutabaahRecord) => void;
    onDeleteRecord?: (record: { id: string; tanggal?: string; nia?: string }) => void;
    onAddUser?: (user: User) => void;
    onUpdateUser?: (user: User) => void;
    onDeleteUser?: (user: { id: string; nia: string; namaLengkap: string }) => void;
  }) {
    if (handlers.onSaveRecord) onRecordSavedCallback = handlers.onSaveRecord;
    if (handlers.onDeleteRecord) onDeleteRecordCallback = handlers.onDeleteRecord;
    if (handlers.onAddUser) onUserAddedCallback = handlers.onAddUser;
    if (handlers.onUpdateUser) onUserUpdatedCallback = handlers.onUpdateUser;
    if (handlers.onDeleteUser) onUserDeletedCallback = handlers.onDeleteUser;
  },

  purgeDemoData(): void {
    try {
      // 1. Purge demo users from storage
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        let modified = false;
        const filtered = users.filter(u => u.role === 'admin' || (!DEMO_USER_IDS.includes(u.id) && !isDemoNia(u.nia)));
        if (filtered.length !== users.length) modified = true;
        filtered.forEach(u => {
          if (u.role === 'admin' && /abdurrahman\s*hakim/i.test(u.namaLengkap)) {
            u.namaLengkap = 'Administrator';
            modified = true;
          }
        });
        if (modified) {
          this.saveUsers(filtered);
        }
      }

      // 2. Purge demo records from storage
      const storedRecords = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (storedRecords) {
        const records: MutabaahRecord[] = JSON.parse(storedRecords);
        const filteredRecords = records.filter(r => !DEMO_USER_IDS.includes(r.userId) && !isDemoNia(r.nia));
        if (filteredRecords.length !== records.length) {
          this.saveRecords(filteredRecords);
        }
      }

      // 3. Purge active user session if it was a demo user
      const storedCur = localStorage.getItem(CURRENT_USER_KEY);
      if (storedCur) {
        const cur: User = JSON.parse(storedCur);
        if (DEMO_USER_IDS.includes(cur.id) || isDemoNia(cur.nia)) {
          localStorage.removeItem(CURRENT_USER_KEY);
        } else if (cur.role === 'admin' && /abdurrahman\s*hakim/i.test(cur.namaLengkap)) {
          cur.namaLengkap = 'Administrator';
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(cur));
        }
      }
    } catch (e) {
      console.error('Error purging demo data', e);
    }
  },

  getUsers(): User[] {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed: User[] = JSON.parse(stored);
        // Clean out demo accounts
        const cleaned = parsed.filter(u => u.role === 'admin' || (!DEMO_USER_IDS.includes(u.id) && !isDemoNia(u.nia)));
        let modified = cleaned.length !== parsed.length;
        cleaned.forEach(u => {
          if (u.role === 'admin') {
            if (u.password === 'admin' || !u.password) {
              u.password = 'bkapjakpus';
              modified = true;
            }
            if (/abdurrahman\s*hakim/i.test(u.namaLengkap)) {
              u.namaLengkap = 'Administrator';
              modified = true;
            }
          }
        });
        if (modified) {
          this.saveUsers(cleaned);
        }
        return cleaned;
      }
    } catch (e) {
      console.error('Error reading users from localStorage', e);
    }
    // Set initial with only admin
    this.saveUsers(INITIAL_USERS);
    return INITIAL_USERS;
  },

  saveUsers(users: User[]): void {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users to localStorage', e);
    }
  },

  updateUser(updatedUser: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index >= 0) {
      users[index] = updatedUser;
      this.saveUsers(users);

      // Sync member's updated info into their existing mutabaah records
      const records = this.getRecords();
      let recordsModified = false;
      records.forEach(r => {
        if (r.userId === updatedUser.id) {
          r.namaLengkap = updatedUser.namaLengkap;
          r.nia = updatedUser.nia;
          r.kodeGrup = updatedUser.kodeGrup;
          r.jenisKelamin = updatedUser.jenisKelamin;
          recordsModified = true;
        }
      });
      if (recordsModified) {
        this.saveRecords(records);
      }

      // If current user is this updated user, update currentUser storage as well
      const current = this.getCurrentUser();
      if (current && current.id === updatedUser.id) {
        this.setCurrentUser(updatedUser);
      }

      if (onUserUpdatedCallback) {
        try {
          onUserUpdatedCallback(updatedUser);
        } catch (err) {
          console.warn('Realtime sync user updated callback error:', err);
        }
      }
    }
  },

  addUser(newUser: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getUsers();
    const created: User = {
      ...newUser,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    users.push(created);
    this.saveUsers(users);
    if (onUserAddedCallback) {
      try {
        onUserAddedCallback(created);
      } catch (err) {
        console.warn('Realtime sync user callback error:', err);
      }
    }
    return created;
  },

  deleteUser(userId: string): void {
    const existing = this.getUsers().find(u => u.id === userId);
    const users = this.getUsers().filter(u => u.id !== userId);
    this.saveUsers(users);
    // Also remove their mutabaah records
    const records = this.getRecords().filter(r => r.userId !== userId);
    this.saveRecords(records);

    if (existing && onUserDeletedCallback) {
      try {
        onUserDeletedCallback({ id: existing.id, nia: existing.nia, namaLengkap: existing.namaLengkap });
      } catch (err) {
        console.warn('Realtime sync user deleted callback error:', err);
      }
    }
  },

  getRecords(): MutabaahRecord[] {
    try {
      const stored = localStorage.getItem(RECORDS_STORAGE_KEY);
      if (stored) {
        const parsed: MutabaahRecord[] = JSON.parse(stored);
        // Purge any demo records associated with demo accounts
        const cleaned = parsed.filter(r => !DEMO_USER_IDS.includes(r.userId) && !isDemoNia(r.nia));
        if (cleaned.length !== parsed.length) {
          this.saveRecords(cleaned);
        }
        return cleaned;
      }
    } catch (e) {
      console.error('Error reading records from localStorage', e);
    }
    this.saveRecords([]);
    return [];
  },

  saveRecords(records: MutabaahRecord[]): void {
    try {
      localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving records to localStorage', e);
    }
  },

  deleteRecord(recordId: string): void {
    const existing = this.getRecords().find(r => r.id === recordId);
    const records = this.getRecords().filter(r => r.id !== recordId);
    this.saveRecords(records);

    if (existing && onDeleteRecordCallback) {
      try {
        onDeleteRecordCallback({ id: existing.id, tanggal: existing.tanggal, nia: existing.nia });
      } catch (err) {
        console.warn('Realtime delete record callback error:', err);
      }
    }
  },

  updateRecord(record: MutabaahRecord): void {
    const records = this.getRecords();
    const index = records.findIndex(r => r.id === record.id || (r.userId === record.userId && r.tanggal === record.tanggal));
    if (index >= 0) {
      records[index] = record;
    } else {
      records.unshift(record);
    }
    this.saveRecords(records);
    if (onRecordSavedCallback) {
      try {
        onRecordSavedCallback(record);
      } catch (err) {
        console.warn('Realtime sync record callback error:', err);
      }
    }
  },

  saveRecord(record: MutabaahRecord): void {
    this.updateRecord(record);
  },

  getRecordByUserAndDate(userId: string, tanggal: string): MutabaahRecord | undefined {
    const records = this.getRecords();
    return records.find(r => r.userId === userId && r.tanggal === tanggal);
  },

  getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        const cur: User = JSON.parse(stored);
        if (DEMO_USER_IDS.includes(cur.id) || isDemoNia(cur.nia)) {
          localStorage.removeItem(CURRENT_USER_KEY);
        } else {
          if (cur.role === 'admin') {
            let curMod = false;
            if (cur.password === 'admin' || !cur.password) {
              cur.password = 'bkapjakpus';
              curMod = true;
            }
            if (/abdurrahman\s*hakim/i.test(cur.namaLengkap)) {
              cur.namaLengkap = 'Administrator';
              curMod = true;
            }
            if (curMod) {
              this.setCurrentUser(cur);
            }
          }
          return cur;
        }
      }
    } catch (e) {
      console.error('Error reading current user', e);
    }
    // Default to admin
    const users = this.getUsers();
    const adminUser = users.find(u => u.role === 'admin') || users[0] || null;
    this.setCurrentUser(adminUser);
    return adminUser;
  },

  setCurrentUser(user: User | null): void {
    try {
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {
      console.error('Error setting current user', e);
    }
  },

  // Export records to CSV format
  exportToCsv(records: MutabaahRecord[]): string {
    const headers = [
      'Tanggal',
      'NIA',
      'Nama Lengkap',
      'Jenis Kelamin',
      'Kode Grup',
      'Tilawah',
      'Jumlah Tilawah',
      'Qiamulail',
      'Rakaat Qiamulail',
      'Subuh Berjamaah Masjid',
      'Al-Matsurat',
      'Puasa Sunah',
      'Materi KKP',
      'Judul Materi KKP',
      'Hafalan KKP',
      'Nama Hafalan',
      'Olahraga',
      'Jenis Olahraga',
      'Durasi Olahraga (menit)',
      'Skor Ruhiah (50)',
      'Skor Fikriah (30)',
      'Skor Jasadiah (20)',
      'Skor Total (100)',
      'Catatan Harian'
    ];

    const rows = records.map(r => [
      `"${r.tanggal}"`,
      `"${r.nia}"`,
      `"${r.namaLengkap}"`,
      `"${r.jenisKelamin}"`,
      `"${r.kodeGrup}"`,
      `"${r.aspekRuhiah.tilawah.dikerjakan ? 'Ya' : 'Tidak'}"`,
      `"${r.aspekRuhiah.tilawah.jumlah} ${r.aspekRuhiah.tilawah.satuan}"`,
      `"${r.aspekRuhiah.sholatQiamulail.dikerjakan ? 'Ya' : 'Tidak'}"`,
      `"${r.aspekRuhiah.sholatQiamulail.rakaat}"`,
      `"${r.aspekRuhiah.sholatSubuhBerjamaahMasjid.status}"`,
      `"${r.aspekRuhiah.almatsurat.status}"`,
      `"${r.aspekRuhiah.puasaSunah.dikerjakan ? (r.aspekRuhiah.puasaSunah.jenisPuasa || 'Ya') : 'Tidak'}"`,
      `"${r.aspekFikriah.membacaMateriKkp.dikerjakan ? 'Ya' : 'Tidak'}"`,
      `"${(r.aspekFikriah.membacaMateriKkp.judulMateri || '').replace(/"/g, '""')}"`,
      `"${r.aspekFikriah.hafalanSuratKkp.dikerjakan ? r.aspekFikriah.hafalanSuratKkp.jenis : 'Tidak'}"`,
      `"${(r.aspekFikriah.hafalanSuratKkp.namaSuratAyat || '').replace(/"/g, '""')}"`,
      `"${r.aspekJasadiah.olahraga.dikerjakan ? 'Ya' : 'Tidak'}"`,
      `"${(r.aspekJasadiah.olahraga.jenisOlahraga || '').replace(/"/g, '""')}"`,
      `"${r.aspekJasadiah.olahraga.durasiMenit}"`,
      `"${r.skorRuhiah}"`,
      `"${r.skorFikriah}"`,
      `"${r.skorJasadiah}"`,
      `"${r.skorTotal}"`,
      `"${(r.catatanHarian || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
};

// Auto-purge any stale demo accounts and demo mutabaah records upon initialization
try {
  if (typeof window !== 'undefined') {
    StorageService.purgeDemoData();
  }
} catch (e) {
  // Ignore in SSR/test
}

