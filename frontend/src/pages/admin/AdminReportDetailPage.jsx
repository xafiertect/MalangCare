import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Check, X, StickyNote, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Sidebar } from '../../components/layout/Sidebar.jsx';
import { ReportStatusBadge } from '../../components/report/ReportStatusBadge.jsx';
import { ReportTimeline } from '../../components/report/ReportTimeline.jsx';
import { PhotoGallery } from '../../components/report/PhotoGallery.jsx';
import { adminReportService } from '../../services/adminReportService.js';
import { DAMAGE_LEVELS, FACILITY_CATEGORIES } from '../../utils/constants.js';
import { formatDateTime } from '../../utils/formatters.js';

export default function AdminReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [note, setNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadReport = async () => {
    try {
      const { data } = await adminReportService.getById(id);
      setReport(data.data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, [id]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 5,
    onDrop: (files) => setEvidenceFiles((prev) => [...prev, ...files].slice(0, 5)),
  });

  const doAction = async (fn) => {
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await fn();
      await loadReport();
      setSuccessMsg('Berhasil!');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Terjadi kesalahan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcess = () => doAction(() => adminReportService.updateStatus(id, { status: 'IN_PROGRESS' }));

  const handleReject = () => doAction(async () => {
    await adminReportService.updateStatus(id, { status: 'REJECTED', rejection_reason: rejectionReason });
    setShowRejectModal(false);
    setRejectionReason('');
  });

  const handleUploadEvidence = () => doAction(async () => {
    await adminReportService.uploadEvidence(id, evidenceFiles);
    setEvidenceFiles([]);
  });

  const handleResolve = () => doAction(() => adminReportService.updateStatus(id, { status: 'RESOLVED' }));

  const handleAddNote = () => doAction(async () => {
    await adminReportService.addNote(id, note);
    setNote('');
  });

  if (loading) return <div className="flex min-h-screen"><Sidebar /><div className="flex-1 flex items-center justify-center text-gray-400">Memuat...</div></div>;
  if (!report) return <div className="flex min-h-screen"><Sidebar /><div className="flex-1 flex items-center justify-center text-gray-400">Laporan tidak ditemukan.</div></div>;

  const categoryLabel = FACILITY_CATEGORIES.find((c) => c.value === report.category)?.label || report.category;
  const damageConfig = DAMAGE_LEVELS[report.damage_level];
  const hasEvidence = (report.evidences?.length || 0) > 0;
  const canResolve = report.status === 'IN_PROGRESS' && hasEvidence;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <Link to="/admin/laporan" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft size={15} /> Kembali ke Daftar Laporan
          </Link>

          {successMsg && <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">✅ {successMsg}</div>}
          {errorMsg && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">❌ {errorMsg}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Detail */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-mono text-gray-400">{report.report_number}</p>
                    <h1 className="text-lg font-bold text-gray-900 mt-0.5">{categoryLabel}</h1>
                  </div>
                  <ReportStatusBadge status={report.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div><span className="text-gray-400">Pelapor</span><p className="font-medium">{report.user?.name}</p></div>
                  <div><span className="text-gray-400">HP</span><p className="font-medium">{report.user?.phone}</p></div>
                  <div><span className="text-gray-400">Kecamatan</span><p className="font-medium">{report.district}</p></div>
                  <div><span className="text-gray-400">Tingkat</span><span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${damageConfig?.bgClass}`}>{damageConfig?.label}</span></div>
                </div>
                <div className="text-sm"><span className="text-gray-400">Alamat: </span>{report.address}</div>
                {report.description && <p className="text-sm text-gray-600 mt-2">{report.description}</p>}
                <p className="text-xs text-gray-400 mt-2">{formatDateTime(report.created_at)}</p>
              </div>

              {/* Foto Laporan */}
              <div className="card p-5">
                <PhotoGallery photos={report.photos || []} title="Foto Kerusakan dari Pelapor" />
              </div>

              {/* Foto Bukti Perbaikan */}
              {hasEvidence && (
                <div className="card p-5 border-green-100 bg-green-50/30">
                  <PhotoGallery photos={report.evidences || []} title="Foto Bukti Perbaikan" />
                </div>
              )}

              {/* Action Buttons */}
              {report.status === 'PENDING' && (
                <div className="card p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Tindakan Verifikasi</h3>
                  <div className="flex gap-3">
                    <button onClick={handleProcess} disabled={actionLoading} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                      {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Proses Laporan
                    </button>
                    <button onClick={() => setShowRejectModal(true)} className="btn-danger flex items-center gap-2 flex-1 justify-center">
                      <X size={16} /> Tolak Laporan
                    </button>
                  </div>
                </div>
              )}

              {report.status === 'IN_PROGRESS' && (
                <div className="card p-5 space-y-4">
                  <h3 className="font-semibold text-gray-900">Upload Foto Bukti Perbaikan</h3>
                  <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-brand-400 transition-colors">
                    <input {...getInputProps()} />
                    <Upload size={24} className="text-gray-300 mx-auto mb-1" />
                    <p className="text-sm text-gray-500">Drag & drop atau klik untuk upload foto bukti</p>
                  </div>
                  {evidenceFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {evidenceFiles.map((f, i) => (
                        <img key={i} src={URL.createObjectURL(f)} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={handleUploadEvidence} disabled={!evidenceFiles.length || actionLoading} className="btn-secondary text-sm disabled:opacity-50 flex items-center gap-2">
                      {actionLoading && <Loader2 size={14} className="animate-spin" />}
                      Upload Foto Bukti ({evidenceFiles.length})
                    </button>
                    <button onClick={handleResolve} disabled={!canResolve || actionLoading} className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
                      {actionLoading && <Loader2 size={14} className="animate-spin" />}
                      ✅ Selesaikan Laporan
                    </button>
                  </div>
                  {!hasEvidence && <p className="text-xs text-orange-500">Upload foto bukti terlebih dahulu sebelum menyelesaikan laporan.</p>}
                </div>
              )}

              {/* Internal Note */}
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><StickyNote size={16} /> Catatan Internal Admin</h3>
                <div className="flex gap-2">
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input-field text-sm flex-1" rows={2} placeholder="Tambahkan catatan internal (tidak terlihat oleh pelapor)..." maxLength={1000} />
                  <button onClick={handleAddNote} disabled={!note.trim() || actionLoading} className="btn-secondary text-sm px-3 self-end disabled:opacity-50">Simpan</button>
                </div>
                {report.admin_notes?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {report.admin_notes.map((n) => (
                      <div key={n.id} className="bg-yellow-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-600">{n.admin?.name} — <span className="text-gray-400">{formatDateTime(n.created_at)}</span></p>
                        <p className="text-sm text-gray-700 mt-0.5">{n.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Timeline */}
            <div className="card p-5 h-fit">
              <h3 className="font-semibold text-gray-900 mb-4">Riwayat Status</h3>
              <ReportTimeline timeline={[...(report.timeline || [])].reverse()} />
              {report.rating && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Rating User</p>
                  <div className="flex items-center gap-1 text-yellow-400">
                    {Array.from({ length: report.rating.score }).map((_, i) => <span key={i}>★</span>)}
                  </div>
                  {report.rating.comment && <p className="text-xs text-gray-500 mt-1">{report.rating.comment}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-bold text-gray-900 mb-2">Tolak Laporan</h3>
            <p className="text-sm text-gray-500 mb-4">Berikan alasan penolakan (wajib, minimal 20 karakter).</p>
            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="input-field text-sm w-full" rows={4} placeholder="Contoh: Foto tidak menunjukkan kerusakan yang dimaksud. Lokasi tidak teridentifikasi." />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRejectModal(false)} className="btn-secondary flex-1">Batal</button>
              <button onClick={handleReject} disabled={rejectionReason.length < 20 || actionLoading} className="btn-danger flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
