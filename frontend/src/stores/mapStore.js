import { create } from 'zustand';

export const useMapStore = create((set) => ({
  filters: {
    category: 'all',
    damage_level: 'all',
    status: 'all',
    district: 'all',
  },

  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value },
  })),

  resetFilters: () => set({
    filters: { category: 'all', damage_level: 'all', status: 'all', district: 'all' },
  }),
}));
