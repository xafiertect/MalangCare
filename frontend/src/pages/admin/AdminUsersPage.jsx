import { useEffect, useState } from 'react';
import { Plus, ToggleLeft, ToggleRight, RefreshCw, Loader2 } from 'lucide-react';
import { Sidebar } from '../../components/layout/Sidebar.jsx';
import { adminUserService } from '../../services/adminUserService.js';
import { formatDate } from '../../utils/formatters.js';

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin', unit_dinas: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminUserService.getAll();
      setAdmins(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await adminUserService.create(form);
      setMsg('Admin baru berhasil dibuat!');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'admin', unit_dinas: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat admin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (admin) => {
    try {
      await adminUserService.toggleStatus(admin.id, !admin.is_active);
      load();
    } catch {}
  };

  const handleResetPassword = async (id) => {
    if (!confirm('Kirim reset password ke email admin ini?')) return;
    try {
      await adminUserService.resetPassword(id);
      setMsg('Email reset password berhasil dikirim!');
    } catch {}
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900">Manajemen Admin</h1>
            <button onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-2">
              <Plus size={14} /> Tambah Admin
            </button>
          </div>

          {msg && <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">✅ {msg}</div>}

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nama', 'Email', 'Role', 'Unit Dinas', 'Terakhir Login', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400">Memuat data...</td></tr>
                ) : admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{admin.name}</td>
                    <td className="px-4 py-3 text-gray-500">{admin.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{admin.unit_dinas || '-'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{admin.last_login_at ? formatDate(admin.last_login_at) : 'Belum login'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${admin.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {admin.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggle(admin)} title={admin.is_active ? 'Nonaktifkan' : 'Aktifkan'} className="text-gray-400 hover:text-brand-600 transition-colors">
                          {admin.is_active ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                        </button>
                        <button onClick={() => handleResetPassword(admin.id)} title="Reset Password" className="text-gray-400 hover:text-orange-500 transition-colors">
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-bold text-gray-900 mb-4">Tambah Admin Baru</h3>
            {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-3">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-3">
              <div><label className="label">Nama Lengkap</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
              <div><label className="label">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required /></div>
              <div><label className="label">Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" minLength={8} required /></div>
              <div><label className="label">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div><label className="label">Unit Dinas</label><input value={form.unit_dinas} onChange={(e) => setForm({ ...form, unit_dinas: e.target.value })} className="input-field" placeholder="PUPR, Dinas Kebersihan, dll" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
