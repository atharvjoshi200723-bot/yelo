import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export interface NeoFABProps {
  label?: string;
  icon?: React.ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-center' | 'inline';
}

export const NeoFAB: React.FC<NeoFABProps> = ({
  label,
  icon = <Plus size={22} strokeWidth={3} />,
  to,
  onClick,
  className = '',
  position = 'bottom-right',
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-24 right-5 sm:right-[max(1.25rem,calc((100vw-480px)/2+1.25rem))] z-40',
    'bottom-center': 'fixed bottom-24 left-1/2 -translate-x-1/2 z-40',
    inline: 'relative',
  };

  const content = (
    <div className="flex items-center gap-2">
      <span className="shrink-0">{icon}</span>
      {label && <span className="text-sm font-black tracking-tight">{label}</span>}
    </div>
  );

  const sharedStyles = `inline-flex items-center justify-center bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_6px_0_#1B1250] rounded-full px-5 py-3 select-none transition-all duration-200 hover:rotate-1 hover:animate-wiggle active:translate-x-[3px] active:translate-y-[4px] active:shadow-[1px_1px_0_#1B1250] ${positionClasses[position]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={sharedStyles} aria-label={label || 'Action'}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={sharedStyles}
      aria-label={label || 'Action'}
    >
      {content}
    </button>
  );
};

export default NeoFAB;
