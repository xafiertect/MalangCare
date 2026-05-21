// backend/src/controllers/admin/adminDashboard.controller.js
import * as dashboardService from '../../services/admin/adminDashboard.service.js';
import { successResponse } from '../../utils/apiResponse.js';

export async function getStats(req, res, next) {
  try {
    const result = await dashboardService.getDashboardStats();
    return successResponse(res, 'Berhasil mendapatkan statistik dashboard admin.', result, 200);
  } catch (error) {
    next(error);
  }
}
