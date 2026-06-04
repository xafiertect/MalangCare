# ⚙️ System Workflow & Sequence Diagrams
## LAPOR MALANG — Alur Sistem Internal
**Versi:** 1.0.0 | **Tanggal:** Mei 2026

---

## 1. Arsitektur Sistem Overview

```
                        ┌─────────────────────────────────────┐
                        │          INTERNET / USER             │
                        └──────────────┬──────────────────────┘
                                       │ HTTPS
                                       ▼
                        ┌─────────────────────────────────────┐
                        │           NGINX (Port 80/443)        │
                        │        Reverse Proxy + SSL           │
                        └────────────┬────────────────────────┘
                                     │
                    ┌────────────────┴───────────────────┐
                    │                                     │
                    ▼                                     ▼
       ┌────────────────────────┐         ┌──────────────────────────┐
       │  React Frontend        │         │  Express.js Backend       │
       │  (Port 3000)           │◄───────►│  (Port 5000)              │
       │                        │  REST   │                            │
       │  • User App            │  API    │  • Auth Routes             │
       │  • Admin Dashboard     │         │  • Report Routes           │
       │  • Peta (Leaflet.js)   │         │  • Admin Routes            │
       │                        │         │  • Notification Routes     │
       └────────────────────────┘         └─────────────┬────────────┘
                                                        │
                               ┌────────────────────────┼──────────────────────┐
                               │                         │                      │
                               ▼                         ▼                      ▼
              ┌────────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐
              │   PostgreSQL 15        │  │   MinIO               │  │   Redis          │
              │   (Port 5432)          │  │   File Storage        │  │   (Port 6379)    │
              │                        │  │   (Port 9000)         │  │                  │
              │   • Users              │  │                        │  │  • JWT Blacklist │
              │   • Reports            │  │   • Foto Kerusakan    │  │  • Rate Limiting │
              │   • Notifications      │  │   • Foto Perbaikan    │  │  • Session Cache │
              │   • Audit Logs         │  │   • Foto Profil       │  │                  │
              └────────────────────────┘  └──────────────────────┘  └─────────────────┘
```

---

## 2. Sequence Diagram — Registrasi User

```
User Browser        Frontend            Backend API         Database            Email Service
     │                  │                    │                   │                    │
     │ Isi form reg      │                    │                   │                    │
     │──────────────────►│                    │                   │                    │
     │                  │ Validasi client     │                   │                    │
     │                  │ (format, required)  │                   │                    │
     │                  │──── POST /auth/register ──────────────►│                    │
     │                  │                    │ Cek duplikat NIK  │                    │
     │                  │                    │ dan Email         │                    │
     │                  │                    │──────────────────►│                    │
     │                  │                    │◄── Tidak ada ─────│                    │
     │                  │                    │ Hash password      │                    │
     │                  │                    │ Enkripsi NIK       │                    │
     │                  │                    │ Generate OTP (6 digit, expired 10 mnt) │
     │                  │                    │──────────────────►│                    │
     │                  │                    │ Simpan user + OTP │                    │
     │                  │                    │                   │                    │
     │                  │                    │─── Kirim OTP ─────────────────────────►│
     │                  │                    │                   │        OTP via Email│
     │                  │◄── 201 {msg: "OTP dikirim"} ──────────│                    │
     │ Form OTP muncul  │                    │                   │                    │
     │──────────────────►│                    │                   │                    │
     │ Masukkan OTP     │──── POST /auth/verify-otp ────────────►│                    │
     │                  │                    │ Cek OTP valid     │                    │
     │                  │                    │ & belum expired   │                    │
     │                  │                    │──────────────────►│                    │
     │                  │                    │◄── Valid ─────────│                    │
     │                  │                    │ Update is_verified=true                │
     │                  │                    │──────────────────►│                    │
     │                  │◄── 200 {msg: "Akun aktif"} ───────────│                    │
     │ Redirect Login   │                    │                   │                    │
```

---

## 3. Sequence Diagram — Login & JWT

```
User Browser        Frontend            Backend API         Database            Redis
     │                  │                    │                   │                  │
     │ Isi email+pass   │                    │                   │                  │
     │──────────────────►│                    │                   │                  │
     │                  │──── POST /auth/login ─────────────────►│                  │
     │                  │                    │ Cari user by email│                  │
     │                  │                    │──────────────────►│                  │
     │                  │                    │◄── User data ─────│                  │
     │                  │                    │ bcrypt compare     │                  │
     │                  │                    │ password hash      │                  │
     │                  │                    │ [MATCH]            │                  │
     │                  │                    │ Generate:          │                  │
     │                  │                    │ accessToken (15m)  │                  │
     │                  │                    │ refreshToken (7d)  │                  │
     │                  │                    │ Simpan refreshToken│                  │
     │                  │                    │──────────────────────────────────────►│
     │                  │◄── 200 {accessToken, refreshToken} ───│                  │
     │                  │ Simpan di           │                   │                  │
     │                  │ localStorage/cookie │                   │                  │
     │ Redirect Dashboard│                    │                   │                  │

[Setiap request API berikutnya]
     │──────────────────►│                    │                   │                  │
     │                  │ Tambahkan header:   │                   │                  │
     │                  │ Authorization:      │                   │                  │
     │                  │ Bearer {accessToken}│                   │                  │
     │                  │─────────── Request + JWT Header ──────►│                  │
     │                  │                    │ Verify JWT         │                  │
     │                  │                    │ Cek blacklist      │                  │
     │                  │                    │────────────────────────────────────── ►│
     │                  │                    │◄── Not blacklisted ────────────────── │
     │                  │                    │ Process request    │                  │

[Token Expired — Auto Refresh]
     │                  │◄── 401 Unauthorized │                   │                  │
     │                  │ Axios interceptor   │                   │                  │
     │                  │──── POST /auth/refresh {refreshToken} ─►│                  │
     │                  │                    │ Verify refreshToken│                  │
     │                  │                    │──────────────────────────────────────►│
     │                  │                    │◄── Valid ─────────────────────────── │
     │                  │                    │ Generate accessToken baru             │
     │                  │◄── 200 {accessToken} ─────────────────│                  │
     │                  │ Retry request asli  │                   │                  │
```

---

## 4. Sequence Diagram — Buat Laporan

```
User Browser        Frontend            Backend API         Database         MinIO Storage
     │                  │                    │                   │                  │
     │ Step 1-4 isi form│                    │                   │                  │
     │──────────────────►│                    │                   │                  │
     │ Klik Submit      │                    │                   │                  │
     │──────────────────►│                    │                   │                  │
     │                  │ Validasi form       │                   │                  │
     │                  │ (foto ada, lokasi,  │                   │                  │
     │                  │  kategori, tingkat) │                   │                  │
     │                  │──── POST /reports (multipart/form-data)►│                  │
     │                  │                    │ Validasi JWT       │                  │
     │                  │                    │ Validasi file type │                  │
     │                  │                    │ & size             │                  │
     │                  │                    │                    │                  │
     │                  │                    │─────── Upload foto ──────────────────►│
     │                  │                    │◄──── URL foto ──────────────────────── │
     │                  │                    │                    │                  │
     │                  │                    │ Generate nomor laporan                │
     │                  │                    │ (LP-YYYYMMDD-XXXX) │                  │
     │                  │                    │                    │                  │
     │                  │                    │ BEGIN TRANSACTION  │                  │
     │                  │                    │─── INSERT reports ─►                  │
     │                  │                    │─── INSERT report_photos ►             │
     │                  │                    │─── INSERT report_timeline ►           │
     │                  │                    │ COMMIT             │                  │
     │                  │                    │◄── report_id ──────│                  │
     │                  │◄── 201 {reportId, reportNumber} ────────│                  │
     │ Modal sukses     │                    │                   │                  │
     │ Redirect detail  │                    │                   │                  │
```

---

## 5. Sequence Diagram — Admin Verifikasi & Selesaikan Laporan

```
Admin Browser       Frontend(Admin)     Backend API        Database         Notif Service
     │                  │                    │                   │                  │
     │ Buka detail laporan                   │                   │                  │
     │──────────────────►│──── GET /admin/reports/:id ──────────►│                  │
     │                  │◄── 200 {report data + photos} ─────────│                  │
     │ Upload foto bukti │                    │                   │                  │
     │──────────────────►│                    │                   │                  │
     │                  │──── POST /admin/reports/:id/evidence ──►│                  │
     │                  │                    │ Validasi file      │                  │
     │                  │                    │ Upload ke MinIO    │                  │
     │                  │                    │ Simpan URL di DB   │                  │
     │                  │                    │──────────────────►│                  │
     │                  │◄── 200 {evidenceUrls} ─────────────────│                  │
     │ Tombol SELESAIKAN│                    │                   │                  │
     │ jadi aktif ✅    │                    │                   │                  │
     │                  │                    │                   │                  │
     │ Klik SELESAIKAN  │                    │                   │                  │
     │──────────────────►│                    │                   │                  │
     │                  │──── PATCH /admin/reports/:id/status ──►│                  │
     │                  │                    │ {status: RESOLVED} │                  │
     │                  │                    │ Validasi: foto     │                  │
     │                  │                    │ bukti ada          │                  │
     │                  │                    │                    │                  │
     │                  │                    │ BEGIN TRANSACTION  │                  │
     │                  │                    │─── UPDATE reports.status ────────────►│
     │                  │                    │─── INSERT report_timeline ────────────►│
     │                  │                    │─── INSERT notifications ──────────────►│
     │                  │                    │─── INSERT audit_logs ─────────────────►│
     │                  │                    │ COMMIT             │                  │
     │                  │                    │                    │                  │
     │                  │                    │──────────────────────────────────────►│
     │                  │                    │               Kirim notif in-app      │
     │                  │                    │               ke User (socket/polling)│
     │                  │◄── 200 {status: RESOLVED} ─────────────│                  │
     │ Status berubah ✅│                    │                   │                  │
     │ Audit log tampil │                    │                   │                  │
```

---

## 6. Sequence Diagram — Sistem Notifikasi

```
Backend API             Redis               Database            User Browser
     │                    │                    │                      │
     │ [Event: Status laporan berubah]         │                      │
     │──── Publish event ─►│                   │                      │
     │                    │                    │                      │
     │────── INSERT notification ─────────────►│                      │
     │                    │ {user_id,           │                      │
     │                    │  type,              │                      │
     │                    │  title,             │                      │
     │                    │  message,           │                      │
     │                    │  data: {report_id, │                      │
     │                    │         foto_urls}} │                      │
     │                    │                    │                      │
     │                    │              [User aktif melakukan polling]│
     │                    │                    │◄── GET /notifications ─│
     │                    │                    │    (setiap 30 detik)  │
     │◄─────── Query unread notifications ─────│                      │
     │──────────────────────────────────────── ►│                      │
     │◄── Notifikasi belum dibaca ─────────────│                      │
     │───────────────────────────────────────────────────────────────►│
     │                    │                    │     Badge +1 muncul  │
     │                    │                    │     Toast notifikasi  │
     │                    │                    │      tampil           │
```

---

## 7. Sequence Diagram — Upload Foto (Validasi & Storage)

```
Frontend               Backend API          Multer            MinIO
   │                       │                   │                 │
   │ File dipilih user     │                   │                 │
   │──── POST multipart ──►│                   │                 │
   │                       │── Middleware ─────►│                 │
   │                       │                   │ Validasi:       │
   │                       │                   │ • Tipe file     │
   │                       │                   │   (jpg,png,webp)│
   │                       │                   │ • Ukuran ≤ 5MB  │
   │                       │                   │ • Jumlah ≤ 5    │
   │                       │                   │                 │
   │                       │                   │ [GAGAL]         │
   │                       │◄── Error 400 ─────│                 │
   │◄── "File tidak valid"─│                   │                 │
   │                       │                   │                 │
   │                       │                   │ [SUKSES]        │
   │                       │                   │ Generate nama unik
   │                       │                   │ UUID + timestamp│
   │                       │                   │─────── PUT ────►│
   │                       │                   │         Simpan  │
   │                       │                   │         file    │
   │                       │◄── File URL ───────────────────────│
   │                       │ Simpan URL ke DB  │                 │
   │◄── 201 {urls[]} ──────│                   │                 │
```

---

## 8. Business Rules — System Level

### 8.1 Rules Pelaporan
```
RULE-001: Setiap laporan wajib memiliki minimal 1 foto
RULE-002: Foto harus berformat JPG/PNG/WEBP, max 5MB per file
RULE-003: Satu laporan max 5 foto
RULE-004: Koordinat GPS wajib ada (lat, lng valid di wilayah Kab. Malang)
RULE-005: Nomor laporan di-generate otomatis: LP-YYYYMMDD-XXXX (sequential per hari)
RULE-006: Status awal laporan SELALU = PENDING
RULE-007: User tidak bisa mengedit laporan setelah dikirim
RULE-008: User tidak bisa menghapus laporan (soft delete oleh admin only)
RULE-009: Pelaporan via Telegram hanya dapat dilakukan oleh user yang telah menautkan telegram_id ke akun MalangCare mereka
RULE-010: Foto laporan yang dikirim via Telegram akan diunggah ke storage MinIO secara otomatis menggunakan backend storage service
RULE-011: Lokasi laporan ditentukan dari koordinat GPS yang dikirimkan oleh user di Telegram. Jika koordinat di luar Kabupaten Malang, bot akan menolak laporan
RULE-012: Alamat (address) dan kecamatan (district) akan di-resolve menggunakan Nominatim reverse geocoding API dengan koordinat GPS yang diberikan
```

### 8.2 Rules Verifikasi Admin
```
RULE-101: Admin WAJIB upload foto bukti sebelum bisa set status RESOLVED
RULE-102: Penolakan laporan WAJIB disertai alasan (min 20 karakter)
RULE-103: Status flow hanya bisa maju, tidak bisa mundur:
          PENDING → IN_PROGRESS atau REJECTED
          IN_PROGRESS → RESOLVED
          (tidak bisa dari RESOLVED kembali ke IN_PROGRESS)
RULE-104: Semua perubahan status admin tercatat di audit_logs
RULE-105: Admin tidak bisa hapus laporan, hanya arsipkan (super admin only)
```

### 8.3 Rules Notifikasi
```
RULE-201: Notifikasi dikirim otomatis setiap perubahan status
RULE-202: Notifikasi RESOLVED wajib menyertakan URL foto bukti perbaikan
RULE-203: Notifikasi disimpan di database, tidak hilang meski tidak dibaca
RULE-204: Maks 100 notifikasi per user disimpan (FIFO — hapus yang terlama)
```

### 8.4 Rules Keamanan
```
RULE-301: JWT Access Token expire 15 menit
RULE-302: JWT Refresh Token expire 7 hari
RULE-303: Refresh Token single-use (rotate setelah dipakai)
RULE-304: Logout = refresh token di-blacklist di Redis
RULE-305: Rate limit: 100 request/menit per IP
RULE-306: Rate limit login: 5 percobaan gagal → lock 30 menit
RULE-307: NIK disimpan terenkripsi AES-256 di database
RULE-308: Admin session expire 8 jam tidak aktif
```
