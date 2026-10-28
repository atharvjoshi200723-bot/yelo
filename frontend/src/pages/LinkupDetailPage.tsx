import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { SocialPost } from '../types';
import { parsePlanPost, participantRatio } from '../lib/plan';
import { ArrowLeft, MapPin, Users, Heart, MessageCircle, UserPlus, UserMinus, Check, X, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ErrorState, ListSkeleton } from '../components/ui/FeedbackStates';

interface JoinRequest {
  user_id: string;
  name: string;
  avatar_url?: string;
  city?: string;
  requested_at: string;
}

export default function LinkupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [decidingOn, setDecidingOn] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/feed/${id}`);
      setPost(res.data.post);
      setError(null);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Could not load this linkup');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchRequests = useCallback(async () => {
    if (!id || !user) return;
    try {
      const res = await api.get(`/feed/${id}/join-requests`);
      setRequests(res.data.requests || []);
    } catch {
      // Not the plan owner (403) — the panel simply stays hidden
      setRequests([]);
    }
  }, [id, user]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const isAuthor = user?.id === (post?.author_id || post?.user_id);

  // Owners poll their pending requests so a new ask shows up without a reload
  useEffect(() => {
    if (!isAuthor) return;
    fetchRequests();
    const interval = window.setInterval(fetchRequests, 10000);
    return () => window.clearInterval(interval);
  }, [isAuthor, fetchRequests]);

  const toggleJoin = async () => {
    if (!id || joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      const res = await api.post(`/feed/${id}/join`);
      setPost(prev => prev ? {
        ...prev,
        is_participant: res.data.is_participant,
        has_pending_request: res.data.has_pending_request,
        participants_count: res.data.participants_count,
        max_participants: res.data.max_participants,
      } : prev);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setJoinError(apiErr.response?.data?.error || 'Could not update your spot. Please try again.');
    }
    setJoining(false);
  };

  const decide = async (requesterId: string, accept: boolean) => {
    if (!id || decidingOn) return;
    setDecidingOn(requesterId);
    setJoinError(null);
    try {
      const res = await api.post(`/feed/${id}/join-requests/${requesterId}/${accept ? 'accept' : 'reject'}`);
      if (accept) {
        // Spots moved — sync the counter straight away
        setPost(prev => prev ? {
          ...prev,
          participants_count: res.data.participants_count,
          max_participants: res.data.max_participants,
        } : prev);
      }
      setRequests(prev => prev.filter(r => r.user_id !== requesterId));
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setJoinError(apiErr.response?.data?.error || 'Could not update this request.');
    }
    setDecidingOn(null);
  };

  if (loading) return <ListSkeleton count={3} height="h-24" />;

  if (error || !post) {
    return <ErrorState message={error || 'Linkup not found'} onRetry={() => { setLoading(true); fetchPost(); }} />;
  }

  const plan = parsePlanPost(post);
  const ratio = participantRatio(post);
  const isFull = post.max_participants != null
    && (post.participants_count ?? 0) >= post.max_participants
    && !post.is_participant;

  const authorName = post.author_name || 'Anonymous';

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 py-2.5 -my-1 text-navy-500 hover:text-navy-700 mb-4 transition-colors"
      >
        <ArrowLeft size={18} /> Back
      </button>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
        <div className="p-6">
          {/* Author row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-navy-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {post.author_avatar ? (
                <img src={post.author_avatar} alt={authorName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-cream-50 font-medium text-sm">{authorName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link
                to={`/profile/${post.author_id || post.user_id}`}
                className="font-semibold text-navy-900 text-sm hover:text-navy-700 transition-colors truncate block"
              >
                {authorName}
              </Link>
              <span className="text-xs text-navy-400">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-navy-100 text-navy-600 flex-shrink-0">
              💬 General
            </span>
          </div>

          {/* Plan body */}
          {plan ? (
            <>
              <h1 className="font-display text-display-md text-navy-900 leading-tight mb-3">
                {plan.title}
              </h1>
              {plan.description && (
                <p className="text-navy-800 whitespace-pre-wrap leading-relaxed mb-4">
                  {plan.description}
                </p>
              )}
              {plan.details.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {plan.details
                    .filter(d => !/max\s+\d+\s+participants?/i.test(d.label))
                    .map(d => (
                      <span
                        key={`${d.icon}-${d.label}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-100 text-navy-600 text-sm font-medium"
                      >
                        <span aria-hidden="true">{d.icon}</span>
                        <span>{d.label}</span>
                      </span>
                    ))}
                </div>
              )}
            </>
          ) : (
            <p className="font-display text-display-md text-navy-900 leading-tight whitespace-pre-wrap mb-4">
              {post.content}
            </p>
          )}

          {post.location_name && (
            <div className="flex items-center gap-1.5 text-sm text-navy-400 mb-4">
              <MapPin size={14} />
              <span>{post.location_name}</span>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 pt-4 border-t border-navy-100/30 text-sm text-navy-400">
            <span className="flex items-center gap-1.5">
              <Heart size={16} /> {Math.max(0, post.likes_count ?? 0)}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle size={16} /> {post.comments_count ?? 0}
            </span>
          </div>
        </div>

        {/* Participants footer — 3/4 counter bottom-left, join button right */}
        {ratio && (
          <div className="px-5 py-4 border-t border-navy-100/30 flex items-center justify-between gap-3 bg-cream-50/50">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-navy-100/30 shadow-soft">
                <Users size={14} className="text-navy-500 shrink-0" />
                <span className="text-sm font-bold text-navy-900 tabular-nums">{ratio}</span>
              </div>
              <span className="text-xs text-navy-400 truncate">
                {isFull ? 'spots full' : `${Math.max(0, (post.max_participants ?? 0) - (post.participants_count ?? 0))} spots open`}
              </span>
            </div>

            {!isAuthor && (
              <button
                onClick={toggleJoin}
                disabled={joining || (isFull && !post.is_participant && !post.has_pending_request)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all btn-press shrink-0 disabled:opacity-50 ${
                  post.is_participant
                    ? 'bg-white border border-navy-100/30 text-navy-600 hover:bg-navy-50'
                    : post.has_pending_request
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-navy-900 text-cream-50 hover:bg-navy-800'
                }`}
              >
                {post.is_participant ? <UserMinus size={15} /> : post.has_pending_request ? <Clock size={15} /> : <UserPlus size={15} />}
                {post.is_participant
                  ? 'Leave'
                  : post.has_pending_request
                    ? (joining ? 'Withdrawing…' : 'Requested')
                    : isFull
                      ? 'Full'
                      : (joining ? 'Sending…' : 'Request to join')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Owner: pending join requests awaiting a decision */}
      {isAuthor && requests.length > 0 && (
        <div className="bg-white rounded-3xl shadow-soft mt-4 overflow-hidden">
          <div className="px-5 pt-4 pb-2 flex items-center gap-2">
            <Users size={16} className="text-navy-500" />
            <h2 className="font-semibold text-navy-900 text-sm">
              {requests.length} join request{requests.length === 1 ? '' : 's'}
            </h2>
          </div>
          <ul>
            {requests.map(r => (
              <li key={r.user_id} className="flex items-center gap-3 px-5 py-3 border-t border-navy-100/20">
                <div className="w-9 h-9 bg-navy-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-cream-50 font-medium text-xs">{(r.name || '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${r.user_id}`}
                    className="font-medium text-navy-900 text-sm truncate block hover:text-navy-700"
                  >
                    {r.name}
                  </Link>
                  <span className="text-xs text-navy-400">
                    asked {formatDistanceToNow(new Date(r.requested_at), { addSuffix: true })}
                  </span>
                </div>
                <button
                  onClick={() => decide(r.user_id, false)}
                  disabled={decidingOn !== null}
                  aria-label={`Reject ${r.name}`}
                  className="p-2 rounded-xl border border-navy-100/30 text-navy-400 hover:text-coral-500 hover:border-coral-500/40 transition-colors disabled:opacity-50"
                >
                  <X size={16} />
                </button>
                <button
                  onClick={() => decide(r.user_id, true)}
                  disabled={decidingOn !== null || isFull}
                  aria-label={`Accept ${r.name}`}
                  className="p-2 rounded-xl bg-navy-900 text-cream-50 hover:bg-navy-800 transition-colors disabled:opacity-50"
                >
                  <Check size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {joinError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {joinError}
        </div>
      )}
    </div>
  );
}
