import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Loader2, ArrowLeft, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService.js';

const schema = z.object({
  newPassword: z.string().min(8, 'Password baru wajib minimal 8 karakter'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword']
});

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values) => {
    if (!token) {
      setServerError('Token reset tidak valid atau tidak disertakan dalam link email.');
      return;
    }
    setServerError('');
    try {
      await authService.resetPassword({
        token,
        newPassword: values.newPassword
      });
      setIsSuccess(true);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Gagal menyetel ulang password. Token mungkin sudah kedaluwarsa.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-brand-400 mb-6 transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Kembali ke Login
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
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {!isSuccess ? (
          <div className="bg-slate-900 border border-gray-800 rounded-2xl p-8 shadow-premium">
            <h2 className="text-left text-xl font-bold tracking-tight text-white mb-2">
              Atur Ulang Password
            </h2>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Masukkan password baru Anda di bawah ini. Pastikan menggunakan kombinasi karakter yang kuat dan mudah Anda ingat.
            </p>

            {!token && (
              <div className="bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs rounded-xl px-4 py-3 mb-5">
                Peringatan: Token reset tidak terdeteksi di URL. Anda tidak dapat mengirimkan form ini tanpa token reset yang valid.
              </div>
            )}

            {serverError && (
              <div className="bg-red-950/40 border border-red-800/60 text-red-300 text-xs rounded-xl px-4 py-3 mb-5">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Password Baru
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock size={16} />
                  </div>
                  <input
                    {...register('newPassword')}
                    type={showPw ? 'text' : 'password'}
                    className="block w-full bg-slate-950 border border-gray-800 focus:border-brand-500/80 text-white placeholder-gray-600 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    placeholder="Minimal 8 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-xs text-red-400 mt-1">{errors.newPassword.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock size={16} />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    className="block w-full bg-slate-950 border border-gray-800 focus:border-brand-500/80 text-white placeholder-gray-600 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                    placeholder="Ulangi password baru"
                  />
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Menyimpan Password...
                  </>
                ) : (
                  'Simpan Password Baru'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-900 border border-gray-800 rounded-2xl p-8 shadow-premium text-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} />
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Password Diperbarui</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              Password Anda telah berhasil diperbarui. Silakan login kembali dengan password baru Anda.
            </p>

            <Link
              to="/login"
              className="block w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-md text-sm active:scale-95"
            >
              Masuk ke Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
