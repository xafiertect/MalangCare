import api from './api.js';

export const adminUserService = {
  getAll: () => api.get('/admin/users'),
  create: (data) => api.post('/admin/users', data),
  toggleStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { is_active: isActive }),
  resetPassword: (id) => api.post(`/admin/users/${id}/reset-password`),
};
