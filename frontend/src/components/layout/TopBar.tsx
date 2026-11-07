import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, MapPin, ChevronDown, LogOut, User as UserIcon, Settings, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { DehradunHills } from '../neo/Decorations';

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Active tab-specific color for the header accent/blob:
  // Home = pink, Rent = orange, Buddy = purple, Forums = teal, Messages = yellow
  const getTabColor = () => {
    const p = location.pathname;
    if (p.startsWith('/rent')) return '#E8622B';
    if (p.startsWith('/buddy')) return '#9A63E6';
    if (p.startsWith('/forums')) return '#2FA3B5';
    if (p.startsWith('/messages')) return '#FFD41F';
    return '#FF5C8A'; // default / home
  };
  const tabColor = getTabColor();

  // Display initial: fallback to 'A' as specified in design brief if no user name/email
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#F6FBD4] z-50 border-b-3 border-[#1B1250] shadow-[0_2px_0_#1B1250]">
      {/* Background container with overflow-hidden so silhouettes/blobs don't spill outside */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Dehradun Mountain Hills silhouette behind header in light purple tint */}
        <div className="absolute inset-x-0 bottom-0">
          <DehradunHills />
        </div>

        {/* Header tab-colored ambient glow/blob that takes current tab's color */}
        <div
          className="absolute -top-8 left-1/4 w-32 h-16 rounded-full filter blur-xl opacity-40 transition-colors duration-300"
          style={{ backgroundColor: tabColor }}
        />
      </div>

      <div className="max-w-[480px] mx-auto flex items-center justify-between h-full px-4 relative z-10">
        {/* YELO Wordmark: Chunky and lime-outlined on navy sticker */}
        <Link
          to="/"
          className="flex items-center select-none active:translate-x-0.5 active:translate-y-0.5 transition-transform"
        >
          <div className="bg-[#1B1250] text-[#C5F030] px-3 py-1 rounded-[12px] border-2.5 border-[#C5F030] shadow-[2px_3px_0_#1B1250] flex items-center justify-center relative">
            <span
              className="font-display font-black text-xl tracking-tight leading-none"
              style={{
                textShadow: '0 0 1px #C5F030',
                letterSpacing: '-0.03em',
              }}
            >
              YELO
            </span>
            {/* Small tab-colored dot in the wordmark corner */}
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-[#1B1250] transition-colors duration-300"
              style={{ backgroundColor: tabColor }}
            />
          </div>
        </Link>

        {/* City Selector: Small Pill */}
        <div className="flex items-center gap-1.5 bg-[#EAE4FB] hover:bg-[#F5F2FF] text-[#1B1250] px-3 py-1 rounded-full border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] select-none cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
          <MapPin size={13} className="text-[#E8622B] shrink-0 fill-[#E8622B]" />
          <span className="text-[11px] font-black tracking-wider uppercase">Dehradun</span>
          <ChevronDown size={12} strokeWidth={3} className="text-[#1B1250]" />
        </div>

        {/* Actions: Circular Bell & Avatar */}
        <div className="flex items-center gap-2.5">
          {/* Circular Bell Button with Navy Outline & Pink Notification Dot */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative w-9 h-9 rounded-full bg-white hover:bg-[#EAE4FB] border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] flex items-center justify-center transition-all duration-150 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <Bell size={18} strokeWidth={2.5} className="text-[#1B1250]" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#FF5C8A] text-white text-[10px] font-black rounded-full border-2 border-[#1B1250] flex items-center justify-center shadow-[1px_1px_0_#1B1250] animate-bounce"
                aria-hidden="true"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Circular Avatar with Colored Ring and Navy Outline */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-full bg-[#1B1250] border-2.5 border-[#1B1250] ring-3 ring-[#9A63E6] shadow-[2px_2px_0_#1B1250] flex items-center justify-center transition-transform active:scale-95 select-none focus:outline-none overflow-hidden cursor-pointer"
              aria-label="Open profile menu"
              aria-expanded={showMenu}
              aria-haspopup="true"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[#F6FBD4] font-black text-xs">
                  {userInitial}
                </span>
              )}
            </button>

            {/* Profile Dropdown Menu */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-2 w-52 bg-[#F6FBD4] rounded-[20px] border-3 border-[#1B1250] shadow-[5px_6px_0_#1B1250] py-2 z-50 animate-pop-in"
                  role="menu"
                  aria-label="Profile menu"
                >
                  <div className="px-4 py-2 border-b-2 border-[#1B1250]/15">
                    <p className="text-xs font-black text-[#1B1250] truncate">{user?.name || 'User'}</p>
                    <p className="text-[10px] font-bold text-[#1B1250]/60 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="px-4 py-2.5 text-xs font-black text-[#1B1250] hover:bg-[#C5F030] transition-colors border-b-2 border-[#1B1250]/15 flex items-center gap-2"
                    onClick={() => setShowMenu(false)}
                  >
                    <UserIcon size={14} strokeWidth={2.5} />
                    My Profile
                  </Link>
                  <Link
                    to="/profile/settings"
                    className="px-4 py-2.5 text-xs font-black text-[#1B1250] hover:bg-[#C5F030] transition-colors border-b-2 border-[#1B1250]/15 flex items-center gap-2"
                    onClick={() => setShowMenu(false)}
                  >
                    <Settings size={14} strokeWidth={2.5} />
                    Profile Settings
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="px-4 py-2.5 text-xs font-black text-[#1B1250] hover:bg-[#C5F030] transition-colors border-b-2 border-[#1B1250]/15 flex items-center gap-2"
                      onClick={() => setShowMenu(false)}
                    >
                      <Shield size={14} strokeWidth={2.5} />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-black text-[#E8622B] hover:bg-[#E8622B]/10 transition-colors flex items-center gap-2 cursor-pointer"
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
}
