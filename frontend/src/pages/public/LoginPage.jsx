import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, Shield, Loader2, ArrowLeft, Mail, Lock } from 'lucide-react';
import { authService } from '../../services/authService.js';
import { useAuthStore } from '../../stores/authStore.js';
import { storage } from '../../utils/storage.js';

const schema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState('');
  const [googleError, setGoogleError] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleError('');
    try {
      const { data } = await authService.googleLogin(credentialResponse.credential);
      const { user, accessToken, refreshToken } = data.data;
      if (user.role !== 'user') {
        setGoogleError('Akun ini adalah akun dinas/admin. Silakan masuk melalui panel admin.');
        return;
      }
      setAuth(user, accessToken, refreshToken);
      storage.setRefreshToken(refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setGoogleError(err.response?.data?.message || 'Login dengan Google gagal. Coba lagi.');
    }
  };

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const { data } = await authService.login(values);
      const { user, accessToken, refreshToken } = data.data;
      
      if (user.role !== 'user') {
        setServerError('Akun ini adalah akun dinas/admin. Silakan masuk melalui panel admin.');
        return;
      }

      setAuth(user, accessToken, refreshToken);
      storage.setRefreshToken(refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login gagal. Periksa kembali email dan password Anda.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-brand-400 mb-6 transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Kembali ke Beranda
        </Link>

        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white block">MALANG<span className="text-brand-400">CARE</span></span>
            <span className="text-[10px] text-gray-400 -mt-1 block">PORTAL WARGA</span>
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold tracking-tight text-white">
          Masuk ke Akun Anda
        </h2>
        <p className="mt-2 text-center text-xs text-gray-400">
          Belum punya akun?{' '}
          <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
            Daftar Warga Baru
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900 border border-gray-800 rounded-2xl p-8 shadow-premium">
          {serverError && (
            <div className="bg-red-950/40 border border-red-800/60 text-red-300 text-xs rounded-xl px-4 py-3 mb-5">
              {serverError}
            </div>
          )}
          {googleError && (
            <div className="bg-red-950/40 border border-red-800/60 text-red-300 text-xs rounded-xl px-4 py-3 mb-5">
              {googleError}
            </div>
          )}

          {/* Google OAuth Button */}
          <div className="mb-5">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setGoogleError('Login dengan Google gagal. Coba lagi.')}
                theme="filled_black"
                shape="rectangular"
                size="large"
                width="380"
                text="signin_with"
                locale="id"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-500 font-medium">atau masuk dengan email</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail size={16} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full bg-slate-950 border border-gray-800 focus:border-brand-500/80 text-white placeholder-gray-600 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  placeholder="nama@email.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors">
                  Lupa Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock size={16} />
                </div>
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  className="block w-full bg-slate-950 border border-gray-800 focus:border-brand-500/80 text-white placeholder-gray-600 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memverifikasi Akun...
                </>
              ) : (
                'Masuk ke Dashboard'
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-[10px] text-gray-500 mt-8">
          Sistem Informasi Pengaduan Pelayanan Publik Kota Malang. &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
