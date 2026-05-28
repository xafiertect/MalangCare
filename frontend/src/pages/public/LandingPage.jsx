import { Link } from 'react-router-dom';
import { MapPin, MessageSquare, Shield, AlertTriangle, ArrowRight, CheckCircle2, Users, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-gray-100 flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">MALANG<span className="text-brand-400">CARE</span></span>
              <span className="text-[10px] text-gray-400 -mt-1 block">LAPOR MALANG</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#fitur" className="hover:text-brand-400 transition-colors">Fitur</a>
            <a href="#alur" className="hover:text-brand-400 transition-colors">Alur Laporan</a>
            <a href="#statistik" className="hover:text-brand-400 transition-colors">Statistik</a>
            <Link to="/peta" className="flex items-center gap-1 hover:text-brand-400 transition-colors">
              <MapPin size={14} /> Peta Publik
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 transition-colors">
              Masuk
            </Link>
            <Link to="/register" className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all shadow-md hover:shadow-brand-500/20 active:scale-95">
              Daftar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-6 animate-pulse">
            <AlertTriangle size={12} /> Portal Pengaduan Publik Malang
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Suara Anda Penting. <br />
            <span className="bg-gradient-to-r from-brand-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Malang Lebih Baik Bersama Anda.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Laporkan masalah infrastruktur, fasilitas umum, sosial, atau lingkungan di sekitar Malang secara cepat, transparan, dan terintegrasi langsung dengan dinas terkait.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto bg-gradient-to-r from-brand-500 to-teal-600 hover:from-brand-600 hover:to-teal-700 text-white font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-95 group">
              Laporkan Sekarang <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/peta" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-gray-800 hover:border-gray-700 text-gray-300 font-semibold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95">
              <MapPin size={18} /> Lihat Peta Laporan
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section id="statistik" className="py-16 border-t border-b border-gray-900 bg-slate-950/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/40 border border-gray-800/40 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <span className="block text-2xl font-bold text-white">1,248+</span>
                <span className="text-sm text-gray-400">Laporan Terselesaikan</span>
              </div>
            </div>
            <div className="bg-slate-900/40 border border-gray-800/40 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                <Clock size={24} />
              </div>
              <div>
                <span className="block text-2xl font-bold text-white">&lt; 24 Jam</span>
                <span className="text-sm text-gray-400">Rata-rata Respon Awal</span>
              </div>
            </div>
            <div className="bg-slate-900/40 border border-gray-800/40 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Users size={24} />
              </div>
              <div>
                <span className="block text-2xl font-bold text-white">4,800+</span>
                <span className="text-sm text-gray-400">Warga Terdaftar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Mengapa MalangCare?</h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">Kami menghadirkan platform pelaporan digital modern dengan kemudahan dan akurasi tinggi.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/30 border border-gray-800/50 hover:border-brand-500/30 p-8 rounded-2xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Penandaan Lokasi Presisi</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Peta interaktif berbasis geolokasi membantu mendeteksi titik koordinat keluhan Anda secara tepat agar dinas tidak salah lokasi.</p>
            </div>

            <div className="bg-slate-900/30 border border-gray-800/50 hover:border-teal-500/30 p-8 rounded-2xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Umpan Balik Real-Time</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Pantau perkembangan laporan Anda dari status dikirim, divalidasi, diproses hingga diselesaikan secara langsung dengan notifikasi instan.</p>
            </div>

            <div className="bg-slate-900/30 border border-gray-800/50 hover:border-emerald-500/30 p-8 rounded-2xl transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Kerahasiaan Terjamin</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Privasi data pribadi Anda terlindungi dengan enkripsi berlapis. Identitas NIK dijamin aman dan hanya digunakan untuk validasi laporan formal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps/Workflow Section */}
      <section id="alur" className="py-20 bg-slate-900/20 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Bagaimana Cara Kerjanya?</h2>
            <p className="text-gray-400 mt-3 max-w-xl mx-auto">Hanya 4 langkah mudah untuk berkontribusi menjaga kenyamanan kota Malang tercinta.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Tulis Laporan', desc: 'Unggah foto bukti fisik dan deskripsikan keluhan Anda secara detail.' },
              { step: '2', title: 'Tentukan Lokasi', desc: 'Pilih titik lokasi keluhan secara presisi di peta yang telah disediakan.' },
              { step: '3', title: 'Verifikasi Dinas', desc: 'Laporan Anda divalidasi dan langsung diteruskan ke instansi berwenang.' },
              { step: '4', title: 'Tindakan Nyata', desc: 'Petugas lapangan menyelesaikan masalah dan mengunggah bukti penyelesaian.' }
            ].map((item, idx) => (
              <div key={idx} className="relative bg-slate-900/40 border border-gray-800 p-6 rounded-2xl">
                <div className="absolute top-4 right-4 text-4xl font-extrabold text-brand-500/20 select-none">{item.step}</div>
                <h3 className="text-lg font-bold text-white mb-2 mt-4">{item.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-brand-500/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-snug">Mari Ciptakan Malang Kota Ramah, <br />Bersih, dan Layak Huni!</h2>
          <p className="text-gray-400 mt-4 max-w-xl mx-auto text-sm sm:text-base">Mulai dengan melayangkan laporan pertama Anda hari ini. Bersama-sama, kita bisa membuat perubahan nyata.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md active:scale-95">
              Buat Laporan Baru
            </Link>
            <Link to="/login" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-gray-800 hover:border-gray-700 text-gray-300 font-semibold px-8 py-3.5 rounded-xl transition-all active:scale-95">
              Masuk ke Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-900 py-8 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} MALANGCARE — LAPOR MALANG. Dikembangkan untuk transparansi pelayanan publik yang lebih baik.</p>
        </div>
      </footer>
    </div>
  );
}
