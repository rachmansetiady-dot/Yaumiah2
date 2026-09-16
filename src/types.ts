export type JenisKelamin = 'Laki-laki' | 'Perempuan';

export type UserRole = 'admin' | 'anggota';

export interface User {
  id: string;
  nia: string; // Nomor Induk Anggota
  namaLengkap: string;
  jenisKelamin: JenisKelamin;
  kodeGrup: string; // e.g. USRAH-ALFALAH, USRAH-ANNUR
  role: UserRole;
  password?: string;
  noHp?: string;
  createdAt: string;
}

export type StatusSubuh = 
  | 'ya'                     // Berjamaah di masjid (Ikhwan) / Awal waktu di rumah (Akhwat)
  | 'masbuq'                 // Masbuq di masjid
  | 'munfarid_awal_waktu'    // Sendiri di awal waktu
  | 'terlambat'              // Terlambat / Kesiangan
  | 'tidak'                  // Tidak sholat
  | 'udzur';                 // Udzur syar'i (haid/nifas bagi akhwat)

export type StatusMatsurat = 
  | 'lengkap'     // Pagi dan Petang
  | 'pagi_saja'   // Pagi saja
  | 'petang_saja' // Petang saja
  | 'tidak';      // Belum / Tidak membaca

export type JenisMatsurat = 'sughro' | 'kubro';

export type JenisPuasa = 
  | 'senin_kamis'
  | 'ayyamul_bidh'
  | 'daud'
  | 'qadha_nadzar'
  | 'syawal'
  | 'arafah_tarwiyah'
  | 'lainnya';

export type JenisHafalan = 'ziyadah' | 'murajaah' | 'keduanya';

export type TingkatKelancaran = 'mutqin' | 'lancar' | 'perlu_tahsin';

export interface AspekRuhiah {
  tilawah: {
    dikerjakan: boolean;
    satuan: 'halaman' | 'juz' | 'lembar';
    jumlah: number;
    suratAyat?: string;
  };
  sholatQiamulail: {
    dikerjakan: boolean;
    rakaat: number;
    catatan?: string;
  };
  sholatSubuhBerjamaahMasjid: {
    status: StatusSubuh;
    keterangan?: string;
  };
  almatsurat: {
    status: StatusMatsurat;
    jenis: JenisMatsurat;
  };
  puasaSunah: {
    dikerjakan: boolean;
    jenisPuasa?: JenisPuasa;
    keterangan?: string;
  };
}

export interface AspekFikriah {
  membacaMateriKkp: {
    dikerjakan: boolean;
    judulMateri: string;
    durasiMenit: number;
    halaman?: string;
    catatanRefleksi?: string;
  };
  hafalanSuratKkp: {
    dikerjakan: boolean;
    jenis: JenisHafalan;
    namaSuratAyat: string;
    tingkatKelancaran: TingkatKelancaran;
  };
}

export interface AspekJasadiah {
  olahraga: {
    dikerjakan: boolean;
    jenisOlahraga: string;
    durasiMenit: number;
    keterangan?: string;
  };
}

export interface MutabaahRecord {
  id: string;
  userId: string;
  nia: string;
  namaLengkap: string;
  jenisKelamin: JenisKelamin;
  kodeGrup: string;
  tanggal: string; // YYYY-MM-DD
  isUdzurSyari?: boolean; // Untuk Akhwat (haid/nifas)
  aspekRuhiah: AspekRuhiah;
  aspekFikriah: AspekFikriah;
  aspekJasadiah: AspekJasadiah;
  catatanHarian?: string;
  skorTotal: number; // 0 - 100
  skorRuhiah: number; // 0 - 100
  skorFikriah: number; // 0 - 100
  skorJasadiah: number; // 0 - 100
  updatedAt: string;
}

export interface GroupSummary {
  kodeGrup: string;
  totalAnggota: number;
  totalIsianHariIni: number;
  rataRataSkor: number;
}
