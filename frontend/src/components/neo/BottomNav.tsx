import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Users, MessageSquare, MessageCircle } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/rent', label: 'Rent', icon: ShoppingBag },
  { path: '/buddy', label: 'Buddy', icon: Users },
  { path: '/forums', label: 'Forums', icon: MessageSquare },
  { path: '/messages', label: 'Messages', icon: MessageCircle },
];

export const NeoBottomNav: React.FC = () => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom pointer-events-none"
      aria-label="Main navigation"
    >
      <div className="max-w-[480px] mx-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[5px_6px_0_#1B1250] rounded-full px-2 py-1.5 flex items-center justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center transition-all duration-200 select-none ${
                  isActive ? 'scale-105' : 'hover:scale-102 opacity-75 hover:opacity-100'
                }`
              }
            >
              {({ isActive }) => (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-[#C5F030] text-[#1B1250] border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250]'
                      : 'text-[#1B1250]'
                  }`}
                >
                  <item.icon
                    size={20}
                    strokeWidth={2.5}
                    className="shrink-0"
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
};

export default NeoBottomNav;
