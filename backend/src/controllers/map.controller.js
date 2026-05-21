// backend/src/controllers/map.controller.js
import { getPublicReports } from '../services/report.service.js';
import { successResponse } from '../utils/apiResponse.js';

export async function getMapReports(req, res, next) {
  try {
    const result = await getPublicReports(req.query);
    return successResponse(res, 'Berhasil mendapatkan data laporan untuk peta.', result);
  } catch (error) {
    next(error);
  }
}
