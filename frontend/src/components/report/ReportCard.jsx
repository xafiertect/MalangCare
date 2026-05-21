import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { ReportStatusBadge } from './ReportStatusBadge.jsx';
import { DAMAGE_LEVELS, FACILITY_CATEGORIES } from '../../utils/constants.js';
import { formatDate, truncate } from '../../utils/formatters.js';

export function ReportCard({ report, adminMode = false }) {
  const primaryPhoto = report.photos?.find((p) => p.is_primary) || report.photos?.[0];
  const categoryLabel = FACILITY_CATEGORIES.find((c) => c.value === report.category)?.label || report.category;
  const damageConfig = DAMAGE_LEVELS[report.damage_level];
  const detailPath = adminMode ? `/admin/laporan/${report.id}` : `/laporan/${report.id}`;

  return (
    <Link to={detailPath} className="card flex gap-4 p-4 hover:shadow-md transition-shadow group">
      {/* Foto */}
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {primaryPhoto ? (
          <img src={primaryPhoto.photo_url} alt="Foto laporan" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📷</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-xs font-mono text-gray-400">{report.report_number}</span>
          <ReportStatusBadge status={report.status} />
        </div>

        <p className="font-medium text-gray-900 text-sm mb-1">{categoryLabel}</p>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <MapPin size={11} />
          <span className="truncate">{truncate(report.address, 50)}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${damageConfig?.bgClass}`}>
            {damageConfig?.label}
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={11} />
            {formatDate(report.created_at)}
          </div>
        </div>

        {report.description && (
          <p className="text-xs text-gray-500 mt-1">{truncate(report.description, 60)}</p>
        )}
      </div>
    </Link>
  );
}
