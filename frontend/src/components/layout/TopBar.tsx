import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, MapPin, ChevronDown, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications?limit=1');
        setUnreadCount(res.data.unreadCount || 0);
      } catch { /* ignore */ }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-cream-50/95 backdrop-blur-lg z-50">
      <div className="max-w-lg mx-auto flex items-center justify-between h-full px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl text-navy-900 tracking-tight">YELO</span>
        </Link>

        {/* Location */}
        <div className="flex items-center gap-1 text-navy-400">
          <MapPin size={14} className="location-pulse" />
          <span className="text-xs font-medium tracking-wide uppercase">Dehradun</span>
          <ChevronDown size={12} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 hover:bg-navy-50 rounded-xl transition-colors"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell size={20} className="text-navy-600" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center" aria-hidden="true">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile avatar */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 bg-navy-900 rounded-full flex items-center justify-center"
              aria-label="Open profile menu"
              aria-expanded={showMenu}
              aria-haspopup="true"
            >
              <span className="text-cream-50 font-medium text-xs">
                {user?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lifted border border-navy-100/30 py-2 z-50 animate-scale-in" role="menu" aria-label="Profile menu">
                  <Link
                    to="/profile/settings"
                    className="block px-4 py-2 text-sm text-navy-700 hover:bg-cream-100 transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    Profile Settings
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm text-navy-700 hover:bg-cream-100 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <hr className="my-1 border-navy-100/30" />
                  <button
                    onClick={() => { logout(); navigate('/login'); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-coral-500 hover:bg-coral-500/5 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
