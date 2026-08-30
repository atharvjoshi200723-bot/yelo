import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="min-h-screen bg-cream-50">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <TopBar />
      <main id="main-content" className="pt-16 pb-20 min-h-screen" tabIndex={-1}>
        <div className="max-w-lg mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
