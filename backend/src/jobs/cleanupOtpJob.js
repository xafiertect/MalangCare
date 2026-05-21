// Hapus OTP token yang sudah expired / sudah digunakan
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

export async function runCleanupOtp() {
  try {
    const result = await prisma.otpToken.deleteMany({
      where: {
        OR: [
          { expires_at: { lt: new Date() } },
          { is_used: true }
        ]
      }
    });
    if (result.count > 0) {
      logger.info(`🧹 OTP Cleanup: ${result.count} token kedaluwarsa dihapus.`);
    }
  } catch (error) {
    logger.error('❌ OTP cleanup job gagal:', error);
  }
}
