// backend/src/index.js
import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import prisma from './config/database.js';
import redis from './config/redis.js';
import { setupCronJobs } from './jobs/index.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server LAPOR MALANG berhasil mengudara di port ${PORT} (${env.NODE_ENV} mode)`);
  setupCronJobs();
});

// Penanganan graceful shutdown saat container dimatikan
const gracefulShutdown = async (signal) => {
  logger.info(`📬 Menerima sinyal ${signal}. Memulai penutupan server secara anggun...`);
  
  server.close(async () => {
    logger.info('🛑 Koneksi server HTTP ditutup.');
    
    try {
      await prisma.$disconnect();
      logger.info('💾 Koneksi database PostgreSQL terputus.');
      
      await redis.quit();
      logger.info('🔌 Koneksi Redis terputus.');
      
      logger.info('👋 Graceful shutdown selesai. Keluar.');
      process.exit(0);
    } catch (err) {
      logger.error('❌ Terjadi kesalahan saat mematikan koneksi:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
