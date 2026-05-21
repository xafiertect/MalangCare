// backend/src/utils/reportNumber.js
import prisma from '../config/database.js';

/**
 * Membuat nomor laporan otomatis dengan format: LP-YYYYMMDD-XXXX
 * Contoh: LP-20260522-0001
 * Sequential per hari berdasarkan database records.
 */
export async function generateReportNumber() {
  const now = new Date();
  
  // Format YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Tentukan waktu awal dan akhir hari ini
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // Ambil jumlah laporan yang terbuat pada hari ini
  const countToday = await prisma.report.count({
    where: {
      created_at: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  // Urutan sequential berikutnya
  const nextSequence = String(countToday + 1).padStart(4, '0');

  return `LP-${dateStr}-${nextSequence}`;
}
