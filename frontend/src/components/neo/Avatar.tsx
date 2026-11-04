import React from 'react';

export interface NeoAvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  ringColor?: 'orange' | 'teal' | 'purple' | 'lime' | 'yellow';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
  onClick?: () => void;
}

export const NeoAvatar: React.FC<NeoAvatarProps> = ({
  src,
  alt = 'Avatar',
  name,
  ringColor = 'orange',
  size = 'md',
  online,
  className = '',
  onClick,
}) => {
  const ringColorMap = {
    orange: 'ring-[#E8622B] bg-[#E8622B]/15',
    teal: 'ring-[#2FA3B5] bg-[#2FA3B5]/15',
    purple: 'ring-[#9A63E6] bg-[#9A63E6]/15',
    lime: 'ring-[#C5F030] bg-[#C5F030]/25',
    yellow: 'ring-[#FFD41F] bg-[#FFD41F]/25',
  };

  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  const initial = name?.trim()?.charAt(0)?.toUpperCase() || alt?.trim()?.charAt(0)?.toUpperCase() || '?';

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full border-3 border-[#1B1250] ring-3 ${ringColorMap[ringColor]} ${sizeClasses[size]} font-black text-[#1B1250] overflow-hidden select-none shadow-[2px_3px_0_#1B1250] bg-white ${
        onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''
      } ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <span className="font-extrabold tracking-tight">{initial}</span>
      )}

      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1B1250] ${
            online ? 'bg-[#3F8A12]' : 'bg-[#FF9A1F]'
          }`}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default NeoAvatar;
