// Trim notifikasi per user agar maksimal 100 entri (FIFO)
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

export async function runCleanupNotifications() {
  try {
    const users = await prisma.notification.groupBy({
      by: ['user_id'],
      _count: { id: true },
      having: { id: { _count: { gt: 100 } } }
    });

    for (const u of users) {
      const excess = u._count.id - 100;
      const oldest = await prisma.notification.findMany({
        where: { user_id: u.user_id },
        orderBy: { created_at: 'asc' },
        take: excess,
        select: { id: true }
      });
      const ids = oldest.map((n) => n.id);
      await prisma.notification.deleteMany({ where: { id: { in: ids } } });
      logger.info(`🧹 Notif Cleanup: ${ids.length} notifikasi usang user ${u.user_id} dihapus.`);
    }
  } catch (error) {
    logger.error('❌ Notification cleanup job gagal:', error);
  }
}
