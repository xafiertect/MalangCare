import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore.js';

export function NotificationBell() {
  const { unreadCount } = useNotificationStore();

  return (
    <Link to="/notifikasi" className="relative p-2 text-gray-500 hover:text-brand-600 rounded-lg hover:bg-gray-50 transition-colors">
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
