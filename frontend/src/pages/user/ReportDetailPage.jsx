import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Star } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar.jsx';
import { ReportStatusBadge } from '../../components/report/ReportStatusBadge.jsx';
import { ReportTimeline } from '../../components/report/ReportTimeline.jsx';
import { PhotoGallery } from '../../components/report/PhotoGallery.jsx';
import { reportService } from '../../services/reportService.js';
import { DAMAGE_LEVELS, FACILITY_CATEGORIES } from '../../utils/constants.js';
import { formatDateTime } from '../../utils/formatters.js';
import { useAuthStore } from '../../stores/authStore.js';

export default function ReportDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);

  useEffect(() => {
    reportService.getReportById(id)
      .then(({ data }) => {
        setReport(data.data);
        if (data.data.rating) setRatingDone(true);
      })
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRate = async () => {
    if (!rating) return;
    setSubmittingRating(true);
    try {
      await reportService.submitRating(id, { score: rating, comment: ratingComment });
      setRatingDone(true);
    } catch {
      // ignore
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) return <div className="min-h-screen"><Navbar /><div className="text-center py-20 text-gray-400">Memuat...</div></div>;
  if (!report) return <div className="min-h-screen"><Navbar /><div className="text-center py-20 text-gray-400">Laporan tidak ditemukan.</div></div>;

  const categoryLabel = FACILITY_CATEGORIES.find((c) => c.value === report.category)?.label || report.category;
  const damageConfig = DAMAGE_LEVELS[report.damage_level];
  const isOwner = user?.id === report.user?.id;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to="/laporan" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft size={15} /> Kembali ke Laporan Saya
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Detail */}
          <div className="md:col-span-2 space-y-4">
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-mono text-gray-400 mb-1">{report.report_number}</p>
                  <h1 className="text-lg font-bold text-gray-900">{categoryLabel}</h1>
                </div>
                <ReportStatusBadge status={report.status} />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <MapPin size={14} />
                <span>{report.address}, {report.district}</span>
              </div>

              <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${damageConfig?.bgClass}`}>
                Tingkat: {damageConfig?.label}
              </span>

              {report.description && (
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{report.description}</p>
              )}

              <p className="text-xs text-gray-400 mt-3">Dilaporkan: {formatDateTime(report.created_at)}</p>

              {report.rejection_reason && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Alasan Penolakan:</p>
                  <p className="text-sm text-red-600">{report.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Foto Laporan */}
            <div className="card p-5">
              <PhotoGallery photos={report.photos || []} title="Foto Kerusakan" />
            </div>

            {/* Foto Bukti Perbaikan */}
            {report.evidences?.length > 0 && (
              <div className="card p-5 border-green-100 bg-green-50/50">
                <PhotoGallery photos={report.evidences || []} title="Foto Bukti Perbaikan" />
              </div>
            )}

            {/* Form Rating */}
            {report.status === 'RESOLVED' && isOwner && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Beri Rating Kepuasan</h3>
                {ratingDone || report.rating ? (
                  <div className="flex items-center gap-2 text-yellow-500">
                    {Array.from({ length: report.rating?.score || rating }).map((_, i) => (
                      <Star key={i} size={20} fill="currentColor" />
                    ))}
                    <span className="text-sm text-gray-500 ml-1">Terima kasih atas penilaian Anda!</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setRating(star)} className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}>
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                      className="input-field text-sm"
                      rows={2}
                      placeholder="Komentar opsional (maks. 200 karakter)"
                      maxLength={200}
                    />
                    <button onClick={handleRate} disabled={!rating || submittingRating} className="btn-primary text-sm">
                      {submittingRating ? 'Menyimpan...' : 'Kirim Rating'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Timeline */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Riwayat Status</h3>
            <ReportTimeline timeline={[...(report.timeline || [])].reverse()} />
          </div>
        </div>
      </div>
    </div>
  );
}
