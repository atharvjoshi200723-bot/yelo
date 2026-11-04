import { AlertTriangle, RefreshCw, Inbox, Search, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  backTo?: string;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, backTo }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="animate-pop-in w-full max-w-sm bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[28px] shadow-neo-card p-8 text-center">
        {/* Orange warning circle */}
        <div className="w-20 h-20 rounded-full bg-[#E8622B] border-3 border-[#1B1250] shadow-neo flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl" role="img" aria-label="Warning">⚠️</span>
        </div>

        <h3 className="font-display font-black text-xl text-[#1B1250] uppercase tracking-wide mb-2">
          {title}
        </h3>
        <p className="text-sm font-bold text-[#1B1250] mb-6 max-w-xs mx-auto">
          {message || 'Please check your connection and try again.'}
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] rounded-full font-display font-black uppercase text-sm shadow-neo hover:translate-y-[-1px] transition-transform"
            >
              <RefreshCw size={15} /> Try again
            </button>
          )}
          {backTo && (
            <Link
              to={backTo}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] rounded-full font-display font-black uppercase text-sm shadow-neo hover:translate-y-[-1px] transition-transform"
            >
              <ArrowLeft size={15} /> Go back
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  action?: { label: string; to: string } | { label: string; onClick: () => void };
}

export function EmptyState({ icon, emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      {/* Candy-ball cluster decorations */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="17" fill="#E8622B" stroke="#1B1250" strokeWidth="2.5" />
          <circle cx="11" cy="12" r="4" fill="white" fillOpacity="0.35" />
        </svg>
        <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="21" fill="#FFD41F" stroke="#1B1250" strokeWidth="2.5" />
          <circle cx="13" cy="14" r="5" fill="white" fillOpacity="0.35" />
        </svg>
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="18" r="17" fill="#2FA3B5" stroke="#1B1250" strokeWidth="2.5" />
          <circle cx="11" cy="12" r="4" fill="white" fillOpacity="0.35" />
        </svg>
      </div>

      {/* Icon / emoji fallback */}
      <div className="w-16 h-16 bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] shadow-neo flex items-center justify-center mx-auto mb-4">
        {icon || (emoji ? <span className="text-3xl">{emoji}</span> : <Inbox size={28} className="text-[#1B1250]" />)}
      </div>

      <h3 className="font-display font-black text-xl text-[#1B1250] uppercase tracking-wide mb-2">{title}</h3>
      {description && (
        <p className="text-sm font-bold text-[#1B1250] mb-6 max-w-xs mx-auto">{description}</p>
      )}
      {action && 'to' in action ? (
        <Link
          to={action.to}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] rounded-full font-display font-black uppercase text-sm shadow-neo hover:translate-y-[-1px] transition-transform"
        >
          {action.label}
        </Link>
      ) : action && 'onClick' in action ? (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] rounded-full font-display font-black uppercase text-sm shadow-neo hover:translate-y-[-1px] transition-transform"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#F6FBD4] border-3 border-dashed border-[#1B1250]/30 rounded-[24px] p-6">
          <div className="flex items-center gap-3 mb-4">
            {/* Circle avatar placeholder */}
            <div className="w-11 h-11 rounded-full bg-[#1B1250]/10 animate-pulse flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="w-28 h-4 rounded-full bg-[#1B1250]/10 animate-pulse" />
              <div className="w-20 h-3 rounded-full bg-[#1B1250]/10 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-full h-4 rounded-full bg-[#1B1250]/10 animate-pulse" />
            <div className="w-5/6 h-4 rounded-full bg-[#1B1250]/10 animate-pulse" />
            <div className="w-3/4 h-4 rounded-full bg-[#1B1250]/10 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 4, height = 'h-20' }: { count?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-[#F6FBD4] border-3 border-dashed border-[#1B1250]/30 rounded-full ${height} animate-pulse flex items-center px-5 gap-3`}
        >
          <div className="w-8 h-8 rounded-full bg-[#1B1250]/10 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="w-1/2 h-3 rounded-full bg-[#1B1250]/10" />
            <div className="w-1/3 h-3 rounded-full bg-[#1B1250]/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-[#F6FBD4] border-3 border-dashed border-[#1B1250]/30 rounded-[24px] overflow-hidden animate-pulse ${i % 3 === 0 ? 'row-span-2' : ''}`}>
          <div className={`${i % 3 === 0 ? 'h-48' : 'h-32'} bg-[#1B1250]/10`} />
          <div className="p-3 space-y-2">
            <div className="w-3/4 h-4 rounded-full bg-[#1B1250]/10" />
            <div className="w-1/2 h-3 rounded-full bg-[#1B1250]/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
