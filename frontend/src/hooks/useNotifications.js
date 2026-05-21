import { useEffect } from 'react';
import { notificationService } from '../services/notificationService.js';
import { useNotificationStore } from '../stores/notificationStore.js';
import { useAuthStore } from '../stores/authStore.js';

export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const { setNotifications } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        const { data } = await notificationService.getAll();
        setNotifications(data.data || []);
      } catch {
        // Abaikan error polling
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, setNotifications]);
}
