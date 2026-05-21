export const DAMAGE_LEVELS = {
  RINGAN: { label: 'Ringan', color: 'green', mapColor: '#22c55e', bgClass: 'bg-green-100 text-green-800' },
  SEDANG: { label: 'Sedang', color: 'yellow', mapColor: '#eab308', bgClass: 'bg-yellow-100 text-yellow-800' },
  BERAT:  { label: 'Berat',  color: 'red',    mapColor: '#ef4444', bgClass: 'bg-red-100 text-red-800' },
};

export const REPORT_STATUS = {
  PENDING:     { label: 'Menunggu',  color: 'gray',  mapColor: '#94a3b8', className: 'badge-pending' },
  IN_PROGRESS: { label: 'Diproses', color: 'blue',  mapColor: '#3b82f6', className: 'badge-progress' },
  RESOLVED:    { label: 'Selesai',  color: 'green', mapColor: '#6b7280', className: 'badge-resolved' },
  REJECTED:    { label: 'Ditolak', color: 'red',   mapColor: '#ef4444', className: 'badge-rejected' },
};

export const FACILITY_CATEGORIES = [
  { value: 'JALAN',              label: 'Jalan' },
  { value: 'JEMBATAN',           label: 'Jembatan' },
  { value: 'DRAINASE',           label: 'Drainase' },
  { value: 'LAMPU_JALAN',        label: 'Lampu Jalan' },
  { value: 'TAMAN',              label: 'Taman' },
  { value: 'FASILITAS_OLAHRAGA', label: 'Fasilitas Olahraga' },
  { value: 'LAINNYA',            label: 'Lainnya' },
];

export const KECAMATAN_MALANG = [
  'Ampelgading', 'Bantur', 'Bululawang', 'Dampit', 'Dau', 'Donomulyo',
  'Gedangan', 'Gondanglegi', 'Jabung', 'Kalipare', 'Karangploso',
  'Kasembon', 'Kepanjen', 'Kromengan', 'Lawang', 'Ngajum', 'Ngantang',
  'Pagak', 'Pagelaran', 'Pakis', 'Pakisaji', 'Poncokusumo',
  'Pujon', 'Singosari', 'Sumbermanjing Wetan', 'Sumberpucung',
  'Tajinan', 'Tirto Yudo', 'Tumpang', 'Turen', 'Wagir',
  'Wajak', 'Wonosari',
];

export const MAP_DEFAULTS = {
  lat: parseFloat(import.meta.env.VITE_MAP_DEFAULT_LAT || '-8.1654'),
  lng: parseFloat(import.meta.env.VITE_MAP_DEFAULT_LNG || '112.6208'),
  zoom: parseInt(import.meta.env.VITE_MAP_DEFAULT_ZOOM || '11'),
};
