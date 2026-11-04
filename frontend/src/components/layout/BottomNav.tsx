import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Users, MessageSquare, MessageCircle } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/rent', label: 'Rent', icon: ShoppingBag },
  { path: '/buddy', label: 'Buddy', icon: Users },
  { path: '/forums', label: 'Forums', icon: MessageSquare },
  { path: '/messages', label: 'Messages', icon: MessageCircle },
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
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
