import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';

export function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    const redirect = user.role === 'user' ? '/dashboard' : '/admin/dashboard';
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
}
