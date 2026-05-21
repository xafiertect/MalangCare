// backend/src/services/notification.service.js
import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Membuat notifikasi baru dan membersihkan notifikasi lama sesuai aturan FIFO (Maksimal 100).
 */
export async function createNotification({ userId, type, title, message, data = null }) {
  try {
    // 1. Simpan notifikasi ke database
    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        data: data ? JSON.parse(JSON.stringify(data)) : null
      }
    });

    // 2. Terapkan RULE-204: Maksimal 100 notifikasi per user disimpan (FIFO)
    const count = await prisma.notification.count({
      where: { user_id: userId }
    });

    if (count > 100) {
      // Dapatkan daftar ID notifikasi tertua yang melebihi batas 100
      const oldestNotifications = await prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'asc' },
        take: count - 100,
        select: { id: true }
      });

      const idsToDelete = oldestNotifications.map((n) => n.id);
      
      await prisma.notification.deleteMany({
        where: { id: { in: idsToDelete } }
      });
      
      logger.info(`🧹 FIFO Notification Cleanup: Menghapus ${idsToDelete.length} notifikasi usang untuk user ${userId}.`);
    }

    return notification;
  } catch (error) {
    logger.error('❌ Gagal membuat/mengirim notifikasi:', error);
  }
}

/**
 * Mendapatkan notifikasi milik seorang user.
 */
export async function getUserNotifications(userId) {
  return prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' }
  });
}

/**
 * Menandai notifikasi sebagai dibaca.
 */
export async function markAsRead(notificationId, userId) {
  return prisma.notification.updateMany({
    where: { id: notificationId, user_id: userId },
    data: { is_read: true }
  });
}

/**
 * Menandai seluruh notifikasi milik user sebagai dibaca.
 */
export async function markAllAsRead(userId) {
  return prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true }
  });
}
