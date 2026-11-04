import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { User, Review } from '../types';
import { useAuth } from '../context/AuthContext';
import { Star, MapPin, GraduationCap, Settings, ChevronRight } from 'lucide-react';
import { ErrorState, FeedSkeleton } from '../components/ui/FeedbackStates';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingChat, setRequestingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const navigate = useNavigate();
  const isOwnProfile = !userId || userId === currentUser?.id;

  // "Request to chat" opens (or reuses) a direct conversation with this user.
  const requestChat = async () => {
    if (!profile) return;
    if (profile.id === currentUser?.id) {
      setChatError('You cannot start a chat with yourself');
      return;
    }
    setRequestingChat(true);
    setChatError(null);
    try {
      const res = await api.post('/messages', { otherUserId: profile.id });
      navigate(`/messages?conv=${res.data.id}`);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setChatError(apiErr.response?.data?.error || 'Could not start the chat. Please try again.');
    }
    setRequestingChat(false);
  };

  useEffect(() => {
    const id = userId || currentUser?.id;
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.get(isOwnProfile ? '/users/me' : `/users/${id}`),
      api.get(`/reviews/user/${id}`).catch(() => ({ data: { reviews: [] } })),
    ]).then(([profileRes, reviewsRes]) => {
      setProfile(profileRes.data.profile);
      setReviews(reviewsRes.data.reviews || []);
      setLoading(false);
    }).catch((err: unknown) => {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Failed to load profile');
      setLoading(false);
    });
  }, [userId, currentUser]);

  if (loading) return (
    <div className="max-w-2xl mx-auto pb-24 px-4 space-y-5 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] p-6">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full border-3 border-dashed border-[#1B1250] bg-[#EAE4FB]" />
          <div className="flex-1 space-y-3">
            <div className="h-7 bg-[#EAE4FB] rounded-full border-3 border-dashed border-[#1B1250] w-40" />
            <div className="h-4 bg-[#EAE4FB] rounded-full border-3 border-dashed border-[#1B1250] w-56" />
          </div>
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-[#F6FBD4] border-3 border-dashed border-[#1B1250] rounded-[20px] p-4 h-20" />
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-2xl mx-auto pb-24 px-4 pt-10 flex flex-col items-center gap-6">
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] p-10 text-center w-full">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="font-display font-black text-xl text-[#1B1250] mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase px-6 py-3 active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="max-w-2xl mx-auto pb-24 px-4 pt-16 text-center">
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] p-10">
        <p className="font-display font-black text-xl text-[#1B1250]">Profile not found</p>
      </div>
    </div>
  );

  // Compare against the loaded profile too: on first render the signed-in user may not
  // have loaded yet, which would briefly show "Request to chat" on your own profile.
  const viewingSelf = Boolean(currentUser && (isOwnProfile || profile.id === currentUser.id));

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 space-y-5">

      {/* ── Profile Header Card ── */}
      <div className="bg-gradient-to-b from-[#EAE4FB] to-[#F5F2FF] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] ring-4 ring-[#9A63E6] overflow-hidden bg-[#F6FBD4] flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={`${profile.name}'s avatar`} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display font-black text-3xl text-[#9A63E6]">{profile.name?.charAt(0) || '?'}</span>
              )}
            </div>
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-black text-3xl text-[#1B1250] leading-tight">{profile.name}</h1>
              {isOwnProfile && (
                <Link
                  to="/profile/settings"
                  className="w-8 h-8 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[2px_3px_0_#1B1250] flex items-center justify-center hover:bg-white transition-colors shrink-0"
                >
                  <Settings size={15} className="text-[#1B1250]" />
                </Link>
              )}
            </div>

            {profile.bio && (
              <p className="italic font-semibold text-[#1B1250]/80 text-sm mt-1 leading-snug">{profile.bio}</p>
            )}

            {/* Pills row */}
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.city && (
                <span className="inline-flex items-center gap-1.5 bg-[#2FA3B5] text-white border-2 border-[#1B1250] rounded-full px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_#1B1250]">
                  <MapPin size={11} />
                  {profile.city}
                </span>
              )}
              {profile.college && (
                <span className="inline-flex items-center gap-1.5 bg-[#FFD41F] text-[#1B1250] border-2 border-[#1B1250] rounded-full px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_#1B1250]">
                  <GraduationCap size={11} />
                  {profile.college}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Request to chat */}
        {currentUser && !viewingSelf && (
          <div className="mt-5">
            <button
              onClick={requestChat}
              disabled={requestingChat}
              className="bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase px-6 py-3 w-full active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {requestingChat ? 'Opening chat…' : 'Request to chat'}
            </button>
            {chatError && (
              <div className="mt-3 bg-[#E8622B] text-white border-3 border-[#1B1250] rounded-[16px] px-4 py-3 text-sm font-bold shadow-[3px_4px_0_#1B1250]">
                {chatError}
              </div>
            )}
          </div>
        )}

        {/* Settings link (own profile) */}
        {isOwnProfile && (
          <div className="mt-4">
            <Link
              to="/profile/settings"
              className="inline-flex items-center gap-2 bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-full font-black uppercase text-xs px-5 py-2.5 hover:bg-white active:translate-x-[2px] active:translate-y-[3px] active:shadow-none transition-all"
            >
              <Settings size={13} />
              Edit Profile Settings
            </Link>
          </div>
        )}
      </div>

      {/* ── Stats Tiles ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#E8622B] border-3 border-[#1B1250] rounded-[20px] shadow-[4px_5px_0_#1B1250] p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star size={14} className="fill-[#FFD41F] text-[#FFD41F]" />
            <span className="font-display font-black text-2xl text-white">{avgRating ?? '-'}</span>
          </div>
          <p className="text-xs font-black uppercase tracking-wider text-white/80">Rating</p>
        </div>
        <div className="bg-[#2FA3B5] border-3 border-[#1B1250] rounded-[20px] shadow-[4px_5px_0_#1B1250] p-4 text-center">
          <span className="font-display font-black text-2xl text-white">{reviews.length}</span>
          <p className="text-xs font-black uppercase tracking-wider text-white/80 mt-1">Reviews</p>
        </div>
        <div className="bg-[#FFD41F] border-3 border-[#1B1250] rounded-[20px] shadow-[4px_5px_0_#1B1250] p-4 text-center">
          <span className="font-display font-black text-2xl text-[#1B1250]">{profile.email_verified ? '✓' : '-'}</span>
          <p className="text-xs font-black uppercase tracking-wider text-[#1B1250]/70 mt-1">Verified</p>
        </div>
      </div>

      {/* ── Quick Links (own profile) ── */}
      {isOwnProfile && (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] overflow-hidden">
          <Link
            to="/profile/settings"
            className="flex items-center justify-between px-5 py-4 border-b-3 border-[#1B1250] hover:bg-white active:bg-[#EAE4FB] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#9A63E6] border-2 border-[#1B1250] flex items-center justify-center">
                <Settings size={16} className="text-white" />
              </div>
              <span className="text-sm font-black text-[#1B1250] uppercase tracking-wide">Profile Settings</span>
            </div>
            <ChevronRight size={18} className="text-[#1B1250]/50" />
          </Link>
          <Link
            to="/buddy/manage"
            className="flex items-center justify-between px-5 py-4 hover:bg-white active:bg-[#EAE4FB] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#C5F030] border-2 border-[#1B1250] flex items-center justify-center">
                <span className="text-base">🧑‍🤝‍🧑</span>
              </div>
              <span className="text-sm font-black text-[#1B1250] uppercase tracking-wide">My Buddy Profile</span>
            </div>
            <ChevronRight size={18} className="text-[#1B1250]/50" />
          </Link>
        </div>
      )}

      {/* ── Reviews ── */}
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] p-6">
        <h2 className="font-display font-black text-lg text-[#1B1250] uppercase tracking-widest mb-5">
          Reviews
        </h2>

        {reviews.length === 0 ? (
          <div className="bg-[#EAE4FB] border-3 border-[#1B1250] border-dashed rounded-[20px] px-5 py-8 text-center">
            <p className="text-sm font-bold text-[#1B1250]/60">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div
                key={review.id}
                className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[22px] shadow-[3px_4px_0_#1B1250] p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full border-2 border-[#1B1250] ring-2 ring-[#9A63E6] bg-[#EAE4FB] flex items-center justify-center shrink-0">
                    <span className="font-display font-black text-sm text-[#9A63E6]">
                      {review.reviewer_name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-black text-[#1B1250]">{review.reviewer_name}</span>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          size={11}
                          className={i <= review.rating ? 'text-[#FFD41F] fill-[#FFD41F]' : 'text-[#1B1250]/20'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm font-bold text-[#1B1250]/75 leading-snug">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
