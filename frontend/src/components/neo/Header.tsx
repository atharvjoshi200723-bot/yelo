import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, MapPin, ChevronDown, LogOut } from 'lucide-react';
import api from '../../lib/api';
import NeoAvatar from './Avatar';

export const NeoHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications?limit=1');
        setUnreadCount(res.data.unreadCount || 0);
      } catch {
        /* ignore */
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#EAE4FB]/90 backdrop-blur-md z-50 border-b-3 border-[#1B1250]">
      <div className="max-w-[480px] mx-auto flex items-center justify-between h-full px-4">
        {/* YELO Wordmark Sticker */}
        <Link
          to="/"
          className="group relative flex items-center select-none active:scale-95 transition-transform"
        >
          <div className="bg-[#FFD41F] border-3 border-[#1B1250] px-2.5 py-0.5 rounded-[12px] shadow-[2px_3px_0_#1B1250] -rotate-2 group-hover:rotate-0 transition-transform">
            <span className="font-display font-black text-xl tracking-tight text-[#1B1250]">
              YELO
            </span>
          </div>
        </Link>

        {/* City Selector Pill */}
        <div className="flex items-center gap-1.5 bg-[#F6FBD4] px-3 py-1 rounded-full border-3 border-[#1B1250] shadow-[2px_2px_0_#1B1250] text-[#1B1250] select-none cursor-pointer hover:bg-white transition-colors">
          <MapPin size={13} className="text-[#E8622B] shrink-0 fill-[#E8622B]" />
          <span className="text-[11px] font-black tracking-wider uppercase">Dehradun</span>
          <ChevronDown size={12} strokeWidth={3} />
        </div>

        {/* Actions (Bell + Profile) */}
        <div className="flex items-center gap-2.5">
          {/* Notification Bell Sticker Button */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 bg-[#F6FBD4] hover:bg-white border-3 border-[#1B1250] rounded-full shadow-[2px_2px_0_#1B1250] text-[#1B1250] transition-all duration-150 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell size={18} strokeWidth={2.5} className="text-[#1B1250]" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#E8622B] text-white text-[10px] font-black rounded-full border-2 border-[#1B1250] flex items-center justify-center shadow-[1px_1px_0_#1B1250] animate-bounce-subtle"
                aria-hidden="true"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-full select-none focus:outline-none"
              aria-label="Open profile menu"
              aria-expanded={showMenu}
              aria-haspopup="true"
            >
              <NeoAvatar
                name={user?.name || user?.email}
                size="sm"
                ringColor="purple"
              />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-2 w-52 bg-[#F6FBD4] rounded-[20px] border-3 border-[#1B1250] shadow-[5px_6px_0_#1B1250] py-2 z-50 animate-pop-in overflow-hidden"
                  role="menu"
                  aria-label="Profile menu"
                >
                  <Link
                    to="/profile/settings"
                    className="block px-4 py-2.5 text-xs font-black text-[#1B1250] hover:bg-[#C5F030] transition-colors border-b-2 border-[#1B1250]/15"
                    onClick={() => setShowMenu(false)}
                  >
                    Profile Settings
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2.5 text-xs font-black text-[#1B1250] hover:bg-[#C5F030] transition-colors border-b-2 border-[#1B1250]/15"
                      onClick={() => setShowMenu(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-black text-[#E8622B] hover:bg-[#E8622B]/10 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={14} strokeWidth={2.5} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default NeoHeader;
