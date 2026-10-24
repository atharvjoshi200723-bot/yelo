import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { BuddyProfile } from '../types';
import { Star, MapPin, Shield, CheckCircle, ArrowLeft, ChevronRight, UserPlus, Search } from 'lucide-react';
import { ErrorState, FeedSkeleton } from '../components/ui/FeedbackStates';

const ACTIVITIES = [
  { name: 'Coffee', emoji: '☕', bg: 'bg-amber-100' },
  { name: 'Movies', emoji: '🎬', bg: 'bg-navy-100' },
  { name: 'Walk', emoji: '🚶', bg: 'bg-sage-100' },
  { name: 'Play', emoji: '🏸', bg: 'bg-coral-100' },
  { name: 'College event', emoji: '🎓', bg: 'bg-navy-100' },
  { name: 'Study', emoji: '📚', bg: 'bg-amber-100' },
  { name: 'Explore', emoji: '🌄', bg: 'bg-sage-100' },
  { name: 'Date', emoji: '❤️', bg: 'bg-rose-100' },
];

const BUDDY_TYPES = [
  { id: 'boyfriend', label: 'Boyfriend', emoji: '❤️', desc: 'Dating companionship', gradient: 'from-rose-500 to-pink-600' },
  { id: 'girlfriend', label: 'Girlfriend', emoji: '💕', desc: 'Dating companionship', gradient: 'from-fuchsia-500 to-purple-600' },
  { id: 'buddy', label: 'Buddy', emoji: '🧑‍🤝‍🧑', desc: 'Hang out together', gradient: 'from-amber-500 to-orange-600' },
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'recent', label: 'Newest' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'distance', label: 'Nearest' },
];

export default function BuddyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [buddies, setBuddies] = useState<BuddyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(searchParams.get('type'));
  const [selectedActivity, setSelectedActivity] = useState<string | null>(searchParams.get('activity'));
  const [sort, setSort] = useState('rating');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [view, setView] = useState<'home' | 'find' | 'results'>(
    searchParams.get('type') || searchParams.get('activity') ? 'results' : 'home'
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 30.3165, lng: 78.0322 })
      );
    } else {
      setUserLocation({ lat: 30.3165, lng: 78.0322 });
    }
  }, []);

  const fetchBuddies = async (buddyType?: string, activity?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { page: '1', limit: '20', sort };
      if (userLocation) {
        params.lat = String(userLocation.lat);
        params.lng = String(userLocation.lng);
      }
      if (buddyType) params.buddyType = buddyType;
      if (activity) params.activity = activity;
      const res = await api.get('/buddy/search', { params });
      setBuddies(res.data.buddies || []);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Failed to load buddies');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (view === 'results') {
      fetchBuddies(selectedType || undefined, selectedActivity || undefined);
    }
  }, [selectedType, selectedActivity, view, sort, userLocation]);

  const handleFindBuddy = () => {
    setView('find');
    setSelectedType(null);
    setSelectedActivity(null);
    setSearchParams({});
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setSelectedActivity(null);
    setView('results');
    setSearchParams({ type: typeId });
  };

  const handleActivitySelect = (activity: string) => {
    setSelectedActivity(activity);
    setSelectedType(null);
    setView('results');
    setSearchParams({ activity });
  };

  const handleBack = () => {
    if (view === 'results') {
      setView('find');
      setSelectedType(null);
      setSelectedActivity(null);
      setSearchParams({});
    } else if (view === 'find') {
      setView('home');
      setSearchParams({});
    }
  };

  return (
    <div className="pb-24">
      {/* Back button */}
      {view !== 'home' && (
        <button onClick={handleBack} className="flex items-center gap-2 text-navy-400 hover:text-navy-600 text-sm font-medium mb-6 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
      )}

      {/* HOME VIEW — Two primary actions */}
      {view === 'home' && (
        <div className="space-y-6">
          {/* Hero */}
          <div className="mb-2">
            <h1 className="font-display text-[2.5rem] leading-[1.1] text-navy-900 mb-3">
              What do you<br />want to do?
            </h1>
            <p className="text-navy-400 text-base">
              Find someone nearby or offer your time.
            </p>
          </div>

          {/* Two Primary Actions */}
          <div className="space-y-3">
            {/* Find a Buddy */}
            <button
              onClick={handleFindBuddy}
              className="w-full bg-navy-900 text-cream-50 rounded-3xl p-6 text-left card-hover btn-press transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Search size={24} className="text-amber-400" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl text-cream-50">Find a Buddy</h2>
                  <p className="text-cream-50/60 text-sm mt-0.5">Discover people nearby to hang out with</p>
                </div>
                <ChevronRight size={20} className="text-cream-50/40" />
              </div>
            </button>

            {/* Become a Buddy */}
            <Link
              to="/buddy/become"
              className="block bg-white border-2 border-amber-400/30 rounded-3xl p-6 text-left card-hover btn-press transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center">
                  <UserPlus size={24} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl text-navy-900">Become a Buddy</h2>
                  <p className="text-navy-400 text-sm mt-0.5">Let others find and request you</p>
                </div>
                <ChevronRight size={20} className="text-navy-300" />
              </div>
            </Link>
          </div>

          {/* Safety Notice */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
            <Shield size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-navy-600 leading-relaxed">
              <p className="font-semibold mb-1">Social companionship only</p>
              <p>Meet in public places. No sexual services. 18+ for dating-style companionship.</p>
            </div>
          </div>
        </div>
      )}

      {/* FIND VIEW — Type + Activity selection */}
      {view === 'find' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl text-navy-900 mb-1">Find a Buddy</h2>
            <p className="text-sm text-navy-400">What kind of companion are you looking for?</p>
          </div>

          {/* Buddy Types */}
          <div>
            <h3 className="text-xs font-semibold text-navy-500 tracking-wider uppercase mb-3">By type</h3>
            <div className="grid grid-cols-3 gap-3">
              {BUDDY_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`bg-gradient-to-br ${type.gradient} rounded-2xl p-4 text-left card-hover btn-press transition-all`}
                >
                  <span className="text-2xl block mb-2">{type.emoji}</span>
                  <span className="font-semibold text-white text-sm block">{type.label}</span>
                  <span className="text-white/60 text-xs">{type.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-navy-100/30" />
            <span className="text-xs text-navy-400 font-medium">OR BY ACTIVITY</span>
            <div className="flex-1 h-px bg-navy-100/30" />
          </div>

          {/* Activities */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              {ACTIVITIES.map(act => (
                <button
                  key={act.name}
                  onClick={() => handleActivitySelect(act.name)}
                  className={`${act.bg} rounded-2xl p-4 text-left card-hover btn-press transition-all`}
                >
                  <span className="text-2xl block mb-2">{act.emoji}</span>
                  <span className="font-medium text-navy-800 text-sm">{act.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RESULTS VIEW — Buddy cards */}
      {view === 'results' && (
        <div>
          <div className="mb-4">
            <h2 className="font-display text-2xl text-navy-900">
              {selectedType ? BUDDY_TYPES.find(t => t.id === selectedType)?.emoji : ''}
              {' '}
              {selectedType ? BUDDY_TYPES.find(t => t.id === selectedType)?.label : selectedActivity}
            </h2>
            <p className="text-sm text-navy-400 mt-1">
              {loading ? 'Searching...' : error ? '' : `${buddies.length} people nearby`}
            </p>
          </div>

          {/* Sort dropdown */}
          {!loading && !error && buddies.length > 0 && (
            <div className="flex justify-end mb-4">
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="text-xs bg-white border border-navy-100/30 rounded-xl px-3 py-1.5 text-navy-500 focus:ring-2 focus:ring-amber-500/30">
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {loading ? (
            <FeedSkeleton count={3} />
          ) : error ? (
            <ErrorState message={error} onRetry={() => fetchBuddies(selectedType || undefined, selectedActivity || undefined)} />
          ) : buddies.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-cream-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👥</span>
              </div>
              <p className="font-display text-lg text-navy-800 mb-2">No one found</p>
              <p className="text-sm text-navy-400 mb-6">Try a different filter or check back later</p>
              <button onClick={handleBack} className="bg-navy-900 text-cream-50 px-6 py-3 rounded-2xl font-medium hover:bg-navy-800 transition-all btn-press text-sm">
                Browse All
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {buddies.map(buddy => (
                <Link
                  key={buddy.id}
                  to={`/buddy/${buddy.id}`}
                  className="block bg-white rounded-3xl p-5 shadow-soft card-hover transition-all"
                >
                  <div className="flex gap-4">
                    {/* Avatar */}
                    {buddy.image_urls?.[0] ? (
                      <img src={buddy.image_urls[0]} alt={`${buddy.name}'s profile`} loading="lazy" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-20 bg-navy-900 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-cream-50 font-bold text-2xl">{buddy.name?.charAt(0)}</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-navy-900">{buddy.name}</h3>
                            <span className="text-navy-400">·</span>
                            <span className="text-navy-500 text-sm">{buddy.date_of_birth ? Math.floor((Date.now() - new Date(buddy.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : ''}</span>
                          </div>
                          <p className="text-sm text-navy-400 mt-0.5 line-clamp-1 italic">"{buddy.title}"</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-navy-900">₹{buddy.price_per_hour}</span>
                          <span className="text-xs text-navy-400">/session</span>
                        </div>
                      </div>

                      {/* Activities */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {buddy.activities?.slice(0, 3).map(act => (
                          <span key={act} className="px-2 py-0.5 bg-cream-100 rounded-full text-xs font-medium text-navy-600">{act}</span>
                        ))}
                        {buddy.activities && buddy.activities.length > 3 && (
                          <span className="px-2 py-0.5 bg-cream-100 rounded-full text-xs text-navy-400">+{buddy.activities.length - 3}</span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-navy-400">
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-amber-500 fill-amber-500" />
                          <span className="font-medium">{buddy.avg_rating ? Number(buddy.avg_rating).toFixed(1) : 'New'}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle size={12} className="text-sage-500" />
                          {buddy.total_sessions} sessions
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {buddy.location_name || 'Dehradun'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
