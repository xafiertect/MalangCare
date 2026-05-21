# LAPOR MALANG

Platform digital berbasis web untuk pelaporan, verifikasi, dan pemantauan perbaikan kerusakan fasilitas publik di Kabupaten Malang secara transparan dan real-time.

---

## Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Tech Stack](#tech-stack)
- [Struktur Monorepo](#struktur-monorepo)
- [Prasyarat](#prasyarat)
- [Menjalankan dengan Docker (Rekomendasi)](#menjalankan-dengan-docker-rekomendasi)
- [Menjalankan Tanpa Docker](#menjalankan-tanpa-docker-development)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Akun Default (Seed)](#akun-default-seed)
- [Dokumentasi Lanjutan](#dokumentasi-lanjutan)

---

## Gambaran Umum

**LAPOR MALANG** terdiri dari tiga komponen utama:

| Komponen | Deskripsi | Port |
|----------|-----------|------|
| **Web App User** | Antarmuka warga untuk melapor dan memantau | 3000 |
| **Web App Admin** | Dashboard dinas untuk mengelola laporan | 3000 |
| **REST API** | Backend Express.js sebagai penghubung sistem | 5000 |

### Alur Kerja Utama

```
Warga membuat laporan (foto + GPS)
    │
    ▼
Admin dinas memverifikasi laporan
    │
    ├── Ditolak → Notifikasi + alasan dikirim ke warga
    │
    └── Diproses → Admin upload foto bukti → Selesai
                                                │
                                    Notifikasi + foto bukti dikirim ke warga
```

---

## Arsitektur Sistem

```
┌────────────────────────────────────────────────────────────┐
│                   Docker Network: lapor-network             │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────────┐  │
│  │ Frontend │    │ Backend  │    │  PostgreSQL 15        │  │
│  │  React   │◄──►│ Express  │◄──►│  (lapor_malang DB)   │  │
│  │ :3000    │    │  :5000   │    └──────────────────────┘  │
│  └──────────┘    └────┬─────┘                               │
│                       │         ┌──────────────────────┐    │
│                       ├────────►│  Redis               │    │
│                       │         │  (Token & Cache)      │    │
│                       │         └──────────────────────┘    │
│                       │         ┌──────────────────────┐    │
│                       └────────►│  MinIO               │    │
│                                 │  (Object Storage)     │    │
│                                 └──────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, Zustand, React-Leaflet, Recharts |
| **Backend** | Node.js 20, Express.js 4, Prisma 5 |
| **Database** | PostgreSQL 15 |
| **Cache / Auth Store** | Redis 7 |
| **File Storage** | MinIO (S3-compatible) |
| **Container** | Docker + Docker Compose |

---

## Struktur Monorepo

```
malang-care/
├── frontend/               # React SPA (user + admin interface)
│   ├── src/
│   │   ├── pages/          # Halaman publik, user, admin
│   │   ├── components/     # Komponen reusable (map, report, layout)
│   │   ├── services/       # API service layer (axios)
│   │   ├── stores/         # Zustand state management
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Constants, formatters, helpers
│   └── README.md
│
├── backend/                # Express REST API
│   ├── src/
│   │   ├── routes/         # API route definitions
│   │   ├── controllers/    # Request handlers (thin)
│   │   ├── services/       # Business logic layer
│   │   ├── middleware/     # Auth, upload, validation, error handler
│   │   ├── validators/     # Zod schemas
│   │   ├── config/         # DB, Redis, MinIO, env config
│   │   ├── utils/          # Helpers (token, encryption, logger)
│   │   └── jobs/           # Cron jobs (OTP cleanup, notif trim)
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.js         # Seed data awal (super admin)
│   └── README.md
│
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production overrides
└── README.md               # Dokumen ini
```

---

## Prasyarat

Pastikan sudah terinstal:

- [Docker](https://docs.docker.com/get-docker/) versi 24+
- [Docker Compose](https://docs.docker.com/compose/install/) versi 2.20+
- (Opsional, tanpa Docker) Node.js 20 LTS, PostgreSQL 15, Redis 7

---

## Menjalankan dengan Docker (Rekomendasi)

### 1. Clone dan konfigurasi environment

```bash
# Salin file environment dan isi nilainya
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` — minimal isi:

```env
JWT_SECRET=isi_min_32_karakter_random
JWT_REFRESH_SECRET=isi_min_32_karakter_random_berbeda
ENCRYPTION_KEY=isi_64_karakter_hex_random
REDIS_PASSWORD=password_redis_kuat
MINIO_ACCESS_KEY=minioadmin_lapor
MINIO_SECRET_KEY=miniosecret_lapor
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=app_password_gmail
```

> **Generate ENCRYPTION_KEY:** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 2. Jalankan semua service

```bash
docker compose up -d
```

### 3. Jalankan migrasi dan seed database

```bash
# Tunggu PostgreSQL healthy (~10 detik), lalu:
docker compose exec backend npx prisma migrate dev --name init
docker compose exec backend npx prisma db seed
```

### 4. Akses aplikasi

| Service | URL |
|---------|-----|
| Web App (User) | http://localhost:3000 |
| Web App (Admin) | http://localhost:3000/admin/login |
| REST API | http://localhost:5000 |
| MinIO Console | http://localhost:9001 |
| API Health | http://localhost:5000/health |

---

## Menjalankan Tanpa Docker (Development)

```bash
# 1. Backend
cd backend
cp .env.example .env   # isi nilai sesuai environment lokal
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev            # berjalan di port 5000

# 2. Frontend (terminal baru)
cd frontend
cp .env.example .env
npm install
npm run dev            # berjalan di port 3000
```

---

## Konfigurasi Environment

### Root `.env` (untuk Docker Compose)

Buat file `.env` di root project untuk variabel yang dipakai docker-compose:

```env
JWT_SECRET=...
JWT_REFRESH_SECRET=...
ENCRYPTION_KEY=...
REDIS_PASSWORD=...
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
```

Lihat detail lengkap di:
- [`backend/.env.example`](backend/.env.example)
- [`frontend/.env.example`](frontend/.env.example)

---

## Akun Default (Seed)

Setelah menjalankan `npx prisma db seed`:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@lapormalang.id` | `SuperAdmin@2026!` |

> **Penting:** Ganti password default segera setelah login pertama.

Super Admin dapat membuat akun Admin baru melalui menu **Manajemen Admin** di dashboard.

---

## Perintah Docker Berguna

```bash
# Melihat log semua service
docker compose logs -f

# Melihat log service tertentu
docker compose logs -f backend

# Masuk ke container backend
docker compose exec backend sh

# Akses psql langsung
docker compose exec postgres psql -U lapor_user -d lapor_malang

# Stop semua service
docker compose down

# Stop dan hapus semua data (HATI-HATI!)
docker compose down -v
```

---

## Dokumentasi Lanjutan

- [Backend README](backend/README.md) — API endpoints, arsitektur, database schema
- [Frontend README](frontend/README.md) — Struktur komponen, routing, state management
- [`.agents/rules/`](.agents/rules/) — PRD, URS, workflow, dan spesifikasi teknis lengkap

---

## Lisensi

Dikembangkan untuk BRIDA Kabupaten Malang. Hak cipta dilindungi.
