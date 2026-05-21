import api from './api.js';

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.patch('/users/profile', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
