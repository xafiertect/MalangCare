import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Camera, MapPin, ChevronRight, ChevronLeft, Check, X, Loader2 } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar.jsx';
import { FACILITY_CATEGORIES, KECAMATAN_MALANG, MAP_DEFAULTS } from '../../utils/constants.js';
import { reportService } from '../../services/reportService.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';

const STEPS = ['Lokasi', 'Detail', 'Foto', 'Review'];

const defaultIcon = L.divIcon({
  html: `<div style="background:#0d9488;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
  className: '', iconSize: [18, 18], iconAnchor: [9, 9],
});

function DraggableMarker({ position, onDrag }) {
  useMapEvents({
    click(e) { onDrag(e.latlng); },
  });
  return position ? <Marker position={position} icon={defaultIcon} draggable eventHandlers={{ dragend: (e) => onDrag(e.target.getLatLng()) }} /> : null;
}

export default function CreateReportPage() {
  const navigate = useNavigate();
  const { coords, getLocation, isLoading: gpsLoading } = useGeolocation();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    latitude: null, longitude: null, address: '', district: '',
    category: '', damage_level: '', description: '',
    photos: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleGps = () => {
    getLocation();
  };

  // Sync GPS coords to form
  if (coords && coords.lat !== formData.latitude) {
    setFormData((f) => ({ ...f, latitude: coords.lat, longitude: coords.lng }));
  }

  const handleMapClick = (latlng) => {
    setFormData((f) => ({ ...f, latitude: latlng.lat, longitude: latlng.lng }));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 5,
    onDrop: (acceptedFiles) => {
      setFormData((f) => ({
        ...f,
        photos: [...f.photos, ...acceptedFiles].slice(0, 5),
      }));
    },
  });

  const removePhoto = (idx) => {
    setFormData((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));
  };

  const canNext = () => {
    if (step === 0) return formData.latitude && formData.longitude && formData.address && formData.district;
    if (step === 1) return formData.category && formData.damage_level;
    if (step === 2) return formData.photos.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('category', formData.category);
      fd.append('damage_level', formData.damage_level);
      fd.append('description', formData.description);
      fd.append('latitude', formData.latitude);
      fd.append('longitude', formData.longitude);
      fd.append('address', formData.address);
      fd.append('district', formData.district);
      formData.photos.forEach((f) => fd.append('photos', f));

      const { data } = await reportService.createReport(fd);
      navigate(`/laporan/${data.data.report.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim laporan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Buat Laporan Kerusakan</h1>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                i < step ? 'bg-brand-500 text-white' :
                i === step ? 'bg-brand-500 text-white ring-4 ring-brand-100' :
                'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? 'font-semibold text-brand-600' : 'text-gray-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-brand-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-5">
          {/* Step 0 — Lokasi */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Tentukan Lokasi Kerusakan</h2>
              <button onClick={handleGps} disabled={gpsLoading} className="btn-secondary text-sm flex items-center gap-2">
                {gpsLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                {gpsLoading ? 'Mendeteksi GPS...' : 'Gunakan Lokasi GPS Saya'}
              </button>

              <MapContainer center={[formData.latitude || MAP_DEFAULTS.lat, formData.longitude || MAP_DEFAULTS.lng]} zoom={14} style={{ height: '250px' }} className="rounded-xl">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <DraggableMarker position={formData.latitude ? [formData.latitude, formData.longitude] : null} onDrag={handleMapClick} />
              </MapContainer>
              <p className="text-xs text-gray-400">Klik pada peta atau drag marker untuk menyesuaikan lokasi.</p>

              {formData.latitude && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  Koordinat: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                </p>
              )}

              <div>
                <label className="label">Alamat Lengkap *</label>
                <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-field" placeholder="Jl. Raya Kepanjen No. 10..." />
              </div>

              <div>
                <label className="label">Kecamatan *</label>
                <select value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className="input-field">
                  <option value="">Pilih kecamatan</option>
                  {KECAMATAN_MALANG.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 1 — Detail */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Detail Kerusakan</h2>
              <div>
                <label className="label">Kategori Fasilitas *</label>
                <div className="grid grid-cols-2 gap-2">
                  {FACILITY_CATEGORIES.map((c) => (
                    <button key={c.value} type="button"
                      onClick={() => setFormData({ ...formData, category: c.value })}
                      className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                        formData.category === c.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Tingkat Kerusakan *</label>
                <div className="space-y-2">
                  {[
                    { value: 'RINGAN', label: 'Ringan', desc: 'Tidak mengganggu aktivitas / lalu lintas' },
                    { value: 'SEDANG', label: 'Sedang', desc: 'Mengurangi fungsi fasilitas' },
                    { value: 'BERAT',  label: 'Berat',  desc: 'Berbahaya / tidak bisa digunakan' },
                  ].map((d) => (
                    <button key={d.value} type="button"
                      onClick={() => setFormData({ ...formData, damage_level: d.value })}
                      className={`w-full p-3 rounded-lg border text-left flex items-center gap-3 transition-colors ${
                        formData.damage_level === d.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${d.value === 'RINGAN' ? 'bg-green-400' : d.value === 'SEDANG' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                      <div>
                        <p className={`text-sm font-medium ${formData.damage_level === d.value ? 'text-brand-700' : 'text-gray-700'}`}>{d.label}</p>
                        <p className="text-xs text-gray-400">{d.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Deskripsi (opsional)</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" rows={3} placeholder="Jelaskan kondisi kerusakan..." maxLength={500} />
                <p className="text-xs text-gray-400 mt-1">{formData.description.length}/500</p>
              </div>
            </div>
          )}

          {/* Step 2 — Foto */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Upload Foto Kerusakan</h2>
              <p className="text-sm text-gray-500">Wajib minimal 1 foto, maksimal 5 foto. Format JPG/PNG/WEBP, maks 5MB per foto.</p>

              <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'}`}>
                <input {...getInputProps()} />
                <Camera size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{isDragActive ? 'Lepaskan foto di sini' : 'Drag & drop atau klik untuk pilih foto'}</p>
              </div>

              {formData.photos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.photos.map((file, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(idx)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <X size={10} className="text-white" />
                      </button>
                      {idx === 0 && <span className="absolute bottom-0 left-0 right-0 text-center text-white text-xs bg-brand-500/80 py-0.5">Utama</span>}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400">{formData.photos.length}/5 foto diunggah</p>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-900">Review Laporan</h2>
              {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Kategori</span><span className="font-medium">{FACILITY_CATEGORIES.find((c) => c.value === formData.category)?.label}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tingkat</span><span className="font-medium">{formData.damage_level}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Kecamatan</span><span className="font-medium">{formData.district}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Alamat</span><span className="font-medium text-right max-w-48">{formData.address}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Foto</span><span className="font-medium">{formData.photos.length} foto</span></div>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.photos.slice(0, 3).map((file, idx) => (
                  <img key={idx} src={URL.createObjectURL(file)} alt="" className="w-20 h-20 rounded-lg object-cover border" />
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => step > 0 && setStep(step - 1)} className={`btn-secondary flex items-center gap-1 ${step === 0 ? 'invisible' : ''}`}>
              <ChevronLeft size={16} /> Kembali
            </button>

            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canNext()} className="btn-primary flex items-center gap-1 disabled:opacity-50">
                Lanjut <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-2">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? 'Mengirim...' : 'Kirim Laporan'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
