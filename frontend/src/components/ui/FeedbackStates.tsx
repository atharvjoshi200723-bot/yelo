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
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 bg-coral-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={28} className="text-coral-500" />
      </div>
      <h3 className="font-display text-lg text-navy-900 mb-2">{title}</h3>
      <p className="text-sm text-navy-400 mb-6 max-w-xs mx-auto">
        {message || 'Please check your connection and try again.'}
      </p>
      <div className="flex gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-cream-50 rounded-xl font-medium hover:bg-navy-800 transition-all btn-press"
          >
            <RefreshCw size={16} /> Try again
          </button>
        )}
        {backTo && (
          <Link
            to={backTo}
            className="flex items-center gap-2 px-5 py-2.5 border border-navy-100/30 text-navy-600 rounded-xl font-medium hover:bg-navy-50 transition-colors"
          >
            <ArrowLeft size={16} /> Go back
          </Link>
        )}
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
      <div className="w-16 h-16 bg-cream-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
        {icon || (emoji ? <span className="text-3xl">{emoji}</span> : <Inbox size={28} className="text-navy-300" />)}
      </div>
      <h3 className="font-display text-lg text-navy-800 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-navy-400 mb-6 max-w-xs mx-auto">{description}</p>
      )}
      {action && 'to' in action ? (
        <Link
          to={action.to}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-cream-50 rounded-xl font-medium hover:bg-navy-800 transition-all btn-press"
        >
          {action.label}
        </Link>
      ) : action && 'onClick' in action ? (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-cream-50 rounded-xl font-medium hover:bg-navy-800 transition-all btn-press"
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
        <div key={i} className="bg-white rounded-3xl p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full skeleton" />
            <div className="space-y-2">
              <div className="w-24 h-4 skeleton" />
              <div className="w-16 h-3 skeleton" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-full h-4 skeleton" />
            <div className="w-3/4 h-4 skeleton" />
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
        <div key={i} className={`bg-white rounded-2xl ${height} skeleton`} />
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-white rounded-2xl overflow-hidden shadow-soft ${i % 3 === 0 ? 'row-span-2' : ''}`}>
          <div className={`${i % 3 === 0 ? 'h-48' : 'h-32'} skeleton`} />
          <div className="p-3 space-y-2">
            <div className="w-3/4 h-4 skeleton" />
            <div className="w-1/2 h-3 skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}
