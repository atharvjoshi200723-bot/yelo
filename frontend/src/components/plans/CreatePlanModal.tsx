import { useEffect, useState } from 'react';
import { CalendarDays, Clock, Sparkles, Users, X } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../lib/api';
import type { SocialPost } from '../../types';
import {
  PLAN_ACTIVITIES,
  PLAN_MAX_DESCRIPTION,
  PLAN_MAX_PARTICIPANTS,
  PLAN_MAX_TITLE,
  PLAN_MIN_PARTICIPANTS,
  buildPlanContent,
  combinePlanDateTime,
  getPlanActivity,
  validatePlanForm,
  type PlanFormValues,
} from '../../lib/plans';

interface CreatePlanModalProps {
  onClose: () => void;
  onCreated: (post: SocialPost) => void;
}

const initialValues = (): PlanFormValues => ({
  activityLabel: PLAN_ACTIVITIES[0].label,
  title: '',
  date: format(new Date(), 'yyyy-MM-dd'),
  time: '',
  description: '',
  capacity: '6',
});

export default function CreatePlanModal({ onClose, onCreated }: CreatePlanModalProps) {
  const [values, setValues] = useState<PlanFormValues>(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll while the sheet is open, matching the create post modal.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const update = <K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    const validationError = validatePlanForm(values);
    if (validationError) {
      setError(validationError);
      return;
    }
    const startsAt = combinePlanDateTime(values.date, values.time);
    if (!startsAt) {
      setError('That date and time looks invalid.');
      return;
    }

    const activity = getPlanActivity(values.activityLabel);
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/feed', {
        category: 'event',
        title: values.title.trim(),
        content: buildPlanContent({
          activityLabel: activity.label,
          startsAt,
          capacity: Number(values.capacity),
          description: values.description,
        }),
      });
      onCreated(res.data.post as SocialPost);
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        (err as Error).message ||
        "Couldn't create your plan. Please try again.";
      setError(message);
    }
    setSubmitting(false);
  };

  return (
    // z-[60] keeps the sheet above the fixed bottom navigation so the actions stay tappable.
    <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-slide-up">
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 flex-shrink-0 border-b border-navy-100/30">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-amber-500">LinkUp</p>
            <h2 className="font-display text-display-sm text-navy-900">Create a Plan</h2>
            <p className="text-xs text-navy-400 mt-1">Open an activity and see who wants to join.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-navy-50 rounded-xl transition-colors" aria-label="Close create plan form">
            <X size={20} className="text-navy-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
          <div className="mb-5">
            <label className="block text-xs font-semibold text-navy-500 tracking-wider uppercase mb-3">
              Activity category
            </label>
            <div className="flex flex-wrap gap-2">
              {PLAN_ACTIVITIES.map((activity) => {
                const selected = values.activityLabel === activity.label;
                return (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => update('activityLabel', activity.label)}
                    aria-pressed={selected}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 btn-press ${
                      selected
                        ? 'bg-navy-900 text-cream-50'
                        : 'bg-cream-100 text-navy-500 hover:bg-cream-200'
                    }`}
                  >
                    {activity.emoji} {activity.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="plan-title" className="block text-xs font-semibold text-navy-500 tracking-wider uppercase mb-2">
              Plan title
            </label>
            <input
              id="plan-title"
              type="text"
              value={values.title}
              onChange={(e) => update('title', e.target.value)}
              maxLength={PLAN_MAX_TITLE}
              placeholder="Sunday morning walk at FRI"
              className="w-full px-4 py-3 border border-navy-100/30 rounded-2xl text-navy-800 placeholder-navy-300 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label htmlFor="plan-date" className="flex items-center gap-1.5 text-xs font-semibold text-navy-500 tracking-wider uppercase mb-2">
                <CalendarDays size={12} /> Date
              </label>
              <input
                id="plan-date"
                type="date"
                value={values.date}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => update('date', e.target.value)}
                className="w-full px-3 py-3 border border-navy-100/30 rounded-2xl text-sm text-navy-800 bg-white"
              />
            </div>
            <div>
              <label htmlFor="plan-time" className="flex items-center gap-1.5 text-xs font-semibold text-navy-500 tracking-wider uppercase mb-2">
                <Clock size={12} /> Time
              </label>
              <input
                id="plan-time"
                type="time"
                value={values.time}
                onChange={(e) => update('time', e.target.value)}
                className="w-full px-3 py-3 border border-navy-100/30 rounded-2xl text-sm text-navy-800 bg-white"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="plan-description" className="block text-xs font-semibold text-navy-500 tracking-wider uppercase mb-2">
              Description
            </label>
            <textarea
              id="plan-description"
              value={values.description}
              onChange={(e) => update('description', e.target.value)}
              maxLength={PLAN_MAX_DESCRIPTION}
              placeholder="Where are you meeting, what should people bring, how long will it take?"
              className="w-full px-4 py-3 border border-navy-100/30 rounded-2xl min-h-[110px] resize-none text-navy-800 placeholder-navy-300 bg-white"
            />
            <p className="text-[11px] text-navy-300 mt-1 text-right">
              {values.description.length}/{PLAN_MAX_DESCRIPTION}
            </p>
          </div>

          <div className="mb-2">
            <label htmlFor="plan-capacity" className="flex items-center gap-1.5 text-xs font-semibold text-navy-500 tracking-wider uppercase mb-2">
              <Users size={12} /> Maximum participants
            </label>
            <input
              id="plan-capacity"
              type="number"
              inputMode="numeric"
              min={PLAN_MIN_PARTICIPANTS}
              max={PLAN_MAX_PARTICIPANTS}
              value={values.capacity}
              onChange={(e) => update('capacity', e.target.value)}
              className="w-full px-4 py-3 border border-navy-100/30 rounded-2xl text-navy-800 bg-white"
            />
            <p className="text-[11px] text-navy-300 mt-1">
              Between {PLAN_MIN_PARTICIPANTS} and {PLAN_MAX_PARTICIPANTS} people.
            </p>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-cream-100 px-3.5 py-3">
            <Sparkles size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-[11px] leading-relaxed text-navy-400">
              Plans are published to the feed as Event posts. The current API has no way to track
              sign-ups, so the card shows the participant limit you set, and people can coordinate
              in the comments.
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700" role="alert">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-navy-100/30 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-navy-500 hover:text-navy-700 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-6 py-2.5 bg-navy-900 text-cream-50 rounded-xl font-medium hover:bg-navy-800 disabled:opacity-50 transition-all duration-200 btn-press"
          >
            {submitting ? 'Creating...' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
