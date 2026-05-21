import { create } from 'zustand';
import { storage } from '../utils/storage.js';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: storage.getAccessToken(),
  isAuthenticated: !!storage.getAccessToken(),
  isLoading: false,

  setAuth: (user, accessToken, refreshToken) => {
    storage.setAccessToken(accessToken);
    if (refreshToken) storage.setRefreshToken(refreshToken);
    set({ user, accessToken, isAuthenticated: true });
  },

  updateToken: (accessToken) => {
    storage.setAccessToken(accessToken);
    set({ accessToken });
  },

  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : updates
  })),

  clearAuth: () => {
    storage.clearAuth();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
