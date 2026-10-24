import { useState, useMemo } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { X } from 'lucide-react';



/**
 * Activity categories for the Create a Plan form.
 * Note: The backend currently only supports these categories for posts:
 *   'general', 'rent', 'buddy', 'college', 'event', 'question', 'discussion'
 * This form maps all activity categories to 'general' since that's the
 * only backend-compatible category for post creation.
 */
const ACTIVITY_CATEGORIES = ['Walking', 'Trekking', 'Gym', 'Gaming', 'Evening Walk', 'Casual Chat', 'Other'];

const CATEGORY_VALUES: Record<string, string> = {
  Walking: 'general',
  Trekking: 'general',
  Gym: 'general',
  Gaming: 'general',
  'Evening Walk': 'general',
  'Casual Chat': 'general',
  Other: 'general',
};

export interface PlanFormValues {
  category: string;
  title: string;
  description: string;
  maxParticipants: number;
  date: string;
  time: string;
}

export function CreatePlanModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();

  const today = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const defaultTime = useMemo(() => {
    const d = new Date();
    return d.toTimeString().split(' ')[0].slice(0, 5  );
}
, []);

  const [form, setForm] = useState<PlanFormValues>({
    category: 'Walking',
    title: '',
    description: '',
    maxParticipants: 5,
    date: today,
    time: defaultTime,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked
          : value === '' ? (name === 'maxParticipants' ? 5 : value)
          : value,
    })  );
}
;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Map the UI category to a backend-compatible category
    const backendCategory = CATEGORY_VALUES[form.category];
    if (!backendCategory) {
      setError('Invalid activity category. Please select a different option.');
      setSubmitting(false);
      return;
    }

    // Build content with plan details (backend post schema doesn't have plan-specific fields)
    const planLines: string[] = [];

    if (form.date || form.time) {
      const datetime = [form.date, form.time].filter(Boolean).join(' at ');
      if (datetime) planLines.push(`📅 ${datetime}`);
    }

    if (form.maxParticipants > 0) {
      planLines.push(`👥 Max ${form.maxParticipants} participant${form.maxParticipants === 1 ? '' : 's'}`);
    }

    const contentParts: string[] = [];
    if (form.description.trim()) contentParts.push(form.description.trim());
    if (planLines.length > 0) contentParts.push(planLines.join('\n'));
    const content = contentParts.join('\n\n');

    if (!content) {
      setError('Please add a description for your plan.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/feed', {
        category: backendCategory,
        title: form.title.trim() || undefined,
        content,
      });

      // Success: close modal and reset form
      onClose();
      setForm({
        category: 'Walking',
        title: '',
        description: '',
        maxParticipants: 5,
        date: today,
        time: defaultTime,
      });
      setError(null);
      setSubmitting(false);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      const errorMsg =
        apiErr.response?.data?.error ||
        'Could not create plan. Please check your connection and try again.';

      setError(errorMsg);
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl rounded-b-3xl p-6 animate-slide-up max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h2 className="font-display text-display-sm text-navy-900">Create a Plan</h2>
          <button
            onClick={() => onClose()}
            className="p-2 hover:bg-navy-50 rounded-xl transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-navy-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Activity Category */}
            <div>
              <label className="block text-xs font-semibold text-navy-500 tracking-wider uppercase mb-3">
                Activity Category
              </label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      setForm(prev => ({
                        ...prev,
                        category: cat,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 btn-press ${
                      form.category === cat
                        ? 'bg-navy-900 text-cream-50'
                        : 'bg-cream-100 text-navy-500 hover:bg-cream-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Title */}
            <div>
              <label className="block text-xs font-semibold text-navy-500 tracking-wider uppercase mb-3">
                Plan Title
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Plan title"
                className="w-full px-4 py-3 border border-navy-100/30 rounded-2xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-navy-800 placeholder-navy-300 outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-navy-500 tracking-wider uppercase mb-3">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What are you planning?"
                className="w-full px-4 py-3 border border-navy-100/30 rounded-2xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-navy-800 placeholder-navy-300 resize-none"
                rows={3}
              />
            </div>

            {/* Maximum number of participants */}
            <div>
              <label className="block text-xs font-semibold text-navy-500 tracking-wider uppercase mb-3">
                Maximum Participants
              </label>
              <input
                type="number"
                name="maxParticipants"
                value={form.maxParticipants.toString()}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-3 border border-navy-100/30 rounded-2xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-navy-800 placeholder-navy-300 outline-none"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-navy-500 tracking-wider uppercase mb-3">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-navy-100/30 rounded-2xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-navy-800 placeholder-navy-300 outline-none"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs font-semibold text-navy-500 tracking-wider uppercase mb-3">
                Time
              </label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-navy-100/30 rounded-2xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-navy-800 placeholder-navy-300 outline-none"
              />
            </div>

            {/* Create Plan button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting || !form.title.trim() || !form.description.trim()}
                className="w-full py-3 bg-navy-900 text-cream-50 rounded-xl font-medium hover:bg-navy-800 disabled:opacity-50 transition-all duration-200 btn-press flex items-center justify-center gap-2"
              >
                {submitting ? 'Creating...' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
