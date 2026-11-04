import React from 'react';

export interface NeoBadgeProps {
  children: React.ReactNode;
  color?: 'orange' | 'lime' | 'teal' | 'yellow' | 'purple' | 'approve' | 'deny' | 'cream' | 'white';
  size?: 'xs' | 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const NeoBadge: React.FC<NeoBadgeProps> = ({
  children,
  color = 'lime',
  size = 'sm',
  icon,
  className = '',
  onClick,
}) => {
  const colorStyles: Record<string, string> = {
    orange: 'bg-[#E8622B] text-white',
    lime: 'bg-[#C5F030] text-[#1B1250]',
    teal: 'bg-[#2FA3B5] text-white',
    yellow: 'bg-[#FFD41F] text-[#1B1250]',
    purple: 'bg-[#9A63E6] text-white',
    approve: 'bg-[#3F8A12] text-white',
    deny: 'bg-[#FF9A1F] text-[#1B1250]',
    cream: 'bg-[#F6FBD4] text-[#1B1250]',
    white: 'bg-white text-[#1B1250]',
  };

  const sizeStyles = {
    xs: 'text-[10px] px-2 py-0.5 gap-1 border-2 font-black',
    sm: 'text-xs px-2.5 py-1 gap-1.5 border-2.5 font-bold',
    md: 'text-sm px-3.5 py-1.5 gap-2 border-3 font-extrabold',
  };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center shrink-0 rounded-full border-[#1B1250] shadow-[2px_2px_0_#1B1250] select-none tracking-tight leading-none ${
        colorStyles[color]
      } ${sizeStyles[size]} ${
        onClick ? 'cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none' : ''
      } ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export default NeoBadge;
