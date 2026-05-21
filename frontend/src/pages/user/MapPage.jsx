import { Navbar } from '../../components/layout/Navbar.jsx';
import { MapView } from '../../components/map/MapView.jsx';

export default function MapPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Peta Laporan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sebaran laporan kerusakan di Kabupaten Malang</p>
        </div>
        <MapView height="calc(100vh - 200px)" showFilter={true} />
      </div>
    </div>
  );
}
