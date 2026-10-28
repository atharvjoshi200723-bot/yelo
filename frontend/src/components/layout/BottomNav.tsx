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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-navy-100/30 z-40 safe-area-bottom" aria-label="Main navigation">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-navy-900'
                  : 'text-navy-300 hover:text-navy-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-navy-900' : 'text-navy-300'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
