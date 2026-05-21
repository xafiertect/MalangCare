import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { MapLegend } from './MapLegend.jsx';
import { MapFilter } from './MapFilter.jsx';
import { DAMAGE_LEVELS, REPORT_STATUS, MAP_DEFAULTS } from '../../utils/constants.js';
import { reportService } from '../../services/reportService.js';
import { useMapStore } from '../../stores/mapStore.js';
import { formatDate } from '../../utils/formatters.js';

// Custom colored icons
function createColoredIcon(color) {
  return L.divIcon({
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function getMarkerIcon(damageLevel, status) {
  if (status === 'RESOLVED') return createColoredIcon('#6b7280');
  const color = DAMAGE_LEVELS[damageLevel]?.mapColor || '#94a3b8';
  return createColoredIcon(color);
}

function FlyToCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1 });
  }, [center, zoom, map]);
  return null;
}

export function MapView({ height = '500px', showFilter = true, adminMode = false }) {
  const { filters } = useMapStore();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filters.category !== 'all') params.category = filters.category;
        if (filters.damage_level !== 'all') params.damage_level = filters.damage_level;
        if (filters.status !== 'all') params.status = filters.status;
        if (filters.district !== 'all') params.district = filters.district;

        const { data } = await reportService.getMapReports(params);
        setReports(data.data || []);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  return (
    <div className="relative">
      {showFilter && (
        <div className="absolute top-3 left-3 z-[400]">
          <MapFilter />
        </div>
      )}

      <div className="absolute bottom-3 right-3 z-[400]">
        <MapLegend />
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/50 z-[500] flex items-center justify-center rounded-xl">
          <div className="text-sm text-gray-500">Memuat data peta...</div>
        </div>
      )}

      <MapContainer
        center={[MAP_DEFAULTS.lat, MAP_DEFAULTS.lng]}
        zoom={MAP_DEFAULTS.zoom}
        style={{ height, width: '100%' }}
        className="rounded-xl"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {reports.map((report) => {
          const lat = parseFloat(report.latitude);
          const lng = parseFloat(report.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;
          const primaryPhoto = report.photos?.[0];
          const detailPath = adminMode ? `/admin/laporan/${report.id}` : `/laporan/${report.id}`;

          return (
            <Marker
              key={report.id}
              position={[lat, lng]}
              icon={getMarkerIcon(report.damage_level, report.status)}
            >
              <Popup maxWidth={240}>
                <div className="text-sm">
                  {primaryPhoto && (
                    <img src={primaryPhoto.photo_url} alt="" className="w-full h-28 object-cover rounded-lg mb-2" />
                  )}
                  <p className="font-semibold text-gray-800 mb-0.5">{report.category?.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500 mb-1">{report.address}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${DAMAGE_LEVELS[report.damage_level]?.bgClass}`}>
                      {DAMAGE_LEVELS[report.damage_level]?.label}
                    </span>
                    <span className={REPORT_STATUS[report.status]?.className}>
                      {REPORT_STATUS[report.status]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(report.created_at)}</p>
                  <Link
                    to={detailPath}
                    className="block mt-2 text-center text-xs bg-brand-500 text-white py-1 rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    Lihat Detail →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
