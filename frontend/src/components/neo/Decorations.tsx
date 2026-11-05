import React from 'react';

/**
 * Glossy 3D Candy Ball
 * Chunky circular sticker with navy outline and curved white glare reflection.
 */
export interface CandyBallProps {
  color?: 'orange' | 'teal' | 'yellow' | 'purple' | 'lime' | 'pink';
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
    pink: 'bg-gradient-to-br from-[#FF8CAE] via-[#FF5C8A] to-[#D92C5E]',
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
 * Wavy Highlight Strip
 * Playful hand-cut wavy yellow #FFD41F strip behind 1-2 key headline words, tilted -2°.
 */
export interface WavyHighlightProps {
  children: React.ReactNode;
  color?: string; // default #FFD41F
  className?: string;
}

export const WavyHighlight: React.FC<WavyHighlightProps> = ({
  children,
  color = '#FFD41F',
  className = '',
}) => {
  return (
    <span className={`relative inline-block px-2.5 py-0.5 -rotate-2 select-none ${className}`}>
      {/* Wavy backing shape */}
      <span
        className="absolute inset-0 border-2.5 border-[#1B1250] rounded-[10px] shadow-[2.5px_3px_0_#1B1250] -z-0"
        style={{
          backgroundColor: color,
          clipPath:
            'polygon(0% 12%, 18% 2%, 38% 10%, 62% 2%, 84% 11%, 100% 4%, 100% 90%, 82% 98%, 60% 91%, 38% 99%, 16% 92%, 0% 96%)',
        }}
      />
      <span className="relative z-10 text-[#1B1250]">{children}</span>
    </span>
  );
};

/**
 * Marker Highlight Strip (Legacy fallback)
 */
export const MarkerHighlight = WavyHighlight;

/**
 * Doodle Star / Sparkle Sticker
 */
export interface DoodleStarProps {
  size?: number;
  color?: 'yellow' | 'lime' | 'pink' | 'teal' | 'orange';
  className?: string;
  rotate?: number;
}

export const DoodleStar: React.FC<DoodleStarProps> = ({
  size = 24,
  color = 'yellow',
  className = '',
  rotate = 0,
}) => {
  const fillMap = {
    yellow: '#FFD41F',
    lime: '#C5F030',
    pink: '#FF5C8A',
    teal: '#2FA3B5',
    orange: '#E8622B',
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      style={{ transform: `rotate(${rotate}deg)` }}
      className={`inline-block select-none pointer-events-none drop-shadow-[1.5px_2px_0_#1B1250] ${className}`}
    >
      <path
        d="M16 2 C16 9, 23 16, 30 16 C23 16, 16 23, 16 30 C16 23, 9 16, 2 16 C9 16, 16 9, 16 2 Z"
        fill={fillMap[color]}
        stroke="#1B1250"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="2" fill="white" />
    </svg>
  );
};

/**
 * Doodle Squiggle Line
 */
export interface DoodleSquiggleProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const DoodleSquiggle: React.FC<DoodleSquiggleProps> = ({
  width = 48,
  height = 14,
  color = '#1B1250',
  className = '',
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 16"
      fill="none"
      className={`inline-block select-none pointer-events-none ${className}`}
    >
      <path
        d="M2 9 Q 8 2, 14 9 T 26 9 T 38 9 T 50 9 T 58 8"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Doodle Arrow
 */
export interface DoodleArrowProps {
  size?: number;
  className?: string;
  color?: string;
}

export const DoodleArrow: React.FC<DoodleArrowProps> = ({
  size = 28,
  className = '',
  color = '#1B1250',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      className={`inline-block select-none pointer-events-none ${className}`}
    >
      <path
        d="M6 26 C 14 26, 22 22, 26 12 M 26 12 L 18 12 M 26 12 L 28 20"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Handwritten Decorative Note (Caveat Brush font)
 * ONLY for small decorative notes next to headings (e.g. "psst, scroll →").
 */
export interface HandwrittenNoteProps {
  children: React.ReactNode;
  className?: string;
  rotate?: number;
  color?: string;
}

export const HandwrittenNote: React.FC<HandwrittenNoteProps> = ({
  children,
  className = '',
  rotate = -4,
  color = '#1B1250',
}) => {
  return (
    <span
      className={`font-hand text-base sm:text-lg tracking-wide inline-flex items-center gap-1 select-none pointer-events-none ${className}`}
      style={{
        color,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {children}
    </span>
  );
};

/**
 * Dehradun Hills Silhouette
 * Subtle mountain horizon for the header in soft purple tint.
 */
export const DehradunHills: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 480 32"
      fill="none"
      preserveAspectRatio="none"
      className={`w-full h-8 pointer-events-none select-none opacity-25 ${className}`}
    >
      {/* Back range */}
      <path
        d="M0 32 L0 18 Q 45 4, 90 14 T 180 8 T 270 16 T 360 6 T 450 14 L 480 12 L 480 32 Z"
        fill="#9A63E6"
      />
      {/* Front range */}
      <path
        d="M0 32 L0 24 Q 50 14, 110 22 T 220 18 T 330 22 T 420 16 L 480 20 L 480 32 Z"
        fill="#B79BF0"
      />
    </svg>
  );
};

/**
 * Tiny Mascot: Round "Yelo" Blob Character
 * Two dot eyes with shine, ink smile, blushing pink cheeks.
 */
export interface MascotProps {
  size?: number;
  mood?: 'happy' | 'wink' | 'party';
  waving?: boolean;
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  size = 38,
  mood = 'happy',
  waving = false,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-block select-none shrink-0 ${waving ? 'animate-bounce-subtle' : ''} ${className}`}
    >
      <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-[2px_2.5px_0_#1B1250]">
        {/* Blob body */}
        <path
          d="M24 4 C36 4, 44 12, 44 24 C44 37, 36 44, 24 44 C12 44, 4 37, 4 24 C4 12, 12 4, 24 4 Z"
          fill="#FFD41F"
          stroke="#1B1250"
          strokeWidth="3"
        />
        {/* Specular glare */}
        <ellipse cx="14" cy="12" rx="4" ry="2.5" transform="rotate(-30 14 12)" fill="white" opacity="0.8" />

        {/* Eyes */}
        {mood === 'wink' ? (
          <>
            <path d="M14 21 Q 17 18, 20 21" stroke="#1B1250" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="30" cy="20" r="3" fill="#1B1250" />
            <circle cx="31" cy="19" r="1" fill="white" />
          </>
        ) : (
          <>
            <circle cx="17" cy="20" r="3" fill="#1B1250" />
            <circle cx="18" cy="19" r="1" fill="white" />
            <circle cx="31" cy="20" r="3" fill="#1B1250" />
            <circle cx="32" cy="19" r="1" fill="white" />
          </>
        )}

        {/* Pink blushing cheeks */}
        <ellipse cx="11" cy="26" rx="2.5" ry="1.5" fill="#FF5C8A" />
        <ellipse cx="37" cy="26" rx="2.5" ry="1.5" fill="#FF5C8A" />

        {/* Smile */}
        <path
          d="M19 26 Q 24 33, 29 26"
          fill="none"
          stroke="#1B1250"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Small waving hand */}
        {waving && (
          <path
            d="M42 22 Q 46 16, 44 14 Q 42 16, 42 20"
            stroke="#1B1250"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="#FFD41F"
          />
        )}
      </svg>
    </div>
  );
};

/**
 * Dehradun Touch: Steaming Chai Cutting Cup Sticker
 */
export const ChaiCupSticker: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-[10px] bg-[#F6FBD4] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] select-none ${className}`}
      title="Dehradun cutting chai"
    >
      <span className="text-base select-none">☕</span>
    </div>
  );
};

/**
 * Dehradun Touch: Momo Sticker
 */
export const MomoSticker: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-[10px] bg-[#F6FBD4] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] select-none ${className}`}
      title="Tibetan momos"
    >
      <span className="text-base select-none">🥟</span>
    </div>
  );
};

/**
 * Dehradun Touch: Mountain Cloud Sticker
 */
export const CloudSticker: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-[10px] bg-[#EAE4FB] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] select-none ${className}`}
      title="Mussoorie mist"
    >
      <span className="text-base select-none">☁️</span>
    </div>
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
        <CandyBall color="pink" size={54} float reverse />
      </div>

      {/* Main 480px Centered Viewport Column */}
      <div className="max-w-[480px] mx-auto min-h-screen relative flex flex-col bg-[#EAE4FB]/60 backdrop-blur-sm sm:border-x-3 sm:border-[#1B1250] sm:shadow-[0_0_50px_rgba(27,18,80,0.08)]">
        {children}
      </div>
    </div>
  );
};
