import React from 'react';

export interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'purple' | 'orange' | 'teal' | 'deny' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const NeoButton = React.forwardRef<HTMLButtonElement, NeoButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      icon,
      iconRight,
      className = '',
      disabled = false,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    // Neo-brutalist variant styles
    const variantStyles: Record<string, string> = {
      primary:
        'bg-[#C5F030] text-[#1B1250] hover:bg-[#bcf01a] shadow-[4px_5px_0_#1B1250] active:shadow-[1px_1px_0_#1B1250]',
      secondary:
        'bg-[#F6FBD4] text-[#1B1250] hover:bg-[#edf4b8] shadow-[4px_5px_0_#1B1250] active:shadow-[1px_1px_0_#1B1250]',
      purple:
        'bg-[#9A63E6] text-white hover:bg-[#8e52e2] shadow-[4px_5px_0_#1B1250] active:shadow-[1px_1px_0_#1B1250]',
      orange:
        'bg-[#E8622B] text-white hover:bg-[#dc541b] shadow-[4px_5px_0_#1B1250] active:shadow-[1px_1px_0_#1B1250]',
      teal:
        'bg-[#2FA3B5] text-white hover:bg-[#258e9f] shadow-[4px_5px_0_#1B1250] active:shadow-[1px_1px_0_#1B1250]',
      deny:
        'bg-[#FF9A1F] text-[#1B1250] hover:bg-[#f08b0e] shadow-[4px_5px_0_#1B1250] active:shadow-[1px_1px_0_#1B1250]',
      outline:
        'bg-white text-[#1B1250] hover:bg-[#F6FBD4] shadow-[4px_5px_0_#1B1250] active:shadow-[1px_1px_0_#1B1250]',
      ghost:
        'bg-transparent text-[#1B1250] border-transparent hover:bg-[#1B1250]/10 shadow-none active:translate-y-0.5',
    };

    const sizeStyles = {
      sm: 'text-xs px-3.5 py-1.5 gap-1.5 font-bold',
      md: 'text-sm px-5 py-2.5 gap-2 font-bold',
      lg: 'text-base px-6 py-3.5 gap-2.5 font-extrabold',
    };

    const disabledStyles = disabled
      ? 'bg-[#E0E2C8] text-[#1B1250]/40 border-[#1B1250]/30 shadow-[2px_2px_0_rgba(27,18,80,0.2)] cursor-not-allowed hover:bg-[#E0E2C8] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_rgba(27,18,80,0.2)]'
      : 'cursor-pointer active:translate-x-[3px] active:translate-y-[4px]';

    const borderStyle = variant === 'ghost' ? 'border-2 border-transparent' : 'border-3 border-[#1B1250]';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-full select-none transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${borderStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${disabledStyles} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...rest}
      >
        {icon && <span className="inline-flex shrink-0">{icon}</span>}
        <span>{children}</span>
        {iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
      </button>
    );
  }
);

NeoButton.displayName = 'NeoButton';
export default NeoButton;
