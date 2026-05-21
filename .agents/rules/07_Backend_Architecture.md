# ⚙️ Backend Architecture
## LAPOR MALANG — Express.js REST API
**Versi:** 1.0.0 | **Stack:** Node.js 20 + Express.js + Prisma + PostgreSQL

---

## 1. Tech Stack Backend

| Library | Versi | Fungsi |
|---------|-------|--------|
| Node.js | 20 LTS | Runtime |
| Express.js | 4.x | Web framework |
| Prisma | 5.x | ORM + migration |
| PostgreSQL | 15 | Database (via Prisma) |
| jsonwebtoken | 9.x | JWT generate & verify |
| bcrypt | 5.x | Password hashing |
| multer | 1.x | File upload middleware |
| multer-minio-storage | latest | Stream langsung ke MinIO |
| @aws-sdk/client-s3 | 3.x | MinIO client (S3-compatible) |
| ioredis | 5.x | Redis client |
| zod | 3.x | Request validation |
| helmet | 7.x | Security headers |
| cors | 2.x | CORS configuration |
| express-rate-limit | 7.x | Rate limiting |
| morgan | 1.x | HTTP request logging |
| winston | 3.x | Application logging |
| node-cron | 3.x | Scheduled tasks |
| crypto | built-in | NIK encryption |
| csv-stringify | 6.x | CSV export |

---

## 2. Struktur Folder

```
backend/
├── src/
│   ├── index.js                    # Entry point
│   ├── app.js                      # Express app setup
│   │
│   ├── config/
│   │   ├── database.js             # Prisma client instance
│   │   ├── redis.js                # Redis client instance
│   │   ├── minio.js                # MinIO/S3 client config
│   │   └── env.js                  # Env validation (zod)
│   │
│   ├── routes/
│   │   ├── index.js                # Route aggregator
│   │   ├── auth.routes.js          # /api/auth/*
│   │   ├── report.routes.js        # /api/reports/*
│   │   ├── notification.routes.js  # /api/notifications/*
│   │   ├── user.routes.js          # /api/users/*
│   │   ├── map.routes.js           # /api/map/*
│   │   └── admin/
│   │       ├── admin.routes.js     # /api/admin/* aggregator
│   │       ├── adminReport.routes.js
│   │       ├── adminUser.routes.js
│   │       └── adminDashboard.routes.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── report.controller.js
│   │   ├── notification.controller.js
│   │   ├── user.controller.js
│   │   ├── map.controller.js
│   │   └── admin/
│   │       ├── adminReport.controller.js
│   │       ├── adminUser.controller.js
│   │       └── adminDashboard.controller.js
│   │
│   ├── services/                   # Business logic layer
│   │   ├── auth.service.js
│   │   ├── report.service.js
│   │   ├── notification.service.js
│   │   ├── user.service.js
│   │   ├── storage.service.js      # MinIO operations
│   │   ├── export.service.js       # CSV generation
│   │   └── admin/
│   │       ├── adminReport.service.js
│   │       └── adminDashboard.service.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT verify
│   │   ├── admin.middleware.js     # Role check admin
│   │   ├── superAdmin.middleware.js
│   │   ├── validate.middleware.js  # Zod validation
│   │   ├── upload.middleware.js    # Multer + MinIO config
│   │   ├── rateLimiter.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   └── auditLog.middleware.js
│   │
│   ├── validators/                 # Zod schemas
│   │   ├── auth.validator.js
│   │   ├── report.validator.js
│   │   └── admin.validator.js
│   │
│   ├── utils/
│   │   ├── generateToken.js        # JWT helpers
│   │   ├── encryption.js           # NIK AES-256 encrypt/decrypt
│   │   ├── reportNumber.js         # Generate LP-YYYYMMDD-XXXX
│   │   ├── apiResponse.js          # Standard response format
│   │   └── logger.js               # Winston config
│   │
│   └── jobs/                       # Scheduled tasks (cron)
│       ├── cleanupOtpJob.js        # Hapus OTP expired
│       ├── cleanupNotifJob.js      # Trim notif > 100 per user
│       └── backupReminderJob.js    # Log reminder backup
│
├── prisma/
│   ├── schema.prisma               # Database schema
│   └── migrations/                 # Migration files
│
├── .env
├── .env.example
├── package.json
└── Dockerfile
```

---

## 3. Express App Setup

```javascript
// src/app.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { rateLimiter } from './middleware/rateLimiter.middleware.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// HTTP logging
app.use(morgan('combined'));

// Rate limiting global
app.use(rateLimiter);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK' }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

export default app;
```

---

## 4. Routes & Controllers

### 4.1 Auth Routes

```javascript
// routes/auth.routes.js
import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginLimiter } from '../middleware/rateLimiter.middleware.js';
import { registerSchema, loginSchema, verifyOtpSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/register',       validate(registerSchema),   authCtrl.register);
router.post('/verify-otp',     validate(verifyOtpSchema),  authCtrl.verifyOtp);
router.post('/login',          loginLimiter, validate(loginSchema), authCtrl.login);
router.post('/refresh',        authCtrl.refreshToken);
router.post('/logout',         authCtrl.logout);
router.post('/forgot-password',authCtrl.forgotPassword);
router.post('/reset-password', authCtrl.resetPassword);

export default router;
```

### 4.2 Report Routes

```javascript
// routes/report.routes.js
import { Router } from 'express';
import * as reportCtrl from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadPhotos } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createReportSchema } from '../validators/report.validator.js';

const router = Router();

// Public
router.get('/public', reportCtrl.getPublicReports);        // Untuk peta publik (guest)

// Authenticated user
router.use(authenticate);
router.post('/', uploadPhotos, validate(createReportSchema), reportCtrl.create);
router.get('/my',              reportCtrl.getMyReports);
router.get('/:id',             reportCtrl.getReportById);
router.post('/:id/rating',     reportCtrl.submitRating);

export default router;
```

### 4.3 Admin Report Routes

```javascript
// routes/admin/adminReport.routes.js
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireAdmin } from '../../middleware/admin.middleware.js';
import { uploadPhotos } from '../../middleware/upload.middleware.js';
import * as adminReportCtrl from '../../controllers/admin/adminReport.controller.js';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/',                    adminReportCtrl.getAllReports);   // dengan filter & pagination
router.get('/:id',                 adminReportCtrl.getReportDetail);
router.patch('/:id/status',        adminReportCtrl.updateStatus);   // PENDING → IN_PROGRESS | REJECTED
router.post('/:id/evidence',       uploadPhotos, adminReportCtrl.uploadEvidence); // foto bukti
router.post('/:id/resolve',        adminReportCtrl.resolveReport);  // Set RESOLVED (butuh evidence)
router.post('/:id/notes',          adminReportCtrl.addInternalNote);
router.get('/export/csv',          adminReportCtrl.exportCsv);

export default router;
```

---

## 5. Middleware Kritis

### 5.1 Auth Middleware

```javascript
// middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import { redis } from '../config/redis.js';
import { apiResponse } from '../utils/apiResponse.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return apiResponse.unauthorized(res, 'Token tidak ada');
  }

  const token = authHeader.split(' ')[1];

  // Cek blacklist di Redis (logout token)
  const isBlacklisted = await redis.get(`blacklist:${token}`);
  if (isBlacklisted) {
    return apiResponse.unauthorized(res, 'Token tidak valid');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return apiResponse.unauthorized(res, 'Token expired atau tidak valid');
  }
};
```

### 5.2 Upload Middleware

```javascript
// middleware/upload.middleware.js
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Format file tidak diizinkan. Gunakan JPG, PNG, atau WEBP'));
  }
  cb(null, true);
};

// Custom storage — stream langsung ke MinIO
const minioStorage = multer.memoryStorage(); // Buffer dulu, upload manual ke MinIO di service

export const uploadPhotos = multer({
  storage: minioStorage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
}).array('photos', 5);
```

### 5.3 Error Handler

```javascript
// middleware/errorHandler.middleware.js
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    user: req.user?.id,
  });

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      code: 'FILE_TOO_LARGE',
      message: 'File terlalu besar. Maksimal 5MB per foto'
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      code: 'TOO_MANY_FILES',
      message: 'Maksimal 5 foto per laporan'
    });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      code: 'DUPLICATE_ENTRY',
      message: 'Data sudah terdaftar sebelumnya'
    });
  }

  // Default
  res.status(err.status || 500).json({
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Terjadi kesalahan server'
  });
};
```

---

## 6. Service Layer

### 6.1 Report Service

```javascript
// services/report.service.js
import { prisma } from '../config/database.js';
import { storageService } from './storage.service.js';
import { generateReportNumber } from '../utils/reportNumber.js';

export const reportService = {
  async createReport(userId, data, files) {
    // 1. Upload foto ke MinIO
    const photoUrls = await storageService.uploadMultiple(files, 'reports');

    // 2. Generate nomor laporan
    const reportNumber = await generateReportNumber();

    // 3. Simpan ke database dalam satu transaksi
    return prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          report_number: reportNumber,
          user_id: userId,
          category: data.category,
          damage_level: data.damageLevel,
          description: data.description,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          district: data.district,
          status: 'PENDING',
        }
      });

      await tx.reportPhoto.createMany({
        data: photoUrls.map((url, idx) => ({
          report_id: report.id,
          photo_url: url,
          is_primary: idx === 0,
        }))
      });

      await tx.reportTimeline.create({
        data: {
          report_id: report.id,
          status: 'PENDING',
          note: 'Laporan berhasil dibuat',
        }
      });

      return report;
    });
  },

  async getPublicReports(filters) {
    return prisma.report.findMany({
      where: {
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.damageLevel !== 'all' && { damage_level: filters.damageLevel }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.district !== 'all' && { district: filters.district }),
      },
      select: {
        id: true,
        report_number: true,
        category: true,
        damage_level: true,
        status: true,
        latitude: true,
        longitude: true,
        district: true,
        created_at: true,
        photos: {
          where: { is_primary: true },
          select: { photo_url: true },
          take: 1,
        }
      },
      orderBy: { created_at: 'desc' },
    });
  },
};
```

### 6.2 Admin Report Service

```javascript
// services/admin/adminReport.service.js
export const adminReportService = {
  async resolveReport(reportId, adminId, evidenceUrls) {
    // Validasi: foto bukti wajib ada
    const evidenceCount = await prisma.reportEvidence.count({
      where: { report_id: reportId }
    });

    if (evidenceCount === 0 && (!evidenceUrls || evidenceUrls.length === 0)) {
      throw { status: 400, code: 'EVIDENCE_REQUIRED',
        message: 'Foto bukti perbaikan wajib diunggah sebelum menyelesaikan laporan'
      };
    }

    // Validasi status: harus IN_PROGRESS
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (report.status !== 'IN_PROGRESS') {
      throw { status: 400, code: 'INVALID_STATUS',
        message: 'Laporan harus berstatus Diproses untuk diselesaikan'
      };
    }

    return prisma.$transaction(async (tx) => {
      // Update status
      await tx.report.update({
        where: { id: reportId },
        data: { status: 'RESOLVED', resolved_at: new Date() }
      });

      // Timeline
      await tx.reportTimeline.create({
        data: { report_id: reportId, status: 'RESOLVED',
          note: 'Kerusakan telah diperbaiki', actor_id: adminId }
      });

      // Audit log
      await tx.auditLog.create({
        data: { admin_id: adminId, action: 'RESOLVE_REPORT',
          target_id: reportId, target_type: 'REPORT' }
      });

      // Ambil data laporan untuk notifikasi
      const fullReport = await tx.report.findUnique({
        where: { id: reportId },
        include: { evidences: true }
      });

      // Buat notifikasi untuk user
      await tx.notification.create({
        data: {
          user_id: fullReport.user_id,
          type: 'REPORT_RESOLVED',
          title: 'Laporan Selesai Diperbaiki! ✅',
          message: `Laporan ${fullReport.report_number} telah selesai diperbaiki.`,
          data: JSON.stringify({
            report_id: reportId,
            report_number: fullReport.report_number,
            evidence_urls: fullReport.evidences.map(e => e.photo_url),
          })
        }
      });

      return fullReport;
    });
  }
};
```

---

## 7. Standard API Response

```javascript
// utils/apiResponse.js
export const apiResponse = {
  success: (res, data, message = 'Sukses', statusCode = 200) =>
    res.status(statusCode).json({ success: true, message, data }),

  created: (res, data, message = 'Berhasil dibuat') =>
    res.status(201).json({ success: true, message, data }),

  paginated: (res, data, pagination, message = 'Sukses') =>
    res.status(200).json({ success: true, message, data, pagination }),

  error: (res, message, code, statusCode = 400) =>
    res.status(statusCode).json({ success: false, code, message }),

  unauthorized: (res, message = 'Tidak terautentikasi') =>
    res.status(401).json({ success: false, code: 'UNAUTHORIZED', message }),

  forbidden: (res, message = 'Akses ditolak') =>
    res.status(403).json({ success: false, code: 'FORBIDDEN', message }),

  notFound: (res, message = 'Data tidak ditemukan') =>
    res.status(404).json({ success: false, code: 'NOT_FOUND', message }),

  serverError: (res, message = 'Terjadi kesalahan server') =>
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message }),
};
```

---

## 8. Encryption — NIK

```javascript
// utils/encryption.js
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

export const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decrypt = (encryptedText) => {
  const [ivHex, authTagHex, encHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
};
```

---

## 9. Environment Variables

```env
# backend/.env.example

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://lapor_user:lapor_pass@postgres:5432/lapor_malang

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://redis:6379

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=lapor-malang
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=http://localhost:9000

# Encryption
ENCRYPTION_KEY=64_char_hex_string_here


# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@lapormalang.id
SMTP_PASS=your_smtp_password
```

---

## 10. Dockerfile — Backend

```dockerfile
# backend/Dockerfile

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Non-root user untuk keamanan
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 5000

# Jalankan migration lalu start server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
```
