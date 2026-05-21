import api from './api.js';

export const adminDashboardService = {
  getStats: () => api.get('/admin/dashboard/stats'),
};
