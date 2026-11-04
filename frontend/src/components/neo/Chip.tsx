import React from 'react';

export interface NeoChipProps {
  label: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  count?: number | string;
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
}

export const NeoChip: React.FC<NeoChipProps> = ({
  label,
  selected = false,
  onClick,
  icon,
  count,
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-3 py-1 gap-1.5' : 'text-sm px-4 py-1.5 gap-2';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center shrink-0 rounded-full font-bold border-3 border-[#1B1250] transition-all duration-150 select-none ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        selected
          ? 'bg-[#C5F030] text-[#1B1250] shadow-[3px_4px_0_#1B1250] scale-[1.02]'
          : 'bg-[#F6FBD4] text-[#1B1250] shadow-[2px_3px_0_#1B1250] hover:bg-[#ebf3b6]'
      } ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#1B1250]'
      } ${sizeClasses} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full border-2 border-[#1B1250] font-black ${
            selected ? 'bg-[#FFD41F] text-[#1B1250]' : 'bg-[#C5F030] text-[#1B1250]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};

export interface NeoChipGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const NeoChipGroup: React.FC<NeoChipGroupProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 -mx-1 scroll-smooth ${className}`}
    >
      {children}
    </div>
  );
};

export default NeoChip;
