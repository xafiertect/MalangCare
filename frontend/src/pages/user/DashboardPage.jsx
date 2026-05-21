import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Map, ClipboardList, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar.jsx';
import { ReportCard } from '../../components/report/ReportCard.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import { reportService } from '../../services/reportService.js';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getMyReports()
      .then(({ data }) => setReports(data.data || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'PENDING').length,
    inProgress: reports.filter((r) => r.status === 'IN_PROGRESS').length,
    resolved: reports.filter((r) => r.status === 'RESOLVED').length,
  };

  const recentReports = reports.slice(0, 5);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Greeting */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Halo, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-sm text-gray-500 mt-0.5">Pantau dan kelola laporan kerusakan Anda</p>
          </div>
          <Link to="/laporan/baru" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Buat Laporan
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Laporan', value: stats.total, icon: ClipboardList, color: 'text-gray-600', bg: 'bg-gray-50' },
            { label: 'Menunggu', value: stats.pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Diproses', value: stats.inProgress, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Selesai', value: stats.resolved, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                <s.icon size={20} className={s.color} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <Link to="/laporan/baru" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow flex-1">
            <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Buat Laporan Baru</p>
              <p className="text-xs text-gray-500">Laporkan kerusakan fasilitas</p>
            </div>
          </Link>
          <Link to="/peta" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow flex-1">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <Map size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Lihat Peta</p>
              <p className="text-xs text-gray-500">Sebaran laporan di peta</p>
            </div>
          </Link>
        </div>

        {/* Recent Reports */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Laporan Terbaru</h2>
            <Link to="/laporan" className="text-sm text-brand-600 hover:underline">Lihat Semua →</Link>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">Memuat laporan...</div>
          ) : recentReports.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400 text-sm mb-4">Anda belum memiliki laporan.</p>
              <Link to="/laporan/baru" className="btn-primary text-sm inline-block">Buat Laporan Pertama</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
