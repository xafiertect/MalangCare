import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar.jsx';
import { ReportCard } from '../../components/report/ReportCard.jsx';
import { reportService } from '../../services/reportService.js';
import { REPORT_STATUS } from '../../utils/constants.js';

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Semua' },
  ...Object.entries(REPORT_STATUS).map(([value, { label }]) => ({ value, label })),
];

export default function MyReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    reportService.getMyReports()
      .then(({ data }) => setReports(data.data || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? reports : reports.filter((r) => r.status === filter);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Laporan Saya</h1>
          <Link to="/laporan/baru" className="btn-primary text-sm flex items-center gap-2">
            <Plus size={16} /> Buat Laporan
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Memuat laporan...</div>
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-gray-400 text-sm mb-4">
              {filter === 'ALL' ? 'Belum ada laporan.' : `Tidak ada laporan dengan status "${REPORT_STATUS[filter]?.label}".`}
            </p>
            {filter === 'ALL' && (
              <Link to="/laporan/baru" className="btn-primary text-sm inline-block">Buat Laporan Pertama</Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
