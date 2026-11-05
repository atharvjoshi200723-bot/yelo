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

  if (loading) {
    return (
      <div className="pb-24 max-w-lg mx-auto space-y-4 px-4 pt-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-24 rounded-[26px] border-3 border-dashed border-[#1B1250] bg-[#F6FBD4] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="pb-24 max-w-lg mx-auto px-4 pt-6">
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-neo-card p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="font-black text-[#1B1250] text-lg mb-6">{error || 'Linkup not found'}</p>
          <button
            onClick={() => { setLoading(true); fetchPost(); }}
            className="bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full font-display font-black uppercase px-6 py-3 active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const plan = parsePlanPost(post);
  const ratio = participantRatio(post);
  const isFull = post.max_participants != null
    && (post.participants_count ?? 0) >= post.max_participants
    && !post.is_participant;

  const authorName = post.author_name || 'Anonymous';

  return (
    <div className="pb-28 max-w-lg mx-auto px-4 pt-4 bg-[#EAE4FB] min-h-screen">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo flex items-center justify-center mb-5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
      >
        <ArrowLeft size={18} className="text-[#1B1250]" />
      </button>

      {/* Hero card */}
      <div className="relative bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[28px] shadow-neo-card p-5 mb-4">
        {/* Category badge */}
        <span className="bg-[#9A63E6] text-white text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-[#1B1250] absolute -top-2 -right-2 rotate-2 select-none">
          💬 General
        </span>

        {/* Plan icon */}
        <div className="w-20 h-20 bg-[#C5F030] rounded-full border-3 border-[#1B1250] shadow-neo flex items-center justify-center text-4xl mb-4 mx-auto">
          {plan ? '🗓️' : '💬'}
        </div>

        {/* Title */}
        {plan ? (
          <h1 className="font-display font-black text-2xl text-[#1B1250] leading-tight mb-3 text-center">
            {plan.title}
          </h1>
        ) : (
          <p className="font-display font-black text-2xl text-[#1B1250] leading-tight mb-3 text-center whitespace-pre-wrap">
            {post.content}
          </p>
        )}

        {/* Info pills */}
        {plan && plan.details.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {plan.details
              .filter(d => !/max\s+\d+\s+participants?/i.test(d.label))
              .map(d => {
                const icon = d.icon;
                const isDate = icon === '📅' || icon === '🕐' || icon === '⏰';
                const isLoc = icon === '📍' || icon === '🗺️' || icon === '📌';
                const bg = isDate ? 'bg-[#FFD41F]' : isLoc ? 'bg-[#2FA3B5] text-white' : 'bg-[#C5F030]';
                return (
                  <span
                    key={`${d.icon}-${d.label}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#1B1250] text-[#1B1250] text-xs font-bold shadow-neo-sm ${bg}`}
                  >
                    <span aria-hidden="true">{d.icon}</span>
                    <span>{d.label}</span>
                  </span>
                );
              })}
          </div>
        )}

        {post.location_name && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#1B1250] bg-[#2FA3B5] text-white text-xs font-bold shadow-neo-sm mb-4">
            <MapPin size={12} />
            <span>{post.location_name}</span>
          </div>
        )}

        {/* Author row */}
        <div className="flex items-center gap-3 mt-2">
          <div className="w-10 h-10 rounded-full bg-[#1B1250] text-[#F6FBD4] font-black flex items-center justify-center border-2 border-[#1B1250] ring-2 ring-[#E8622B] flex-shrink-0 overflow-hidden">
            {post.author_avatar ? (
              <img src={post.author_avatar} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm">{authorName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Link
              to={`/profile/${post.author_id || post.user_id}`}
              className="font-black text-[#1B1250] text-sm hover:underline truncate block"
            >
              {authorName}
            </Link>
            <span className="text-xs text-[#1B1250]/50 font-semibold">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[#1B1250]/50 text-xs font-bold">
            <span className="flex items-center gap-1 text-[#FF5C8A]">
              <Heart size={14} className="fill-[#FF5C8A]" /> {Math.max(0, post.likes_count ?? 0)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={14} /> {post.comments_count ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Description card */}
      {plan && plan.description && (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-neo-card p-5 mb-4">
          <p className="text-xs font-black text-[#1B1250] uppercase tracking-wider mb-2">About this plan</p>
          <p className="text-sm font-semibold text-[#1B1250] whitespace-pre-wrap leading-relaxed">
            {plan.description}
          </p>
        </div>
      )}

      {/* Participants section */}
      {ratio && (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-neo-card p-4 mb-4 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#1B1250] bg-[#C5F030] text-[#1B1250] text-xs font-black shadow-neo-sm">
            <Users size={12} />
            <span>{ratio}</span>
          </span>
          <span className="text-xs font-bold text-[#1B1250]/60">
            {isFull ? '🔒 spots full' : `${Math.max(0, (post.max_participants ?? 0) - (post.participants_count ?? 0))} spots open`}
          </span>
        </div>
      )}

      {/* Owner: pending join requests awaiting a decision */}
      {isAuthor && requests.length > 0 && (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-neo-card mb-4 overflow-hidden">
          <div className="px-5 pt-4 pb-2 flex items-center gap-2">
            <Users size={16} className="text-[#1B1250]" />
            <h2 className="text-xs font-black text-[#1B1250] uppercase tracking-wider">
              {requests.length} join request{requests.length === 1 ? '' : 's'}
            </h2>
          </div>
          <ul>
            {requests.map(r => (
              <li key={r.user_id} className="flex items-center gap-3 px-5 py-3 border-t-2 border-dashed border-[#1B1250]/20">
                <div className="w-9 h-9 rounded-full bg-[#1B1250] text-[#F6FBD4] font-black flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-[#9A63E6]">
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs">{(r.name || '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/profile/${r.user_id}`}
                    className="font-black text-[#1B1250] text-sm truncate block hover:underline"
                  >
                    {r.name}
                  </Link>
                  <span className="text-xs text-[#1B1250]/50 font-semibold">
                    asked {formatDistanceToNow(new Date(r.requested_at), { addSuffix: true })}
                  </span>
                </div>
                {/* Reject */}
                <button
                  onClick={() => decide(r.user_id, false)}
                  disabled={decidingOn !== null}
                  aria-label={`Reject ${r.name}`}
                  className="px-3 py-1.5 rounded-full bg-[#FF9A1F] text-[#1B1250] border-2 border-[#1B1250] shadow-neo-sm text-xs font-black uppercase active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                >
                  <X size={14} />
                </button>
                {/* Accept */}
                <button
                  onClick={() => decide(r.user_id, true)}
                  disabled={decidingOn !== null || isFull}
                  aria-label={`Accept ${r.name}`}
                  className="px-3 py-1.5 rounded-full bg-[#C5F030] text-[#1B1250] border-2 border-[#1B1250] shadow-neo-sm text-xs font-black uppercase active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                >
                  <Check size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Join error */}
      {joinError && (
        <div className="bg-[#F6FBD4] border-3 border-[#E8622B] rounded-[20px] shadow-neo p-3 mb-4 text-sm font-bold text-[#E8622B]">
          {joinError}
        </div>
      )}

      {/* Sticky bottom bar */}
      {!isAuthor && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#F6FBD4] border-t-3 border-[#1B1250] p-4 flex gap-3 z-30">
          <button
            onClick={toggleJoin}
            disabled={joining || (isFull && !post.is_participant && !post.has_pending_request)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full border-3 border-[#1B1250] font-display font-black uppercase text-sm shadow-neo active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 ${
              post.is_participant
                ? 'bg-[#F6FBD4] text-[#1B1250]'
                : post.has_pending_request
                  ? 'bg-[#FFD41F] text-[#1B1250]'
                  : 'bg-[#C5F030] text-[#1B1250]'
            }`}
          >
            {post.is_participant ? <UserMinus size={16} /> : post.has_pending_request ? <Clock size={16} /> : <UserPlus size={16} />}
            {post.is_participant
              ? 'Leave'
              : post.has_pending_request
                ? (joining ? 'Withdrawing…' : 'Requested')
                : isFull
                  ? '🔒 Full'
                  : (joining ? 'Sending…' : 'Request to Join')}
          </button>
        </div>
      )}
    </div>
  );
}
