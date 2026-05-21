// backend/src/middleware/auditLog.middleware.js
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Utilitas untuk mencatat log audit admin ke database secara manual.
 * Dapat dipanggil langsung dari controller setelah transaksi sukses.
 */
export async function logAudit({ adminId, action, targetId, targetType, oldValue = null, newValue = null, ipAddress = '0.0.0.0' }) {
  try {
    await prisma.auditLog.create({
      data: {
        admin_id: adminId,
        action,
        target_id: targetId,
        target_type: targetType,
        old_value: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        new_value: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        ip_address: ipAddress
      }
    });
  } catch (error) {
    logger.error('❌ Gagal menulis log audit ke database:', error);
  }
}
