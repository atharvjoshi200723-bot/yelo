import React from 'react';

export interface NeoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const NeoInput = React.forwardRef<HTMLInputElement, NeoInputProps>(
  ({ label, error, icon, iconRight, className = '', id, ...rest }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-black uppercase tracking-wider text-[#1B1250] ml-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-4 pointer-events-none text-[#1B1250] flex items-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-[#F6FBD4] text-[#1B1250] font-bold placeholder:text-[#1B1250]/45 placeholder:font-medium border-3 border-[#1B1250] rounded-[20px] shadow-[3px_4px_0_#1B1250] focus:shadow-[4px_6px_0_#1B1250] focus:bg-white focus:outline-none transition-all duration-150 py-3 ${
              icon ? 'pl-11' : 'pl-4'
            } ${iconRight ? 'pr-11' : 'pr-4'} ${
              error ? 'border-[#E8622B] shadow-[3px_4px_0_#E8622B]' : ''
            } ${className}`}
            {...rest}
          />
          {iconRight && (
            <div className="absolute right-4 text-[#1B1250] flex items-center">
              {iconRight}
            </div>
          )}
        </div>
        {error && (
          <span className="text-xs font-extrabold text-[#E8622B] ml-2 flex items-center gap-1">
            ⚠️ {error}
          </span>
        )}
      </div>
    );
  }
);

NeoInput.displayName = 'NeoInput';

export interface NeoTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const NeoTextarea = React.forwardRef<HTMLTextAreaElement, NeoTextareaProps>(
  ({ label, error, className = '', id, ...rest }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-black uppercase tracking-wider text-[#1B1250] ml-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full bg-[#F6FBD4] text-[#1B1250] font-bold placeholder:text-[#1B1250]/45 placeholder:font-medium border-3 border-[#1B1250] rounded-[20px] shadow-[3px_4px_0_#1B1250] focus:shadow-[4px_6px_0_#1B1250] focus:bg-white focus:outline-none transition-all duration-150 p-4 resize-none ${
            error ? 'border-[#E8622B] shadow-[3px_4px_0_#E8622B]' : ''
          } ${className}`}
          {...rest}
        />
        {error && (
          <span className="text-xs font-extrabold text-[#E8622B] ml-2 flex items-center gap-1">
            ⚠️ {error}
          </span>
        )}
      </div>
    );
  }
);

NeoTextarea.displayName = 'NeoTextarea';

export default NeoInput;
