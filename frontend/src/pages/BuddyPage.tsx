import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { BuddyProfile, BuddyRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { Star, MapPin, CheckCircle, ArrowLeft, ChevronRight, UserPlus, Search, Send, MessageCircle } from 'lucide-react';
import { ErrorState, FeedSkeleton } from '../components/ui/FeedbackStates';
import {
  CandyBall,
  WavyHighlight,
  DoodleStar,
  DoodleSquiggle,
  HandwrittenNote,
  Mascot,
  ChaiCupSticker,
} from '../components/neo/Decorations';

const ACTIVITIES = [
  { name: 'Coffee', emoji: '☕', bg: 'bg-[#FFD41F]' },
  { name: 'Movies', emoji: '🎬', bg: 'bg-[#B79BF0]' },
  { name: 'Walk', emoji: '🚶', bg: 'bg-[#C5F030]' },
  { name: 'Play', emoji: '🏸', bg: 'bg-[#E8622B]' },
  { name: 'College event', emoji: '🎓', bg: 'bg-[#2FA3B5]' },
  { name: 'Study', emoji: '📚', bg: 'bg-[#F6FBD4]' },
  { name: 'Explore', emoji: '🌄', bg: 'bg-[#FF9A1F]' },
  { name: 'Date', emoji: '❤️', bg: 'bg-[#FB7185]' },
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'recent', label: 'Newest' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'distance', label: 'Nearest' },
];

export default function BuddyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [buddies, setBuddies] = useState<BuddyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>('buddy');
  const [selectedActivity, setSelectedActivity] = useState<string | null>(searchParams.get('activity'));
  const [sort, setSort] = useState('rating');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [view, setView] = useState<'home' | 'find' | 'results'>(
    searchParams.get('activity') ? 'results' : 'home'
  );
  const [buddyRequestStatus, setBuddyRequestStatus] = useState<Record<string, BuddyRequest | null>>({});

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
      const buddies = res.data.buddies || [];
      setBuddies(buddies);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Failed to load buddies');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const statusUpdates: Record<string, BuddyRequest | null> = {};
      for (const buddy of buddies) {
        if (buddy.user_id === user.id) continue;
        try {
          const statusRes = await api.get(`/buddy/${buddy.id}/request-status`, { params: { requesterId: user.id } });
          statusUpdates[buddy.id] = statusRes.data.request || null;
        } catch {
          statusUpdates[buddy.id] = null;
        }
      }
      if (!cancelled) setBuddyRequestStatus(prev => ({ ...prev, ...statusUpdates }));
    })();
    return () => { cancelled = true; };
  }, [buddies, user]);

  const openBuddyChat = (buddyId: string, conversationId: string | null) => {
    if (conversationId) {
      navigate(`/messages?conv=${conversationId}`);
    } else {
      navigate(`/buddy/${buddyId}`);
    }
  };

  // Real-time: new/updated buddy profiles
  useEffect(() => {
    let socket: ReturnType<typeof getSocket> | null = null;
    try { socket = getSocket(); } catch { /* not signed in */ }
    if (!socket) return;
    const onBuddy = (buddy: BuddyProfile) => {
      if (user && buddy.user_id === user.id) return;
      setBuddies(prev => {
        const idx = prev.findIndex(b => b.id === buddy.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = buddy;
          return next;
        }
        return [buddy, ...prev];
      });
    };
    socket.on('buddy_updated', onBuddy);
    return () => { socket?.off('buddy_updated', onBuddy); };
  }, [user]);

  useEffect(() => {
    if (view === 'results') {
      fetchBuddies(selectedType || undefined, selectedActivity || undefined);
    }
  }, [selectedType, selectedActivity, view, sort, userLocation]);

  const handleFindBuddy = () => {
    setView('find');
    setSelectedActivity(null);
    setSearchParams({});
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
      setSelectedActivity(null);
      setSearchParams({});
    } else if (view === 'find') {
      setView('home');
      setSearchParams({});
    }
  };

  return (
    <div className="w-full relative pb-16">
      {/* Back button */}
      {view !== 'home' && (
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#F6FBD4] hover:bg-white text-[#1B1250] border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] rounded-full text-xs font-black mb-5 transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> Back
        </button>
      )}

      {/* HOME VIEW — Two Primary Actions on a Vibrant Purple Background */}
      {view === 'home' && (
        <div className="relative">
          {/* Purple Background Hero Container */}
          <div className="relative bg-[#9A63E6] border-3 border-[#1B1250] rounded-[32px] shadow-[8px_10px_0_#1B1250] p-6 sm:p-8 overflow-hidden">
            {/* 3-4 Floating Candy Balls */}
            <div className="absolute -top-3 -right-3 pointer-events-none z-10 opacity-90">
              <CandyBall color="yellow" size={68} float />
            </div>
            <div className="absolute top-1/3 -left-4 pointer-events-none z-10 opacity-80">
              <CandyBall color="teal" size={54} float reverse />
            </div>
            <div className="absolute -bottom-4 right-1/4 pointer-events-none z-10 opacity-85">
              <CandyBall color="orange" size={60} float />
            </div>
            <div className="absolute bottom-10 -right-4 pointer-events-none z-10 opacity-75">
              <CandyBall color="lime" size={48} float reverse />
            </div>

            {/* Heading & Subtitle */}
            <div className="mb-8 relative z-20">
              <div className="flex items-start justify-between">
                <h1
                  className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-[1.08] mb-3"
                  style={{ textShadow: '2px 2px 0 #1B1250' }}
                >
                  What do you <br />
                  <span className="inline-flex items-center gap-2 mt-1">
                    <WavyHighlight>want to do?</WavyHighlight>
                    <DoodleStar color="yellow" size={24} rotate={15} />
                  </span>
                </h1>
                <div className="hidden xs:flex flex-col items-end pt-1">
                  <HandwrittenNote rotate={-3} className="text-[#FFD41F] drop-shadow-[1px_1px_0_#1B1250]">
                    hangout vibes ✨
                  </HandwrittenNote>
                  <DoodleSquiggle color="#FFD41F" width={48} height={12} className="mt-0.5" />
                </div>
              </div>
              <p className="text-white/95 font-bold text-sm sm:text-base tracking-wide" style={{ textShadow: '1px 1px 0 rgba(27,18,80,0.5)' }}>
                Find someone nearby or offer your time.
              </p>
            </div>

            {/* Two Chunky Sticker Option Cards */}
            <div className="space-y-5 relative z-20">
              {/* Option 1: Find a Buddy (Lime/Yellow Sticker Card, tilted -2°, squishes on tap) */}
              <button
                type="button"
                onClick={handleFindBuddy}
                className="w-full bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] rounded-[26px] p-5 sm:p-6 text-left shadow-[6px_8px_0_#1B1250] -rotate-2 hover:rotate-0 transition-all duration-200 select-none cursor-pointer active:translate-x-[3px] active:translate-y-[4px] active:shadow-[1px_1px_0_#1B1250] active:scale-[0.98] group"
              >
                <div className="flex items-center gap-4">
                  {/* Big Icon Box on Left */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white border-2.5 border-[#1B1250] rounded-[20px] shadow-[2px_2px_0_#1B1250] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Search size={28} strokeWidth={3} className="text-[#1B1250]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display font-black text-xl sm:text-2xl text-[#1B1250] tracking-tight">
                      Find a Buddy
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-[#1B1250]/80 mt-1 leading-snug">
                      Discover people nearby to hang out with
                    </p>
                  </div>
                  {/* Chevron Button */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] flex items-center justify-center shrink-0">
                    <ChevronRight size={22} strokeWidth={3} className="text-[#1B1250]" />
                  </div>
                </div>
              </button>

              {/* Option 2: Become a Buddy (Cream Sticker Card, tilted +2°, squishes on tap) */}
              <Link
                to="/buddy/become"
                className="block w-full bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] rounded-[26px] p-5 sm:p-6 text-left shadow-[6px_8px_0_#1B1250] rotate-2 hover:rotate-0 transition-all duration-200 select-none cursor-pointer active:translate-x-[3px] active:translate-y-[4px] active:shadow-[1px_1px_0_#1B1250] active:scale-[0.98] group"
              >
                <div className="flex items-center gap-4">
                  {/* Big Icon Box on Left */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#FFD41F] border-2.5 border-[#1B1250] rounded-[20px] shadow-[2px_2px_0_#1B1250] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <UserPlus size={28} strokeWidth={3} className="text-[#1B1250]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display font-black text-xl sm:text-2xl text-[#1B1250] tracking-tight">
                      Become a Buddy
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-[#1B1250]/80 mt-1 leading-snug">
                      Let others find and request you
                    </p>
                  </div>
                  {/* Chevron Button */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#C5F030] border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] flex items-center justify-center shrink-0">
                    <ChevronRight size={22} strokeWidth={3} className="text-[#1B1250]" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* FIND VIEW — Activity selection */}
      {view === 'find' && (
        <div className="space-y-5">
          {/* Heading card */}
          <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[24px] shadow-[4px_6px_0_#1B1250] p-5">
            <h2 className="font-display font-black text-2xl text-[#1B1250] tracking-tight">Find a Buddy</h2>
            <p className="text-xs font-bold text-[#1B1250]/70 mt-1">What do you want to do together?</p>
          </div>

          {/* Activity grid */}
          <div className="grid grid-cols-2 gap-3">
            {ACTIVITIES.map(act => (
              <button
                key={act.name}
                type="button"
                onClick={() => handleActivitySelect(act.name)}
                className={`${act.bg} border-3 border-[#1B1250] rounded-[22px] p-4 text-left shadow-[3px_4px_0_#1B1250] hover:shadow-[5px_6px_0_#1B1250] transition-all active:translate-x-[2px] active:translate-y-[3px] active:shadow-[1px_1px_0_#1B1250] group`}
              >
                <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{act.emoji}</span>
                <span className="font-black text-xs text-[#1B1250] uppercase tracking-wide">{act.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RESULTS VIEW — Buddy cards */}
      {view === 'results' && (
        <div>
          {/* Header card */}
          <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[24px] shadow-[4px_6px_0_#1B1250] p-4 mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display font-black text-xl text-[#1B1250] truncate">
                {selectedActivity || 'Buddies nearby'}
              </h2>
              <p className="text-xs font-bold text-[#1B1250]/70 mt-0.5">
                {loading ? 'Searching…' : error ? '' : `${buddies.length} people nearby`}
              </p>
            </div>

            {!loading && !error && buddies.length > 0 && (
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="shrink-0 text-xs font-black bg-[#F6FBD4] border-2 border-[#1B1250] rounded-full px-3 py-1.5 text-[#1B1250] shadow-[2px_2px_0_#1B1250] outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
          </div>

          {loading ? (
            /* Skeleton cards */
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="bg-[#F6FBD4] border-2 border-dashed border-[#1B1250] rounded-[24px] h-32 animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={() => fetchBuddies(undefined, selectedActivity || undefined)} />
          ) : buddies.length === 0 ? (
            /* Empty state */
            <div className="text-center py-14 bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] p-8 -rotate-1">
              <div className="flex items-center justify-center gap-2.5 mb-4">
                <ChaiCupSticker size={30} />
                <Mascot size={48} mood="happy" waving />
              </div>
              <p className="font-display font-black text-2xl text-[#1B1250] mb-2">No one found</p>
              <p className="text-xs font-bold text-[#1B1250]/70 mb-5">Try a different filter or check back later</p>
              <button
                type="button"
                onClick={handleBack}
                className="bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                Browse All
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {buddies.map((buddy, index) => {
                const rotation = index % 2 === 0 ? '-rotate-1 hover:rotate-0' : 'rotate-1 hover:rotate-0';
                // Alternating avatar ring colour: orange for even, teal for odd
                const ringColor = index % 2 === 0 ? 'ring-[#E8622B]' : 'ring-[#2FA3B5]';
                const staggerClass = `stagger-${Math.min((index % 5) + 1, 5)}`;

                return (
                  <Link
                    key={buddy.id}
                    to={`/buddy/${buddy.id}`}
                    className={`block bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[24px] p-5 shadow-[4px_6px_0_#1B1250] hover:shadow-[6px_8px_0_#1B1250] transition-all duration-200 animate-sticker-slap ${staggerClass} ${rotation}`}
                  >
                    <div className="flex gap-4">
                      {/* Avatar in sticker frame */}
                      <div className={`w-16 h-16 rounded-[20px] bg-[#F6FBD4] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] flex items-center justify-center shrink-0 overflow-hidden ring-2 ${ringColor}`}>
                        {buddy.image_urls?.[0] ? (
                          <img src={buddy.image_urls[0]} alt={`${buddy.name}'s profile`} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#1B1250] font-black text-2xl">{buddy.name?.charAt(0)?.toUpperCase()}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + age + price */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-display font-black text-base text-[#1B1250]">{buddy.name}</h3>
                              <span className="text-xs font-bold text-[#1B1250]/40">·</span>
                              <span className="text-xs font-bold text-[#1B1250]/70">
                                {buddy.date_of_birth ? Math.floor((Date.now() - new Date(buddy.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : ''}
                              </span>
                            </div>
                            {/* Tagline */}
                            <p className="text-xs font-semibold text-[#1B1250]/80 mt-0.5 line-clamp-1 italic">"{buddy.title}"</p>
                          </div>
                          {/* Price pill */}
                          <span className="shrink-0 inline-flex items-center gap-0.5 bg-[#FFD41F] border-2 border-[#1B1250] rounded-full px-2.5 py-0.5 font-black text-[11px] text-[#1B1250]">
                            ₹{buddy.price_per_hour}<span className="text-[9px] font-black text-[#1B1250]/60 ml-0.5">/session</span>
                          </span>
                        </div>

                        {/* Activities */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {buddy.activities?.slice(0, 3).map(act => (
                            <span key={act} className="px-2.5 py-0.5 bg-[#C5F030] border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250] rounded-full text-[10px] font-black text-[#1B1250]">{act}</span>
                          ))}
                          {buddy.activities && buddy.activities.length > 3 && (
                            <span className="px-2 py-0.5 bg-[#F6FBD4] border-2 border-[#1B1250] rounded-full text-[10px] font-black text-[#1B1250]/60">+{buddy.activities.length - 3}</span>
                          )}
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-[#1B1250]/70">
                          <span className="flex items-center gap-1">
                            <Star size={12} className="text-[#FFD41F] fill-[#FFD41F]" />
                            <span className="font-black text-[#1B1250]">{buddy.avg_rating ? Number(buddy.avg_rating).toFixed(1) : 'New'}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle size={12} className="text-[#3F8A12]" />
                            {buddy.total_sessions} sessions
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={11} className="text-[#E8622B]" />
                            {buddy.location_name || 'Dehradun'}
                          </span>
                        </div>

                        {/* Action buttons */}
                        {user?.id !== buddy.user_id && (
                          <div className="mt-3 flex items-center gap-2">
                            {(() => {
                              const request = buddyRequestStatus[buddy.id] || null;
                              if (request?.status === 'accepted') {
                                return (
                                  <button
                                    onClick={e => { e.preventDefault(); openBuddyChat(buddy.id, request.conversation_id ?? null); }}
                                    className="inline-flex items-center gap-1.5 text-xs font-black bg-[#C5F030] text-[#1B1250] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] px-3.5 py-1 rounded-full active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                                  >
                                    <MessageCircle size={13} strokeWidth={2.5} /> Chat
                                  </button>
                                );
                              }
                              if (request) {
                                return (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-black bg-[#FFD41F] text-[#1B1250] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] px-3 py-1 rounded-full">
                                    <Send size={12} strokeWidth={2.5} /> Request sent
                                  </span>
                                );
                              }
                              return (
                                <button
                                  onClick={e => { e.preventDefault(); openBuddyChat(buddy.id, null); }}
                                  className="inline-flex items-center gap-1.5 text-xs font-black bg-[#C5F030] hover:bg-[#bcf01a] text-[#1B1250] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] px-3.5 py-1 rounded-full active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                                >
                                  <Send size={12} strokeWidth={2.5} /> Send request
                                </button>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
