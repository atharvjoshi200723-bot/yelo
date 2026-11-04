import { useState, useMemo } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useKeyboardInset } from '../../hooks/useKeyboardInset';
import { ImagePicker } from '../ui/ImagePicker';
import { X } from 'lucide-react';
import { SocialPost } from '../../types';
import { CandyBall } from '../neo/Decorations';

/**
 * Activity categories for the Create a Plan form.
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

export function CreatePlanModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: (post: SocialPost) => void;
}) {
  const { user } = useAuth();
  const keyboardInset = useKeyboardInset();

  const today = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const defaultTime = useMemo(() => {
    const d = new Date();
    return d.toTimeString().split(' ')[0].slice(0, 5);
  }, []);

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
  const [imageUrls, setImageUrls] = useState<string[]>([]);

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
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const backendCategory = CATEGORY_VALUES[form.category];
    if (!backendCategory) {
      setError('Invalid activity category. Please select a different option.');
      setSubmitting(false);
      return;
    }

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
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });

      onSuccess?.(res.data.post);
      onClose();
      setForm({
        category: 'Walking',
        title: '',
        description: '',
        maxParticipants: 5,
        date: today,
        time: defaultTime,
      });
      setImageUrls([]);
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

  const isFormValid = form.title.trim().length > 0 && form.description.trim().length > 0;

  return (
    <div
      className="fixed inset-0 bg-[#1B1250]/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 animate-pop-in"
      style={{ paddingBottom: keyboardInset }}
    >
      {/* Cream Neo-Brutalist Modal Container */}
      <div className="relative bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[8px_10px_0_#1B1250] w-full sm:max-w-lg rounded-[28px] p-6 max-h-[min(90dvh,100%)] sm:max-h-[min(88vh,100%)] flex flex-col overflow-visible">
        {/* Small Candy Ball Peeking Out from the Modal Top-Left Corner */}
        <div className="absolute -top-4 -left-4 pointer-events-none z-20">
          <CandyBall color="orange" size={48} float />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 shrink-0 pl-3">
          <h2 className="font-display font-black text-2xl text-[#1B1250] tracking-tight">
            Create Linkup
          </h2>

          {/* Close X Button (Circular Navy-Outlined Button) */}
          <button
            type="button"
            onClick={() => onClose()}
            className="w-8 h-8 rounded-full bg-[#C5F030] hover:bg-[#FFD41F] border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] flex items-center justify-center text-[#1B1250] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shrink-0"
            aria-label="Close"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Form with Scrolling Body */}
        <form className="flex-1 flex flex-col min-h-0" onSubmit={handleSubmit} noValidate>
          <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 no-scrollbar">
            {/* Activity Category Chips */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#9A63E6] mb-2">
                Activity Category
              </label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_CATEGORIES.map((cat) => {
                  const isSelected = form.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setForm(prev => ({
                          ...prev,
                          category: cat,
                        }))
                      }
                      className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all select-none border-2.5 border-[#1B1250] ${
                        isSelected
                          ? 'bg-[#C5F030] text-[#1B1250] shadow-[2px_3px_0_#1B1250] scale-[1.02]'
                          : 'bg-white text-[#1B1250] shadow-[1px_2px_0_#1B1250] hover:bg-[#F6FBD4]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan Title */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#9A63E6] mb-1.5">
                Plan Title
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Plan title"
                className="w-full px-4 py-3 bg-white border-3 border-[#1B1250] rounded-[20px] shadow-[3px_4px_0_#1B1250] focus:shadow-[4px_6px_0_#1B1250] focus:outline-none text-[#1B1250] font-bold text-sm placeholder:text-[#1B1250]/40 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#9A63E6] mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="What are you planning?"
                className="w-full px-4 py-3 bg-white border-3 border-[#1B1250] rounded-[20px] shadow-[3px_4px_0_#1B1250] focus:shadow-[4px_6px_0_#1B1250] focus:outline-none text-[#1B1250] font-bold text-sm placeholder:text-[#1B1250]/40 resize-none transition-all"
                rows={3}
              />
            </div>

            {/* Photos */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#9A63E6] mb-1.5">
                Photos
              </label>
              <div className="bg-white border-2.5 border-[#1B1250] rounded-[20px] p-3 shadow-[2px_2px_0_#1B1250]">
                <ImagePicker value={imageUrls} onChange={setImageUrls} />
              </div>
            </div>

            {/* Maximum Participants */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#9A63E6] mb-1.5">
                Maximum Participants
              </label>
              <input
                type="number"
                name="maxParticipants"
                value={form.maxParticipants.toString()}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-3 bg-white border-3 border-[#1B1250] rounded-[20px] shadow-[3px_4px_0_#1B1250] focus:shadow-[4px_6px_0_#1B1250] focus:outline-none text-[#1B1250] font-bold text-sm placeholder:text-[#1B1250]/40 transition-all"
              />
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#9A63E6] mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-white border-2.5 border-[#1B1250] rounded-[18px] shadow-[2px_2px_0_#1B1250] text-[#1B1250] font-bold text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#9A63E6] mb-1.5">
                  Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-white border-2.5 border-[#1B1250] rounded-[18px] shadow-[2px_2px_0_#1B1250] text-[#1B1250] font-bold text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pinned Bottom Action: "Create Plan" Button */}
          <div className="shrink-0 pt-4 mt-4 border-t-2.5 border-[#1B1250]/20">
            {error && (
              <div className="mb-3 p-3 bg-[#E8622B]/15 border-2.5 border-[#E8622B] rounded-[16px] text-xs font-black text-[#E8622B]">
                ⚠️ {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || !isFormValid}
              className={`w-full py-3.5 px-6 rounded-full font-display font-black text-sm uppercase tracking-wider select-none transition-all duration-150 flex items-center justify-center gap-2 ${
                isFormValid && !submitting
                  ? 'bg-[#C5F030] hover:bg-[#bcf01a] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] active:translate-x-[2px] active:translate-y-[3px] active:shadow-[1px_1px_0_#1B1250] cursor-pointer'
                  : 'bg-[#E0E2C8] text-[#1B1250]/40 border-2.5 border-[#1B1250]/30 shadow-none cursor-not-allowed'
              }`}
            >
              {submitting ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default CreatePlanModal;
