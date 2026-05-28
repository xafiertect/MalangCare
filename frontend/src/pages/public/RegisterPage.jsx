import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Loader2, ArrowLeft, Mail, Lock, User, Phone, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import { authService } from '../../services/authService.js';

const registerSchema = z.object({
  name: z.string().min(3, 'Nama lengkap wajib diisi minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  nik: z.string().length(16, 'NIK wajib terdiri dari 16 digit'),
  phone: z.string().min(10, 'Nomor HP minimal 10 digit').max(15, 'Nomor HP maksimal 15 digit'),
  password: z.string().min(8, 'Password wajib minimal 8 karakter'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword']
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Register Form, 2: OTP Verification, 3: Success Screen
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [serverError, setServerError] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onRegisterSubmit = async (values) => {
    setServerError('');
    try {
      const { data } = await authService.register(values);
      const result = data.data; // { userId, email }
      setUserId(result.userId);
      setUserEmail(result.email);
      setStep(2);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registrasi gagal. Pastikan email atau NIK belum terdaftar.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpToken.length !== 6) {
      setOtpError('Kode OTP harus terdiri dari 6 digit.');
      return;
    }
    setOtpError('');
    setOtpSubmitting(true);
    try {
      await authService.verifyOtp({ userId, token: otpToken });
      setStep(3);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Kode OTP tidak valid atau sudah kedaluwarsa.');
    } finally {
      setOtpSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setResendMessage('');
    setResendLoading(true);
    try {
      await authService.resendOtp({ userId });
      setResendMessage('Kode OTP baru telah dikirimkan ke email Anda.');
    } catch (err) {
      setResendMessage(err.response?.data?.message || 'Gagal mengirim ulang OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

      {step === 1 && (
        <>
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
              Daftar Akun Warga
            </h2>
            <p className="mt-2 text-center text-xs text-gray-400">
              Sudah punya akun?{' '}
              <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
                Masuk Sekarang
              </Link>
            </p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4">
            <div className="bg-slate-900 border border-gray-800 rounded-2xl p-8 shadow-premium">
              {serverError && (
                <div className="bg-red-950/40 border border-red-800/60 text-red-300 text-xs rounded-xl px-4 py-3 mb-5">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                        <User size={16} />
                      </div>
                      <input
                        {...register('name')}
                        type="text"
                        className="block w-full bg-slate-950 border border-gray-800 focus:border-brand-500/80 text-white placeholder-gray-600 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                        placeholder="Nama Lengkap"
                      />
                    </div>
                    {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Nomor NIK (KTP)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                        <Shield size={16} />
                      </div>
                      <input
                        {...register('nik')}
                        type="text"
                        maxLength={16}
                        className="block w-full bg-slate-950 border border-gray-800 focus:border-brand-500/80 text-white placeholder-gray-600 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                        placeholder="16 Digit Nomor NIK"
                      />
                    </div>
                    {errors.nik && <p className="text-xs text-red-400 mt-1">{errors.nik.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Nomor Telepon
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                        <Phone size={16} />
                      </div>
                      <input
                        {...register('phone')}
                        type="tel"
                        className="block w-full bg-slate-950 border border-gray-800 focus:border-brand-500/80 text-white placeholder-gray-600 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                        <Lock size={16} />
                      </div>
                      <input
                        {...register('password')}
                        type="password"
                        className="block w-full bg-slate-950 border border-gray-800 focus:border-brand-500/80 text-white placeholder-gray-600 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                        placeholder="Minimal 8 karakter"
                      />
                    </div>
                    {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                        <Lock size={16} />
                      </div>
                      <input
                        {...register('confirmPassword')}
                        type="password"
                        className="block w-full bg-slate-950 border border-gray-800 focus:border-brand-500/80 text-white placeholder-gray-600 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                        placeholder="Ulangi password"
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-brand-500/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-4"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Membuat Akun...
                    </>
                  ) : (
                    'Daftar Sekarang'
                  )}
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {step === 2 && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
          <div className="bg-slate-900 border border-gray-800 rounded-2xl p-8 shadow-premium text-center">
            <div className="w-14 h-14 bg-brand-500/10 text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <KeyRound size={28} />
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Verifikasi OTP</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Kode OTP 6-digit telah dikirimkan ke email <span className="font-semibold text-gray-200">{userEmail}</span>. Silakan masukkan kode di bawah ini untuk mengaktifkan akun Anda.
            </p>

            {otpError && (
              <div className="bg-red-950/40 border border-red-800/60 text-red-300 text-xs rounded-xl px-4 py-3 mb-5 text-left">
                {otpError}
              </div>
            )}

            {resendMessage && (
              <div className="bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs rounded-xl px-4 py-3 mb-5 text-left">
                {resendMessage}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="block w-full text-center bg-slate-950 border border-gray-800 focus:border-brand-500/80 text-white font-mono text-3xl tracking-[0.75em] pl-[0.75em] py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all placeholder-gray-800"
                />
              </div>

              <button
                type="submit"
                disabled={otpSubmitting}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {otpSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  'Verifikasi Akun'
                )}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center justify-center gap-2 text-xs">
              <span className="text-gray-500">Tidak menerima kode OTP?</span>
              <button
                onClick={handleResendOtp}
                disabled={resendLoading}
                className="font-semibold text-brand-400 hover:text-brand-300 transition-colors disabled:opacity-50"
              >
                {resendLoading ? 'Mengirim ulang...' : 'Kirim Ulang OTP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
          <div className="bg-slate-900 border border-gray-800 rounded-2xl p-8 shadow-premium text-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} />
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Verifikasi Berhasil!</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              Akun Anda telah berhasil diaktifkan dan diverifikasi secara resmi. Sekarang Anda dapat menggunakan akun Anda untuk melaporkan pengaduan.
            </p>

            <Link
              to="/login"
              className="block w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-all shadow-md text-sm active:scale-95"
            >
              Masuk ke Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
