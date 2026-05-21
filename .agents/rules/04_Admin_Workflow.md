# 🛡️ Admin Workflow
## LAPOR MALANG — Alur Administrator (Dinas/Pemerintah)
**Versi:** 1.0.0 | **Tanggal:** Mei 2026

---

## 1. Alur Login Admin

```
┌─────────────────────────────────────────────────────────────┐
│                        LOGIN ADMIN                           │
└─────────────────────────────────────────────────────────────┘

[Admin] Akses /admin/login
    │
    ├──> Isi Email + Password
    │         │
    │    [Validasi Role = admin | super_admin]
    │    ┌────┴────────────────────────────────────┐
    │  GAGAL                                     SUKSES
    │    │                                          │
    │  "Email atau password salah"              JWT Token dibuat
    │  (maks 5x → akun terkunci 30 menit)       (expire 8 jam)
    │                                               │
    │                                          Redirect ke
    │                                          /admin/dashboard
    │
    ATURAN KEAMANAN:
    • Akun admin HANYA dibuat oleh Super Admin
    • Admin biasa tidak bisa self-register
    • Session expired setelah 8 jam tidak aktif
    • Semua aksi admin tercatat di audit log
```

---

## 2. Alur Dashboard Admin

```
┌─────────────────────────────────────────────────────────────┐
│                      DASHBOARD ADMIN                         │
└─────────────────────────────────────────────────────────────┘

[Admin] Masuk /admin/dashboard
    │
    ├──> Ringkasan Statistik (auto-refresh setiap 60 detik)
    │    ┌──────────────────────────────────────────────────┐
    │    │ KARTU STATISTIK                                   │
    │    │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐│
    │    │ │ Total    │ │ Hari Ini │ │ Menunggu │ │Selesai││
    │    │ │ Laporan  │ │          │ │Verifikasi│ │Bln Ini││
    │    │ │  1.234   │ │    23    │ │    47    │ │  312  ││
    │    │ └──────────┘ └──────────┘ └──────────┘ └──────┘│
    │    └──────────────────────────────────────────────────┘
    │
    ├──> Grafik Laporan 7 Hari Terakhir (Bar Chart)
    │
    ├──> Donut Chart — Laporan per Kategori Fasilitas
    │
    ├──> Tabel — Top 5 Kecamatan dengan laporan terbanyak
    │
    └──> Peta Mini — Sebaran laporan aktif (belum selesai)
         Klik pin → popup singkat → link ke detail laporan
```

---

## 3. Alur Manajemen Laporan

```
┌─────────────────────────────────────────────────────────────┐
│                  DAFTAR LAPORAN MASUK                        │
└─────────────────────────────────────────────────────────────┘

[Admin] Menu "Kelola Laporan"
    │
    ├──> Tabel laporan dengan kolom:
    │    [No Laporan] [Tanggal] [Pelapor] [Kategori]
    │    [Kecamatan] [Tingkat] [Status] [Aksi]
    │
    ├──> Panel Filter
    │    ┌──────────────────────────────────────┐
    │    │ Status:     [ Semua ▼ ]              │
    │    │ Kategori:   [ Semua ▼ ]              │
    │    │ Kecamatan:  [ Semua ▼ ]              │
    │    │ Tingkat:    [ Semua ▼ ]              │
    │    │ Tanggal:    [Dari] s/d [Sampai]      │
    │    │ Search:     [Cari nomor/nama...]     │
    │    └──────────────────────────────────────┘
    │
    ├──> Klik baris / tombol "Detail" → Halaman Detail Laporan
    │
    └──> Tombol [Export CSV] → Unduh data sesuai filter aktif
```

---

## 4. Alur Verifikasi Laporan (PROSES UTAMA)

```
┌─────────────────────────────────────────────────────────────┐
│              VERIFIKASI LAPORAN — DETAIL                     │
└─────────────────────────────────────────────────────────────┘

[Admin] Buka Detail Laporan (Status: MENUNGGU)
    │
    ├──> Halaman menampilkan:
    │    • Nomor laporan & timestamp
    │    • Info pelapor (nama, HP — tanpa NIK)
    │    • Lokasi di peta mini (pin + alamat)
    │    • Kategori fasilitas & tingkat kerusakan
    │    • Foto-foto kerusakan dari pelapor (galeri)
    │    • Deskripsi kerusakan
    │    • Catatan internal sebelumnya (jika ada)
    │
    ├──> [Opsional] Admin tambah catatan internal
    │    (tidak terlihat oleh user)
    │
    ├──> Admin menentukan tindakan:
    │
    │    ┌─────────────────────────────┐
    │    │       PILIHAN AKSI          │
    │    │                             │
    │    │  [✅ PROSES LAPORAN]        │
    │    │  [❌ TOLAK LAPORAN]         │
    │    └─────────────────────────────┘
    │
    ├──> PATH A: Klik "PROSES LAPORAN"
    │         │
    │         ▼
    │    Konfirmasi modal: "Ubah status ke Diproses?"
    │         │
    │         ▼ Konfirmasi
    │    Status berubah → DIPROSES ✅
    │    Notifikasi otomatis dikirim ke User
    │    Audit log tercatat
    │
    └──> PATH B: Klik "TOLAK LAPORAN"
              │
              ▼
         Modal form penolakan:
         ┌──────────────────────────────────────┐
         │ Alasan Penolakan (wajib diisi):      │
         │ ┌──────────────────────────────────┐ │
         │ │ Foto tidak menunjukkan kerusakan │ │
         │ │ yang dimaksud. Mohon kirim ulang │ │
         │ │ dengan foto yang lebih jelas.    │ │
         │ └──────────────────────────────────┘ │
         │ [Batal]  [Konfirmasi Tolak]           │
         └──────────────────────────────────────┘
              │
              ▼ Konfirmasi
         Status berubah → DITOLAK ❌
         Notifikasi + alasan dikirim ke User
         Audit log tercatat
```

---

## 5. Alur Penyelesaian Laporan (WAJIB FOTO BUKTI)

```
┌─────────────────────────────────────────────────────────────┐
│           MENYELESAIKAN LAPORAN — UPLOAD FOTO BUKTI          │
└─────────────────────────────────────────────────────────────┘

[Admin] Buka Detail Laporan (Status: DIPROSES)
    │
    ├──> Tombol "SELESAIKAN LAPORAN" terlihat
    │    TAPI tombol ini DISABLED (abu-abu) selama
    │    foto bukti perbaikan belum diunggah
    │
    ├──> STEP 1: Upload Foto Bukti Perbaikan
    │    ┌──────────────────────────────────────────┐
    │    │ 📸 Upload Foto Bukti Perbaikan           │
    │    │                                          │
    │    │ [Drag & Drop atau Klik untuk Upload]     │
    │    │                                          │
    │    │ Ketentuan:                               │
    │    │ • Wajib upload minimal 1 foto            │
    │    │ • Maks 5 foto                            │
    │    │ • Format: JPG / PNG / WEBP               │
    │    │ • Maks 5MB per foto                      │
    │    │ • Foto harus memperlihatkan              │
    │    │   kondisi fasilitas SETELAH diperbaiki   │
    │    │                                          │
    │    │ Preview foto muncul setelah upload ✅    │
    │    └──────────────────────────────────────────┘
    │         │
    │    [Foto berhasil diunggah ke storage]
    │         │
    │         ▼
    │    Tombol "SELESAIKAN LAPORAN" → AKTIF (biru)
    │
    ├──> STEP 2: Klik "SELESAIKAN LAPORAN"
    │         │
    │         ▼
    │    Konfirmasi modal:
    │    "Apakah Anda yakin ingin menandai laporan ini
    │     sebagai SELESAI? Foto bukti perbaikan akan
    │     dikirimkan ke pelapor."
    │         │
    │         ▼ Konfirmasi
    │
    │    ┌──────────────────────────────────────────┐
    │    │ SISTEM OTOMATIS:                         │
    │    │ 1. Status laporan → SELESAI              │
    │    │ 2. Foto bukti tersimpan di database      │
    │    │ 3. Notifikasi dikirim ke User:           │
    │    │    "Laporan #LP-XXXX selesai diperbaiki" │
    │    │    + foto bukti perbaikan                │
    │    │ 4. Pin di peta berubah warna → abu ⚫   │
    │    │ 5. Audit log tercatat                    │
    │    └──────────────────────────────────────────┘
    │
    └──> Halaman detail laporan menampilkan status SELESAI ✅
         Foto bukti tampil di bagian bawah halaman
```

---

## 6. Alur Export Data

```
┌─────────────────────────────────────────────────────────────┐
│                       EXPORT DATA                            │
└─────────────────────────────────────────────────────────────┘

[Admin] Halaman Kelola Laporan
    │
    ├──> Atur filter yang diinginkan:
    │    (Status, Kategori, Kecamatan, Rentang Tanggal)
    │
    ├──> Klik [Export CSV]
    │         │
    │    [Backend generate CSV dari data filtered]
    │         │
    │    File .csv langsung terunduh
    │    Nama file: laporan_malang_[filter]_[tanggal].csv
    │
    Kolom CSV:
    No Laporan | Tanggal Dibuat | Tanggal Selesai |
    Kecamatan | Kategori | Tingkat Kerusakan |
    Status | Waktu Verifikasi (jam) | Rating User
```

---

## 7. Alur Super Admin — Kelola Akun Admin

```
┌─────────────────────────────────────────────────────────────┐
│              KELOLA AKUN ADMIN (SUPER ADMIN)                 │
└─────────────────────────────────────────────────────────────┘

[Super Admin] Menu "Manajemen Admin"
    │
    ├──> Daftar semua akun admin:
    │    [Nama] [Email] [Role] [Status] [Terakhir Login] [Aksi]
    │
    ├──> Klik [+ Tambah Admin Baru]
    │    ┌──────────────────────────────────────┐
    │    │ Nama Lengkap: ___________________    │
    │    │ Email:        ___________________    │
    │    │ Password:     ___________________    │
    │    │ Role:  ○ Admin  ○ Super Admin        │
    │    │ Unit Dinas:   [Pilih Dinas ▼]       │
    │    │                          [Simpan]    │
    │    └──────────────────────────────────────┘
    │         │
    │    Email undangan dikirim ke admin baru
    │
    ├──> Toggle [Aktif/Nonaktif] di baris admin
    │    Admin nonaktif tidak bisa login
    │
    └──> Klik [Reset Password] → link reset dikirim ke email
```

---

## 8. Dashboard Admin — Layout

```
HALAMAN DASHBOARD ADMIN
┌─────────────────────────────────────────────────────────────┐
│  🏛️ LAPOR MALANG ADMIN     [Ibu Sari — PUPR] [Logout]      │
├──────────────┬──────────────────────────────────────────────┤
│ SIDEBAR      │                                              │
│              │  DASHBOARD                                   │
│ 📊 Dashboard │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│              │  │1,234 │ │  23  │ │  47  │ │ 312  │      │
│ 📋 Laporan   │  │Total │ │Hari  │ │Tunggu│ │Selesai      │
│              │  │      │ │ Ini  │ │Verif │ │Bln Ini      │
│ 🗺️ Peta      │  └──────┘ └──────┘ └──────┘ └──────┘      │
│              │                                              │
│ 📁 Export    │  [Bar Chart — 7 Hari]  [Donut — Kategori]  │
│              │                                              │
│ 👥 Admin     │  [Tabel Top Kecamatan]  [Peta Mini]        │
│   (super)    │                                              │
│              │  ⚠️ Laporan Perlu Segera Diproses (47)      │
│ ⚙️ Settings  │  [Lihat Semua Laporan Pending →]            │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

---

## 9. Audit Trail — Setiap Aksi Tercatat

| Aksi | Yang Dicatat |
|------|-------------|
| Login admin | Timestamp, IP address, email admin |
| Ubah status laporan | Admin ID, laporan ID, status lama, status baru, timestamp |
| Upload foto bukti | Admin ID, laporan ID, nama file, timestamp |
| Tolak laporan | Admin ID, laporan ID, alasan penolakan, timestamp |
| Buat akun admin baru | Super admin ID, email admin baru, role, timestamp |
| Nonaktifkan admin | Super admin ID, admin yang dinonaktifkan, timestamp |
| Export CSV | Admin ID, filter yang digunakan, jumlah baris, timestamp |
