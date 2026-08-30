import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { Flag, X } from 'lucide-react';

interface ReportModalProps {
  targetType: 'user' | 'buddy_profile' | 'listing' | 'forum_post' | 'comment' | 'message';
  targetId: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam', emoji: '📢' },
  { value: 'harassment', label: 'Harassment', emoji: '😡' },
  { value: 'fake_profile', label: 'Fake profile', emoji: '🎭' },
  { value: 'scam', label: 'Scam', emoji: '💰' },
  { value: 'inappropriate', label: 'Inappropriate content', emoji: '⚠️' },
  { value: 'unsafe', label: 'Unsafe behavior', emoji: '🚨' },
  { value: 'other', label: 'Other', emoji: '📝' },
];

export default function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await api.post('/reports', {
        reportType: targetType,
        targetId,
        reason,
        description: description || undefined,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      alert(apiErr.response?.data?.error || 'Failed to submit report');
    }
    setSubmitting(false);
  };

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    modalRef.current?.focus();
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Report submitted">
        <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 animate-slide-up text-center">
          <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Flag size={32} className="text-sage-600" />
          </div>
          <h3 className="font-display text-xl text-navy-900 mb-2">Report submitted</h3>
          <p className="text-sm text-navy-500 mb-6">Our team will review this report.</p>
          <button onClick={onClose}
            className="w-full bg-navy-900 text-cream-50 py-3 rounded-2xl font-medium hover:bg-navy-800 transition-all btn-press">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Report content">
      <div ref={modalRef} tabIndex={-1} className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl text-navy-900">Report</h3>
          <button onClick={onClose} className="p-2 hover:bg-cream-100 rounded-xl transition-colors" aria-label="Close report dialog">
            <X size={20} className="text-navy-400" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-navy-500 mb-4">Why are you reporting this?</p>

        <div className="space-y-2 mb-5">
          {REPORT_REASONS.map(r => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                reason === r.value
                  ? 'bg-navy-900 text-cream-50'
                  : 'bg-cream-50 text-navy-700 hover:bg-cream-100'
              }`}
            >
              <span className="text-lg">{r.emoji}</span>
              <span className="text-sm font-medium">{r.label}</span>
            </button>
          ))}
        </div>

        {reason && (
          <div className="mb-5">
            <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-navy-100/30 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-amber-500/30 resize-none"
              rows={3}
              placeholder="Add any details that might help..."
              maxLength={1000}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 text-navy-500 border border-navy-100/30 rounded-2xl font-medium hover:bg-navy-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-medium hover:bg-red-600 disabled:opacity-50 transition-all btn-press"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
