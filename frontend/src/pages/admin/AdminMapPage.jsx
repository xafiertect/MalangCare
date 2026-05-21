import { Sidebar } from '../../components/layout/Sidebar.jsx';
import { MapView } from '../../components/map/MapView.jsx';

export default function AdminMapPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Peta Sebaran Laporan</h1>
          <p className="text-sm text-gray-500">Lihat distribusi laporan kerusakan di seluruh Kabupaten Malang</p>
        </div>
        <MapView height="calc(100vh - 180px)" showFilter={true} adminMode={true} />
      </main>
    </div>
  );
}
