import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ClipboardList, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar.jsx';
import { adminDashboardService } from '../../services/adminDashboardService.js';
import { FACILITY_CATEGORIES, DAMAGE_LEVELS } from '../../utils/constants.js';

const PIE_COLORS = ['#0d9488', '#0f766e', '#14b8a6', '#5eead4', '#99f6e4', '#f97316', '#ef4444'];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminDashboardService.getStats()
      .then(({ data }) => setStats(data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const overview = stats?.overview || {};
  const weeklyTrend = stats?.weekly_trend || [];
  const categories = stats?.categories || [];
  const districts = stats?.districts || [];

  const categoryChartData = categories.map((c) => ({
    name: FACILITY_CATEGORIES.find((fc) => fc.value === c.category)?.label || c.category,
    value: c.count,
  }));

  const statCards = [
    { label: 'Total Laporan', value: overview.total || 0, icon: ClipboardList, color: 'text-gray-700', bg: 'bg-gray-50' },
    { label: 'Menunggu Verifikasi', value: overview.PENDING || 0, icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-50' },
    { label: 'Sedang Diproses', value: overview.IN_PROGRESS || 0, icon: TrendingUp, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Selesai', value: overview.RESOLVED || 0, icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Ringkasan statistik laporan kerusakan fasilitas</p>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Memuat data...</div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((s) => (
                  <div key={s.label} className="card p-4">
                    <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                      <s.icon size={20} className={s.color} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Weekly Trend */}
                <div className="card p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Laporan 7 Hari Terakhir</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weeklyTrend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Laporan" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Breakdown */}
                <div className="card p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Laporan per Kategori</h3>
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                          {categoryChartData.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Belum ada data</div>
                  )}
                </div>
              </div>

              {/* Top Districts */}
              {districts.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Top Kecamatan dengan Laporan Terbanyak</h3>
                  <div className="space-y-2">
                    {districts.slice(0, 5).map((d, idx) => (
                      <div key={d.district} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-5 text-right">{idx + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-0.5">
                            <span className="font-medium text-gray-700">{d.district}</span>
                            <span className="text-gray-500">{d.count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-400 rounded-full"
                              style={{ width: `${(d.count / districts[0].count) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Reports Link */}
              {(overview.PENDING || 0) > 0 && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
                  <p className="text-sm text-yellow-800">
                    <strong>{overview.PENDING}</strong> laporan menunggu verifikasi Anda.
                  </p>
                  <Link to="/admin/laporan?status=PENDING" className="text-sm font-semibold text-yellow-700 hover:underline">
                    Proses Sekarang →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
