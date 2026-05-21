import { CheckCircle, AlertCircle, XCircle, Bell } from 'lucide-react';
import { formatRelative } from '../../utils/formatters.js';

const TYPE_CONFIG = {
  REPORT_RECEIVED:    { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-50' },
  REPORT_IN_PROGRESS: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  REPORT_RESOLVED:    { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
  REPORT_REJECTED:    { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
};

export function NotificationItem({ notification, onClick }) {
  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.REPORT_RECEIVED;
  const Icon = config.icon;

  return (
    <button
      onClick={() => onClick(notification)}
      className={`w-full flex gap-3 p-3 rounded-lg text-left transition-colors hover:bg-gray-50 ${
        !notification.is_read ? 'bg-brand-50/50' : ''
      }`}
    >
      <div className={`w-9 h-9 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon size={16} className={config.color} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{formatRelative(notification.created_at)}</p>
      </div>

      {!notification.is_read && (
        <div className="w-2 h-2 rounded-full bg-brand-500 mt-1 flex-shrink-0" />
      )}
    </button>
  );
}
