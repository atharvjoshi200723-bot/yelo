import React from 'react';

export interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'cream' | 'white' | 'purple' | 'lime' | 'orange' | 'teal';
  rotate?: -3 | -2 | -1 | 0 | 1 | 2 | 3;
  interactive?: boolean;
  isFloatingNotification?: boolean;
}

export const NeoCard = React.forwardRef<HTMLDivElement, NeoCardProps>(
  (
    {
      children,
      variant = 'cream',
      rotate = 0,
      interactive = false,
      isFloatingNotification = false,
      className = '',
      ...rest
    },
    ref
  ) => {
    const bgStyles: Record<string, string> = {
      cream: 'bg-[#F6FBD4] text-[#1B1250]',
      white: 'bg-white text-[#1B1250]',
      purple: 'bg-[#9A63E6] text-white',
      lime: 'bg-[#C5F030] text-[#1B1250]',
      orange: 'bg-[#E8622B] text-white',
      teal: 'bg-[#2FA3B5] text-white',
    };

    const rotationStyles: Record<number, string> = {
      [-3]: '-rotate-3',
      [-2]: '-rotate-2',
      [-1]: '-rotate-1',
      0: 'rotate-0',
      1: 'rotate-1',
      2: 'rotate-2',
      3: 'rotate-3',
    };

    // Notification cards get a white surface with soft blurred shadow per instructions
    const shadowBorder = isFloatingNotification
      ? 'bg-white border-3 border-[#1B1250] shadow-[0_12px_32px_-4px_rgba(27,18,80,0.18)]'
      : `${bgStyles[variant]} border-3 border-[#1B1250] shadow-[6px_8px_0_#1B1250]`;

    const interactiveStyles = interactive
      ? 'transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-[7px_10px_0_#1B1250] active:translate-x-[3px] active:translate-y-[4px] active:shadow-[2px_3px_0_#1B1250]'
      : '';

    return (
      <div
        ref={ref}
        className={`rounded-[26px] p-4.5 sm:p-5 relative ${shadowBorder} ${rotationStyles[rotate] || ''} ${interactiveStyles} ${className}`}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

NeoCard.displayName = 'NeoCard';
export default NeoCard;
