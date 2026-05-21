import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Download, Filter } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar.jsx';
import { ReportStatusBadge } from '../../components/report/ReportStatusBadge.jsx';
import { adminReportService } from '../../services/adminReportService.js';
import { FACILITY_CATEGORIES, DAMAGE_LEVELS, REPORT_STATUS, KECAMATAN_MALANG } from '../../utils/constants.js';
import { formatDate } from '../../utils/formatters.js';

export default function AdminReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    category: '',
    damage_level: '',
    district: '',
  });

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (search) params.search = search;
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await adminReportService.getAll(params);
      setReports(data.data || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadReports();
  };

  const handleExport = async () => {
    try {
      const params = { ...filters };
      if (search) params.search = search;
      const response = await adminReportService.exportCsv(params);
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_malang_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const selectClass = 'input-field text-sm py-1.5';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">Kelola Laporan</h1>
            <button onClick={handleExport} className="btn-secondary text-sm flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="card p-4 mb-4">
            <div className="flex flex-wrap gap-3">
              <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
                <input value={search} onChange={(e) => setSearch(e.target.value)} className="input-field text-sm flex-1" placeholder="Cari nomor laporan / nama..." />
                <button type="submit" className="btn-primary text-sm px-3">
                  <Search size={14} />
                </button>
              </form>

              <select className={selectClass} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">Semua Status</option>
                {Object.entries(REPORT_STATUS).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>

              <select className={selectClass} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">Semua Kategori</option>
                {FACILITY_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>

              <select className={selectClass} value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })}>
                <option value="">Semua Kecamatan</option>
                {KECAMATAN_MALANG.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['No Laporan', 'Pelapor', 'Kategori', 'Tingkat', 'Kecamatan', 'Status', 'Tanggal', 'Aksi'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">Memuat data...</td></tr>
                  ) : reports.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-gray-400">Tidak ada laporan ditemukan.</td></tr>
                  ) : reports.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.report_number}</td>
                      <td className="px-4 py-3 text-gray-700">{r.user?.name}</td>
                      <td className="px-4 py-3 text-gray-600">{FACILITY_CATEGORIES.find((c) => c.value === r.category)?.label}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DAMAGE_LEVELS[r.damage_level]?.bgClass}`}>
                          {DAMAGE_LEVELS[r.damage_level]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.district}</td>
                      <td className="px-4 py-3"><ReportStatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(r.created_at)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/laporan/${r.id}`} className="text-brand-600 hover:underline text-xs font-medium">Detail →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
