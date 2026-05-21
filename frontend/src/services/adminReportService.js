import api from './api.js';

export const adminReportService = {
  getAll: (params) => api.get('/admin/reports', { params }),
  getById: (id) => api.get(`/admin/reports/${id}`),
  updateStatus: (id, data) => api.patch(`/admin/reports/${id}/status`, data),
  uploadEvidence: (id, files) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('photos', f));
    return api.post(`/admin/reports/${id}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  addNote: (id, note) => api.post(`/admin/reports/${id}/notes`, { note }),
  exportCsv: (params) => api.get('/admin/reports/export', {
    params,
    responseType: 'blob',
  }),
};
