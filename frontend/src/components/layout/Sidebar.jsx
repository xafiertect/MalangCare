import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Map, Users, LogOut, MapPin, Settings } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore.js';
import { authService } from '../../services/authService.js';
import { storage } from '../../utils/storage.js';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/laporan', icon: ClipboardList, label: 'Kelola Laporan' },
  { to: '/admin/peta', icon: Map, label: 'Peta Sebaran' },
];

const superAdminItems = [
  { to: '/admin/pengguna', icon: Users, label: 'Manajemen Admin' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authService.logout(storage.getRefreshToken());
    } finally {
      clearAuth();
      navigate('/admin/login');
    }
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-500 text-white'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <MapPin size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">LAPOR MALANG</p>
            <p className="text-xs text-gray-500">Panel Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}

        {user?.role === 'super_admin' && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3">Super Admin</p>
            </div>
            {superAdminItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User Info + Logout */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-brand-700 font-bold text-sm">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </aside>
  );
}
