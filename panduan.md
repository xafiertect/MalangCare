# Panduan Setup LAPOR MALANG

Panduan lengkap untuk menjalankan proyek LAPOR MALANG dari nol, termasuk semua dependensi, konfigurasi environment, database, bot Telegram, dan deployment production.

## Daftar Isi (Tambahan)
- [Deployment Production (VPS)](#deployment-production-vps)

---

## Daftar Isi

1. [Kebutuhan Sistem](#1-kebutuhan-sistem)
2. [Instalasi Prasyarat](#2-instalasi-prasyarat)
3. [Clone & Struktur Proyek](#3-clone--struktur-proyek)
4. [Konfigurasi Environment Variables](#4-konfigurasi-environment-variables)
5. [Cara A — Menjalankan dengan Docker (Rekomendasi)](#5-cara-a--menjalankan-dengan-docker-rekomendasi)
6. [Cara B — Menjalankan Lokal Tanpa Docker](#6-cara-b--menjalankan-lokal-tanpa-docker)
7. [Inisialisasi Database](#7-inisialisasi-database)
8. [Setup Bot Telegram](#8-setup-bot-telegram)
9. [Verifikasi Semua Service](#9-verifikasi-semua-service)
10. [Akun Default Setelah Seed](#10-akun-default-setelah-seed)
11. [Perintah Berguna](#11-perintah-berguna)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Kebutuhan Sistem

| Komponen | Minimum | Rekomendasi |
|----------|---------|-------------|
| OS | Linux / macOS / Windows (WSL2) | Ubuntu 22.04 / Arch Linux |
| RAM | 4 GB | 8 GB |
| Storage | 5 GB | 10 GB |
| CPU | 2 core | 4 core |

---

## 2. Instalasi Prasyarat

### 2.1 Docker & Docker Compose (wajib untuk Cara A)

**Ubuntu/Debian:**
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Verifikasi
docker --version
docker compose version
```

**Arch Linux:**
```bash
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```

**macOS:**
Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).

---

### 2.2 Node.js 20 LTS (wajib untuk Cara B / development lokal)

**Menggunakan nvm (disarankan):**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc  # atau ~/.zshrc

# Install & gunakan Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verifikasi
node --version   # v20.x.x
npm --version    # 10.x.x
```

---

### 2.3 PostgreSQL 15 (hanya Cara B)

**Ubuntu/Debian:**
```bash
sudo apt install postgresql-15
sudo systemctl enable --now postgresql
```

**Arch Linux:**
```bash
sudo pacman -S postgresql
sudo -u postgres initdb -D /var/lib/postgres/data
sudo systemctl enable --now postgresql
```

Buat user dan database:
```bash
sudo -u postgres psql -c "CREATE USER lapor_user WITH PASSWORD 'strong_postgres_password';"
sudo -u postgres psql -c "CREATE DATABASE lapor_malang OWNER lapor_user;"
```

---

### 2.4 Redis 7 (hanya Cara B)

**Ubuntu/Debian:**
```bash
sudo apt install redis-server
sudo systemctl enable --now redis-server
```

**Arch Linux:**
```bash
sudo pacman -S redis
sudo systemctl enable --now redis
```

Aktifkan password di `/etc/redis/redis.conf`:
```
requirepass strong_redis_password
```
```bash
sudo systemctl restart redis
```

---

### 2.5 MinIO (hanya Cara B)

```bash
# Download binary
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Jalankan MinIO
mkdir -p ~/minio-data
MINIO_ROOT_USER=minioadmin_lapor MINIO_ROOT_PASSWORD=miniosecret_lapor_pass \
  minio server ~/minio-data --console-address ":9001" &
```

Akses konsol MinIO di `http://localhost:9001`, lalu buat bucket bernama `lapor-malang` dan atur public policy untuk folder `public/`.

---

## 3. Clone & Struktur Proyek

```bash
git clone <url-repository> malang-care
cd malang-care
```

Struktur utama:
```
malang-care/
├── backend/          # Express.js API (port 5000)
├── frontend/         # React + Vite (port 3000/3001)
├── docker-compose.yml          # Development
├── docker-compose.prod.yml     # Production override
├── .env.example                # Template env root (untuk Docker)
└── panduan.md
```

---

## 4. Konfigurasi Environment Variables

### 4.1 Buat file `.env` di root (dipakai Docker Compose)

```bash
cp .env.example .env
```

Edit `.env` dan isi semua nilai:

```env
# ─── JWT ────────────────────────────────────────────────────────
JWT_SECRET=isi_dengan_min_32_karakter_random_string_bebas
JWT_REFRESH_SECRET=isi_dengan_min_32_karakter_random_string_berbeda
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─── DATABASE ───────────────────────────────────────────────────
DB_PASSWORD=password_postgresql_yang_kuat

# ─── REDIS ──────────────────────────────────────────────────────
REDIS_PASSWORD=password_redis_yang_kuat

# ─── MINIO ──────────────────────────────────────────────────────
MINIO_ACCESS_KEY=minioadmin_lapor
MINIO_SECRET_KEY=miniosecret_lapor_pass
MINIO_BUCKET_NAME=lapor-malang
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=http://localhost:9000

# ─── ENCRYPTION (NIK) ───────────────────────────────────────────
# Generate key dengan: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=<hasil_64_karakter_hex>

# ─── SMTP (Email OTP) ───────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=emailkamu@gmail.com
SMTP_PASS=app_password_dari_google

# ─── SYSTEM ─────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
VITE_API_URL=http://localhost:5000/api
VITE_MINIO_PUBLIC_URL=http://localhost:9000

# ─── TELEGRAM BOT ───────────────────────────────────────────────
TELEGRAM_BOT_TOKEN=token_dari_botfather
TELEGRAM_BOT_ACTIVE=true
```

**Generate ENCRYPTION_KEY:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Generate JWT_SECRET dan JWT_REFRESH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Jalankan dua kali dan gunakan hasil berbeda untuk JWT_SECRET dan JWT_REFRESH_SECRET
```

---

### 4.2 Gmail App Password (untuk SMTP)

Jika menggunakan Gmail:
1. Aktifkan **2-Step Verification** di akun Google
2. Buka [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Buat App Password baru → pilih **Mail** → salin 16-karakter password
4. Gunakan sebagai nilai `SMTP_PASS`

---

### 4.3 Buat `backend/.env` (hanya untuk Cara B / dev lokal tanpa Docker)

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` — **perhatikan perbedaan host** (lokal = `localhost`, bukan nama container):

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgresql://lapor_user:strong_postgres_password@localhost:5432/lapor_malang

JWT_SECRET=sama_dengan_root_env
JWT_REFRESH_SECRET=sama_dengan_root_env
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

REDIS_URL=redis://:strong_redis_password@localhost:6379
REDIS_PASSWORD=strong_redis_password

# Penting: MINIO_ENDPOINT = localhost untuk dev lokal
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin_lapor
MINIO_SECRET_KEY=miniosecret_lapor_pass
MINIO_BUCKET_NAME=lapor-malang
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=http://localhost:9000

ENCRYPTION_KEY=<64_karakter_hex>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=emailkamu@gmail.com
SMTP_PASS=app_password_dari_google

TELEGRAM_BOT_TOKEN=token_dari_botfather
TELEGRAM_BOT_ACTIVE=true
```

---

### 4.4 Buat `frontend/.env` (hanya untuk Cara B)

```bash
cp frontend/.env.example frontend/.env
```

Isi `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_MINIO_PUBLIC_URL=http://localhost:9000
VITE_MAP_DEFAULT_LAT=-8.1654
VITE_MAP_DEFAULT_LNG=112.6208
VITE_MAP_DEFAULT_ZOOM=11
```

---

## 5. Cara A — Menjalankan dengan Docker (Rekomendasi)

### 5.1 Jalankan semua service

```bash
# Dari root proyek
docker compose up -d
```

Ini akan menjalankan 6 service sekaligus:
| Container | Service | Port Host |
|-----------|---------|-----------|
| `lapor_postgres` | PostgreSQL 15 | 5433 |
| `lapor_redis` | Redis 7 | 6379 |
| `lapor_minio` | MinIO | 9000, 9001 |
| `lapor_minio_init` | Buat bucket otomatis | — |
| `lapor_backend` | Express API | 5000 |
| `lapor_frontend` | Vite dev server | 3001 |

### 5.2 Inisialisasi database (pertama kali saja)

Tunggu hingga backend siap (~30 detik), lalu:
```bash
# Jalankan migrasi
docker exec lapor_backend npx prisma migrate dev --name init

# Isi data awal (super admin)
docker exec lapor_backend node prisma/seed.js
```

### 5.3 Cek status

```bash
docker compose ps
docker compose logs -f backend   # lihat log backend real-time
```

### 5.4 Akses aplikasi

| Layanan | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:5000/api |
| Health check | http://localhost:5000/health |
| MinIO Console | http://localhost:9001 |

---

## 6. Cara B — Menjalankan Lokal Tanpa Docker

Pastikan PostgreSQL, Redis, dan MinIO sudah berjalan (lihat [Bagian 2](#2-instalasi-prasyarat)).

### 6.1 Install dependensi backend

```bash
cd backend
npm install
npx prisma generate
```

### 6.2 Jalankan backend

```bash
cd backend
npm run dev
# Berjalan di http://localhost:5000
```

### 6.3 Install dependensi frontend

```bash
cd frontend
npm install
```

### 6.4 Jalankan frontend

```bash
cd frontend
npm run dev
# Berjalan di http://localhost:3000
```

---

## 7. Inisialisasi Database

### 7.1 Migrasi schema

**Via Docker:**
```bash
docker exec lapor_backend npx prisma migrate dev --name init
```

**Lokal:**
```bash
cd backend
npm run prisma:migrate
```

### 7.2 Seed data awal

**Via Docker:**
```bash
docker exec lapor_backend node prisma/seed.js
```

**Lokal:**
```bash
cd backend
npm run prisma:seed
```

### 7.3 Buka Prisma Studio (opsional, untuk inspeksi database)

**Lokal:**
```bash
cd backend
npx prisma studio
# Buka di http://localhost:5555
```

---

## 8. Setup Bot Telegram

Bot Telegram memungkinkan pengguna membuat laporan kerusakan langsung dari Telegram tanpa membuka website.

### 8.1 Buat Bot di BotFather

1. Buka Telegram → cari `@BotFather`
2. Kirim perintah `/newbot`
3. Masukkan **nama bot** (contoh: `LAPOR MALANG Bot`)
4. Masukkan **username bot** — harus diakhiri `bot` (contoh: `lapor_malang_bot`)
5. BotFather akan memberikan token seperti:
   ```
   123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 8.2 Isi token di `.env`

**Cara A (Docker) — edit root `.env`:**
```env
TELEGRAM_BOT_TOKEN=123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_BOT_ACTIVE=true
```
Lalu restart backend:
```bash
docker compose restart backend
```

**Cara B (lokal) — edit `backend/.env`:**
```env
TELEGRAM_BOT_TOKEN=123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_BOT_ACTIVE=true
```
Lalu restart `npm run dev`.

### 8.3 Cara kerja bot

| Perintah | Fungsi |
|----------|--------|
| `/start` | Salam dan daftar perintah |
| `/lapor` | Mulai alur pembuatan laporan (foto → lokasi GPS → kategori → tingkat kerusakan → deskripsi → konfirmasi) |
| `/status` | Lihat 3 laporan terbaru beserta statusnya |
| `/help` | Panduan penggunaan |
| `/cancel` | Batalkan proses laporan yang sedang berjalan |

### 8.4 Penautan akun

Pengguna wajib menautkan akun Telegram mereka dengan akun LAPOR MALANG terlebih dahulu:
1. Kirim pesan apa saja ke bot
2. Bot akan meminta **Share Contact**
3. Nomor HP yang dibagikan akan dicocokkan dengan database
4. Jika cocok, akun akan tertaut dan bot bisa digunakan penuh

> **Catatan:** Pengguna harus sudah mendaftar dan memverifikasi akun di website terlebih dahulu sebelum bisa menggunakan bot Telegram.

### 8.5 Notifikasi otomatis via Telegram

Jika akun sudah tertaut, pengguna akan menerima notifikasi Telegram otomatis saat status laporannya berubah (Diproses, Selesai, atau Ditolak).

---

## 9. Verifikasi Semua Service

Jalankan perintah berikut untuk memastikan semua berjalan dengan benar:

```bash
# 1. Cek semua container berjalan (Cara A)
docker compose ps

# 2. Health check backend
curl http://localhost:5000/health
# Expected: {"status":"ok","timestamp":"..."}

# 3. Test endpoint publik (laporan untuk peta)
curl http://localhost:5000/api/reports/public
# Expected: {"success":true,"message":"...","data":[...]}

# 4. Cek koneksi Redis (Cara A)
docker exec lapor_redis redis-cli -a ${REDIS_PASSWORD} ping
# Expected: PONG

# 5. Cek PostgreSQL (Cara A)
docker exec lapor_postgres pg_isready -U lapor_user -d lapor_malang
# Expected: .../lapor_malang - accepting connections

# 6. Akses MinIO Console
# Buka http://localhost:9001 di browser
# Login dengan MINIO_ACCESS_KEY dan MINIO_SECRET_KEY

# 7. Cek log backend untuk status bot Telegram
docker compose logs backend | grep -i telegram
# Expected: 🤖 Memulai polling bot Telegram...
```

---

## 10. Akun Default Setelah Seed

Setelah menjalankan `prisma:seed`, akun berikut akan dibuat secara otomatis:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@lapormalang.id` | `SuperAdmin@2026!` |

> **Penting:** Segera ganti password Super Admin setelah pertama kali login melalui `/admin/login`.

Halaman login admin berada di: `http://localhost:3001/admin/login`

---

## 11. Perintah Berguna

### Docker

```bash
# Jalankan semua service
docker compose up -d

# Matikan semua service
docker compose down

# Matikan + hapus semua volume (reset data)
docker compose down -v

# Restart satu service
docker compose restart backend

# Lihat log service tertentu
docker compose logs -f backend
docker compose logs -f frontend

# Masuk ke shell container
docker exec -it lapor_backend sh
docker exec -it lapor_postgres psql -U lapor_user -d lapor_malang

# Rebuild image setelah perubahan Dockerfile
docker compose up -d --build backend
```

### Prisma

```bash
# Jalankan migrasi baru setelah ubah schema.prisma
npx prisma migrate dev --name nama_perubahan

# Deploy migrasi ke production
npx prisma migrate deploy

# Reset database (hapus semua data + jalankan ulang migrasi)
npx prisma migrate reset

# Regenerasi Prisma Client setelah ubah schema
npx prisma generate

# Buka Prisma Studio (GUI database)
npx prisma studio
```

### Backend Lokal

```bash
cd backend
npm run dev        # Development dengan nodemon
npm run start      # Production
npm run prisma:migrate
npm run prisma:seed
npm run prisma:generate
```

### Frontend Lokal

```bash
cd frontend
npm run dev        # Development server (port 3000)
npm run build      # Build production ke dist/
npm run preview    # Preview build production
npm run lint       # ESLint check
```

---

## 12. Troubleshooting

### Backend tidak bisa connect ke database

```
Error: Can't reach database server at postgres:5432
```
- **Cara A:** Pastikan container `lapor_postgres` sudah `healthy`: `docker compose ps`
- **Cara B:** Pastikan `DATABASE_URL` di `backend/.env` menggunakan `localhost`, bukan `postgres`

---

### Backend error saat start — Environment validation failed

```
❌ Kesalahan konfigurasi environment variables
```
- Cek semua variabel wajib sudah diisi di `.env`
- `ENCRYPTION_KEY` harus tepat **64 karakter** hex
- `JWT_SECRET` dan `JWT_REFRESH_SECRET` minimal **32 karakter**
- `SMTP_USER` harus format email valid

---

### MinIO: upload foto gagal

- Pastikan bucket `lapor-malang` sudah dibuat (otomatis oleh `minio-init`, atau buat manual via konsol `localhost:9001`)
- Cek `MINIO_ENDPOINT` — di Docker gunakan `minio`, di lokal gunakan `localhost`
- Pastikan `MINIO_SECRET_KEY` minimal 8 karakter

---

### Bot Telegram tidak merespons

1. Pastikan `TELEGRAM_BOT_TOKEN` sudah diisi dengan token asli dari BotFather
2. Pastikan `TELEGRAM_BOT_ACTIVE=true`
3. Cek log backend: `docker compose logs backend | grep -i telegram`
4. Pastikan server bisa mengakses internet (bot menggunakan long-polling ke `api.telegram.org`)
5. Satu token hanya bisa digunakan oleh **satu instance** backend — jangan jalankan dua instance sekaligus

---

### Port sudah digunakan (address already in use)

```bash
# Cari proses yang menggunakan port
sudo lsof -i :5000
sudo lsof -i :3000

# Matikan proses tersebut
kill -9 <PID>
```

---

### Redis AUTH error

```
WRONGPASS invalid username-password pair
```
- Pastikan `REDIS_PASSWORD` di `.env` sama dengan password yang dikonfigurasi di Redis
- Cek format `REDIS_URL`: `redis://:PASSWORD@HOST:PORT` (tanda titik dua sebelum password wajib ada)

---

### Prisma P1001 — Can't reach database server

```bash
# Cek apakah PostgreSQL berjalan
sudo systemctl status postgresql

# Cek koneksi manual
psql postgresql://lapor_user:PASSWORD@localhost:5432/lapor_malang
```

---

## Deployment Production (VPS)

### Arsitektur Production

```
Internet (port 80/443)
    ↓
┌─────────────────────────────────────┐
│  Nginx (reverse proxy)              │  ← satu-satunya yang expose
│  lapor_nginx                        │
│  /*        → frontend:80 (static)   │
│  /api/*    → backend:5000 (API)     │
│  /uploads/ → backend:5000 (files)   │
└─────────────────────────────────────┘
         ↓ (internal Docker network)
┌──────────────────────────────────────────┐
│  lapor-network-prod (tidak bisa diakses) │
│  ├── frontend:80   (static files)        │
│  ├── backend:5000  (Express API)         │
│  ├── postgres:5432 (database)            │
│  ├── redis:6379    (cache/session)       │
│  └── minio:9000    (object storage)      │
└──────────────────────────────────────────┘
```

### Persiapan VPS

```bash
# Install Docker di VPS (Ubuntu)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone repo
git clone https://github.com/xafiertect/MalangCare.git
cd MalangCare
```

### Setup Environment Production

```bash
cp .env.example .env
nano .env   # isi semua nilai, terutama:
```

Nilai wajib diubah di `.env` untuk production:

```env
# Domain kamu
FRONTEND_URL=https://yourdomain.com

# Generate nilai aman (bukan placeholder!)
JWT_SECRET=<min 32 karakter random>
JWT_REFRESH_SECRET=<min 32 karakter random berbeda>
DB_PASSWORD=<password kuat>
REDIS_PASSWORD=<password kuat>
MINIO_ACCESS_KEY=<access key>
MINIO_SECRET_KEY=<min 8 karakter>
ENCRYPTION_KEY=<64 karakter hex>

# MinIO public URL (file foto diakses dari sini)
MINIO_PUBLIC_URL=https://yourdomain.com/files

# SMTP (untuk fitur reset password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=app_password

# Telegram Bot
TELEGRAM_BOT_TOKEN=token_dari_botfather
TELEGRAM_BOT_ACTIVE=true

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

### Jalankan Production

```bash
# Build dan jalankan semua service
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Jalankan migrasi + seed (pertama kali saja)
docker exec lapor_backend npx prisma migrate deploy
docker exec lapor_backend node prisma/seed.js

# Cek semua container berjalan
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Tambah File Foto via Nginx (opsional)

Jika ingin akses file MinIO melalui `/files/` di domain:

Tambahkan di `nginx/nginx.conf` dalam blok `server`:
```nginx
# Akses file MinIO via /files/
location /files/ {
    proxy_pass http://minio:9000/lapor-malang/;
    proxy_set_header Host minio:9000;
    expires 7d;
    add_header Cache-Control "public";
}
```

### Pasang SSL dengan Let's Encrypt

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Generate certificate (ganti yourdomain.com)
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificate ke folder nginx
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Uncomment blok HTTPS di nginx/nginx.conf
# lalu restart nginx
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx
```

### Perintah Berguna di Production

```bash
# Lihat log semua service
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Restart satu service
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend

# Update kode tanpa downtime
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build backend

# Backup database
docker exec lapor_postgres pg_dump -U lapor_user lapor_malang | gzip > backup_$(date +%Y%m%d).sql.gz
```
