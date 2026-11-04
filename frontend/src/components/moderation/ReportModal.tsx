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
      <div
        className="fixed inset-0 bg-[#1B1250]/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Report submitted"
      >
        <div className="relative bg-[#F6FBD4] w-full sm:max-w-md sm:rounded-[28px] rounded-t-[28px] p-6 border-3 border-[#1B1250] shadow-[8px_10px_0_#1B1250] text-center">
          {/* Candy-ball decoration */}
          <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#E8622B] border-2 border-[#1B1250] flex items-center justify-center overflow-hidden">
            <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-white/60" />
          </div>

          <div className="text-5xl mb-4">✅</div>
          <h3 className="font-display font-black text-xl text-[#1B1250] mb-2">Report submitted</h3>
          <p className="text-sm font-bold text-[#1B1250]/60 mb-6">Our team will review this report. Thank you for keeping YELO safe.</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase tracking-wide transition-all active:translate-y-[2px] active:shadow-none"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-[#1B1250]/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Report content"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-[#F6FBD4] w-full sm:max-w-md sm:rounded-[28px] rounded-t-[28px] p-6 border-3 border-[#1B1250] shadow-[8px_10px_0_#1B1250] max-h-[90vh] overflow-y-auto focus:outline-none"
      >
        {/* Candy-ball decoration */}
        <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#E8622B] border-2 border-[#1B1250] flex items-center justify-center overflow-hidden">
          <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-white/60" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-black text-xl text-[#1B1250]">Report</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] flex items-center justify-center transition-all active:translate-y-[2px] active:shadow-none"
            aria-label="Close report dialog"
          >
            <X size={18} className="text-[#1B1250]" aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs font-black text-[#9A63E6] uppercase tracking-wider mb-3">Why are you reporting this?</p>

        {/* Reason chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {REPORT_REASONS.map(r => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase border-3 border-[#1B1250] transition-all active:translate-y-[1px] ${
                reason === r.value
                  ? 'bg-[#C5F030] shadow-[4px_5px_0_#1B1250] text-[#1B1250]'
                  : 'bg-[#F6FBD4] shadow-[2px_2px_0_#1B1250] text-[#1B1250] hover:bg-[#C5F030]/30'
              }`}
            >
              <span>{r.emoji}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>

        {reason && (
          <div className="mb-5">
            <label className="block text-xs font-black text-[#9A63E6] uppercase tracking-wider mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none resize-none"
              rows={3}
              placeholder="Add any details that might help..."
              maxLength={1000}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-black uppercase text-sm transition-all active:translate-y-[2px] active:shadow-none"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || submitting}
            className="flex-1 py-3 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase text-sm disabled:opacity-50 transition-all active:translate-y-[2px] active:shadow-none"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
