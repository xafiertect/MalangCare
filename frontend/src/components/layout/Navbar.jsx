import { Link, useNavigate } from 'react-router-dom';
import { Bell, MapPin, LogOut, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { useNotificationStore } from '../../stores/notificationStore.js';
import { authService } from '../../services/authService.js';
import { storage } from '../../utils/storage.js';

export function Navbar() {
  const navigate = useNavigate();
  const { user, clearAuth, isAuthenticated } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout(storage.getRefreshToken());
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <MapPin size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">LAPOR MALANG</span>
          </Link>

          {/* Nav Links (desktop) */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/peta" className="text-sm text-gray-600 hover:text-brand-600 font-medium transition-colors">
              Peta Laporan
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="text-sm text-gray-600 hover:text-brand-600 font-medium transition-colors">
                  Dashboard
                </Link>
                <Link to="/laporan" className="text-sm text-gray-600 hover:text-brand-600 font-medium transition-colors">
                  Laporan Saya
                </Link>
              </>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notif Bell */}
                <Link to="/notifikasi" className="relative p-2 text-gray-500 hover:text-brand-600 rounded-lg hover:bg-gray-50 transition-colors">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 transition-colors"
                  >
                    <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                      {user?.avatar_url
                        ? <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        : <User size={16} className="text-brand-600" />
                      }
                    </div>
                    <span className="hidden sm:block font-medium">{user?.name?.split(' ')[0]}</span>
                    <ChevronDown size={14} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
                      <Link
                        to="/profil"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User size={14} /> Profil Saya
                      </Link>
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut size={14} /> Keluar
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-1.5">Masuk</Link>
                <Link to="/register" className="btn-primary text-sm py-1.5">Daftar</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
