import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { CandyBall } from '../neo/Decorations';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#EAE4FB] bg-gradient-to-b from-[#EAE4FB] to-[#F5F2FF] text-[#1B1250] relative overflow-x-hidden">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Floating Decorative Candy Balls visible on desktop margins */}
      <div className="hidden lg:block fixed left-[max(1rem,calc((100vw-480px)/2-80px))] top-28 pointer-events-none z-10">
        <CandyBall color="orange" size={60} float reverse />
      </div>
      <div className="hidden lg:block fixed right-[max(1rem,calc((100vw-480px)/2-84px))] top-44 pointer-events-none z-10">
        <CandyBall color="teal" size={68} float />
      </div>
      <div className="hidden lg:block fixed left-[max(1.5rem,calc((100vw-480px)/2-96px))] bottom-36 pointer-events-none z-10">
        <CandyBall color="yellow" size={54} float />
      </div>
      <div className="hidden lg:block fixed right-[max(1.5rem,calc((100vw-480px)/2-72px))] bottom-24 pointer-events-none z-10">
        <CandyBall color="purple" size={58} float reverse />
      </div>

      {/* Global Sticker Header */}
      <TopBar />

      {/* Centered App Column */}
      <main
        id="main-content"
        className="pt-20 pb-24 min-h-screen max-w-[480px] mx-auto sm:border-x-3 sm:border-[#1B1250]/15 relative bg-[#EAE4FB]/40"
        tabIndex={-1}
      >
        <div className="px-4 py-2">
          <Outlet />
        </div>
      </main>

      {/* Floating Pill Bottom Nav */}
      <BottomNav />
    </div>
  );
}
