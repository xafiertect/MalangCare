import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { useNotifications } from './hooks/useNotifications.js';

// Public Pages
import LandingPage from './pages/public/LandingPage.jsx';
import LoginPage from './pages/public/LoginPage.jsx';
import RegisterPage from './pages/public/RegisterPage.jsx';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/public/ResetPasswordPage.jsx';
import PublicMapPage from './pages/public/PublicMapPage.jsx';

// User Pages
import DashboardPage from './pages/user/DashboardPage.jsx';
import CreateReportPage from './pages/user/CreateReportPage.jsx';
import MyReportsPage from './pages/user/MyReportsPage.jsx';
import ReportDetailPage from './pages/user/ReportDetailPage.jsx';
import MapPage from './pages/user/MapPage.jsx';
import NotificationsPage from './pages/user/NotificationsPage.jsx';
import ProfilePage from './pages/user/ProfilePage.jsx';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';
import AdminReportDetailPage from './pages/admin/AdminReportDetailPage.jsx';
import AdminMapPage from './pages/admin/AdminMapPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';

function AppRoutes() {
  useNotifications();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/peta" element={<PublicMapPage />} />

      {/* User (Protected) */}
      <Route element={<ProtectedRoute allowedRoles={['user']} />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/laporan/baru" element={<CreateReportPage />} />
        <Route path="/laporan" element={<MyReportsPage />} />
        <Route path="/laporan/:id" element={<ReportDetailPage />} />
        <Route path="/peta-saya" element={<MapPage />} />
        <Route path="/notifikasi" element={<NotificationsPage />} />
        <Route path="/profil" element={<ProfilePage />} />
      </Route>

      {/* Admin Login */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Admin (Protected) */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/laporan" element={<AdminReportsPage />} />
        <Route path="/admin/laporan/:id" element={<AdminReportDetailPage />} />
        <Route path="/admin/peta" element={<AdminMapPage />} />
      </Route>

      {/* Super Admin Only */}
      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route path="/admin/pengguna" element={<AdminUsersPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
