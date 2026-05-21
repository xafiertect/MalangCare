import { useNavigate } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar.jsx';
import { NotificationItem } from '../../components/notifications/NotificationItem.jsx';
import { useNotificationStore } from '../../stores/notificationStore.js';
import { notificationService } from '../../services/notificationService.js';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, markRead, markAllRead } = useNotificationStore();

  const handleClick = async (notif) => {
    if (!notif.is_read) {
      markRead(notif.id);
      await notificationService.markRead(notif.id);
    }
    // Navigate to report if data has reportId
    try {
      const data = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data;
      if (data?.report_id) navigate(`/laporan/${data.report_id}`);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    markAllRead();
    await notificationService.markAllRead();
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-900">Notifikasi</h1>
          {notifications.some((n) => !n.is_read) && (
            <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 text-sm text-brand-600 hover:underline">
              <CheckCheck size={16} /> Tandai semua dibaca
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-gray-400 text-sm">Tidak ada notifikasi.</p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-50 overflow-hidden">
            {notifications.map((notif) => (
              <NotificationItem key={notif.id} notification={notif} onClick={handleClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
