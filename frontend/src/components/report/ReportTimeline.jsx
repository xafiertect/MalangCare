import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { REPORT_STATUS } from '../../utils/constants.js';
import { formatDateTime } from '../../utils/formatters.js';

const ICONS = {
  PENDING: <Clock size={16} className="text-yellow-500" />,
  IN_PROGRESS: <AlertCircle size={16} className="text-blue-500" />,
  RESOLVED: <CheckCircle size={16} className="text-green-500" />,
  REJECTED: <XCircle size={16} className="text-red-500" />,
};

export function ReportTimeline({ timeline = [] }) {
  return (
    <div className="space-y-0">
      {timeline.map((entry, idx) => (
        <div key={entry.id} className="flex gap-3">
          {/* Icon & connector */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center flex-shrink-0 shadow-sm">
              {ICONS[entry.status] || <Clock size={16} className="text-gray-400" />}
            </div>
            {idx < timeline.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-200 my-1" style={{ minHeight: '20px' }} />
            )}
          </div>

          {/* Content */}
          <div className={`pb-4 ${idx === timeline.length - 1 ? '' : ''}`}>
            <p className="text-sm font-medium text-gray-900">
              {REPORT_STATUS[entry.status]?.label || entry.status}
            </p>
            {entry.note && <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>}
            {entry.admin && (
              <p className="text-xs text-gray-400 mt-0.5">oleh {entry.admin.name} — {entry.admin.unit_dinas}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(entry.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
