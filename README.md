<div align="center">

# LAPOR MALANG

**Platform Digital Pelaporan Kerusakan Infrastruktur Publik**  
Kabupaten Malang, Jawa Timur

*Warga melapor. Dinas memproses. Publik memantau.*

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![MinIO](https://img.shields.io/badge/MinIO-S3_Storage-C72E49?style=flat-square&logo=minio&logoColor=white)](https://min.io)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## Tentang Proyek

**LAPOR MALANG** adalah sistem pelaporan infrastruktur berbasis web yang menghubungkan warga Kabupaten Malang dengan dinas terkait. Warga dapat melaporkan kerusakan jalan, jembatan, saluran drainase, dan fasilitas publik lainnya secara digital — lengkap dengan foto dan koordinat GPS — tanpa harus datang ke kantor.

Proyek ini dibangun sebagai full-stack monorepo dengan arsitektur production-ready: containerized via Docker, object storage berbasis S3, autentikasi JWT dengan refresh token, enkripsi NIK AES-256-GCM, dan integrasi bot Telegram.

---

## Fitur Utama

### Untuk Warga
- **Buat Laporan** — unggah foto (maks. 5), tandai lokasi via GPS atau peta interaktif, pilih kategori dan tingkat kerusakan
- **Pantau Status** — lacak progres laporan dari PENDING → IN\_PROGRESS → RESOLVED secara real-time
- **Peta Publik** — lihat semua laporan aktif di peta interaktif Kabupaten Malang
- **Notifikasi** — terima pemberitahuan in-app dan Telegram saat status laporan berubah
- **Login Google** — daftar dan masuk dengan akun Google
- **Bot Telegram** — buat laporan langsung dari Telegram tanpa membuka website

### Untuk Admin Dinas
- **Dashboard** — ringkasan statistik laporan per status, kategori, dan kecamatan
- **Kelola Laporan** — proses, tolak, atau selesaikan laporan dengan catatan dan foto bukti perbaikan
- **Audit Trail** — seluruh tindakan admin tercatat dengan timestamp dan IP address
- **Catatan Internal** — tambah komentar internal yang tidak terlihat oleh warga
- **Export CSV** — unduh data laporan dengan filter kategori, status, atau rentang tanggal

### Untuk Super Admin
- Semua akses Admin
- **Manajemen Admin** — buat, aktifkan, dan nonaktifkan akun admin dinas

---

## Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                     Production (via Nginx)                      │
│                                                                 │
│   Browser ──► Nginx :80/:443                                    │
│                  ├── /api/*    ──► backend:5000  (Express API)  │
│                  ├── /files/*  ──► minio:9000    (Foto publik)  │
│                  └── /*        ──► frontend:80   (React SPA)    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Internal Docker Network                      │
│                                                                 │
│   frontend (React + Vite)                                       │
│       │  Axios + JWT interceptor + auto-refresh                 │
│       ▼                                                         │
│   backend (Express.js)                                          │
│       ├── Routes → Controllers → Services → Prisma ORM         │
│       ├── Auth: JWT access (15m) + refresh token (7d)          │
│       ├── NIK encryption: AES-256-GCM                          │
│       ├── File upload: multer → MinIO (S3-compatible)          │
│       └── Cron jobs: OTP cleanup, notifikasi trim              │
│       │                                                         │
│       ├──► PostgreSQL 15  (data utama)                         │
│       ├──► Redis 7        (JWT blacklist + rate limit cache)    │
│       └──► MinIO          (foto laporan, avatar, bukti)        │
│                                                                 │
│   Telegram Bot  ──► long-polling ──► backend service           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Lapisan | Teknologi | Keterangan |
|---|---|---|
| **Frontend** | React 18, Vite 5 | SPA dengan HMR dan code splitting |
| **UI & Style** | Tailwind CSS 3, Lucide Icons | Design system custom berbasis utility |
| **State Management** | Zustand | Global auth, notifikasi, dan map state |
| **Peta** | React-Leaflet + OpenStreetMap | Peta interaktif dengan marker dinamis |
| **Grafik** | Recharts | Statistik laporan di dashboard admin |
| **Backend** | Node.js 20, Express.js 4 | REST API dengan arsitektur berlapis |
| **ORM** | Prisma 5 | Type-safe database access + migrasi |
| **Database** | PostgreSQL 15 | Relational DB dengan JSONB untuk notif |
| **Cache** | Redis 7 | JWT blacklist, rate limiting |
| **Storage** | MinIO (S3-compatible) | Object storage foto dengan ACL publik |
| **Auth** | JWT (access + refresh) | Short-lived access token + rotation |
| **Enkripsi** | AES-256-GCM | Enkripsi NIK warga di database |
| **Email** | Nodemailer + SMTP | OTP verifikasi akun & reset password |
| **Bot** | Telegram Bot API | Laporan via chat, notifikasi status |
| **OAuth** | Google OAuth 2.0 | Login dengan akun Google |
| **Container** | Docker + Docker Compose | Multi-service orchestration |
| **Reverse Proxy** | Nginx | SSL termination, routing, static serve |
| **Validasi** | Zod | Schema validation di backend dan env |

---

## Alur Status Laporan

```
         ┌─────────┐
         │ PENDING │  ◄── Laporan baru masuk dari warga / Telegram
         └────┬────┘
              │
     ┌────────┴────────┐
     ▼                 ▼
┌─────────────┐   ┌──────────┐
│ IN_PROGRESS │   │ REJECTED │  ◄── Admin tolak + wajib alasan ≥ 20 karakter
└──────┬──────┘   └──────────┘
       │
       │  Admin upload ≥ 1 foto bukti perbaikan
       ▼
  ┌──────────┐
  │ RESOLVED │  ◄── Selesai — warga bisa beri rating 1–5 bintang
  └──────────┘
```

Setiap transisi status dicatat di `ReportTimeline` dan memicu notifikasi otomatis ke warga.

---

## Struktur Proyek

```
MalangCare/
├── backend/
│   ├── src/
│   │   ├── config/          # Prisma, Redis, MinIO, env validator (Zod)
│   │   ├── controllers/     # Request handler — tipis, delegasi ke service
│   │   ├── services/        # Business logic, transaksi DB
│   │   ├── routes/          # Express router + middleware chain
│   │   ├── middleware/      # auth JWT, multer upload, Zod validate, audit log
│   │   ├── jobs/            # node-cron: OTP cleanup, notif trim
│   │   └── utils/           # apiResponse, logger, encryption, token helper
│   ├── prisma/
│   │   ├── schema.prisma    # 10+ model: User, Admin, Report, Timeline, dll
│   │   └── seed.js          # Super admin default
│   ├── Dockerfile           # Multi-stage production image
│   └── Dockerfile.dev       # Development image (nodemon)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/      # Landing, Login, Register, Map publik
│   │   │   ├── user/        # Dashboard, Laporan, Profil, Notifikasi
│   │   │   └── admin/       # Dashboard, Kelola laporan, Manajemen user
│   │   ├── components/      # Layout, Map, Report card, PhotoGallery
│   │   ├── stores/          # Zustand: authStore, notificationStore, mapStore
│   │   ├── services/        # Axios API clients per domain
│   │   └── hooks/           # useNotifications (polling 30s)
│   ├── Dockerfile           # Production: build → Nginx static
│   └── Dockerfile.dev       # Development: Vite dev server
│
├── nginx/
│   └── nginx.conf           # Routing, SSL, proxy ke MinIO /files/*
│
├── docker-compose.yml       # Stack development (6 service)
├── docker-compose.prod.yml  # Override production (Nginx, no exposed ports)
├── .env.example             # Template env lengkap dengan komentar
└── panduan.md               # Panduan setup & deployment lengkap
```

---

## Cara Menjalankan

### Dengan Docker (Direkomendasikan)

```bash
# 1. Clone repo
git clone https://github.com/xafiertect/MalangCare.git
cd MalangCare

# 2. Salin dan isi environment variables
cp .env.example .env
# Edit .env — isi JWT_SECRET, ENCRYPTION_KEY, DB_PASSWORD, dll

# 3. Jalankan semua service
docker compose up -d

# 4. Inisialisasi database (pertama kali saja)
docker exec lapor_backend npx prisma migrate deploy
docker exec lapor_backend node prisma/seed.js
```

| Service | URL |
|---|---|
| Aplikasi (warga) | http://localhost:3001 |
| Login Admin | http://localhost:3001/admin/login |
| REST API | http://localhost:5000/api |
| MinIO Console | http://localhost:9001 |

> Lihat [`panduan.md`](panduan.md) untuk panduan setup lengkap termasuk Google OAuth, Telegram Bot, SSL, dan deployment ke VPS.

---

## Akun Default

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@lapormalang.id` | `SuperAdmin@2026!` |

> Ganti password segera setelah login pertama.

---

## Keamanan

- **NIK** warga dienkripsi dengan AES-256-GCM sebelum disimpan ke database — tidak pernah tersimpan plaintext
- **JWT** access token berumur 15 menit; refresh token di-rotate setiap sesi baru
- **Logout** memblacklist access token di Redis hingga kedaluwarsa
- **Rate limiting** dan CORS dikonfigurasi di Express
- **Nginx** sebagai satu-satunya pintu masuk di production — database, Redis, dan MinIO tidak pernah terekspos ke internet
- **Audit log** mencatat seluruh tindakan admin (IP, timestamp, before/after value)

---

## Kontribusi & Lisensi

Proyek ini dikembangkan sebagai sistem nyata untuk kebutuhan pelaporan publik Kabupaten Malang.  
Dibuat dengan ❤️ oleh [Rizqi Maulidiyah](https://github.com/xafiertect) & [Elkana Xafier](https://github.com/xafiertect).

---

<div align="center">

*Built with Node.js · React · PostgreSQL · Docker*

</div>
