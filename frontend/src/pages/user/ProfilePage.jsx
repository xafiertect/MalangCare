import { useState, useEffect } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import { userService } from '../../services/userService.js';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '' });
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await userService.updateProfile(form);
      updateUser(data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { data } = await userService.uploadAvatar(file);
      updateUser({ avatar_url: data.data.avatar_url });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Profil Saya</h1>

        <div className="card p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-brand-100 overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-700 text-2xl font-bold">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-brand-600 transition-colors">
                {uploadingAvatar ? <Loader2 size={13} className="text-white animate-spin" /> : <Camera size={13} className="text-white" />}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">{user?.role}</span>
            </div>
          </div>

          <hr />

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            {saved && (
              <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3">✅ Profil berhasil disimpan!</div>
            )}

            <div>
              <label className="label">Nama Lengkap</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="label">Email</label>
              <input value={user?.email || ''} className="input-field bg-gray-50 cursor-not-allowed" disabled />
              <p className="text-xs text-gray-400 mt-1">Email tidak dapat diubah</p>
            </div>

            <div>
              <label className="label">Nomor HP</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="label">NIK</label>
              <input value="••••••••••••••••" className="input-field bg-gray-50 cursor-not-allowed font-mono tracking-widest" disabled />
              <p className="text-xs text-gray-400 mt-1">NIK tidak dapat diubah</p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
