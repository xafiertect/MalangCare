# Panduan Lengkap LAPOR MALANG

Panduan instalasi, konfigurasi, dan deployment sistem pelaporan infrastruktur **LAPOR MALANG** dari nol — mencakup development lokal, Docker, bot Telegram, Google OAuth, hingga deployment production ke VPS dengan SSL.

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
9. [Setup Google OAuth](#9-setup-google-oauth)
10. [Verifikasi Semua Service](#10-verifikasi-semua-service)
11. [Akun Default Setelah Seed](#11-akun-default-setelah-seed)
12. [Perintah Berguna](#12-perintah-berguna)
13. [Deployment Production — VPS](#13-deployment-production--vps)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Kebutuhan Sistem

| Komponen | Minimum | Rekomendasi |
|---|---|---|
| OS | Linux / macOS / Windows (WSL2) | Ubuntu 22.04 / Arch Linux |
| RAM | 4 GB | 8 GB |
| Disk | 10 GB | 20 GB |
| CPU | 2 core | 4 core |
| Koneksi | Ada akses internet | Stabil (untuk Telegram polling & email) |

> **VPS Production:** minimal 2 vCPU, 2 GB RAM, 20 GB SSD. Rekomendasi: 4 GB RAM untuk headroom.

---

## 2. Instalasi Prasyarat

### 2.1 Docker & Docker Compose (wajib untuk Cara A)

**Ubuntu / Debian:**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Verifikasi
docker --version          # Docker 24.x+
docker compose version    # Docker Compose v2.x+
```

**Arch Linux:**
```bash
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```

**macOS:** Instal [Docker Desktop](https://www.docker.com/products/docker-desktop/).

---

### 2.2 Node.js 20 LTS (wajib untuk Cara B dan generate secret keys)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc   # atau ~/.zshrc

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verifikasi
node --version   # v20.x.x
npm --version    # 10.x.x
```

---

### 2.3 PostgreSQL 15 (hanya Cara B)

**Ubuntu / Debian:**
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
sudo -u postgres psql << 'EOF'
CREATE USER lapor_user WITH PASSWORD 'strong_postgres_password';
CREATE DATABASE lapor_malang OWNER lapor_user;
\q
EOF
```

---

### 2.4 Redis 7 (hanya Cara B)

**Ubuntu / Debian:**
```bash
sudo apt install redis-server
sudo systemctl enable --now redis-server
```

**Arch Linux:**
```bash
sudo pacman -S redis
sudo systemctl enable --now redis
```

Aktifkan password — edit `/etc/redis/redis.conf`:
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
chmod +x minio && sudo mv minio /usr/local/bin/

# Jalankan di background
mkdir -p ~/minio-data
MINIO_ROOT_USER=minioadmin_lapor \
MINIO_ROOT_PASSWORD=miniosecret_lapor_pass \
  minio server ~/minio-data --console-address ":9001" &
```

Buka konsol MinIO di `http://localhost:9001`, masuk dengan kredensial di atas, lalu:
1. Buat bucket bernama `lapor-malang`
2. Buka tab **Access Rules** → tambah rule dengan prefix `public` dan policy `readonly`

> Semua foto yang diupload (laporan, avatar, bukti) disimpan di subfolder `public/` agar bisa diakses browser tanpa autentikasi.

---

## 3. Clone & Struktur Proyek

```bash
git clone <url-repository> lapor-malang
cd lapor-malang
```

Struktur utama:
```
lapor-malang/
├── backend/                      # Express.js API
│   ├── src/
│   │   ├── config/               # Prisma, Redis, MinIO, env validator
│   │   ├── controllers/          # Parse req/res, delegasi ke service
│   │   ├── services/             # Business logic, transaksi DB
│   │   ├── routes/               # Express router + middleware
│   │   ├── middleware/           # Auth JWT, upload multer, validasi Zod
│   │   ├── jobs/                 # Cron jobs (OTP cleanup, notif trim)
│   │   └── utils/                # Helper (apiResponse, logger, enkripsi)
│   ├── prisma/
│   │   ├── schema.prisma         # Model database
│   │   ├── migrations/           # Riwayat migrasi
│   │   └── seed.js               # Data awal (super admin)
│   ├── Dockerfile                # Production image
│   └── Dockerfile.dev            # Development image (nodemon)
├── frontend/                     # React + Vite
│   ├── src/
│   │   ├── pages/                # Halaman (user/, admin/, public/)
│   │   ├── components/           # Komponen reusable
│   │   ├── stores/               # Zustand state management
│   │   ├── services/             # Axios API clients
│   │   └── hooks/                # Custom React hooks
│   ├── Dockerfile                # Production image (Nginx static)
│   └── Dockerfile.dev            # Development image (Vite dev server)
├── nginx/
│   └── nginx.conf                # Konfigurasi Nginx untuk production
├── docker-compose.yml            # Stack development
├── docker-compose.prod.yml       # Override untuk production
├── .env.example                  # Template environment variables
└── panduan.md                    # File ini
```

---

## 4. Konfigurasi Environment Variables

### 4.1 Buat file `.env` di root proyek

```bash
cp .env.example .env
```

Buka `.env` dengan editor dan isi **semua** nilai placeholder. Bagian berikut menjelaskan cara generate setiap secret.

---

### 4.2 Generate Secret Keys

Jalankan perintah-perintah ini dan salin hasilnya ke `.env`:

```bash
# JWT_SECRET (jalankan dua kali, ambil nilai berbeda untuk masing-masing)
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# ENCRYPTION_KEY — wajib tepat 64 karakter hex
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Contoh nilai yang dihasilkan:
```
JWT_SECRET=K8mP3xQvL9wZnT2uRjFsYdBhCeAiG6oW
JWT_REFRESH_SECRET=X1pN5vMcH7qE4ySzIlUkDgAoRtFnJwBe
ENCRYPTION_KEY=a3f8c2d1e6b094571832fa6d0c5e9874ab12cd34ef567890abcdef1234567890
```

---

### 4.3 Gmail App Password (untuk SMTP)

Fitur reset password dan OTP verifikasi membutuhkan SMTP:

1. Aktifkan **2-Step Verification** di akun Google
2. Buka [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Klik **Create** → beri nama (contoh: "Lapor Malang")
4. Salin 16 karakter password yang dihasilkan
5. Isi di `.env`:
   ```env
   SMTP_USER=emailkamu@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   ```

> Jika menggunakan SMTP provider lain (Mailtrap, SendGrid, dsb.), sesuaikan `SMTP_HOST` dan `SMTP_PORT`.

---

### 4.4 Google OAuth (Login dengan Google)

Fitur opsional untuk login warga menggunakan akun Google:

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Buat project baru atau pilih project yang ada
3. Pergi ke **APIs & Services → OAuth consent screen** → pilih **External** → isi form
4. Pergi ke **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Tambahkan **Authorized JavaScript origins:**
   ```
   http://localhost:3001        ← development
   https://yourdomain.com       ← production (jika ada)
   ```
7. Klik **Create** → salin **Client ID** dan **Client Secret**
8. Isi di `.env`:
   ```env
   GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxx
   VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
   ```

> Kosongkan `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` jika tidak ingin menggunakan fitur login Google.

---

### 4.5 Telegram Bot Token

Lihat [Bagian 8 — Setup Bot Telegram](#8-setup-bot-telegram) untuk instruksi lengkap.

```env
TELEGRAM_BOT_TOKEN=123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_BOT_ACTIVE=true
```

Set `TELEGRAM_BOT_ACTIVE=false` untuk menonaktifkan bot tanpa menghapus token.

---

### 4.6 Backend `.env` (khusus Cara B — lokal tanpa Docker)

```bash
# Buat dari template (jika ada), atau buat manual
cat > backend/.env << 'EOF'
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Gunakan localhost — bukan nama container
DATABASE_URL=postgresql://lapor_user:strong_postgres_password@localhost:5432/lapor_malang

JWT_SECRET=sama_dengan_root_env
JWT_REFRESH_SECRET=sama_dengan_root_env
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

REDIS_URL=redis://:strong_redis_password@localhost:6379

# Endpoint MinIO lokal = localhost
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin_lapor
MINIO_SECRET_KEY=miniosecret_lapor_pass
MINIO_BUCKET_NAME=lapor-malang
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=http://localhost:9000

ENCRYPTION_KEY=64_karakter_hex_sama_dengan_root_env

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=emailkamu@gmail.com
SMTP_PASS=app_password_16_karakter

TELEGRAM_BOT_TOKEN=123456789:AAFxxx
TELEGRAM_BOT_ACTIVE=true

GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxx
EOF
```

> **Perbedaan utama vs Docker:** `MINIO_ENDPOINT=localhost` dan `DATABASE_URL` menggunakan `localhost`, bukan nama container.

---

### 4.7 Frontend `.env` (khusus Cara B — lokal tanpa Docker)

```bash
cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
VITE_MAP_DEFAULT_LAT=-8.1654
VITE_MAP_DEFAULT_LNG=112.6208
VITE_MAP_DEFAULT_ZOOM=11
EOF
```

---

## 5. Cara A — Menjalankan dengan Docker (Rekomendasi)

### 5.1 Pastikan `.env` sudah diisi

```bash
# Cek tidak ada nilai placeholder yang belum diganti
grep -n "ganti_dengan\|replace_with\|xxxx" .env
# Output kosong = semua sudah diisi
```

### 5.2 Jalankan semua service

```bash
docker compose up -d
```

Docker akan menjalankan 6 service:

| Container | Service | Port Host | Keterangan |
|---|---|---|---|
| `lapor_postgres` | PostgreSQL 15 | 5433 | Database utama |
| `lapor_redis` | Redis 7 | 6379 | Cache & JWT blacklist |
| `lapor_minio` | MinIO | 9000, 9001 | Object storage foto |
| `lapor_minio_init` | MinIO init | — | Buat bucket otomatis, exit setelah selesai |
| `lapor_backend` | Express API | 5000 | REST API |
| `lapor_frontend` | Vite dev server | 3001 | UI React |

### 5.3 Inisialisasi database (pertama kali saja)

Tunggu backend siap (~30 detik), lalu:
```bash
# Jalankan migrasi schema
docker exec lapor_backend npx prisma migrate deploy

# Isi data awal — membuat akun Super Admin
docker exec lapor_backend node prisma/seed.js
```

### 5.4 Cek status semua service

```bash
docker compose ps
# Semua service harus berstatus "Up" atau "Up (healthy)"
```

### 5.5 Akses aplikasi

| Layanan | URL |
|---|---|
| Frontend (warga & admin) | http://localhost:3001 |
| Backend REST API | http://localhost:5000/api |
| Health check | http://localhost:5000/health |
| MinIO Console (storage) | http://localhost:9001 |

Login admin: [http://localhost:3001/admin/login](http://localhost:3001/admin/login)

---

## 6. Cara B — Menjalankan Lokal Tanpa Docker

Pastikan PostgreSQL, Redis, dan MinIO sudah berjalan (lihat [Bagian 2](#2-instalasi-prasyarat)).

### 6.1 Backend

```bash
cd backend
npm install
npx prisma generate
npm run prisma:migrate   # jalankan migrasi
npm run prisma:seed      # buat super admin
npm run dev              # mulai server di http://localhost:5000
```

### 6.2 Frontend

Buka terminal baru:
```bash
cd frontend
npm install
npm run dev              # mulai Vite di http://localhost:3000
```

---

## 7. Inisialisasi Database

### Migrasi Schema

| Cara | Perintah |
|---|---|
| Docker | `docker exec lapor_backend npx prisma migrate deploy` |
| Lokal | `cd backend && npm run prisma:migrate` |

> Gunakan `migrate deploy` untuk lingkungan production/Docker. Gunakan `migrate dev` hanya di lokal saat membuat migrasi baru.

### Seed Data Awal

| Cara | Perintah |
|---|---|
| Docker | `docker exec lapor_backend node prisma/seed.js` |
| Lokal | `cd backend && npm run prisma:seed` |

### Prisma Studio — GUI Database (opsional)

```bash
cd backend
npx prisma studio
# Buka di http://localhost:5555
```

### Buat Migrasi Baru (setelah ubah `schema.prisma`)

```bash
cd backend
npx prisma migrate dev --name nama_deskriptif_perubahan
npx prisma generate
```

Lalu rebuild backend container jika menggunakan Docker:
```bash
docker compose up -d --build backend
```

---

## 8. Setup Bot Telegram

Bot memungkinkan warga membuat laporan langsung dari Telegram tanpa buka website.

### 8.1 Buat Bot di BotFather

1. Buka Telegram → cari `@BotFather`
2. Kirim `/newbot`
3. Masukkan **nama tampilan** bot (contoh: `LAPOR MALANG`)
4. Masukkan **username bot** — harus diakhiri `bot` (contoh: `lapor_malang_bot`)
5. BotFather memberikan token:
   ```
   123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 8.2 Isi token ke `.env`

```env
TELEGRAM_BOT_TOKEN=123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_BOT_ACTIVE=true
```

Restart backend agar token terbaca:
```bash
# Docker
docker compose restart backend

# Lokal
# Ctrl+C → npm run dev
```

Verifikasi bot aktif:
```bash
docker compose logs backend | grep -i telegram
# Expected: 🤖 Memulai polling bot Telegram...
```

### 8.3 Alur Penggunaan Bot

```
Warga kirim pesan → Bot minta share contact (nomor HP)
   → Nomor dicocokkan dengan database
   → Jika cocok → akun tertaut → bot aktif penuh
```

> **Syarat:** Warga harus sudah mendaftar dan memverifikasi akun di website sebelum bisa menggunakan bot.

### 8.4 Perintah Bot

| Perintah | Fungsi |
|---|---|
| `/start` | Salam dan daftar menu |
| `/lapor` | Mulai alur laporan: foto → lokasi GPS → kategori → tingkat kerusakan → deskripsi → konfirmasi |
| `/status` | Lihat 3 laporan terbaru |
| `/help` | Panduan penggunaan |
| `/cancel` | Batalkan laporan yang sedang dibuat |

### 8.5 Notifikasi Otomatis via Telegram

Jika akun sudah tertaut, warga otomatis menerima pesan Telegram saat status laporannya berubah (Diproses → Selesai / Ditolak).

### 8.6 Batasan Bot

- Satu token hanya bisa digunakan oleh **satu instance** backend. Jangan jalankan dua backend secara bersamaan dengan token yang sama.
- Bot menggunakan **long-polling** — server harus bisa mengakses `api.telegram.org` (butuh koneksi internet).
- Di production, pastikan tidak ada firewall yang memblokir koneksi keluar ke `api.telegram.org:443`.

---

## 9. Setup Google OAuth

Login "Masuk dengan Google" hanya untuk warga (bukan admin).

### 9.1 Buat Credentials di Google Cloud Console

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Buat project baru (atau gunakan yang sudah ada)
3. Pergi ke **APIs & Services → OAuth consent screen**:
   - User Type: **External**
   - Isi App name, User support email, Developer email
   - Klik **Save and Continue** (skip Scopes & Test users)
4. Pergi ke **APIs & Services → Credentials → + Create Credentials → OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Name: `Lapor Malang Dev` (atau sesukamu)
5. **Authorized JavaScript origins** — tambahkan semua origin yang akan menggunakan login:
   ```
   http://localhost:3001
   https://yourdomain.com
   ```
6. **Authorized redirect URIs** — tidak diperlukan (sistem menggunakan credential callback, bukan redirect)
7. Klik **Create** → salin **Client ID** dan **Client Secret**

### 9.2 Isi ke `.env`

```env
GOOGLE_CLIENT_ID=123456789-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_GOOGLE_CLIENT_ID=123456789-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

### 9.3 Restart Backend dan Frontend

```bash
docker compose restart backend
docker compose restart frontend
```

### 9.4 Cara Kerja

1. Warga klik tombol **Masuk dengan Google** di halaman login
2. Popup Google muncul → warga pilih akun
3. Backend menerima credential → verifikasi via Google API
4. Jika email belum terdaftar → akun baru dibuat otomatis (tanpa NIK & HP, perlu dilengkapi)
5. Jika email sudah terdaftar → login langsung

---

## 10. Verifikasi Semua Service

```bash
# 1. Status semua container
docker compose ps

# 2. Health check backend
curl http://localhost:5000/health
# Expected: {"status":"ok","timestamp":"...","services":{"database":"ok","redis":"ok"}}

# 3. Test API publik (laporan peta)
curl http://localhost:5000/api/reports/public
# Expected: {"success":true,"data":[...]}

# 4. Test koneksi Redis
docker exec lapor_redis redis-cli -a "${REDIS_PASSWORD}" ping
# Expected: PONG

# 5. Test koneksi PostgreSQL
docker exec lapor_postgres pg_isready -U lapor_user -d lapor_malang
# Expected: .../lapor_malang - accepting connections

# 6. Cek bot Telegram aktif
docker compose logs backend | grep -i telegram
# Expected: 🤖 Memulai polling bot Telegram...

# 7. MinIO Console
# Buka http://localhost:9001 → login dengan MINIO_ACCESS_KEY / MINIO_SECRET_KEY
# Pastikan bucket "lapor-malang" ada dan folder "public" punya Anonymous access = download
```

---

## 11. Akun Default Setelah Seed

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@lapormalang.id` | `SuperAdmin@2026!` |

**Segera ganti password** setelah pertama kali login:
- Halaman login admin: `http://localhost:3001/admin/login`
- Setelah login → pojok kiri bawah → menu profil

Super Admin bisa:
- Membuat & mengelola akun Admin
- Memproses semua laporan
- Export laporan ke CSV

---

## 12. Perintah Berguna

### Docker Compose

```bash
# Jalankan semua service
docker compose up -d

# Matikan semua service (data tetap ada)
docker compose down

# Matikan + hapus semua volume (RESET DATA — hati-hati!)
docker compose down -v

# Restart satu service
docker compose restart backend

# Lihat log real-time
docker compose logs -f backend
docker compose logs -f frontend

# Masuk ke shell container
docker exec -it lapor_backend sh
docker exec -it lapor_postgres psql -U lapor_user -d lapor_malang

# Rebuild image setelah ubah Dockerfile
docker compose up -d --build backend
docker compose up -d --build frontend
```

### Prisma

```bash
cd backend

# Buat migrasi baru setelah ubah schema.prisma
npx prisma migrate dev --name nama_perubahan

# Deploy migrasi (production / Docker)
npx prisma migrate deploy

# Reset database — hapus semua data + jalankan ulang migrasi (DEV ONLY)
npx prisma migrate reset

# Regenerasi Prisma Client
npx prisma generate

# GUI database
npx prisma studio
```

### Backend (lokal)

```bash
cd backend
npm run dev              # Development (nodemon, auto-restart)
npm run start            # Production (tanpa nodemon)
npm run prisma:migrate   # Shortcut migrate dev
npm run prisma:seed      # Shortcut node prisma/seed.js
npm run prisma:generate  # Shortcut prisma generate
```

### Frontend (lokal)

```bash
cd frontend
npm run dev      # Vite dev server (port 3000, HMR aktif)
npm run build    # Build production ke dist/
npm run preview  # Preview build production
npm run lint     # ESLint check
```

---

## 13. Deployment Production — VPS

### 13.1 Arsitektur Production

```
Internet (port 80 / 443)
         │
    ┌────▼────────────────────────────────────┐
    │  Nginx  (lapor_nginx)                   │
    │  /*          → frontend:80  (static)    │
    │  /api/*      → backend:5000 (API)       │
    │  /files/*    → minio:9000   (foto)      │
    │  /uploads/*  → backend:5000 (fallback)  │
    └────┬────────────────────────────────────┘
         │  internal Docker network (lapor-network-prod)
    ┌────▼───────────────────────────────────────────┐
    │  frontend:80   (Nginx static, React build)     │
    │  backend:5000  (Express API, tidak expose)     │
    │  postgres:5432 (database, tidak expose)        │
    │  redis:6379    (cache, tidak expose)           │
    │  minio:9000    (storage, tidak expose)         │
    └────────────────────────────────────────────────┘
```

### 13.2 Persiapan VPS

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# Install git
sudo apt install git -y

# Clone repository
git clone <url-repository> /opt/lapor-malang
cd /opt/lapor-malang
```

### 13.3 Konfigurasi Nginx untuk MinIO

Edit `nginx/nginx.conf` — tambahkan blok `location /files/` di dalam blok `server`:

```nginx
# Proxy foto publik dari MinIO
location /files/ {
    proxy_pass         http://minio:9000/lapor-malang/public/;
    proxy_set_header   Host minio:9000;
    proxy_set_header   X-Real-IP $remote_addr;
    expires            30d;
    add_header         Cache-Control "public, immutable";
}
```

> Dengan konfigurasi ini, `MINIO_PUBLIC_URL` diisi `https://yourdomain.com/files`.
> URL foto menjadi: `https://yourdomain.com/files/avatars/...` dst.

### 13.4 Konfigurasi `.env` untuk Production

```bash
cp .env.example .env
nano .env
```

Nilai yang **wajib** disesuaikan untuk production:

```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# Generate nilai baru — JANGAN pakai nilai development!
JWT_SECRET=<min 32 karakter, generate baru>
JWT_REFRESH_SECRET=<min 32 karakter, berbeda dari JWT_SECRET>
DB_PASSWORD=<password kuat untuk PostgreSQL>
REDIS_PASSWORD=<password kuat untuk Redis>
MINIO_ACCESS_KEY=<username MinIO>
MINIO_SECRET_KEY=<password MinIO, min 8 karakter>
ENCRYPTION_KEY=<64 karakter hex — SIMPAN AMAN, tidak bisa diubah setelah data masuk>

# URL MinIO via Nginx (file diakses melalui domain)
MINIO_PUBLIC_URL=https://yourdomain.com/files

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=emailkamu@gmail.com
SMTP_PASS=app_password_16_karakter

# Telegram
TELEGRAM_BOT_TOKEN=<token dari BotFather>
TELEGRAM_BOT_ACTIVE=true

# Google OAuth
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>
```

### 13.5 Pasang SSL dengan Let's Encrypt

```bash
# Install certbot
sudo apt install certbot -y

# Generate sertifikat (ganti yourdomain.com)
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  --agree-tos \
  --email admin@yourdomain.com

# Salin sertifikat ke folder nginx
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem
```

Lalu di `nginx/nginx.conf`, aktifkan blok HTTPS dan HTTP → HTTPS redirect (uncomment blok yang sudah ada).

**Auto-renewal sertifikat:**
```bash
# Tambahkan cron job — perbarui sertifikat otomatis setiap hari
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && \
  cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/lapor-malang/nginx/ssl/ && \
  cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/lapor-malang/nginx/ssl/ && \
  docker exec lapor_nginx nginx -s reload") | crontab -
```

### 13.6 Jalankan Production

```bash
cd /opt/lapor-malang

# Build dan jalankan semua service (gabungkan kedua compose file)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Inisialisasi database (pertama kali saja)
docker exec lapor_backend npx prisma migrate deploy
docker exec lapor_backend node prisma/seed.js

# Cek semua berjalan
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### 13.7 Update Kode di Production

```bash
cd /opt/lapor-malang

# Pull perubahan terbaru
git pull

# Rebuild dan restart hanya service yang berubah
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  up -d --build backend

# Jika ada migrasi schema baru
docker exec lapor_backend npx prisma migrate deploy
```

### 13.8 Backup Database

```bash
# Backup manual
docker exec lapor_postgres pg_dump -U lapor_user lapor_malang \
  | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore backup
gunzip -c backup_20260604_120000.sql.gz \
  | docker exec -i lapor_postgres psql -U lapor_user lapor_malang
```

**Backup otomatis via cron:**
```bash
(crontab -l 2>/dev/null; echo "0 2 * * * docker exec lapor_postgres \
  pg_dump -U lapor_user lapor_malang | gzip > \
  /opt/backups/lapor_\$(date +\%Y\%m\%d).sql.gz") | crontab -
```

---

## 14. Troubleshooting

### Backend tidak start — `Cannot find module`

```
Error: Cannot find module '/app/src/index.js'
```

Image belum direbuild setelah ada perubahan file penting:
```bash
docker compose up -d --build backend
```

---

### Backend error — `Environment validation failed`

```
❌ Kesalahan konfigurasi environment variables
```

Cek semua variabel wajib:
- `ENCRYPTION_KEY` — tepat **64 karakter** hex
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — minimal **32 karakter**
- `SMTP_USER` — harus format email valid
- `DATABASE_URL` — harus format URL PostgreSQL yang valid
- `REDIS_URL` — harus format URL Redis yang valid

```bash
# Tampilkan isi .env untuk dicek (tanpa baris komentar)
grep -v '^#' .env | grep -v '^$'
```

---

### Backend tidak bisa connect ke database

```
Error: Can't reach database server at postgres:5432
```

- Pastikan container `lapor_postgres` sudah `healthy`: `docker compose ps`
- Untuk Cara B: pastikan `DATABASE_URL` di `backend/.env` menggunakan `localhost`, bukan `postgres`
- Cek PostgreSQL berjalan: `sudo systemctl status postgresql`

---

### Foto tidak tampil di browser (gambar broken)

Penyebab: foto tersimpan di path MinIO yang tidak publik.

Cek policy bucket:
```bash
docker exec lapor_minio sh -c \
  "mc alias set m http://localhost:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY && \
   mc anonymous get-json m/lapor-malang"
```

Harus ada rule `s3:GetObject` dengan Resource `arn:aws:s3:::lapor-malang/public*`.

Jika rule hilang, jalankan ulang minio-init:
```bash
docker compose up minio-init
```

Semua foto baru akan tersimpan di `public/reports/`, `public/avatars/`, `public/evidences/` dan bisa diakses publik. Foto lama yang tersimpan di path non-publik perlu diupload ulang.

---

### MinIO upload gagal

```
⚠️ MinIO tidak tersedia, fallback ke local storage
```

- Cek container MinIO berjalan: `docker compose ps lapor_minio`
- Dari dalam container backend, MinIO diakses via hostname `minio` (bukan `localhost`)
- Pastikan `MINIO_SECRET_KEY` minimal 8 karakter
- Verifikasi bucket ada: buka `http://localhost:9001` → login → cek bucket `lapor-malang`

---

### Bot Telegram tidak merespons

1. Pastikan `TELEGRAM_BOT_TOKEN` valid (format: `123456789:AAFxxx...`)
2. Pastikan `TELEGRAM_BOT_ACTIVE=true`
3. Cek log backend: `docker compose logs backend | grep -i telegram`
4. Server harus bisa mengakses `api.telegram.org:443` (cek firewall)
5. **Satu token = satu instance** — jangan jalankan dua backend dengan token sama secara bersamaan

---

### Google Sign-In error: "The given origin is not allowed"

```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

Tambahkan origin ke Google Cloud Console:
1. Buka [console.cloud.google.com](https://console.cloud.google.com) → Credentials → Edit OAuth Client
2. Tambahkan `http://localhost:3001` (atau domain production) ke **Authorized JavaScript origins**
3. Tunggu 5–10 menit untuk propagasi

---

### Redis AUTH error

```
WRONGPASS invalid username-password pair
```

- Pastikan `REDIS_PASSWORD` di `.env` sama dengan password di Redis
- Format `REDIS_URL` yang benar: `redis://:PASSWORD@HOST:PORT` (titik dua wajib sebelum password)

---

### Port sudah digunakan

```
Error: Port 5000 sudah digunakan
```

```bash
# Cari proses yang menggunakan port
sudo lsof -i :5000    # backend
sudo lsof -i :3001    # frontend
sudo lsof -i :5433    # PostgreSQL

# Matikan proses
kill -9 <PID>
```

---

### Prisma: `P3005` — schema berbeda dari migration history

```bash
# Reset dan jalankan ulang semua migrasi (DEV ONLY — hapus semua data!)
cd backend && npx prisma migrate reset

# Untuk production — resolve konflik manual
cd backend && npx prisma migrate resolve --applied <migration_name>
```

---

### Data tidak tampil setelah seed

```bash
# Cek apakah seed berhasil
docker exec lapor_postgres psql -U lapor_user -d lapor_malang \
  -c "SELECT id, email, role FROM admins;"

# Jalankan ulang seed
docker exec lapor_backend node prisma/seed.js
```

---

*Terakhir diperbarui: Juni 2026*
