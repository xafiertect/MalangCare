# 📝 User Requirements Specification (URS)
## LAPOR MALANG
**Versi:** 1.0.0  
**Tanggal:** Mei 2026  
**Prioritas:** MUST / SHOULD / COULD / WON'T (MoSCoW)

---

## 1. Aktor Sistem

| Aktor | Deskripsi |
|-------|-----------|
| **Guest** | Pengunjung belum login — hanya bisa lihat peta publik |
| **User** | Warga terdaftar yang bisa membuat dan memantau laporan |
| **Admin** | Staf dinas yang memverifikasi dan mengelola laporan |
| **Super Admin** | Admin dengan hak kelola admin lain dan konfigurasi sistem |
| **System** | Proses otomatis (notifikasi, cleanup, scheduler) |

---

## 2. Kebutuhan Fungsional — Guest

| ID | Requirement | Prioritas | Acceptance Criteria |
|----|-------------|-----------|---------------------|
| URS-G-01 | Guest dapat melihat peta publik dengan pin laporan | MUST | Peta tampil tanpa login, pin berwarna sesuai tingkat kerusakan |
| URS-G-02 | Guest dapat melihat detail ringkas laporan di peta (tanpa data pribadi pelapor) | SHOULD | Klik pin tampil: kategori, tingkat, kecamatan, status |
| URS-G-03 | Guest dapat mengakses halaman registrasi | MUST | Form registrasi bisa diakses dari landing page |
| URS-G-04 | Guest dapat mengakses halaman login | MUST | Form login bisa diakses dari landing page |

---

## 3. Kebutuhan Fungsional — User (Warga)

### 3.1 Autentikasi & Akun

| ID | Requirement | Prioritas | Acceptance Criteria |
|----|-------------|-----------|---------------------|
| URS-U-01 | User dapat mendaftar akun baru | MUST | Form input: nama lengkap, NIK (16 digit), nomor HP, email, password. Validasi format dan duplikasi |
| URS-U-02 | User menerima verifikasi setelah registrasi | MUST | Kode OTP dikirim ke email terdaftar |
| URS-U-03 | User dapat login dengan email + password | MUST | Login berhasil → redirect ke dashboard. Gagal → pesan error spesifik |
| URS-U-04 | User dapat logout | MUST | Token di-invalidate, redirect ke halaman login |
| URS-U-05 | User dapat request reset password | MUST | Link reset dikirim ke email, berlaku 1 jam |
| URS-U-06 | User dapat mengedit profil (nama, HP, foto profil) | SHOULD | Perubahan tersimpan, foto profil maks 2MB |
| URS-U-07 | NIK tidak bisa diubah setelah registrasi | MUST | Field NIK di profil disabled/read-only |

### 3.2 Pelaporan Kerusakan

| ID | Requirement | Prioritas | Acceptance Criteria |
|----|-------------|-----------|---------------------|
| URS-U-08 | User dapat membuat laporan baru | MUST | Form laporan dapat diakses dari dashboard dan peta |
| URS-U-09 | User wajib melampirkan minimal 1 foto kerusakan | MUST | Upload gagal jika tidak ada foto. Format: JPG/PNG/WEBP, maks 5MB per foto, maks 5 foto |
| URS-U-10 | Lokasi GPS otomatis terdeteksi saat buat laporan | MUST | Browser meminta izin lokasi. Koordinat lat/lng tersimpan |
| URS-U-11 | User dapat adjust pin lokasi manual di peta jika GPS tidak akurat | SHOULD | Drag pin di peta untuk koreksi lokasi |
| URS-U-12 | User memilih kategori fasilitas | MUST | Dropdown: Jalan, Jembatan, Drainase, Lampu Jalan, Taman, Fasilitas Olahraga, Lainnya |
| URS-U-13 | User memilih tingkat kerusakan | MUST | Radio button: Ringan / Sedang / Berat (dengan deskripsi panduan) |
| URS-U-14 | User dapat mengisi deskripsi tambahan | SHOULD | Textarea maks 500 karakter, opsional |
| URS-U-15 | User dapat melihat preview foto sebelum submit | SHOULD | Thumbnail foto tampil sebelum form disubmit |
| URS-U-16 | Laporan berhasil dibuat → konfirmasi tampil | MUST | Modal/toast sukses muncul, nomor laporan ditampilkan |

### 3.3 Pemantauan Laporan

| ID | Requirement | Prioritas | Acceptance Criteria |
|----|-------------|-----------|---------------------|
| URS-U-17 | User dapat melihat daftar semua laporan miliknya | MUST | Halaman "Laporan Saya" dengan list, urut terbaru |
| URS-U-18 | User dapat filter laporan by status | SHOULD | Filter: Semua / Menunggu / Diproses / Selesai / Ditolak |
| URS-U-19 | User dapat melihat detail laporan | MUST | Tampil: foto, lokasi, kategori, tingkat, status, timeline riwayat status |
| URS-U-20 | User dapat melihat alasan penolakan jika laporan ditolak | MUST | Alasan penolakan tampil jelas di detail laporan |
| URS-U-21 | User dapat melihat foto bukti perbaikan dari admin | MUST | Foto perbaikan muncul di detail laporan saat status Selesai |

### 3.4 Notifikasi

| ID | Requirement | Prioritas | Acceptance Criteria |
|----|-------------|-----------|---------------------|
| URS-U-22 | User menerima notifikasi in-app saat status laporan berubah | MUST | Badge notifikasi bertambah, list notifikasi tampil |
| URS-U-23 | Notifikasi "Laporan Selesai" menyertakan foto bukti perbaikan | MUST | Foto perbaikan bisa dilihat dari notifikasi |
| URS-U-24 | User dapat menandai notifikasi sebagai sudah dibaca | SHOULD | Klik notifikasi → status read, badge berkurang |

### 3.5 Peta Interaktif

| ID | Requirement | Prioritas | Acceptance Criteria |
|----|-------------|-----------|---------------------|
| URS-U-25 | User dapat melihat peta seluruh laporan di Kabupaten Malang | MUST | Peta tampil dengan pin berwarna sesuai tingkat kerusakan |
| URS-U-26 | User dapat filter pin di peta | SHOULD | Filter: kategori fasilitas, tingkat kerusakan, status laporan |
| URS-U-27 | Klik pin di peta → tampil popup detail laporan | MUST | Popup: foto thumbnail, kategori, tingkat, status |
| URS-U-28 | Peta memiliki legenda warna | MUST | Legenda: Ringan (hijau), Sedang (kuning), Berat (merah), Selesai (abu) |

### 3.6 Rating

| ID | Requirement | Prioritas | Acceptance Criteria |
|----|-------------|-----------|---------------------|
| URS-U-29 | User dapat memberi rating 1-5 bintang setelah laporan selesai | COULD | Form rating muncul setelah status berubah ke Selesai |
| URS-U-30 | User dapat meninggalkan komentar pada rating | COULD | Textarea opsional, maks 200 karakter |
| URS-U-31 | Rating hanya bisa diberikan sekali per laporan | COULD | Tombol rating disabled setelah dinilai |

### 3.7 Integrasi Telegram Bot

| ID | Requirement | Prioritas | Acceptance Criteria |
|----|-------------|-----------|---------------------|
| URS-U-32 | User dapat menautkan akun Telegram | MUST | Mengirimkan nomor HP (Share Contact) ke bot. Jika nomor terdaftar di web, akun tertaut otomatis |
| URS-U-33 | User dapat membuat laporan baru via Telegram | MUST | Menggunakan perintah `/lapor`. Alur percakapan memandu upload foto, kirim lokasi, pilih kategori, tingkat kerusakan, & deskripsi |
| URS-U-34 | User menerima notifikasi perkembangan status laporan di Telegram | MUST | Setiap perubahan status (Diproses, Selesai, Ditolak) dikirim langsung sebagai pesan Telegram ke user |
| URS-U-35 | Telegram bot merespons perintah bantuan | SHOULD | Perintah `/help` menampilkan panduan cara pelaporan dan penautan akun |

---

## 4. Kebutuhan Fungsional — Admin

### 4.1 Autentikasi

| ID | Requirement | Prioritas | Acceptance Criteria |
|----|-------------|-----------|---------------------|
| URS-A-01 | Admin login dengan email + password | MUST | Halaman login terpisah dari user (/admin/login) |
| URS-A-02 | Admin dapat logout | MUST | Sesi berakhir, redirect ke login admin |
| URS-A-03 | Akun admin tidak bisa self-register | MUST | Hanya super admin yang bisa buat akun admin |
| URS-A-04 | Session admin expired setelah 8 jam tidak aktif | MUST | Auto logout dan redirect ke login |

### 4.2 Dashboard

| ID | Requirement | Prioritas | Acceptance Criteria |
|----|-------------|-----------|---------------------|
| URS-A-05 | Admin melihat ringkasan statistik di dashboard | MUST | Card: total laporan, laporan hari ini, menunggu verifikasi, selesai bulan ini |
| URS-A-06 | Dashboard menampilkan grafik laporan per hari (7 hari terakhir) | SHOULD | Bar/line chart jumlah laporan masuk per hari |
| URS-A-07 | Dashboard menampilkan breakdown per kecamatan | SHOULD | Tabel atau chart sebaran laporan per kecamatan |
| URS-A-08 | Dashboard menampilkan breakdown per kategori fasilitas | SHOULD | Pie/donut chart kategori fasilitas |
| URS-A-09 | Dashboard memiliki peta sebaran laporan aktif | SHOULD | Peta dengan pin laporan yang belum selesai |

### 4.3 Manajemen Laporan

| ID | Requirement | Prioritas | Acceptance Criteria |
|----|-------------|-----------|---------------------|
| URS-A-10 | Admin melihat daftar semua laporan masuk | MUST | Tabel dengan: nomor, tanggal, pelapor, kategori, tingkat, kecamatan, status |
| URS-A-11 | Admin dapat filter laporan by status, kategori, kecamatan, tanggal | MUST | Multi-filter tersedia di halaman daftar laporan |
| URS-A-12 | Admin dapat search laporan by nomor atau nama pelapor | SHOULD | Search input di halaman daftar laporan |
| URS-A-13 | Admin dapat melihat detail laporan lengkap | MUST | Tampil semua data: foto pelapor, info user, lokasi di peta mini, timeline status |
| URS-A-14 | Admin dapat mengubah status laporan ke "Diproses" | MUST | Tombol "Proses" tersedia di detail laporan status Menunggu |
| URS-A-15 | Admin dapat menolak laporan dengan wajib mengisi alasan | MUST | Form penolakan wajib diisi, alasan dikirim ke user via notifikasi |
| URS-A-16 | Admin WAJIB upload foto bukti perbaikan sebelum status Selesai | MUST | Tombol "Selesai" hanya aktif setelah foto perbaikan diunggah |
| URS-A-17 | Admin dapat upload 1-5 foto bukti perbaikan | MUST | Format: JPG/PNG/WEBP, maks 5MB per foto |
| URS-A-18 | Foto bukti perbaikan otomatis dikirim ke user via notifikasi | MUST | Notifikasi user langsung muncul setelah admin klik Selesai |
| URS-A-19 | Admin dapat menambahkan catatan internal pada laporan | SHOULD | Catatan tidak tampil ke user, hanya untuk admin |

### 4.4 Export & Laporan

| ID | Requirement | Prioritas | Acceptance Criteria |
|----|-------------|-----------|---------------------|
| URS-A-20 | Admin dapat export daftar laporan ke CSV | SHOULD | Tombol export, file langsung diunduh |
| URS-A-21 | Admin dapat filter data sebelum export | SHOULD | Export mengikuti filter aktif yang dipilih |

### 4.5 Manajemen Admin (Super Admin)

| ID | Requirement | Prioritas | Acceptance Criteria |
|----|-------------|-----------|---------------------|
| URS-A-22 | Super admin dapat membuat akun admin baru | MUST | Form: nama, email, password, role (admin/super_admin) |
| URS-A-23 | Super admin dapat menonaktifkan akun admin | MUST | Toggle aktif/nonaktif di halaman kelola admin |
| URS-A-24 | Super admin dapat mereset password admin | SHOULD | Reset via email, link berlaku 1 jam |

---

## 5. Kebutuhan Non-Fungsional

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| URS-NF-01 | Sistem berjalan di browser modern (Chrome 90+, Firefox 88+, Safari 14+) | MUST |
| URS-NF-02 | UI responsif untuk mobile (min 375px) dan desktop (min 1280px) | MUST |
| URS-NF-03 | API response time < 500ms untuk query normal | MUST |
| URS-NF-04 | Semua komunikasi menggunakan HTTPS | MUST |
| URS-NF-05 | NIK user disimpan terenkripsi (AES-256) di database | MUST |
| URS-NF-06 | Password di-hash dengan bcrypt (salt rounds: 12) | MUST |
| URS-NF-07 | Upload foto hanya menerima JPG, PNG, WEBP — maks 5MB per file | MUST |
| URS-NF-08 | Rate limiting: maks 100 request/menit per IP | MUST |
| URS-NF-09 | Sistem bisa menangani 1.000 concurrent users | SHOULD |
| URS-NF-10 | Database di-backup otomatis setiap hari pukul 02.00 WIB | MUST |
| URS-NF-11 | Log semua aktivitas admin tersimpan (audit trail) | MUST |
| URS-NF-12 | Pesan error API menggunakan format standar (code + message) | MUST |
