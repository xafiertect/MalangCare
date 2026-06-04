// backend/src/services/admin/adminReport.service.js
import prisma from '../../config/database.js';
import { uploadToStorage } from '../storage.service.js';
import { createNotification } from '../notification.service.js';
import { logAudit } from '../../middleware/auditLog.middleware.js';
import { stringify } from 'csv-stringify/sync';
import logger from '../../utils/logger.js';

/**
 * Mendapatkan Detail Laporan Lengkap (untuk Admin)
 */
export async function getAdminReportDetail(reportId) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      photos: { orderBy: { is_primary: 'desc' } },
      evidences: {
        include: { admin: { select: { name: true, unit_dinas: true } } },
        orderBy: { created_at: 'asc' }
      },
      timeline: {
        include: { admin: { select: { name: true, unit_dinas: true } } },
        orderBy: { created_at: 'asc' }
      },
      admin_notes: {
        include: { admin: { select: { name: true, unit_dinas: true } } },
        orderBy: { created_at: 'desc' }
      },
      rating: true
    }
  });

  if (!report) throw new Error('Laporan tidak ditemukan.');
  return report;
}

/**
 * Menambah Catatan Internal Admin (tidak terlihat oleh user)
 */
export async function addAdminNote(reportId, adminId, note) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new Error('Laporan tidak ditemukan.');

  return prisma.adminNote.create({
    data: { report_id: reportId, admin_id: adminId, note }
  });
}

/**
 * Export Laporan ke CSV (mengikuti filter aktif)
 */
export async function exportReportsCsv(filters = {}) {
  const { category, damage_level, status, district, search, dateFrom, dateTo } = filters;

  const where = {};
  if (category) where.category = category;
  if (damage_level) where.damage_level = damage_level;
  if (status) where.status = status;
  if (district) where.district = district;
  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) where.created_at.gte = new Date(dateFrom);
    if (dateTo) where.created_at.lte = new Date(dateTo);
  }
  if (search) {
    where.OR = [
      { report_number: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } }
    ];
  }

  const reports = await prisma.report.findMany({
    where,
    include: {
      user: { select: { name: true } },
      rating: { select: { score: true } }
    },
    orderBy: { created_at: 'desc' }
  });

  const rows = reports.map((r) => ({
    'No Laporan': r.report_number,
    'Tanggal Dibuat': r.created_at.toLocaleDateString('id-ID'),
    'Tanggal Selesai': r.resolved_at ? r.resolved_at.toLocaleDateString('id-ID') : '-',
    'Pelapor': r.user.name,
    'Kecamatan': r.district,
    'Alamat': r.address,
    'Kategori': r.category,
    'Tingkat Kerusakan': r.damage_level,
    'Status': r.status,
    'Alasan Ditolak': r.rejection_reason || '-',
    'Rating User': r.rating ? r.rating.score : '-'
  }));

  return stringify(rows, { header: true });
}

/**
 * Mendapatkan Seluruh Laporan dengan Filter Pencarian untuk Admin
 */
export async function getAdminReports(filters = {}) {
  const { category, damage_level, status, district, search } = filters;

  let whereClause = {};

  if (category) whereClause.category = category;
  if (damage_level) whereClause.damage_level = damage_level;
  if (status) whereClause.status = status;
  if (district) whereClause.district = district;

  if (search) {
    whereClause.OR = [
      { report_number: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  return prisma.report.findMany({
    where: whereClause,
    include: {
      photos: true,
      user: { select: { name: true, email: true, phone: true } },
      evidences: true
    },
    orderBy: { created_at: 'desc' }
  });
}

/**
 * Mengunggah Foto Bukti Perbaikan dari Admin
 */
export async function uploadEvidencePhoto(reportId, adminId, file) {
  if (!file) {
    throw new Error('Berkas bukti perbaikan wajib dilampirkan.');
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId }
  });

  if (!report) {
    throw new Error('Laporan tidak ditemukan.');
  }

  if (report.status !== 'IN_PROGRESS') {
    throw new Error('Foto bukti perbaikan hanya bisa diunggah ketika laporan berstatus sedang diproses (IN_PROGRESS).');
  }

  // 1. Upload ke S3 MinIO S3
  const photoUrl = await uploadToStorage(file, 'public/evidences');

  // 2. Simpan record ke DB
  const evidence = await prisma.reportEvidence.create({
    data: {
      report_id: reportId,
      photo_url: photoUrl,
      uploaded_by: adminId
    }
  });

  // 3. Catat log audit admin
  await logAudit({
    adminId,
    action: 'UPLOAD_EVIDENCE',
    targetId: reportId,
    targetType: 'REPORT',
    newValue: { photoUrl }
  });

  return evidence;
}

/**
 * Memperbarui Status Laporan dengan Validasi Alur Bisnis (Transaction-safe)
 */
export async function updateReportStatus(reportId, adminId, updateData, ipAddress = '0.0.0.0') {
  const { status, note, rejection_reason } = updateData;

  // 1. Ambil kondisi status saat ini
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { evidences: true }
  });

  if (!report) {
    throw new Error('Laporan tidak ditemukan.');
  }

  const oldStatus = report.status;

  // RULE-103: Validasi alur status (hanya maju, tidak boleh mundur)
  if (oldStatus === 'PENDING') {
    if (status !== 'IN_PROGRESS' && status !== 'REJECTED') {
      throw new Error('Status PENDING hanya dapat berpindah ke IN_PROGRESS atau REJECTED.');
    }
  } else if (oldStatus === 'IN_PROGRESS') {
    if (status !== 'RESOLVED') {
      throw new Error('Status IN_PROGRESS hanya dapat berpindah ke RESOLVED.');
    }
  } else {
    throw new Error('Laporan yang telah berstatus selesai (RESOLVED) atau ditolak (REJECTED) tidak dapat diubah kembali.');
  }

  // RULE-102: Penolakan laporan wajib ada alasan minimum 20 karakter
  if (status === 'REJECTED') {
    if (!rejection_reason || rejection_reason.trim().length < 20) {
      throw new Error('Penolakan laporan wajib disertai alasan penolakan dengan minimal 20 karakter.');
    }
  }

  // RULE-101: Admin wajib upload foto bukti sebelum RESOLVED
  if (status === 'RESOLVED') {
    if (report.evidences.length === 0) {
      throw new Error('Laporan tidak dapat diselesaikan sebelum admin mengunggah foto bukti perbaikan perbaikan.');
    }
  }

  // 2. Mulai Transaksi Update Database
  const result = await prisma.$transaction(async (tx) => {
    // A. Update Laporan
    let dataToUpdate = { status };
    if (status === 'REJECTED') {
      dataToUpdate.rejection_reason = rejection_reason;
    } else if (status === 'RESOLVED') {
      dataToUpdate.resolved_at = new Date();
    }

    const updatedReport = await tx.report.update({
      where: { id: reportId },
      data: dataToUpdate
    });

    // B. Buat timeline baru
    await tx.reportTimeline.create({
      data: {
        report_id: reportId,
        status,
        note: note || `Status laporan diubah menjadi ${status} oleh dinas terkait.`,
        actor_id: adminId
      }
    });

    return updatedReport;
  });

  // 3. Tentukan notifikasi yang sesuai
  let notifType = 'REPORT_IN_PROGRESS';
  let notifTitle = 'Laporan Sedang Diproses';
  let notifMessage = `Laporan Anda ${report.report_number} telah disetujui dan sedang dalam proses perbaikan.`;

  if (status === 'RESOLVED') {
    notifType = 'REPORT_RESOLVED';
    notifTitle = 'Kerusakan Selesai Diperbaiki';
    notifMessage = `Hore! Laporan Anda ${report.report_number} telah selesai ditindaklanjuti. Terima kasih atas kepedulian Anda.`;
  } else if (status === 'REJECTED') {
    notifType = 'REPORT_REJECTED';
    notifTitle = 'Laporan Anda Ditolak';
    notifMessage = `Laporan Anda ${report.report_number} ditolak oleh dinas terkait. Alasan: "${rejection_reason}"`;
  }

  // 4. Kirim notifikasi in-app otomatis ke warga pelapor
  await createNotification({
    userId: report.user_id,
    type: notifType,
    title: notifTitle,
    message: notifMessage,
    data: {
      reportId,
      reportNumber: report.report_number,
      evidenceUrls: status === 'RESOLVED' ? report.evidences.map(e => e.photo_url) : []
    }
  });

  // 5. Catat audit log perubahan status admin (RULE-104)
  await logAudit({
    adminId,
    action: status === 'RESOLVED' ? 'RESOLVE_REPORT' : status === 'REJECTED' ? 'REJECT_REPORT' : 'PROCESS_REPORT',
    targetId: reportId,
    targetType: 'REPORT',
    oldValue: { status: oldStatus },
    newValue: { status },
    ipAddress
  });

  return result;
}
