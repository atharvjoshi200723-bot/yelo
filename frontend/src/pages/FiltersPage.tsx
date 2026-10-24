import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Instagram, MapPin, Clock, Star, Filter, ChevronDown, Search, SlidersHorizontal, Image, Loader2 } from 'lucide-react';

export type FiltersPayload = {
  account: 'all' | 'logged_in' | 'logged_out' | 'verified' | 'student' | 'educator' | 'educator_only';
  content: string[];
  location: {
    enabled: boolean;
    radiusKm: number;
    city: string;
  };
  accountType: string[];
  verified: 'all' | 'verified' | 'blue_ticker' | 'unverified';
  social: 'all' | 'instagram' | 'twitter' | 'both' | 'neither';
  engagement: {
    minLikes?: number;
    minShares?: number;
    minComments?: number;
  };
  postedWithin: 'all' | '1h' | '24h' | '3d' | '1w' | '1m' | 'custom';
  sortBy: 'liked' | 'shared' | 'newest' | 'oldest' | 'verified' | 'closest';
  misc: {
    hasLocation?: boolean;
    hasHashtags?: boolean;
    hasMentions?: boolean;
    savedOnly?: boolean;
  };
};

interface FiltersPageProps {
  onClose: () => void;
  onFiltersApplied: (filters: FiltersPayload) => void;
  initialFilters?: Partial<FiltersPayload>;
}

const ACCOUNT_OPTIONS = [
  { value: 'all' as const, label: 'All users', icon: Star, description: 'Logged in and logged out' },
  { value: 'logged_in' as const, label: 'Logged in', icon: Star, description: 'Only logged-in users' },
  { value: 'logged_out' as const, label: 'Logged out', icon: Star, description: 'Only logged-out users' },
  { value: 'verified' as const, label: 'Verified only', icon: Star, description: 'Verified accounts' },
  { value: 'student' as const, label: 'Student only', icon: Star, description: 'Students' },
  { value: 'educator' as const, label: 'Educator only', icon: Star, description: 'Educators' },
];

const CONTENT_OPTIONS = [
  { value: 'photo', label: 'Photo', icon: Image },
  { value: 'video', label: 'Video', icon: Image },
  { value: 'text', label: 'Text', icon: Image },
  { value: 'poll', label: 'Poll', icon: Image },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'student', label: 'Student', icon: Star },
  { value: 'educator', label: 'Educator', icon: Star },
  { value: 'professional', label: 'Professional', icon: Star },
];

const VERIFIED_OPTIONS = [
  { value: 'all' as const, label: 'All badges' },
  { value: 'verified' as const, label: 'Verified' },
  { value: 'blue_ticker' as const, label: 'Blue tick only' },
  { value: 'unverified' as const, label: 'Unverified' },
];

const SOCIAL_OPTIONS: { value: FiltersPayload['social']; label: string; icon?: React.ComponentType<Record<string, unknown>> }[] = [
  { value: 'all', label: 'All platforms' },
  { value: 'instagram', label: 'Instagram link', icon: Instagram },
  { value: 'twitter', label: 'Twitter link' },
  { value: 'both', label: 'Both' },
  { value: 'neither', label: 'Neither' },
];

const POSTED_WITHIN_OPTIONS = [
  { value: 'all' as const, label: 'Any time' },
  { value: '1h' as const, label: 'Last hour', icon: Clock },
  { value: '24h' as const, label: 'Last 24 hours', icon: Clock },
  { value: '3d' as const, label: 'Last 3 days', icon: Clock },
  { value: '1w' as const, label: 'Last week', icon: Clock },
  { value: '1m' as const, label: 'Last month', icon: Clock },
  { value: 'custom' as const, label: 'Custom range', icon: Clock },
];

const SORT_OPTIONS = [
  { value: 'liked' as const, label: 'Most liked', icon: Star },
  { value: 'shared' as const, label: 'Most shared', icon: Star },
  { value: 'newest' as const, label: 'Newest', icon: Star },
  { value: 'oldest' as const, label: 'Oldest', icon: Star },
  { value: 'verified' as const, label: 'Verified first', icon: Star },
  { value: 'closest' as const, label: 'Location closest', icon: MapPin },
];

const MISC_OPTIONS = [
  { key: 'hasLocation' as const, label: 'Has location tag', icon: MapPin },
  { key: 'hasHashtags' as const, label: 'Has hashtags', icon: Filter },
  { key: 'hasMentions' as const, label: 'Has mentions', icon: Search },
  { key: 'savedOnly' as const, label: 'Saved posts only', icon: SlidersHorizontal },
];

function defaultValue(): FiltersPayload {
  return {
    account: 'all',
    content: [],
    location: { enabled: false, radiusKm: 10, city: 'Dehradun' },
    accountType: [],
    verified: 'all',
    social: 'all',
    engagement: {},
    postedWithin: 'all',
    sortBy: 'newest',
    misc: {},
  };
}

function deepEqual(a: FiltersPayload, b: FiltersPayload): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function FiltersPage({ onClose, onFiltersApplied, initialFilters }: FiltersPageProps) {
  useEffect(() => {
    window.history.pushState({}, '', window.location.href);
  }, []);

  const [filters, setFilters] = useState<FiltersPayload>(() => {
    const base = defaultValue();
    if (!initialFilters) return base;
    return {
      ...base,
      ...initialFilters,
      location: { ...base.location, ...(initialFilters.location ?? {}) },
      engagement: { ...base.engagement, ...(initialFilters.engagement ?? {}) },
      misc: { ...base.misc, ...(initialFilters.misc ?? {}) },
    };
  });

  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [sheetStyle, setSheetStyle] = useState<React.CSSProperties>({});
  const sheetRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const focusTrapRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const [matchedCount, setMatchedCount] = useState(1247);
  const [showDateRange, setShowDateRange] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    lastFocusedRef.current = document.activeElement as HTMLElement;
    return () => {
      lastFocusedRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const handleBackButton = () => {
      if (window.history.length > 1) {
        onClose();
      }
    };
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && focusTrapRef.current) {
        const focusable = focusTrapRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (handleRef.current) handleRef.current.focus();
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    setDragStart(e.clientY);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setDragging(true);
    setDragStart(e.touches[0].clientY);
  }, []);

  const handleMove = useCallback((y: number) => {
    if (dragStart === null) return;
    const delta = y - dragStart;
    if (delta < 0) {
      setSheetStyle({ transform: `translateY(${delta}px)`, transition: 'none' });
    }
  }, [dragStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientY);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    handleMove(e.touches[0].clientY);
  }, [handleMove]);

  const handleUp = useCallback(() => {
    setDragging(false);
    if (dragStart === null) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const rect = sheet.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    const currentTranslate = parseFloat(sheetStyle.transform?.replace('translateY(', '').replace('px)', '') || '0');
    if (currentTranslate > 120) {
      onClose();
    }
    setSheetStyle({ transform: 'translateY(0)', transition: 'transform 0.3s ease-out' });
    setDragStart(null);
  }, [dragStart, onClose, sheetStyle.transform]);

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const onTouchMove = (e: TouchEvent) => handleTouchMove(e);
    const onUp = () => handleUp();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, handleMouseMove, handleTouchMove, handleUp]);

  const update = (patch: Partial<FiltersPayload>) => {
    setFilters(prev => {
      const next = { ...prev, ...patch };
      if (patch.location) next.location = { ...prev.location, ...patch.location };
      if (patch.engagement) next.engagement = { ...prev.engagement, ...patch.engagement };
      if (patch.misc) next.misc = { ...prev.misc, ...patch.misc };
      return next;
    });
  };

  const toggleContent = (value: string) => {
    setFilters(prev => {
      const next = prev.content.includes(value)
        ? { ...prev, content: prev.content.filter(c => c !== value) }
        : { ...prev, content: [...prev.content, value] };
      return next;
    });
  };

  const toggleAccountType = (value: string) => {
    setFilters(prev => {
      const next = prev.accountType.includes(value)
        ? { ...prev, accountType: prev.accountType.filter(t => t !== value) }
        : { ...prev, accountType: [...prev.accountType, value] };
      return next;
    });
  };

  const toggleMisc = (key: keyof FiltersPayload['misc']) => {
    setFilters(prev => ({
      ...prev,
      misc: {
        ...prev.misc,
        [key]: !prev.misc[key],
      },
    }));
  };

  const setEngagement = (key: 'minLikes' | 'minShares' | 'minComments', value: number) => {
    setFilters(prev => ({
      ...prev,
      engagement: { ...prev.engagement, [key]: value || undefined },
    }));
  };

  const apply = () => {
    onFiltersApplied(filters);
    onClose();
  };

  const reset = () => {
    const def = defaultValue();
    setFilters(def);
    setStartDate('');
    setEndDate('');
    setShowDateRange(false);
  };

  const SHOWING_CONTENT_COUNT = 1247;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        ref={sheetRef}
        className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-lifted max-h-[88vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-slide-up"
        style={sheetStyle}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex items-center justify-center py-3 px-5 cursor-grab active:cursor-grabbing select-none" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
          <div className="w-10 h-1 bg-navy-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-navy-100/40">
          <div>
            <h2 className="font-display text-display-sm text-navy-900 flex items-center gap-2">
              <Filter size={18} className="text-brand-500" />
              Filters
            </h2>
            <p className="text-xs text-navy-400 mt-0.5">Refine the posts you see</p>
          </div>
          <button
            ref={handleRef}
            onClick={onClose}
            className="p-2 hover:bg-navy-50 rounded-xl transition-colors text-navy-400 hover:text-navy-600"
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>

        {/* Live count */}
        <div className="mx-5 mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-navy-500">
            <Loader2 size={12} className="text-brand-500 animate-spin-slow" />
            <span>{matchedCount.toLocaleString()} posts match</span>
          </div>
          <span className="text-[10px] text-navy-300">based on your filters</span>
        </div>

        {/* Scrollable filters */}
        <div ref={focusTrapRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Account filter */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-navy-800">Account</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className={`relative flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    filters.account === option.value
                      ? 'bg-navy-50 border-navy-200 shadow-soft'
                      : 'bg-white border-navy-100/40 hover:border-navy-200 hover:bg-navy-50/30'
                  }`}
                >
                  < option.icon size={14} className={`mt-0.5 ${filters.account === option.value ? 'text-navy-700' : 'text-navy-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-navy-800">{option.label}</div>
                    <div className="text-xs text-navy-400 mt-0.5 line-clamp-1">{option.description}</div>
                  </div>
                  {filters.account === option.value && (
                    <div className="w-4 h-4 rounded-full border-2 border-navy-300 flex items-center justify-center shrink-0 mt-0.5 bg-navy-900">
                      <div className="w-1.5 h-1.5 rounded-full bg-cream-50" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </section>

          {/* Content filter */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Image size={14} className="text-brand-500" />
              <h3 className="text-sm font-semibold text-navy-800">Content type</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {CONTENT_OPTIONS.map(option => {
                const checked = filters.content.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleContent(option.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      checked
                        ? 'bg-navy-900 text-cream-50 border-navy-900'
                        : 'bg-white text-navy-600 border-navy-200 hover:border-navy-300 hover:bg-navy-50'
                    }`}
                  >
                    < option.icon size={12} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Location filter */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={14} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-navy-800">Location</h3>
            </div>
            <label className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-navy-600">Within radius</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.location.enabled}
                  onChange={e => update({ location: { ...filters.location, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-navy-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500" />
              </label>
            </label>
            {filters.location.enabled && (
              <div className="space-y-3 pl-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-navy-500 flex items-center gap-1">
                    <MapPin size={12} />
                    {filters.location.city || 'Dehradun'}
                  </span>
                  <span className="text-xs font-medium text-navy-700">{filters.location.radiusKm} km</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={filters.location.radiusKm}
                  onChange={e => update({ location: { ...filters.location, radiusKm: Number(e.target.value) } })}
                  className="w-full h-1.5 bg-navy-200 rounded-full appearance-none cursor-pointer accent-brand-500"
                  aria-label="Location radius in kilometers"
                />
                <div className="flex justify-between text-[10px] text-navy-300">
                  <span>1 km</span>
                  <span>50 km</span>
                </div>
              </div>
            )}
          </section>

          {/* Account type filter */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-navy-800">Account type</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_TYPE_OPTIONS.map(option => {
                const checked = filters.accountType.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleAccountType(option.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      checked
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-white text-navy-600 border border-navy-200 hover:border-navy-300'
                    }`}
                  >
                    < option.icon size={12} className={checked ? 'text-amber-600' : 'text-navy-300'} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Verified filter */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-navy-800">Verified badges</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {VERIFIED_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    filters.verified === option.value
                      ? 'bg-navy-50 border-navy-200 shadow-soft'
                      : 'bg-white border-navy-100/40 hover:border-navy-200 hover:bg-navy-50/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="verified"
                    value={option.value}
                    checked={filters.verified === option.value}
                    onChange={() => update({ verified: option.value })}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-navy-800">{option.label}</span>
                  {filters.verified === option.value && (
                    <div className="ml-auto w-4 h-4 rounded-full border-2 border-navy-300 flex items-center justify-center bg-navy-900">
                      <div className="w-1.5 h-1.5 rounded-full bg-cream-50" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </section>

          {/* Social platforms filter */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Instagram size={14} className="text-brand-500" />
              <h3 className="text-sm font-semibold text-navy-800">Social platforms</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SOCIAL_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    filters.social === option.value
                      ? 'bg-navy-50 border-navy-200 shadow-soft'
                      : 'bg-white border-navy-100/40 hover:border-navy-200 hover:bg-navy-50/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="social"
                    value={option.value}
                    checked={filters.social === option.value}
                    onChange={() => update({ social: option.value })}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-navy-800 flex items-center gap-2">
                    {option.icon && < option.icon size={14} className="text-navy-400" />}
                    {option.label}
                  </span>
                  {filters.social === option.value && (
                    <div className="ml-auto w-4 h-4 rounded-full border-2 border-navy-300 flex items-center justify-center bg-navy-900">
                      <div className="w-1.5 h-1.5 rounded-full bg-cream-50" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </section>

          {/* Engagement filter */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-navy-800">Engagement</h3>
            </div>
            <div className="space-y-3">
              {(['minLikes', 'minShares', 'minComments'] as const).map(key => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-navy-600 w-24 shrink-0 capitalize">
                    {key.replace('min', '')}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={999999}
                    value={filters.engagement[key] || ''}
                    onChange={e => setEngagement(key, e.target.value ? Number(e.target.value) : 0)}
                    placeholder="Any"
                    className="w-full px-3 py-2 border border-navy-200 rounded-xl text-sm text-navy-800 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent bg-white"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Posted within filter */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-navy-800">Posted within</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {POSTED_WITHIN_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    filters.postedWithin === option.value
                      ? 'bg-navy-50 border-navy-200 shadow-soft'
                      : 'bg-white border-navy-100/40 hover:border-navy-200 hover:bg-navy-50/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="postedWithin"
                    value={option.value}
                    checked={filters.postedWithin === option.value}
                    onChange={() => {
                      update({ postedWithin: option.value });
                      if (option.value === 'custom') setShowDateRange(true);
                    }}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-navy-800 flex items-center gap-2">
                    {option.icon && < option.icon size={14} className="text-navy-400" />}
                    {option.label}
                  </span>
                  {filters.postedWithin === option.value && (
                    <div className="ml-auto w-4 h-4 rounded-full border-2 border-navy-300 flex items-center justify-center bg-navy-900">
                      <div className="w-1.5 h-1.5 rounded-full bg-cream-50" />
                    </div>
                  )}
                </label>
              ))}
            </div>
            {showDateRange && filters.postedWithin === 'custom' && (
              <div className="mt-3 p-3 bg-navy-50 rounded-xl border border-navy-200 space-y-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-navy-600">Start date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => {
                        e.currentTarget.blur();
                        setStartDate(e.target.value);
                      }}
                      inputMode="none"
                      readOnly
                      onClick={(e) => e.currentTarget.showPicker()}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-navy-600">End date</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => {
                        e.currentTarget.blur();
                        setEndDate(e.target.value);
                      }}
                      inputMode="none"
                      readOnly
                      onClick={(e) => e.currentTarget.showPicker()}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDateRange(false)}
                  className="w-full mt-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  Hide date range
                </button>
              </div>
            )}
          </section>

          {/* Sort by filter */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal size={14} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-navy-800">Sort by</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SORT_OPTIONS.map(option => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    filters.sortBy === option.value
                      ? 'bg-navy-50 border-navy-200 shadow-soft'
                      : 'bg-white border-navy-100/40 hover:border-navy-200 hover:bg-navy-50/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="sortBy"
                    value={option.value}
                    checked={filters.sortBy === option.value}
                    onChange={() => update({ sortBy: option.value })}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-navy-800 flex items-center gap-2">
                    {option.icon && < option.icon size={14} className="text-navy-400" />}
                    {option.label}
                  </span>
                  {filters.sortBy === option.value && (
                    <div className="ml-auto w-4 h-4 rounded-full border-2 border-navy-300 flex items-center justify-center bg-navy-900">
                      <div className="w-1.5 h-1.5 rounded-full bg-cream-50" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </section>

          {/* Misc filters */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-navy-800">More filters</h3>
            </div>
            <div className="space-y-2">
              {MISC_OPTIONS.map(option => {
                const checked = !!filters.misc[option.key];
                return (
                  <label
                    key={option.key}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? 'bg-navy-50 border-navy-200 shadow-soft'
                        : 'bg-white border-navy-100/40 hover:border-navy-200 hover:bg-navy-50/30'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 text-sm font-medium text-navy-800">
                      < option.icon size={14} className="text-navy-400" />
                      {option.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleMisc(option.key)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        checked ? 'bg-navy-900' : 'bg-navy-200'
                      }`}
                      aria-label={`Toggle ${option.label}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          checked ? 'translate-x-4' : ''
                        }`}
                      />
                    </button>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-navy-100/40 px-5 py-4 flex items-center justify-between gap-3 bg-white">
          <button
            type="button"
            onClick={reset}
            className="text-sm text-navy-500 hover:text-navy-700 font-medium transition-colors"
          >
            Reset all
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-navy-600 hover:text-navy-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={apply}
              className="px-6 py-2.5 bg-navy-900 text-cream-50 rounded-xl font-medium hover:bg-navy-800 active:bg-navy-800 transition-all btn-press text-sm min-w-[170px]"
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
