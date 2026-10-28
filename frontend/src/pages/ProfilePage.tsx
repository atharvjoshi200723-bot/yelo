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
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-soft overflow-hidden mb-6">
        <div className="h-28 skeleton" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-md border-4 border-white skeleton" />
            <div className="flex-1 pb-1 space-y-2">
              <div className="w-32 h-6 skeleton" />
              <div className="w-40 h-4 skeleton" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return <ErrorState message={error} backTo="/" />;

  if (!profile) return (
    <div className="text-center py-16">
      <p className="text-navy-400">Profile not found</p>
    </div>
  );

  // Compare against the loaded profile too: on first render the signed-in user may not
  // have loaded yet, which would briefly show "Request to chat" on your own profile.
  const viewingSelf = Boolean(currentUser && (isOwnProfile || profile.id === currentUser.id));

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl shadow-soft overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-28" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-md flex items-center justify-center border-4 border-white overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={`${profile.name}'s avatar`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-amber-600">{profile.name?.charAt(0) || '?'}</span>
              )}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-navy-900">{profile.name}</h1>
                {isOwnProfile && (
                  <Link to="/profile/settings" className="text-navy-300 hover:text-navy-600 transition-colors">
                    <Settings size={18} />
                  </Link>
                )}
              </div>
              <p className="text-sm text-navy-400">{profile.email}</p>
            </div>
          </div>

          {currentUser && !viewingSelf && (
            <div className="mt-4 mb-2">
              <button
                onClick={requestChat}
                disabled={requestingChat}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium disabled:opacity-60"
              >
                {requestingChat ? 'Opening chat...' : 'Request to chat'}
              </button>
              {chatError && <p className="text-xs text-red-500 mt-1">{chatError}</p>}
            </div>
          )}

          <div className="mt-4 space-y-2">
            {profile.city && (
              <div className="flex items-center gap-2 text-sm text-navy-500">
                <MapPin size={14} />{profile.city}
              </div>
            )}
            {profile.college && (
              <div className="flex items-center gap-2 text-sm text-navy-500">
                <GraduationCap size={14} />{profile.college}
              </div>
            )}
            {profile.bio && <p className="text-sm text-navy-600 mt-2">{profile.bio}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-soft text-center">
          <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
            <Star size={16} className="fill-current" />
            <span className="text-lg font-bold text-navy-900">
              {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '-'}
            </span>
          </div>
          <p className="text-xs text-navy-400">{reviews.length} reviews</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-soft text-center">
          <p className="text-lg font-bold text-navy-900 mb-1">{profile.email_verified ? '✓' : '-'}</p>
          <p className="text-xs text-navy-400">Email verified</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-soft text-center">
          <p className="text-lg font-bold text-navy-900 mb-1">{profile.phone_verified ? '✓' : '-'}</p>
          <p className="text-xs text-navy-400">Phone verified</p>
        </div>
      </div>

      {/* Quick Links */}
      {isOwnProfile && (
        <div className="bg-white rounded-2xl shadow-soft mb-6 overflow-hidden">
          <Link to="/profile/settings" className="flex items-center justify-between p-4 hover:bg-cream-50 transition-colors border-b border-navy-100/20">
            <div className="flex items-center gap-3">
              <Settings size={18} className="text-navy-500" />
              <span className="text-sm font-medium text-navy-800">Profile Settings</span>
            </div>
            <ChevronRight size={16} className="text-navy-300" />
          </Link>
          <Link to="/buddy/manage" className="flex items-center justify-between p-4 hover:bg-cream-50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-lg">🧑‍🤝‍🧑</span>
              <span className="text-sm font-medium text-navy-800">My Buddy Profile</span>
            </div>
            <ChevronRight size={16} className="text-navy-300" />
          </Link>
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h2 className="text-lg font-semibold text-navy-900 mb-4">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-navy-400 text-center py-8">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="border-b border-navy-100/20 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-cream-100 rounded-full flex items-center justify-center">
                    <span className="text-xs text-navy-600">{review.reviewer_name?.charAt(0) || '?'}</span>
                  </div>
                  <span className="text-sm font-medium text-navy-700">{review.reviewer_name}</span>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={12} className={i <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-navy-200'} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-sm text-navy-600">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
