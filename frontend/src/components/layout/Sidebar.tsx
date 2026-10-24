import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Users, MessageSquare, MessageCircle, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/rent', label: 'Rent', icon: ShoppingBag },
  { path: '/buddy', label: 'Buddy', icon: Users },
  { path: '/forums', label: 'Forums', icon: MessageSquare },
  { path: '/messages', label: 'Messages', icon: MessageCircle },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200 flex-col p-4">
      <nav className="flex-1 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
        
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Shield size={20} />
            <span>Admin</span>
          </NavLink>
        )}
      </nav>

      <div className="p-4 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-500">📍 Dehradun, Uttarakhand</p>
        <p className="text-xs text-slate-400 mt-1">Hyper-local marketplace</p>
      </div>
    </aside>
  );
}
