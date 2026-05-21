// backend/src/services/report.service.js
import prisma from '../config/database.js';
import { uploadToStorage } from './storage.service.js';
import { generateReportNumber } from '../utils/reportNumber.js';
import { createNotification } from './notification.service.js';
import logger from '../utils/logger.js';

/**
 * Membuat Laporan Warga Baru (Transaction-safe)
 */
export async function createReport(userId, reportData, files = []) {
  // RULE-001: Setiap laporan wajib memiliki minimal 1 foto
  if (!files || files.length === 0) {
    throw new Error('Setiap laporan wajib melampirkan minimal 1 foto kerusakan.');
  }

  // RULE-003: Satu laporan max 5 foto
  if (files.length > 5) {
    throw new Error('Batas maksimal lampiran foto dalam satu laporan adalah 5 berkas.');
  }

  // 1. Generate nomor laporan otomatis (LP-YYYYMMDD-XXXX)
  const reportNumber = await generateReportNumber();

  // 2. Mulai Transaksi Database
  const result = await prisma.$transaction(async (tx) => {
    // A. Buat record Laporan
    const report = await tx.report.create({
      data: {
        report_number: reportNumber,
        user_id: userId,
        category: reportData.category,
        damage_level: reportData.damage_level,
        description: reportData.description,
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        address: reportData.address,
        district: reportData.district,
        status: 'PENDING' // RULE-006: Status awal laporan SELALU = PENDING
      }
    });

    // B. Unggah foto-foto ke MinIO storage & simpan record ke DB
    const photoPromises = files.map(async (file, idx) => {
      const photoUrl = await uploadToStorage(file, 'reports');
      return tx.reportPhoto.create({
        data: {
          report_id: report.id,
          photo_url: photoUrl,
          is_primary: idx === 0 // Jadikan foto pertama sebagai foto utama
        }
      });
    });

    const photos = await Promise.all(photoPromises);

    // C. Tambahkan entri riwayat ke ReportTimeline
    const timeline = await tx.reportTimeline.create({
      data: {
        report_id: report.id,
        status: 'PENDING',
        note: 'Laporan berhasil dibuat oleh warga.'
      }
    });

    return { report, photos, timeline };
  });

  // 3. Kirim notifikasi konfirmasi pendaftaran laporan ke pelapor
  await createNotification({
    userId,
    type: 'REPORT_RECEIVED',
    title: 'Laporan Berhasil Diterima',
    message: `Laporan Anda dengan nomor ${reportNumber} telah berhasil didaftarkan dan sedang menunggu verifikasi admin.`,
    data: { reportId: result.report.id, reportNumber }
  });

  return result;
}

/**
 * Mendapatkan Daftar Laporan Warga
 */
export async function getUserReports(userId) {
  return prisma.report.findMany({
    where: { user_id: userId },
    include: {
      photos: true,
      timeline: { orderBy: { created_at: 'desc' } }
    },
    orderBy: { created_at: 'desc' }
  });
}

/**
 * Mendapatkan Detail Laporan Berdasarkan ID
 */
export async function getReportById(reportId) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      photos: true,
      timeline: {
        include: {
          admin: { select: { name: true, unit_dinas: true } }
        },
        orderBy: { created_at: 'desc' }
      },
      evidences: {
        include: {
          admin: { select: { name: true, unit_dinas: true } }
        }
      },
      rating: true,
      user: { select: { name: true, email: true, phone: true } }
    }
  });

  if (!report) {
    throw new Error('Laporan tidak ditemukan.');
  }

  return report;
}

/**
 * Mendapatkan Laporan Publik untuk Peta (tanpa data pribadi pelapor)
 */
export async function getPublicReports(filters = {}) {
  const { category, damage_level, status, district } = filters;
  const where = {};
  if (category && category !== 'all') where.category = category;
  if (damage_level && damage_level !== 'all') where.damage_level = damage_level;
  if (status && status !== 'all') where.status = status;
  if (district && district !== 'all') where.district = district;

  return prisma.report.findMany({
    where,
    select: {
      id: true,
      report_number: true,
      category: true,
      damage_level: true,
      status: true,
      latitude: true,
      longitude: true,
      address: true,
      district: true,
      created_at: true,
      photos: {
        where: { is_primary: true },
        select: { photo_url: true },
        take: 1
      }
    },
    orderBy: { created_at: 'desc' }
  });
}

/**
 * Memberikan Rating Umpan Balik untuk Laporan Selesai (RESOLVED)
 */
export async function rateReport(reportId, userId, { score, comment }) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });

  if (!report) {
    throw new Error('Laporan tidak ditemukan.');
  }

  if (report.user_id !== userId) {
    throw new Error('Anda tidak memiliki izin memberikan rating pada laporan ini.');
  }

  if (report.status !== 'RESOLVED') {
    throw new Error('Rating hanya bisa diberikan pada laporan yang sudah berstatus selesai (RESOLVED).');
  }

  // Cek apakah rating sudah pernah diberikan
  const existingRating = await prisma.reportRating.findUnique({
    where: { report_id: reportId }
  });

  if (existingRating) {
    throw new Error('Anda sudah memberikan rating untuk laporan ini.');
  }

  return prisma.reportRating.create({
    data: {
      report_id: reportId,
      user_id: userId,
      score,
      comment
    }
  });
}
