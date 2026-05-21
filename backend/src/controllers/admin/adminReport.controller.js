// backend/src/controllers/admin/adminReport.controller.js
import * as adminReportService from '../../services/admin/adminReport.service.js';
import { successResponse } from '../../utils/apiResponse.js';

export async function getReportDetail(req, res, next) {
  try {
    const result = await adminReportService.getAdminReportDetail(req.params.id);
    return successResponse(res, 'Berhasil mendapatkan detail laporan.', result);
  } catch (error) {
    next(error);
  }
}

export async function addNote(req, res, next) {
  try {
    const result = await adminReportService.addAdminNote(req.params.id, req.user.id, req.body.note);
    return successResponse(res, 'Catatan internal berhasil ditambahkan.', result, 201);
  } catch (error) {
    next(error);
  }
}

export async function exportCsv(req, res, next) {
  try {
    const csv = await adminReportService.exportReportsCsv(req.query);
    const date = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="laporan_malang_${date}.csv"`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
}

export async function listReports(req, res, next) {
  try {
    const result = await adminReportService.getAdminReports(req.query);
    return successResponse(res, 'Berhasil mendapatkan daftar seluruh laporan.', result, 200);
  } catch (error) {
    next(error);
  }
}

export async function uploadEvidence(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new Error('Minimal 1 foto bukti perbaikan wajib diunggah.'));
    }
    // Upload tiap file satu per satu, kumpulkan hasilnya
    const results = [];
    for (const file of req.files) {
      const evidence = await adminReportService.uploadEvidencePhoto(req.params.id, req.user.id, file);
      results.push(evidence);
    }
    return successResponse(res, `${results.length} foto bukti perbaikan berhasil diunggah.`, results, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '0.0.0.0';
    const result = await adminReportService.updateReportStatus(req.params.id, req.user.id, req.body, ipAddress);
    return successResponse(res, `Status laporan berhasil diperbarui menjadi ${req.body.status}.`, result, 200);
  } catch (error) {
    next(error);
  }
}
