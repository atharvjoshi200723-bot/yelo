import React from 'react';

/**
 * Glossy 3D Candy Ball
 * Chunky circular sticker with navy outline and curved white glare reflection.
 */
export interface CandyBallProps {
  color?: 'orange' | 'teal' | 'yellow' | 'purple' | 'lime';
  size?: number; // size in pixels
  className?: string;
  float?: boolean;
  reverse?: boolean;
  blur?: boolean;
}

export const CandyBall: React.FC<CandyBallProps> = ({
  color = 'orange',
  size = 56,
  className = '',
  float = true,
  reverse = false,
  blur = false,
}) => {
  const colorMap = {
    orange: 'bg-gradient-to-br from-[#FF8855] via-[#E8622B] to-[#B33F10]',
    teal: 'bg-gradient-to-br from-[#53CDDF] via-[#2FA3B5] to-[#156B78]',
    yellow: 'bg-gradient-to-br from-[#FFE769] via-[#FFD41F] to-[#D4A500]',
    purple: 'bg-gradient-to-br from-[#B788F8] via-[#9A63E6] to-[#6A34B5]',
    lime: 'bg-gradient-to-br from-[#DBFA65] via-[#C5F030] to-[#8CAE09]',
  };

  const floatClass = float
    ? reverse
      ? 'animate-candy-float-reverse'
      : 'animate-candy-float'
    : '';

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] select-none pointer-events-none shrink-0 ${colorMap[color]} ${floatClass} ${
        blur ? 'filter blur-[1px] opacity-80' : ''
      } ${className}`}
    >
      {/* 3D Glossy curved specular glare */}
      <div className="absolute top-1 left-2 w-1/3 h-1/4 bg-white/75 rounded-full transform -rotate-45 filter blur-[0.5px]" />
      <div className="absolute top-2 left-1.5 w-1.5 h-1.5 bg-white/90 rounded-full" />
    </div>
  );
};

/**
 * Marker Highlight Strip
 * Yellow #FFD41F marker-highlight strip behind 1-2 key headline words.
 */
export interface MarkerHighlightProps {
  children: React.ReactNode;
  color?: string; // default #FFD41F
  className?: string;
}

export const MarkerHighlight: React.FC<MarkerHighlightProps> = ({
  children,
  color = '#FFD41F',
  className = '',
}) => {
  return (
    <span
      style={{ backgroundColor: color }}
      className={`inline-block px-2 py-0.5 rounded-[8px] border-2 border-[#1B1250] text-[#1B1250] shadow-[2px_2px_0_#1B1250] -rotate-1 ${className}`}
    >
      {children}
    </span>
  );
};

/**
 * Mobile App Shell Container
 * Centers the app on desktop in a ~480px column with soft lavender background and decorations on the sides.
 */
export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#EAE4FB] bg-gradient-to-b from-[#EAE4FB] to-[#F5F2FF] text-[#1B1250] relative overflow-x-hidden selection:bg-[#C5F030] selection:text-[#1B1250]">
      {/* Floating Decorative Candy Balls visible on wide screens / edges */}
      <div className="hidden lg:block fixed left-[max(1rem,calc((100vw-480px)/2-80px))] top-28 pointer-events-none z-10">
        <CandyBall color="orange" size={64} float reverse />
      </div>
      <div className="hidden lg:block fixed right-[max(1rem,calc((100vw-480px)/2-90px))] top-48 pointer-events-none z-10">
        <CandyBall color="teal" size={72} float />
      </div>
      <div className="hidden lg:block fixed left-[max(1.5rem,calc((100vw-480px)/2-100px))] bottom-36 pointer-events-none z-10">
        <CandyBall color="yellow" size={56} float />
      </div>
      <div className="hidden lg:block fixed right-[max(1.5rem,calc((100vw-480px)/2-70px))] bottom-20 pointer-events-none z-10">
        <CandyBall color="purple" size={60} float reverse />
      </div>

      {/* Main 480px Centered Viewport Column */}
      <div className="max-w-[480px] mx-auto min-h-screen relative flex flex-col bg-[#EAE4FB]/60 backdrop-blur-sm sm:border-x-3 sm:border-[#1B1250] sm:shadow-[0_0_50px_rgba(27,18,80,0.08)]">
        {children}
      </div>
    </div>
  );
};
