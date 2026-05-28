import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Loader2, ArrowLeft, Mail, CheckCircle2, Key } from 'lucide-react';
import { authService } from '../../services/authService.js';

const schema = z.object({
  email: z.string().email('Format email tidak valid'),
});

export default function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false);
  const [serverError, setServerError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await authService.forgotPassword(values.email);
      setUserEmail(values.email);
      setIsSent(true);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Permintaan gagal. Silakan coba kembali.');
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
        {!isSent ? (
          <div className="bg-slate-900 border border-gray-800 rounded-2xl p-8 shadow-premium">
            <h2 className="text-left text-xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
              <Key className="text-brand-400" size={20} /> Lupa Password?
            </h2>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Masukkan alamat email terdaftar Anda di bawah. Kami akan mengirimkan instruksi dan tautan khusus untuk mengatur ulang password Anda.
            </p>

            {serverError && (
              <div className="bg-red-950/40 border border-red-800/60 text-red-300 text-xs rounded-xl px-4 py-3 mb-5">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Alamat Email Anda
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Mengirim Instruksi...
                  </>
                ) : (
                  'Kirim Tautan Reset'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-900 border border-gray-800 rounded-2xl p-8 shadow-premium text-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} />
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Tautan Dikirim</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              Jika alamat email <span className="font-semibold text-gray-200">{userEmail}</span> terdaftar di sistem kami, Anda akan segera menerima email berisi instruksi dan tautan untuk membuat password baru.
            </p>

            <Link
              to="/login"
              className="block w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-md text-sm active:scale-95"
            >
              Kembali ke Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
