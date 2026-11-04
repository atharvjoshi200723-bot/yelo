import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface NeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const NeoModal: React.FC<NeoModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  className = '',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-xs',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1B1250]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Sticker Card */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[8px_10px_0_#1B1250] p-6 z-10 animate-pop-in overflow-hidden ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
          {title ? (
            <div className="font-display font-black text-xl text-[#1B1250] tracking-tight">
              {title}
            </div>
          ) : (
            <div />
          )}

          {/* Neo Circular X Close Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#C5F030] hover:bg-[#FFD41F] border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] flex items-center justify-center text-[#1B1250] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0"
            aria-label="Close dialog"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Body Content */}
        <div className="text-[#1B1250] font-medium leading-relaxed max-h-[75vh] overflow-y-auto no-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && <div className="mt-5 pt-4 border-t-2 border-[#1B1250]/15 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

export default NeoModal;
