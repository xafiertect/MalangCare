# 🗄️ Database Design
## LAPOR MALANG — PostgreSQL 15
**Versi:** 1.0.0 | **ORM:** Prisma 5.x

---

## 1. Mengapa PostgreSQL?

| Kriteria | PostgreSQL ✅ | MySQL |
|----------|-------------|-------|
| Geospasial (PostGIS ready) | ✅ Excellent | ⚠️ Terbatas |
| JSONB queryable | ✅ Native, indexed | ⚠️ Lambat |
| ACID Transactions | ✅ Sangat ketat | ✅ Baik |
| Concurrent write (MVCC) | ✅ Superior | ⚠️ Lock lebih sering |
| Full-text search | ✅ Built-in | ⚠️ Terbatas |
| Enum types | ✅ Native | ⚠️ String-based |
| Array types | ✅ Native | ❌ Tidak ada |
| Open source | ✅ | ✅ |

---

## 2. Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────────┐
│     users       │         │       reports        │
├─────────────────┤  1   *  ├─────────────────────┤
│ id (UUID) PK    │◄────────│ id (UUID) PK         │
│ name            │         │ user_id FK           │
│ email (unique)  │         │ report_number (unique)│
│ nik_encrypted   │         │ category             │
│ phone           │         │ damage_level         │
│ password_hash   │         │ description          │
│ avatar_url      │         │ latitude             │
│ is_verified     │         │ longitude            │
│ is_active       │         │ address              │
│ role            │         │ district             │
│ login_attempts  │         │ status               │
│ locked_until    │         │ resolved_at          │
│ created_at      │         │ created_at           │
│ updated_at      │         │ updated_at           │
└─────────────────┘         └─────────┬───────────┘
                                      │ 1
                        ┌─────────────┼──────────────────┐
                        │             │                  │
                        │ *           │ *                │ *
               ┌────────▼──────┐ ┌───▼──────────┐ ┌────▼──────────────┐
               │ report_photos │ │report_timeline│ │  report_evidences │
               ├───────────────┤ ├───────────────┤ ├───────────────────┤
               │ id PK         │ │ id PK         │ │ id PK             │
               │ report_id FK  │ │ report_id FK  │ │ report_id FK      │
               │ photo_url     │ │ status        │ │ photo_url         │
               │ is_primary    │ │ note          │ │ uploaded_by FK    │
               │ created_at    │ │ actor_id FK   │ │ created_at        │
               └───────────────┘ │ created_at    │ └───────────────────┘
                                 └───────────────┘

┌─────────────────┐         ┌─────────────────────┐
│     admins      │         │    notifications     │
├─────────────────┤  1   *  ├─────────────────────┤
│ id (UUID) PK    │◄───┐    │ id (UUID) PK         │
│ name            │    │    │ user_id FK           │
│ email (unique)  │    │    │ type                 │
│ password_hash   │    │    │ title                │
│ role            │    │    │ message              │
│ unit_dinas      │    │    │ data (JSONB)         │
│ is_active       │    │    │ is_read              │
│ last_login_at   │    │    │ created_at           │
│ created_at      │    │    └─────────────────────┘
│ updated_at      │    │
└─────────────────┘    │    ┌─────────────────────┐
         │             │    │    audit_logs        │
         │ *           │    ├─────────────────────┤
         └─────────────┘    │ id (UUID) PK         │
                 ▲          │ admin_id FK          │
                 └──────────│ action               │
                            │ target_id            │
                            │ target_type          │
                            │ old_value (JSONB)    │
                            │ new_value (JSONB)    │
                            │ ip_address           │
                            │ created_at           │
                            └─────────────────────┘

┌─────────────────────┐
│     otp_tokens      │
├─────────────────────┤
│ id PK               │
│ user_id FK          │
│ token               │
│ type (VERIFY|RESET) │
│ expires_at          │
│ is_used             │
│ created_at          │
└─────────────────────┘

┌─────────────────────┐
│   report_ratings    │
├─────────────────────┤
│ id PK               │
│ report_id FK unique │
│ user_id FK          │
│ score (1-5)         │
│ comment             │
│ created_at          │
└─────────────────────┘
```

---

## 3. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

enum UserRole {
  user
  admin
  super_admin
}

enum ReportStatus {
  PENDING
  IN_PROGRESS
  RESOLVED
  REJECTED
}

enum DamageLevel {
  RINGAN
  SEDANG
  BERAT
}

enum FacilityCategory {
  JALAN
  JEMBATAN
  DRAINASE
  LAMPU_JALAN
  TAMAN
  FASILITAS_OLAHRAGA
  LAINNYA
}

enum NotificationType {
  REPORT_RECEIVED
  REPORT_IN_PROGRESS
  REPORT_RESOLVED
  REPORT_REJECTED
}

enum OtpType {
  VERIFY_ACCOUNT
  RESET_PASSWORD
}

enum AuditAction {
  LOGIN
  PROCESS_REPORT
  REJECT_REPORT
  RESOLVE_REPORT
  UPLOAD_EVIDENCE
  CREATE_ADMIN
  DEACTIVATE_ADMIN
  EXPORT_DATA
}

// ─────────────────────────────────────────
// USERS
// ─────────────────────────────────────────

model User {
  id              String    @id @default(uuid())
  name            String
  email           String    @unique
  nik_encrypted   String                            // AES-256 encrypted
  phone           String
  password_hash   String
  avatar_url      String?
  is_verified     Boolean   @default(false)
  is_active       Boolean   @default(true)
  role            UserRole  @default(user)
  login_attempts  Int       @default(0)
  locked_until    DateTime?
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  reports         Report[]
  notifications   Notification[]
  otp_tokens      OtpToken[]
  ratings         ReportRating[]

  @@map("users")
}

// ─────────────────────────────────────────
// ADMINS
// ─────────────────────────────────────────

model Admin {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  password_hash String
  role          UserRole  @default(admin)
  unit_dinas    String?
  is_active     Boolean   @default(true)
  last_login_at DateTime?
  created_by    String?                             // UUID super admin pembuat
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  timelines     ReportTimeline[]
  evidences     ReportEvidence[]
  audit_logs    AuditLog[]

  @@map("admins")
}

// ─────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────

model Report {
  id              String           @id @default(uuid())
  report_number   String           @unique              // LP-YYYYMMDD-XXXX
  user_id         String
  category        FacilityCategory
  damage_level    DamageLevel
  description     String?          @db.VarChar(500)
  latitude        Decimal          @db.Decimal(10, 8)
  longitude       Decimal          @db.Decimal(11, 8)
  address         String
  district        String                               // Kecamatan
  status          ReportStatus     @default(PENDING)
  rejection_reason String?
  resolved_at     DateTime?
  created_at      DateTime         @default(now())
  updated_at      DateTime         @updatedAt

  user            User             @relation(fields: [user_id], references: [id])
  photos          ReportPhoto[]
  timeline        ReportTimeline[]
  evidences       ReportEvidence[]
  rating          ReportRating?

  // Index untuk performa query filter & peta
  @@index([status])
  @@index([category])
  @@index([damage_level])
  @@index([district])
  @@index([user_id])
  @@index([created_at])
  @@index([latitude, longitude])   // Untuk query geospasial
  @@map("reports")
}

// ─────────────────────────────────────────
// REPORT PHOTOS (foto dari pelapor)
// ─────────────────────────────────────────

model ReportPhoto {
  id          String   @id @default(uuid())
  report_id   String
  photo_url   String
  is_primary  Boolean  @default(false)
  created_at  DateTime @default(now())

  report      Report   @relation(fields: [report_id], references: [id], onDelete: Cascade)

  @@index([report_id])
  @@map("report_photos")
}

// ─────────────────────────────────────────
// REPORT EVIDENCE (foto bukti perbaikan dari admin)
// ─────────────────────────────────────────

model ReportEvidence {
  id            String   @id @default(uuid())
  report_id     String
  photo_url     String
  uploaded_by   String                           // Admin ID
  created_at    DateTime @default(now())

  report        Report   @relation(fields: [report_id], references: [id], onDelete: Cascade)
  admin         Admin    @relation(fields: [uploaded_by], references: [id])

  @@index([report_id])
  @@map("report_evidences")
}

// ─────────────────────────────────────────
// REPORT TIMELINE (riwayat perubahan status)
// ─────────────────────────────────────────

model ReportTimeline {
  id          String       @id @default(uuid())
  report_id   String
  status      ReportStatus
  note        String?
  actor_id    String?                            // Admin ID yang melakukan perubahan
  created_at  DateTime     @default(now())

  report      Report       @relation(fields: [report_id], references: [id], onDelete: Cascade)
  admin       Admin?       @relation(fields: [actor_id], references: [id])

  @@index([report_id])
  @@map("report_timelines")
}

// ─────────────────────────────────────────
// REPORT RATINGS
// ─────────────────────────────────────────

model ReportRating {
  id          String   @id @default(uuid())
  report_id   String   @unique                  // Satu laporan = satu rating
  user_id     String
  score       Int                               // 1-5
  comment     String?  @db.VarChar(200)
  created_at  DateTime @default(now())

  report      Report   @relation(fields: [report_id], references: [id])
  user        User     @relation(fields: [user_id], references: [id])

  @@map("report_ratings")
}

// ─────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────

model Notification {
  id          String           @id @default(uuid())
  user_id     String
  type        NotificationType
  title       String
  message     String
  data        Json?                              // JSONB: {report_id, evidence_urls, ...}
  is_read     Boolean          @default(false)
  created_at  DateTime         @default(now())

  user        User             @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, is_read])
  @@index([user_id, created_at])
  @@map("notifications")
}

// ─────────────────────────────────────────
// OTP TOKENS
// ─────────────────────────────────────────

model OtpToken {
  id          String   @id @default(uuid())
  user_id     String
  token       String   @db.VarChar(6)
  type        OtpType
  expires_at  DateTime
  is_used     Boolean  @default(false)
  created_at  DateTime @default(now())

  user        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, type])
  @@map("otp_tokens")
}

// ─────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────

model AuditLog {
  id          String      @id @default(uuid())
  admin_id    String
  action      AuditAction
  target_id   String?                           // ID laporan/admin yang dimodifikasi
  target_type String?                           // "REPORT" | "ADMIN"
  old_value   Json?                             // JSONB: nilai sebelum perubahan
  new_value   Json?                             // JSONB: nilai setelah perubahan
  ip_address  String?
  created_at  DateTime    @default(now())

  admin       Admin       @relation(fields: [admin_id], references: [id])

  @@index([admin_id])
  @@index([action])
  @@index([target_id])
  @@index([created_at])
  @@map("audit_logs")
}
```

---

## 4. Indexes & Performance

```sql
-- Query paling sering: ambil laporan untuk peta (lat, lng + filter)
CREATE INDEX idx_reports_geo ON reports (latitude, longitude);
CREATE INDEX idx_reports_status_category ON reports (status, category);
CREATE INDEX idx_reports_district_status ON reports (district, status);

-- Notifikasi: ambil unread per user
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at DESC);

-- Report search by number
CREATE INDEX idx_reports_number ON reports (report_number);

-- Audit log query by date range
CREATE INDEX idx_audit_logs_date ON audit_logs (created_at DESC);
```

---

## 5. Database Migrations (Urutan)

```bash
# 1. Buat initial migration
npx prisma migrate dev --name init

# 2. Jalankan di production
npx prisma migrate deploy

# 3. Cek status migration
npx prisma migrate status

# 4. Seed data awal (kecamatan, super admin)
npx prisma db seed
```

---

## 6. Seed Data

```javascript
// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Buat Super Admin awal
  const superAdminPass = await bcrypt.hash('SuperAdmin@2026!', 12);
  await prisma.admin.upsert({
    where: { email: 'superadmin@lapormalang.id' },
    update: {},
    create: {
      name: 'Super Administrator',
      email: 'superadmin@lapormalang.id',
      password_hash: superAdminPass,
      role: 'super_admin',
      unit_dinas: 'BRIDA Kabupaten Malang',
    }
  });

  console.log('✅ Seed selesai: Super admin dibuat');
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

---

## 7. Backup Strategy

```bash
# Script backup harian (dipanggil oleh cron job di host atau k8s)
# Simpan ke direktori /backups dengan retention 30 hari

#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/lapor_malang_${TIMESTAMP}.sql.gz"

pg_dump -h postgres -U lapor_user -d lapor_malang | gzip > $BACKUP_FILE

# Hapus backup lebih dari 30 hari
find /backups -name "*.sql.gz" -mtime +30 -delete

echo "Backup selesai: $BACKUP_FILE"
```

---

## 8. Konvensi Penamaan

| Objek | Konvensi | Contoh |
|-------|----------|--------|
| Tabel | snake_case, plural | `report_photos` |
| Kolom | snake_case | `created_at`, `user_id` |
| PK | `id` (UUID) | `id UUID DEFAULT gen_random_uuid()` |
| FK | `{table_singular}_id` | `report_id`, `user_id` |
| Index | `idx_{table}_{kolom}` | `idx_reports_status` |
| Enum | UPPER_SNAKE_CASE | `IN_PROGRESS`, `RESOLVED` |
| Timestamp | `created_at`, `updated_at` | Semua tabel |
