# 👤 User Workflow
## LAPOR MALANG — Alur Pengguna (Warga)
**Versi:** 1.0.0 | **Tanggal:** Mei 2026

---

## 1. Alur Registrasi & Login

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRASI USER BARU                      │
└─────────────────────────────────────────────────────────────┘

[Guest] Buka Landing Page
    │
    ├──> Klik "Daftar Sekarang"
    │         │
    │         ▼
    │    Isi Form Registrasi
    │    ┌──────────────────────────────┐
    │    │ • Nama Lengkap               │
    │    │ • NIK (16 digit)             │
    │    │ • Nomor HP                   │
    │    │ • Email                      │
    │    │ • Password (min 8 karakter)  │
    │    │ • Konfirmasi Password        │
    │    └──────────────────────────────┘
    │         │
    │    [Validasi Form]
    │    ┌────┴─────────────────┐
    │  GAGAL                  SUKSES
    │    │                       │
    │  Tampil error           Kirim OTP ke email
    │  di field terkait           │
    │                        User masukkan kode OTP
    │                             │
    │                    ┌────────┴────────┐
    │                  SALAH/EXPIRED     BENAR
    │                    │                 │
    │                  Minta kirim       Akun aktif ✅
    │                  ulang OTP         Redirect ke Login
    │
    └──> Klik "Sudah punya akun?" → halaman Login
```

```
┌─────────────────────────────────────────────────────────────┐
│                         LOGIN USER                           │
└─────────────────────────────────────────────────────────────┘

[User] Buka Halaman Login
    │
    ├──> Isi Email + Password
    │         │
    │    [Validasi Kredensial]
    │    ┌────┴─────────────────┐
    │  GAGAL                  SUKSES
    │    │                       │
    │  Tampil "Email atau      JWT Access Token dibuat
    │  password salah"         JWT Refresh Token dibuat
    │  (maks 5x → akun locked)     │
    │                        Simpan token di localStorage
    │                             │
    │                        Redirect ke Dashboard User
    │
    └──> Klik "Lupa Password?" → alur reset password
```

```
┌─────────────────────────────────────────────────────────────┐
│                     RESET PASSWORD                           │
└─────────────────────────────────────────────────────────────┘

[User] Halaman "Lupa Password"
    │
    ├──> Masukkan Email Terdaftar
    │         │
    │    [Cek email di database]
    │    ┌────┴─────────────────┐
    │  TIDAK ADA              ADA
    │    │                       │
    │  Tampil pesan           Kirim email berisi link reset
    │  "Jika email terdaftar, (valid 1 jam, single-use)
    │   kami kirimkan link"        │
    │                        User klik link di email
    │                             │
    │                        Halaman buat password baru
    │                             │
    │                        Password di-update ✅
    │                        Redirect ke Login
```

---

## 2. Alur Membuat Laporan

```
┌─────────────────────────────────────────────────────────────┐
│                    BUAT LAPORAN BARU                         │
└─────────────────────────────────────────────────────────────┘

[User Login] Dashboard / Peta
    │
    ├──> Klik tombol "+ Buat Laporan"
    │         │
    │         ▼
    │    STEP 1 — Lokasi
    │    ┌──────────────────────────────────────┐
    │    │ Sistem minta izin GPS browser        │
    │    │                                      │
    │    │ ┌─────────────┬───────────────────┐  │
    │    │ │ IZIN DIBERIKAN │ IZIN DITOLAK   │  │
    │    │ │               │                 │  │
    │    │ │ Pin otomatis  │ User drag pin   │  │
    │    │ │ di lokasi GPS │ manual di peta  │  │
    │    │ └─────────────┴───────────────────┘  │
    │    │                                      │
    │    │ User bisa adjust pin manual          │
    │    │ Alamat otomatis reverse geocode      │
    │    └──────────────────────────────────────┘
    │         │
    │         ▼ Klik "Lanjut"
    │
    │    STEP 2 — Detail Kerusakan
    │    ┌──────────────────────────────────────┐
    │    │ Kategori Fasilitas (wajib):          │
    │    │   ○ Jalan      ○ Jembatan            │
    │    │   ○ Drainase   ○ Lampu Jalan         │
    │    │   ○ Taman      ○ Fasilitas Olahraga  │
    │    │   ○ Lainnya                          │
    │    │                                      │
    │    │ Tingkat Kerusakan (wajib):           │
    │    │   ○ Ringan — Tidak mengganggu lalu   │
    │    │             lintas/aktivitas         │
    │    │   ○ Sedang — Mengurangi fungsi       │
    │    │             fasilitas                │
    │    │   ○ Berat  — Berbahaya / tidak bisa  │
    │    │             digunakan               │
    │    │                                      │
    │    │ Deskripsi (opsional, maks 500 char)  │
    │    └──────────────────────────────────────┘
    │         │
    │         ▼ Klik "Lanjut"
    │
    │    STEP 3 — Upload Foto
    │    ┌──────────────────────────────────────┐
    │    │ Upload 1-5 foto kerusakan (wajib)    │
    │    │ Format: JPG / PNG / WEBP             │
    │    │ Maks: 5MB per foto                   │
    │    │                                      │
    │    │ [Drag & Drop atau Klik untuk Browse] │
    │    │                                      │
    │    │ Preview thumbnail foto muncul        │
    │    │ User bisa hapus foto yang salah      │
    │    └──────────────────────────────────────┘
    │         │
    │         ▼ Klik "Lanjut"
    │
    │    STEP 4 — Review & Submit
    │    ┌──────────────────────────────────────┐
    │    │ Ringkasan laporan sebelum submit:    │
    │    │ • Lokasi di peta (mini map)          │
    │    │ • Kategori & tingkat kerusakan       │
    │    │ • Foto-foto yang diunggah            │
    │    │ • Deskripsi                          │
    │    └──────────────────────────────────────┘
    │         │
    │         ▼ Klik "Kirim Laporan"
    │
    │    [Proses Upload & Simpan]
    │    ┌────┴─────────────────┐
    │  GAGAL                  SUKSES
    │    │                       │
    │  Toast error            Modal sukses muncul
    │  "Gagal mengirim,       Nomor laporan: #LP-XXXXXXXX
    │   coba lagi"            Status: Menunggu Verifikasi
    │                             │
    │                        Redirect ke halaman detail laporan
    │                        Pin baru muncul di peta
```

---

## 3. Alur Memantau Laporan

```
┌─────────────────────────────────────────────────────────────┐
│                    PANTAU STATUS LAPORAN                     │
└─────────────────────────────────────────────────────────────┘

[User] Menu "Laporan Saya"
    │
    ├──> Daftar laporan tampil (terbaru di atas)
    │    Status ditandai dengan badge warna:
    │    🟡 Menunggu  🔵 Diproses  ✅ Selesai  🔴 Ditolak
    │
    ├──> Klik laporan tertentu → Halaman Detail Laporan
    │         │
    │         ▼
    │    Detail Laporan
    │    ┌──────────────────────────────────────┐
    │    │ Nomor: #LP-XXXXXXXX                  │
    │    │ Tanggal dibuat: DD/MM/YYYY HH:MM     │
    │    │ Lokasi: [Nama Jalan, Kecamatan]      │
    │    │ Kategori: [Kategori Fasilitas]       │
    │    │ Tingkat: [Ringan/Sedang/Berat]       │
    │    │ Foto-foto kerusakan (galeri)         │
    │    │ Deskripsi                            │
    │    │                                      │
    │    │ Status Saat Ini: [Badge Status]      │
    │    │                                      │
    │    │ Timeline Riwayat:                    │
    │    │ ● 10 Mei 2026 09:15 — Laporan dibuat │
    │    │ ● 10 Mei 2026 14:30 — Diverifikasi  │
    │    │ ● 15 Mei 2026 10:00 — Selesai       │
    │    │                                      │
    │    │ [Jika DITOLAK]                       │
    │    │ Alasan: "Foto tidak jelas,           │
    │    │ lokasi tidak ditemukan"              │
    │    │                                      │
    │    │ [Jika SELESAI]                       │
    │    │ Foto Bukti Perbaikan: [Galeri Foto]  │
    │    │ [Form Rating Kepuasan ⭐⭐⭐⭐⭐]        │
    │    └──────────────────────────────────────┘
```

---

## 4. Alur Notifikasi

```
┌─────────────────────────────────────────────────────────────┐
│                      NOTIFIKASI USER                         │
└─────────────────────────────────────────────────────────────┘

[Event Pemicu dari Admin]               [User Menerima]
         │                                      │
Laporan diverifikasi (Diproses) ──────> 🔔 Notifikasi:
                                        "Laporan #LP-XXXX sedang 
                                         diproses oleh petugas"

Laporan ditolak ──────────────────────> 🔔 Notifikasi:
                                        "Laporan #LP-XXXX ditolak.
                                         Alasan: [alasan admin]"

Admin upload foto + status Selesai ───> 🔔 Notifikasi:
                                        "Laporan #LP-XXXX telah 
                                         selesai diperbaiki! 
                                         Tap untuk lihat foto bukti"
                                              │
                                         User tap notifikasi
                                              │
                                         Redirect ke Detail Laporan
                                         Foto perbaikan tampil di galeri
                                              │
                                         Form rating muncul
```

---

## 5. Alur Peta Interaktif

```
┌─────────────────────────────────────────────────────────────┐
│                      PETA INTERAKTIF                         │
└─────────────────────────────────────────────────────────────┘

[User/Guest] Buka halaman Peta
    │
    ├──> Peta Kabupaten Malang tampil (OpenStreetMap)
    │    Pin berwarna muncul sesuai tingkat kerusakan:
    │    🟢 Ringan  🟡 Sedang  🔴 Berat  ⚫ Selesai
    │
    ├──> Filter Panel (atas/samping peta)
    │    ┌──────────────────────────────────────┐
    │    │ Kategori:    [Semua ▼]              │
    │    │ Tingkat:     [Semua ▼]              │
    │    │ Status:      [Aktif ▼]              │
    │    │ Kecamatan:   [Semua ▼]              │
    │    └──────────────────────────────────────┘
    │         │ Ubah filter → pin diperbarui real-time
    │
    ├──> Klik Pin → Popup muncul
    │    ┌──────────────────────────────────────┐
    │    │ 📸 [Foto thumbnail kerusakan]        │
    │    │ Kategori: Jalan                      │
    │    │ Tingkat: 🔴 Berat                    │
    │    │ Kecamatan: Kepanjen                  │
    │    │ Status: Diproses                     │
    │    │ Tanggal Lapor: 10 Mei 2026           │
    │    │ [Lihat Detail →]  (hanya jika login) │
    │    └──────────────────────────────────────┘
    │
    └──> Legenda di pojok peta selalu tampil
```

---

## 6. Status Flow Laporan

```
                    ┌──────────────┐
                    │  MENUNGGU    │  ← Laporan baru dibuat
                    │  (PENDING)   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │                         │
              ▼                         ▼
    ┌──────────────────┐      ┌──────────────────┐
    │    DIPROSES      │      │    DITOLAK        │
    │   (IN_PROGRESS)  │      │   (REJECTED)      │
    └────────┬─────────┘      └──────────────────┘
             │                  (Notifikasi + Alasan)
             │
             ▼
    ┌──────────────────┐
    │  [Admin Upload   │
    │   Foto Bukti]    │
    │   (WAJIB)        │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │     SELESAI      │
    │    (RESOLVED)    │
    └──────────────────┘
      (Notifikasi + Foto Bukti dikirim ke User)
```

---

## 7. State UI — Halaman Utama

```
DASHBOARD USER
┌─────────────────────────────────────────────────────────┐
│  Header: Logo LAPOR MALANG   [🔔 Notifikasi] [Avatar]  │
├─────────────────────────────────────────────────────────┤
│  Selamat datang, Budi 👋                                │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Total    │ │Menunggu  │ │Diproses  │ │ Selesai  │  │
│  │Laporan   │ │          │ │          │ │          │  │
│  │  12      │ │    3     │ │    5     │ │    4     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                          │
│  [+ Buat Laporan Baru]  [Lihat Peta]                   │
│                                                          │
│  Laporan Terbaru                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ #LP-0012 | Jalan | 🔴 Berat | Kepanjen          │   │
│  │ "Jalan berlubang besar..."     🔵 Diproses       │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ #LP-0011 | Drainase | 🟡 Sedang | Malang Tengah │   │
│  │ "Saluran tersumbat..."         🟡 Menunggu       │   │
│  └──────────────────────────────────────────────────┘   │
│  [Lihat Semua Laporan →]                                │
└─────────────────────────────────────────────────────────┘
```
