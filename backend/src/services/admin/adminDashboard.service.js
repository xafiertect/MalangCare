// backend/src/services/admin/adminDashboard.service.js
import prisma from '../../config/database.js';

/**
 * Mendapatkan Data Ringkasan Statistik untuk Beranda Dashboard Admin
 */
export async function getDashboardStats() {
  // 1. Total Laporan & breakdown Status
  const statusCounts = await prisma.report.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  const stats = {
    total: 0,
    PENDING: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    REJECTED: 0
  };

  statusCounts.forEach((group) => {
    stats[group.status] = group._count.id;
    stats.total += group._count.id;
  });

  // 2. Breakdown berdasarkan Kategori Fasilitas
  const categoryCounts = await prisma.report.groupBy({
    by: ['category'],
    _count: { id: true }
  });

  const categoryStats = categoryCounts.map((group) => ({
    category: group.category,
    count: group._count.id
  }));

  // 3. Breakdown berdasarkan Tingkat Kerusakan
  const damageCounts = await prisma.report.groupBy({
    by: ['damage_level'],
    _count: { id: true }
  });

  const damageStats = damageCounts.map((group) => ({
    damage_level: group.damage_level,
    count: group._count.id
  }));

  // 4. Sebaran data per kecamatan (Kecamatan teraktif)
  const districtCounts = await prisma.report.groupBy({
    by: ['district'],
    _count: { id: true },
    orderBy: {
      _count: { id: 'desc' }
    },
    take: 10 // Top 10 kecamatan
  });

  const districtStats = districtCounts.map((group) => ({
    district: group.district,
    count: group._count.id
  }));

  // 5. Tren mingguan laporan (7 hari terakhir)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyTrendRaw = await prisma.report.findMany({
    where: {
      created_at: { gte: sevenDaysAgo }
    },
    select: { created_at: true }
  });

  // Susun data per hari
  const trendMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('id-ID', { weekday: 'long' });
    trendMap[dateStr] = 0;
  }

  weeklyTrendRaw.forEach((report) => {
    const dateStr = report.created_at.toLocaleDateString('id-ID', { weekday: 'long' });
    if (trendMap[dateStr] !== undefined) {
      trendMap[dateStr]++;
    }
  });

  const trendStats = Object.keys(trendMap).map((day) => ({
    day,
    count: trendMap[day]
  }));

  return {
    overview: stats,
    categories: categoryStats,
    damage_levels: damageStats,
    districts: districtStats,
    weekly_trend: trendStats
  };
}
