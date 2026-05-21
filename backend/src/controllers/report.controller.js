// backend/src/controllers/report.controller.js
import * as reportService from '../services/report.service.js';
import { successResponse } from '../utils/apiResponse.js';

export async function getPublicReports(req, res, next) {
  try {
    const result = await reportService.getPublicReports(req.query);
    return successResponse(res, 'Berhasil mendapatkan data laporan publik.', result);
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const result = await reportService.createReport(req.user.id, req.body, req.files);
    return successResponse(res, 'Laporan Anda berhasil dikirimkan.', result, 201);
  } catch (error) {
    next(error);
  }
}

export async function getMyReports(req, res, next) {
  try {
    const result = await reportService.getUserReports(req.user.id);
    return successResponse(res, 'Berhasil mendapatkan daftar laporan Anda.', result, 200);
  } catch (error) {
    next(error);
  }
}

export async function getDetails(req, res, next) {
  try {
    const result = await reportService.getReportById(req.params.id);
    return successResponse(res, 'Berhasil mendapatkan rincian laporan.', result, 200);
  } catch (error) {
    next(error);
  }
}

export async function rate(req, res, next) {
  try {
    const result = await reportService.rateReport(req.params.id, req.user.id, req.body);
    return successResponse(res, 'Terima kasih atas umpan balik Anda! Rating berhasil disimpan.', result, 201);
  } catch (error) {
    next(error);
  }
}
