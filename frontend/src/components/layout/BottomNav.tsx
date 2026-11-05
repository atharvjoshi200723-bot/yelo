import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Users, MessageSquare, MessageCircle } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home, accent: '#FF5C8A' },          // Home = pink
  { path: '/rent', label: 'Rent', icon: ShoppingBag, accent: '#E8622B' }, // Rent = orange
  { path: '/buddy', label: 'Buddy', icon: Users, accent: '#9A63E6' },     // Buddy = purple
  { path: '/forums', label: 'Forums', icon: MessageSquare, accent: '#2FA3B5' }, // Forums = teal
  { path: '/messages', label: 'Messages', icon: MessageCircle, accent: '#FFD41F' }, // Messages = yellow
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom pointer-events-none"
      aria-label="Main navigation"
    >
      <div className="max-w-[480px] mx-auto px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2">
        {/* Floating pill bar with navy border and hard shadow */}
        <div className="pointer-events-auto bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[4px_6px_0_#1B1250] rounded-full px-2 py-1.5 flex items-center justify-between">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className="flex items-center justify-center select-none"
            >
              {({ isActive }) => (
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center gap-1.5 py-1.5 transition-all duration-200 ${
                      isActive
                        ? 'bg-[#C5F030] text-[#1B1250] border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] px-3.5 rounded-full'
                        : 'text-[#1B1250] px-2.5 hover:opacity-80 active:scale-95'
                    }`}
                  >
                    <item.icon
                      size={20}
                      strokeWidth={2.5}
                      className="shrink-0 text-[#1B1250]"
                    />
                    {isActive && (
                      <span className="text-xs font-black tracking-tight text-[#1B1250]">
                        {item.label}
                      </span>
                    )}
                  </div>
                  {/* Small accent underneath active tab: Home=pink, Rent=orange, Buddy=purple, Forums=teal, Messages=yellow */}
                  {isActive && (
                    <span
                      className="w-5 h-1 rounded-full border border-[#1B1250] mt-0.5 animate-pop-in"
                      style={{ backgroundColor: item.accent }}
                    />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
