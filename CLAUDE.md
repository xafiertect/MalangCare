# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LAPOR MALANG** — A public infrastructure reporting system (damage to roads, bridges, drainage, etc.) for Malang Regency. Citizens submit geo-tagged reports with photos; admins process and resolve them. Built as a Docker-first monorepo.

## Development Commands

### Full Stack via Docker (recommended)
```bash
# Copy and fill env vars first
cp .env.example .env

# Start all services (PostgreSQL, Redis, MinIO, backend, frontend)
docker compose up -d

# Run DB migrations + seed (first time only)
docker exec lapor_backend npx prisma migrate dev
docker exec lapor_backend node prisma/seed.js

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

**Ports:** backend `5000`, frontend `3001`, PostgreSQL `5433`, MinIO `9000/9001`, Redis `6379`

### Backend (local, without Docker)
```bash
cd backend
npm install
cp .env.example .env   # adjust DATABASE_URL to localhost

npm run dev            # nodemon watch
npm run prisma:migrate # run migrations
npm run prisma:seed    # seed super admin
npm run prisma:generate # regenerate Prisma client after schema changes
```

### Frontend (local, without Docker)
```bash
cd frontend
npm install
# create frontend/.env with VITE_API_URL=http://localhost:5000/api

npm run dev    # vite dev server on port 3000
npm run build  # production build
npm run lint   # ESLint check
```

### Generate ENCRYPTION_KEY
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Architecture

### Backend (`backend/src/`)
Strict layered architecture: **Routes → Controllers → Services → Prisma**

- `routes/` — Express routers; apply `authenticate` + `requireRole` middleware, then delegate to controllers
- `controllers/` — parse/validate req/res, call one service method, return `successResponse`/`errorResponse`
- `services/` — all business logic; use `prisma.$transaction()` for multi-table writes
- `middleware/` — `auth.middleware.js` (JWT verify + Redis blacklist check + active-account check), `upload.middleware.js` (multer → memory buffer, then streamed to MinIO in service), `validate.middleware.js` (Zod schemas from `validators/`)
- `jobs/` — `node-cron` scheduled tasks: OTP cleanup, notification trim (>100/user), backup reminder
- `config/` — single-instance exports for `prisma`, `redis`, `minio`, validated env via Zod

**API response shape** (always): `{ success: bool, message: string, data?: any, pagination?: any }`  
Source: `utils/apiResponse.js` — use `successResponse`, `errorResponse`, `paginatedResponse`.

**Report number format:** `LP-YYYYMMDD-XXXX` (sequential per day), generated in `utils/reportNumber.js`.

**NIK encryption:** AES-256-GCM via `utils/encryption.js`; stored as `iv:authTag:ciphertext` hex string. The `ENCRYPTION_KEY` env var must be a 64-char hex string (32 bytes).

**JWT strategy:** short-lived access token (15 min) + long-lived refresh token (7 days). Logout blacklists the access token in Redis with TTL matching its remaining validity.

### Frontend (`frontend/src/`)

- `stores/` — Zustand: `authStore` (user, accessToken, isAuthenticated), `notificationStore` (list + unread count), `mapStore` (filter state for map)
- `services/api.js` — single Axios instance; request interceptor injects JWT; response interceptor handles 401 → auto-refresh → retry queue; on refresh failure, clears auth and redirects `/login`
- `services/` — one file per backend domain (authService, reportService, notificationService, adminReportService, etc.)
- `components/layout/ProtectedRoute.jsx` — wraps `<Outlet>`, checks `isAuthenticated` and `allowedRoles`; admin routes require `['admin', 'super_admin']`; `/admin/pengguna` requires `['super_admin']` only
- `hooks/useNotifications.js` — polls `/api/notifications` every 30 seconds while authenticated; wired globally in `App.jsx`
- `components/map/MapView.jsx` — React-Leaflet with OpenStreetMap tiles; custom marker icons by `DamageLevel` (RINGAN=green, SEDANG=yellow, BERAT=red); resolved reports get gray pins

### Database (PostgreSQL 15 + Prisma)

Key schema notes:
- `User` and `Admin` are **separate tables** — users submit reports, admins process them
- `Report` → `ReportPhoto[]` (user photos), `ReportEvidence[]` (admin repair proof photos), `ReportTimeline[]` (status audit trail), `AdminNote[]` (internal comments), `ReportRating?` (post-resolve user rating)
- Report status flow: `PENDING → IN_PROGRESS → RESOLVED` or `PENDING → REJECTED`. Resolving requires at least one `ReportEvidence` entry.
- `nik_encrypted` on `User` stores the National ID encrypted; never expose raw NIK in API responses
- Notification `data` column is JSONB — stores `{report_id, report_number, evidence_urls}` depending on type

After any `schema.prisma` change: run `npx prisma migrate dev --name <description>` and `npx prisma generate`.

### Infrastructure (Docker Compose)
| Service | Image | Purpose |
|---|---|---|
| `postgres` | postgres:15-alpine | Primary database (mapped to host 5433) |
| `redis` | redis:7-alpine | JWT blacklist + rate-limit store |
| `minio` | minio/minio | S3-compatible object storage for photos |
| `minio-init` | minio/mc | Creates `lapor-malang` bucket on first start |
| `backend` | custom | Express API |
| `frontend` | custom | Vite dev server |

MinIO stores all uploaded photos; URLs are public under `lapor-malang/public/`. The backend streams file buffers from multer's memory storage directly to MinIO via `@aws-sdk/client-s3`.

## Role System
| Role | Access |
|---|---|
| `user` | Submit/view own reports, public map, notifications, profile |
| `admin` | Process/reject/resolve reports, upload evidence, internal notes, export CSV |
| `super_admin` | All admin access + manage admin accounts (`/admin/pengguna`) |

## Environment Setup
Root `.env` is used by Docker Compose for secrets interpolation. `backend/.env` and `frontend/.env` (or `frontend/.env.local`) are for local development without Docker. See `.env.example` for all required variables. Optional: `TELEGRAM_BOT_TOKEN` for Telegram notifications.
