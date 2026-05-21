import api from './api.js';

export const reportService = {
  getPublicReports: (params) => api.get('/reports/public', { params }),
  getMapReports: (params) => api.get('/map', { params }),

  createReport: (formData) => api.post('/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyReports: () => api.get('/reports/my'),
  getReportById: (id) => api.get(`/reports/${id}`),
  submitRating: (id, data) => api.post(`/reports/${id}/rate`, data),
};
