// Log reminder bahwa backup harian perlu dilakukan (backup sebenarnya via pg_dump di host/cron)
import logger from '../utils/logger.js';

export function runBackupReminder() {
  logger.info('📦 Backup Reminder: Pastikan backup database harian telah berjalan via pg_dump di host.');
}
