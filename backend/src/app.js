// backend/src/app.js
import express from 'express';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { globalRateLimiter } from './middleware/rateLimiter.middleware.js';
import errorHandler from './middleware/errorHandler.middleware.js';

// Import Routers
import authRoutes from './routes/auth.routes.js';
import reportRoutes from './routes/report.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import userRoutes from './routes/user.routes.js';
import mapRoutes from './routes/map.routes.js';
import adminReportRoutes from './routes/admin/adminReport.routes.js';
import adminDashboardRoutes from './routes/admin/adminDashboard.routes.js';
import adminUserRoutes from './routes/admin/adminUser.routes.js';

const app = express();

// 1. Keamanan & Kebijakan CORS
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

// 2. Request Parsers & Logger
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 3. Global Rate Limiter
app.use(globalRateLimiter);

// 4. Serve local uploads (dev fallback saat MinIO tidak tersedia)
if (process.env.NODE_ENV !== 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
}

// 5. Base Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// 6. Inject Routers
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/users', adminUserRoutes);

// 7. Central Error Handler (Wajib paling akhir)
app.use(errorHandler);

export default app;
