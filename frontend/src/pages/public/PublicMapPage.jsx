import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, MapPin } from 'lucide-react';
import { MapView } from '../../components/map/MapView.jsx';

export default function PublicMapPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-gray-100 flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-8 h-8 rounded-lg bg-gray-850 hover:bg-gray-800 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                <Shield size={16} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-white block">MALANG<span className="text-brand-400">CARE</span></span>
                <span className="text-[9px] text-gray-400 -mt-1 block">PETA SEBARAN</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-xs font-semibold text-gray-300 hover:text-white px-3 py-1.5 transition-colors">
              Masuk
            </Link>
            <Link to="/register" className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-all shadow-md hover:shadow-brand-500/20">
              Daftar Warga
            </Link>
          </div>
        </div>
      </header>

      {/* Main Map Area */}
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full relative z-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <MapPin size={22} className="text-brand-400" /> Peta Publik MalangCare
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Visualisasi sebaran laporan pengaduan kerusakan fasilitas publik dan pelayanan sosial di wilayah Malang.
            </p>
          </div>
          
          <div className="bg-slate-900 border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-400 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
            <span>Diperbarui secara real-time langsung oleh laporan warga</span>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 bg-slate-900 border border-gray-800 rounded-2xl overflow-hidden shadow-premium relative min-h-[500px]">
          <MapView height="calc(100vh - 240px)" showFilter={true} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-4 bg-slate-950/80 text-center text-[10px] text-gray-500">
        <p>&copy; {new Date().getFullYear()} MALANGCARE — LAPOR MALANG. Semua koordinat laporan terenkripsi demi keamanan privasi warga.</p>
      </footer>
    </div>
  );
}
