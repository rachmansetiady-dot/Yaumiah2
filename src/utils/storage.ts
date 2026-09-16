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
    namaLengkap: 'Ust. H. Abdurrahman Hakim',
    jenisKelamin: 'Laki-laki',
    kodeGrup: 'PUSAT',
    role: 'admin',
    password: 'bkapjakpus',
    noHp: '081234567890',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'user-001',
    nia: 'NIA-2024-001',
    namaLengkap: 'Ahmad Fauzan Pratama',
    jenisKelamin: 'Laki-laki',
    kodeGrup: 'USRAH-ALFALAH',
    role: 'anggota',
    password: '123',
    noHp: '081298765431',
    createdAt: '2024-01-10T00:00:00.000Z'
  },
  {
    id: 'user-002',
    nia: 'NIA-2024-002',
    namaLengkap: 'Fathimah Az-Zahra',
    jenisKelamin: 'Perempuan',
    kodeGrup: 'USRAH-ANNUR',
    role: 'anggota',
    password: '123',
    noHp: '081298765432',
    createdAt: '2024-01-11T00:00:00.000Z'
  },
  {
    id: 'user-003',
    nia: 'NIA-2024-003',
    namaLengkap: 'Muhammad Ridwan Syahputra',
    jenisKelamin: 'Laki-laki',
    kodeGrup: 'USRAH-ALFALAH',
    role: 'anggota',
    password: '123',
    noHp: '081298765433',
    createdAt: '2024-01-12T00:00:00.000Z'
  },
  {
    id: 'user-004',
    nia: 'NIA-2024-004',
    namaLengkap: 'Nurul Hidayah Putri',
    jenisKelamin: 'Perempuan',
    kodeGrup: 'USRAH-ANNUR',
    role: 'anggota',
    password: '123',
    noHp: '081298765434',
    createdAt: '2024-01-13T00:00:00.000Z'
  },
  {
    id: 'user-005',
    nia: 'NIA-2024-005',
    namaLengkap: 'Zaid Abdullah Mansur',
    jenisKelamin: 'Laki-laki',
    kodeGrup: 'USRAH-ALIKHLAS',
    role: 'anggota',
    password: '123',
    noHp: '081298765435',
    createdAt: '2024-01-14T00:00:00.000Z'
  },
  {
    id: 'user-006',
    nia: 'NIA-2024-006',
    namaLengkap: 'Aisyah Humaira',
    jenisKelamin: 'Perempuan',
    kodeGrup: 'USRAH-ALIKHLAS',
    role: 'anggota',
    password: '123',
    noHp: '081298765436',
    createdAt: '2024-01-15T00:00:00.000Z'
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

// Generate some sample records for yesterday and today
function generateSampleRecords(users: User[]): MutabaahRecord[] {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const dates = [
    getFormattedDate(today),
    getFormattedDate(yesterday),
    getFormattedDate(twoDaysAgo)
  ];

  const sampleRecords: MutabaahRecord[] = [];
  const anggotaList = users.filter(u => u.role === 'anggota');

  dates.forEach((tgl, dIdx) => {
    anggotaList.forEach((u, uIdx) => {
      // simulate some varying completion
      if (dIdx === 0 && uIdx === 4) return; // one member hasn't filled today yet

      const isAhmad = u.nia === 'NIA-2024-001';
      const isFathimah = u.nia === 'NIA-2024-002';
      const isAkhwat = u.jenisKelamin === 'Perempuan';

      const ruhiah: AspekRuhiah = {
        tilawah: {
          dikerjakan: true,
          satuan: 'halaman',
          jumlah: isAhmad ? 20 : isFathimah ? 10 : 8,
          suratAyat: isAhmad ? 'QS. Al-Baqarah 1-141' : 'QS. Ali Imran 50-90'
        },
        sholatQiamulail: {
          dikerjakan: dIdx !== 2 || uIdx % 2 === 0,
          rakaat: isAhmad ? 8 : 4,
          catatan: 'Tahajjud & Witir'
        },
        sholatSubuhBerjamaahMasjid: {
          status: isAkhwat ? 'ya' : (uIdx % 3 === 0 ? 'ya' : 'masbuq'),
          keterangan: isAkhwat ? 'Tepat waktu di rumah' : 'Di Masjid Al-Muhajirin'
        },
        almatsurat: {
          status: (dIdx + uIdx) % 2 === 0 ? 'lengkap' : 'pagi_saja',
          jenis: 'kubro'
        },
        puasaSunah: {
          dikerjakan: dIdx === 1, // yesterday did puasa
          jenisPuasa: 'senin_kamis',
          keterangan: 'Puasa sunah Senin'
        }
      };

      const fikriah: AspekFikriah = {
        membacaMateriKkp: {
          dikerjakan: true,
          judulMateri: 'Materi KKP Bab 3: Urgensi Ibadah & Dakwah',
          durasiMenit: 25,
          halaman: 'Hal 45-60',
          catatanRefleksi: 'Memperdalam pemahaman tentang konsekuensi iman dalam keseharian.'
        },
        hafalanSuratKkp: {
          dikerjakan: true,
          jenis: uIdx % 2 === 0 ? 'ziyadah' : 'murajaah',
          namaSuratAyat: 'QS. Al-Mulk ayat 1-15',
          tingkatKelancaran: 'mutqin'
        }
      };

      const jasadiah: AspekJasadiah = {
        olahraga: {
          dikerjakan: dIdx !== 1, // did sports today & 2 days ago
          jenisOlahraga: isAkhwat ? 'Senam / Workout Rumah' : 'Jogging / Lari santai',
          durasiMenit: 30,
          keterangan: 'Pagi hari sebelum aktivitas'
        }
      };

      const scores = calculateScore(ruhiah, fikriah, jasadiah, false);

      sampleRecords.push({
        id: `rec-${u.id}-${tgl}`,
        userId: u.id,
        nia: u.nia,
        namaLengkap: u.namaLengkap,
        jenisKelamin: u.jenisKelamin,
        kodeGrup: u.kodeGrup,
        tanggal: tgl,
        isUdzurSyari: false,
        aspekRuhiah: ruhiah,
        aspekFikriah: fikriah,
        aspekJasadiah: jasadiah,
        catatanHarian: 'Alhamdulillah target harian terlaksana dengan baik.',
        ...scores,
        updatedAt: new Date().toISOString()
      });
    });
  });

  return sampleRecords;
}

let onRecordSavedCallback: ((record: MutabaahRecord) => void) | null = null;
let onDeleteRecordCallback: ((record: { id: string; tanggal?: string; nia?: string }) => void) | null = null;
let onUserAddedCallback: ((user: User) => void) | null = null;
let onUserUpdatedCallback: ((user: User) => void) | null = null;
let onUserDeletedCallback: ((user: { id: string; nia: string; namaLengkap: string }) => void) | null = null;

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

  getUsers(): User[] {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed: User[] = JSON.parse(stored);
        // Ensure admin password is migrated to bkapjakpus
        let modified = false;
        parsed.forEach(u => {
          if (u.role === 'admin' && (u.password === 'admin' || !u.password)) {
            u.password = 'bkapjakpus';
            modified = true;
          }
        });
        if (modified) {
          this.saveUsers(parsed);
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error reading users from localStorage', e);
    }
    // Set initial
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
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading records from localStorage', e);
    }
    // Set initial with sample records
    const users = this.getUsers();
    const records = generateSampleRecords(users);
    this.saveRecords(records);
    return records;
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
        if (cur.role === 'admin' && (cur.password === 'admin' || !cur.password)) {
          cur.password = 'bkapjakpus';
          this.setCurrentUser(cur);
        }
        return cur;
      }
    } catch (e) {
      console.error('Error reading current user', e);
    }
    // Default to admin or first user for instant preview
    const users = this.getUsers();
    const defaultUser = users[0]; // Admin by default
    this.setCurrentUser(defaultUser);
    return defaultUser;
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
