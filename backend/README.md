# LAPOR MALANG — Backend API

REST API backend untuk platform LAPOR MALANG, dibangun dengan **Node.js 20 + Express.js + Prisma + PostgreSQL**.

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Struktur Folder](#struktur-folder)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Endpoints](#api-endpoints)
- [Autentikasi](#autentikasi)
- [Upload File](#upload-file)
- [Cron Jobs](#cron-jobs)
- [Konvensi Kode](#konvensi-kode)

---

## Tech Stack

| Library | Versi | Fungsi |
|---------|-------|--------|
| Node.js | 20 LTS | Runtime |
| Express.js | 4.x | Web framework |
| Prisma | 5.x | ORM + migrasi database |
| PostgreSQL | 15 | Database utama |
| Redis (ioredis) | 5.x | Cache, blacklist token, refresh token store |
| jsonwebtoken | 9.x | JWT access & refresh token |
| bcrypt | 5.x | Hashing password (salt rounds: 12) |
| multer | 1.x | Multipart file upload (memory storage) |
| @aws-sdk/client-s3 | 3.x | MinIO client (S3-compatible) |
| zod | 3.x | Validasi request schema |
| nodemailer | 6.x | Pengiriman email (OTP, reset password) |
| helmet | 7.x | Security HTTP headers |
| express-rate-limit | 7.x | Rate limiting (100 req/menit per IP) |
| morgan | 1.x | HTTP request logging |
| winston | 3.x | Application logging |
| node-cron | 3.x | Scheduled jobs |
| csv-stringify | 6.x | Export laporan ke CSV |

---

## Struktur Folder

```
backend/
├── src/
│   ├── index.js                    # Entry point — start server + cron jobs
│   ├── app.js                      # Express setup (middleware + routes)
│   │
│   ├── config/
│   │   ├── database.js             # Prisma client instance
│   │   ├── redis.js                # Redis client instance
│   │   ├── minio.js                # MinIO/S3 client config
│   │   └── env.js                  # Validasi env vars (Zod)
│   │
│   ├── routes/
│   │   ├── auth.routes.js          # POST /api/auth/*
│   │   ├── report.routes.js        # /api/reports/*
│   │   ├── notification.routes.js  # /api/notifications/*
│   │   ├── user.routes.js          # /api/users/*
│   │   ├── map.routes.js           # GET /api/map (publik)
│   │   └── admin/
│   │       ├── adminReport.routes.js
│   │       ├── adminDashboard.routes.js
│   │       └── adminUser.routes.js
│   │
│   ├── controllers/                # Thin — hanya panggil service + kirim response
│   │   ├── auth.controller.js
│   │   ├── report.controller.js
│   │   ├── notification.controller.js
│   │   ├── user.controller.js
│   │   ├── map.controller.js
│   │   └── admin/
│   │       ├── adminReport.controller.js
│   │       ├── adminDashboard.controller.js
│   │       └── adminUser.controller.js
│   │
│   ├── services/                   # Business logic
│   │   ├── auth.service.js         # Register, OTP, login, refresh, logout, reset password
│   │   ├── report.service.js       # CRUD laporan + rating
│   │   ├── notification.service.js # Buat & kelola notifikasi in-app
│   │   ├── user.service.js         # Profil user + upload avatar
│   │   ├── storage.service.js      # Upload/delete file ke MinIO
│   │   └── admin/
│   │       ├── adminReport.service.js    # Verifikasi, evidence, export CSV
│   │       ├── adminDashboard.service.js # Statistik & chart data
│   │       └── adminUser.service.js      # CRUD admin account (super admin)
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT verify + blacklist check
│   │   ├── upload.middleware.js     # Multer (memory storage, 5MB limit)
│   │   ├── validate.middleware.js   # Zod schema validation
│   │   ├── rateLimiter.middleware.js # Global + auth rate limiter
│   │   ├── errorHandler.middleware.js # Central error handler
│   │   └── auditLog.middleware.js   # Utilitas tulis audit log admin
│   │
│   ├── validators/
│   │   ├── auth.validator.js        # Register, login, OTP schemas
│   │   ├── report.validator.js      # Create report, update status, rating schemas
│   │   └── admin.validator.js       # Create admin, forgot/reset password schemas
│   │
│   ├── utils/
│   │   ├── apiResponse.js          # successResponse / errorResponse helper
│   │   ├── encryption.js           # AES-256-GCM encrypt/decrypt (untuk NIK)
│   │   ├── generateToken.js        # JWT access + refresh token helpers
│   │   ├── reportNumber.js         # Generate nomor laporan LP-YYYYMMDD-XXXX
│   │   └── logger.js               # Winston logger config
│   │
│   └── jobs/
│       ├── cleanupOtpJob.js        # Hapus OTP expired setiap jam
│       ├── cleanupNotifJob.js      # Trim notifikasi >100 per user (tengah malam)
│       ├── backupReminderJob.js    # Log reminder backup pukul 02.00
│       └── index.js                # Setup semua cron jobs
│
├── prisma/
│   ├── schema.prisma               # Database schema (models + enums + indexes)
│   └── seed.js                     # Seed super admin default
│
├── .env.example                    # Template environment variables
├── Dockerfile                      # Production Dockerfile (multi-stage)
├── Dockerfile.dev                  # Development Dockerfile (nodemon)
└── package.json
```

---

## Instalasi & Menjalankan

### Development (tanpa Docker)

```bash
# Install dependencies
npm install

# Salin dan isi environment variables
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Jalankan migrasi database
npx prisma migrate dev --name init

# Seed data awal (super admin)
npx prisma db seed

# Jalankan development server (nodemon)
npm run dev
```

### Dengan Docker

```bash
# Dari root monorepo
docker compose up -d backend postgres redis minio

# Jalankan migrasi
docker compose exec backend npx prisma migrate dev --name init

# Seed
docker compose exec backend npx prisma db seed
```

---

## Environment Variables

Salin `.env.example` ke `.env` dan isi semua nilai:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://lapor_user:lapor_pass@localhost:5432/lapor_malang

# JWT (min. 32 karakter)
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://:password@localhost:6379
REDIS_PASSWORD=password_redis

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET_NAME=lapor-malang
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=http://localhost:9000

# Encryption (NIK) — generate dengan:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=64_karakter_hex

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=app_password
```

---

## Database

### Schema Utama

| Model | Keterangan |
|-------|-----------|
| `User` | Akun warga pelapor. NIK disimpan terenkripsi AES-256-GCM |
| `Admin` | Akun staf dinas. Dibuat hanya oleh Super Admin |
| `Report` | Laporan kerusakan fasilitas publik |
| `ReportPhoto` | Foto-foto dari pelapor (maks. 5 foto) |
| `ReportEvidence` | Foto bukti perbaikan dari admin |
| `ReportTimeline` | Riwayat perubahan status laporan |
| `AdminNote` | Catatan internal admin (tidak terlihat user) |
| `ReportRating` | Rating kepuasan user setelah laporan selesai (1–5 bintang) |
| `Notification` | Notifikasi in-app untuk user |
| `OtpToken` | Token OTP (verifikasi akun & reset password) |
| `AuditLog` | Log setiap aksi admin |

### Status Flow Laporan

```
PENDING → IN_PROGRESS → RESOLVED
PENDING → REJECTED
```

### Perintah Prisma

```bash
# Buat migrasi baru
npx prisma migrate dev --name nama_perubahan

# Deploy migrasi ke production
npx prisma migrate deploy

# Buka Prisma Studio (GUI database)
npx prisma studio

# Reset database (dev only — hapus semua data!)
npx prisma migrate reset
```

---

## API Endpoints

Base URL: `http://localhost:5000/api`

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/register` | — | Daftarkan akun warga baru |
| POST | `/verify-otp` | — | Verifikasi kode OTP email |
| POST | `/resend-otp` | — | Kirim ulang kode OTP |
| POST | `/login` | — | Login user atau admin |
| POST | `/refresh` | — | Perbarui access token |
| POST | `/logout` | JWT | Logout dan blacklist token |
| POST | `/forgot-password` | — | Kirim link reset password ke email |
| POST | `/reset-password` | — | Set password baru dengan token |

### Laporan User (`/api/reports`)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/public` | — | Data laporan untuk peta publik (tanpa data pribadi) |
| POST | `/` | User | Buat laporan baru (multipart/form-data + foto) |
| GET | `/my` | User | Daftar laporan milik user yang login |
| GET | `/:id` | User | Detail laporan |
| POST | `/:id/rate` | User | Berikan rating kepuasan (hanya jika RESOLVED) |

### Peta (`/api/map`)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/` | — | Data pin peta (lat, lng, kategori, status, foto utama) |

Query params opsional: `category`, `damage_level`, `status`, `district`

### Notifikasi (`/api/notifications`)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/` | User | Semua notifikasi milik user |
| PATCH | `/:id/read` | User | Tandai satu notifikasi dibaca |
| PATCH | `/read-all` | User | Tandai semua notifikasi dibaca |

### Profil User (`/api/users`)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/profile` | User | Ambil data profil |
| PATCH | `/profile` | User | Update nama / nomor HP |
| POST | `/profile/avatar` | User | Upload foto profil (field: `avatar`) |

### Admin — Laporan (`/api/admin/reports`)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/export` | Admin | Export CSV (ikuti filter aktif) |
| GET | `/` | Admin | Daftar semua laporan (filter + search) |
| GET | `/:id` | Admin | Detail laporan lengkap |
| PATCH | `/:id/status` | Admin | Ubah status (PENDING→IN_PROGRESS/REJECTED, IN_PROGRESS→RESOLVED) |
| POST | `/:id/evidence` | Admin | Upload foto bukti perbaikan (field: `photos`, maks 5) |
| POST | `/:id/notes` | Admin | Tambah catatan internal |

### Admin — Dashboard (`/api/admin/dashboard`)

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/stats` | Admin | Statistik overview + chart + kecamatan |

### Admin — Manajemen Admin (`/api/admin/users`) — Super Admin Only

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/` | Super Admin | Daftar semua admin |
| POST | `/` | Super Admin | Buat akun admin baru |
| PATCH | `/:id/status` | Super Admin | Aktifkan/nonaktifkan admin |
| POST | `/:id/reset-password` | Super Admin | Reset password admin (kirim email) |

---

## Autentikasi

Sistem menggunakan **JWT** dengan pola **Refresh Token Rotation (RTR)**:

1. Login → dapat `accessToken` (15 menit) + `refreshToken` (7 hari)
2. Setiap request terproteksi sertakan header: `Authorization: Bearer <accessToken>`
3. Saat access token expired → POST `/api/auth/refresh` dengan `refreshToken`
4. Refresh token lama di-invalidate, token baru diterbitkan (single-use)
5. Logout → access token di-blacklist di Redis, refresh token dihapus

**Format Response**

```json
{
  "success": true,
  "message": "Pesan sukses",
  "data": { ... }
}
```

```json
{
  "success": false,
  "message": "Pesan error",
  "errors": null
}
```

---

## Upload File

- **Middleware:** `multer` dengan memory storage
- **Storage:** MinIO (S3-compatible)
- **Batasan:** JPG / PNG / WEBP, maks 5MB per file, maks 5 file per request
- **Field names:**
  - Foto laporan: `photos` (array)
  - Foto bukti perbaikan: `photos` (array)
  - Foto profil/avatar: `avatar` (single)
- **URL format:** `${MINIO_PUBLIC_URL}/${BUCKET_NAME}/${folder}/${timestamp}-${uuid}.${ext}`

---

## Cron Jobs

| Job | Jadwal | Aksi |
|-----|--------|------|
| `cleanupOtpJob` | Setiap jam (`0 * * * *`) | Hapus OTP expired / sudah digunakan |
| `cleanupNotifJob` | Tengah malam (`0 0 * * *`) | Trim notifikasi >100 per user (FIFO) |
| `backupReminderJob` | Pukul 02.00 (`0 2 * * *`) | Log reminder backup database harian |

---

## Konvensi Kode

- **ES Modules** (`"type": "module"` di package.json) — gunakan `import/export`
- **Async/await** — semua operasi async menggunakan try/catch
- **Controller thin** — controller hanya extract data dari request, panggil service, kirim response
- **Service fat** — semua business logic, validasi bisnis, dan DB queries ada di service
- **Prisma transactions** — operasi multi-tabel menggunakan `prisma.$transaction()`
- **Standard response** — selalu gunakan `successResponse()` / `errorResponse()` dari `utils/apiResponse.js`
