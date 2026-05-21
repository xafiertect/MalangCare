// backend/src/jobs/index.js
import cron from 'node-cron';
import { runCleanupOtp } from './cleanupOtpJob.js';
import { runCleanupNotifications } from './cleanupNotifJob.js';
import { runBackupReminder } from './backupReminderJob.js';
import logger from '../utils/logger.js';

export function setupCronJobs() {
  // Setiap jam — hapus OTP expired
  cron.schedule('0 * * * *', () => {
    logger.info('⏰ Cron: Menjalankan cleanup OTP...');
    runCleanupOtp();
  });

  // Setiap hari tengah malam — trim notifikasi berlebih
  cron.schedule('0 0 * * *', () => {
    logger.info('⏰ Cron: Menjalankan cleanup notifikasi...');
    runCleanupNotifications();
  });

  // Setiap hari pukul 02.00 — reminder backup
  cron.schedule('0 2 * * *', () => {
    runBackupReminder();
  });

  logger.info('✅ Cron jobs berhasil dijadwalkan.');
}
