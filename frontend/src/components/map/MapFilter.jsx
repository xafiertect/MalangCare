import { Filter, RotateCcw } from 'lucide-react';
import { FACILITY_CATEGORIES, DAMAGE_LEVELS, REPORT_STATUS, KECAMATAN_MALANG } from '../../utils/constants.js';
import { useMapStore } from '../../stores/mapStore.js';

export function MapFilter() {
  const { filters, setFilter, resetFilters } = useMapStore();

  const selectClass = 'input-field text-xs py-1.5';

  return (
    <div className="bg-white rounded-xl shadow-md p-3 min-w-[220px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <Filter size={14} />
          Filter Peta
        </div>
        <button
          onClick={resetFilters}
          className="text-xs text-gray-400 hover:text-brand-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Kategori</label>
          <select className={selectClass} value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
            <option value="all">Semua Kategori</option>
            {FACILITY_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Tingkat Kerusakan</label>
          <select className={selectClass} value={filters.damage_level} onChange={(e) => setFilter('damage_level', e.target.value)}>
            <option value="all">Semua Tingkat</option>
            {Object.entries(DAMAGE_LEVELS).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Status</label>
          <select className={selectClass} value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="all">Semua Status</option>
            {Object.entries(REPORT_STATUS).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Kecamatan</label>
          <select className={selectClass} value={filters.district} onChange={(e) => setFilter('district', e.target.value)}>
            <option value="all">Semua Kecamatan</option>
            {KECAMATAN_MALANG.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
