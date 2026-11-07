import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parsePlanPost, participantRatio, PlanDetails } from '../lib/plan';
import api from '../lib/api';
import { SocialPost, Comment } from '../types';
import { Heart, MessageCircle, Bookmark, Share2, Plus, X, MapPin, Send, Trash2, Calendar, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { ErrorState, FeedSkeleton } from '../components/ui/FeedbackStates';
import { CreatePlanModal } from '../components/plans/CreatePlanModal';
import { ImagePicker } from '../components/ui/ImagePicker';
import { useKeyboardInset } from '../hooks/useKeyboardInset';
import { getSocket } from '../lib/socket';
import {
  WavyHighlight,
  DoodleStar,
  DoodleSquiggle,
  DoodleArrow,
  HandwrittenNote,
  Mascot,
  ChaiCupSticker,
  CloudSticker,
} from '../components/neo/Decorations';

const CATEGORIES = ['general', 'rent', 'buddy', 'college', 'event', 'question', 'discussion'];
const CATEGORY_STYLES: Record<string, { label: string; emoji: string; bg: string; text: string }> = {
  general: { label: 'General', emoji: '💬', bg: 'bg-[#2FA3B5]', text: 'text-white' },
  rent: { label: 'Rent', emoji: '📦', bg: 'bg-[#E8622B]', text: 'text-white' },
  buddy: { label: 'Buddy', emoji: '👥', bg: 'bg-[#C5F030]', text: 'text-[#1B1250]' },
  college: { label: 'College', emoji: '🎓', bg: 'bg-[#9A63E6]', text: 'text-white' },
  event: { label: 'Event', emoji: '🎉', bg: 'bg-[#FFD41F]', text: 'text-[#1B1250]' },
  question: { label: 'Question', emoji: '❓', bg: 'bg-[#FF9A1F]', text: 'text-[#1B1250]' },
  discussion: { label: 'Discussion', emoji: '💭', bg: 'bg-[#B79BF0]', text: 'text-[#1B1250]' },
};

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const keyboardInset = useKeyboardInset();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showLinkup, setShowLinkup] = useState(false);
  const [newPost, setNewPost] = useState<{ category: string; content: string; imageUrls: string[] }>({ category: 'general', content: '', imageUrls: [] });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  // Comment panel state
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentsData, setCommentsData] = useState<Record<string, Comment[]>>({});
  const [commentAuthors, setCommentAuthors] = useState<Record<string, { id: string; name: string; avatar_url?: string }>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  // Delete state
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      setError(null);
      const params: Record<string, string | number> = { page: pageNum, limit: 20, sort: 'recent' };
      if (filter) params.category = filter;
      const res = await api.get('/feed', { params });
      const data = res.data.posts || [];
      setPosts(prev => append ? [...prev, ...data] : data);
      setHasMore(data.length === 20);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Failed to load posts');
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchPosts(1, false);
    setPage(1);
  }, [fetchPosts]);

  // Real-time: prepend new posts from other users without a reload
  const filterRef = useRef(filter);
  useEffect(() => { filterRef.current = filter; }, [filter]);
  useEffect(() => {
    let socket: ReturnType<typeof getSocket> | null = null;
    try { socket = getSocket(); } catch { /* not signed in */ }
    if (!socket) return;
    const onPost = (post: SocialPost) => {
      const activeFilter = filterRef.current;
      if (activeFilter && post.category !== activeFilter) return;
      setPosts(prev => prev.some(p => p.id === post.id) ? prev : [post, ...prev]);
    };
    socket.on('feed_post', onPost);
    return () => { socket?.off('feed_post', onPost); };
  }, []);

  // Lock body scroll when create modal is open
  useEffect(() => {
    if (showCreate) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
    document.body.style.overflow = '';
  }, [showCreate]);

  // Lock body scroll when plan modal is open
  useEffect(() => {
    if (showLinkup) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
    document.body.style.overflow = '';
  }, [showLinkup]);

  const [likingPosts, setLikingPosts] = useState<Record<string, boolean>>({});

  const createPost = async () => {
    if (!newPost.content.trim()) return;
    setSubmitting(true);
    setCreateError(null);
    try {
      const res = await api.post('/feed', newPost);
      setPosts(prev => [res.data.post, ...prev]);
      setShowCreate(false);
      setNewPost({ category: 'general', content: '', imageUrls: [] });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setCreateError(apiErr.response?.data?.error || "Couldn't create your post. Please try again.");
    }
    setSubmitting(false);
  };

  const toggleLike = async (postId: string) => {
    if (likingPosts[postId]) return;
    setLikingPosts(prev => ({ ...prev, [postId]: true }));

    // Optimistically update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const nextLiked = !p.isLiked;
      return {
        ...p,
        isLiked: nextLiked,
        likes_count: Math.max(0, (p.likes_count ?? 0) + (nextLiked ? 1 : -1)),
      };
    }));

    try {
      const res = await api.post(`/feed/${postId}/like`);
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        const newCount = typeof res.data.likes_count === 'number'
          ? Math.max(0, res.data.likes_count)
          : Math.max(0, p.likes_count ?? 0);
        return {
          ...p,
          isLiked: res.data.liked,
          likes_count: newCount,
        };
      }));
    } catch {
      // Revert optimistic update on failure
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        const revertLiked = !p.isLiked;
        return {
          ...p,
          isLiked: revertLiked,
          likes_count: Math.max(0, (p.likes_count ?? 0) + (revertLiked ? 1 : -1)),
        };
      }));
    } finally {
      setLikingPosts(prev => ({ ...prev, [postId]: false }));
    }
  };

  const toggleSave = async (postId: string) => {
    try {
      const res = await api.post(`/feed/${postId}/save`);
      setPosts(posts.map(p => p.id === postId ? { ...p, isSaved: res.data.saved } : p));
    } catch { /* silent - optimistic UI */ }
  };

  const sharePost = async (postId: string) => {
    const url = `${window.location.origin}/?post=${postId}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'YELO Post', url }); } catch { /* user cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(url); } catch { /* clipboard unavailable */ }
    }
  };

  // --- Comment functions ---
  const toggleComments = async (postId: string) => {
    if (expandedComments === postId) {
      setExpandedComments(null);
      return;
    }
    setExpandedComments(postId);
    if (!commentsData[postId]) {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      try {
        const res = await api.get(`/feed/${postId}/comments`);
        setCommentsData(prev => ({ ...prev, [postId]: res.data.comments || [] }));
      } catch {
        setCommentsData(prev => ({ ...prev, [postId]: [] }));
      }
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const submitComment = async (postId: string) => {
    const text = (commentText[postId] || '').trim();
    if (!text) return;
    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await api.post(`/feed/${postId}/comments`, { content: text });
      const newComment: Comment = {
        ...res.data.comment,
        author_name: user?.name || 'You',
        author_avatar: user?.avatar_url,
      };
      setCommentsData(prev => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), newComment],
      }));
      if (newComment.author_id) {
        const entry = {
          id: newComment.author_id,
          name: newComment.author_name || 'User',
          avatar_url: newComment.author_avatar || undefined,
        };
        setCommentAuthors(prev => ({
          ...prev,
          [postId]: { ...prev[postId], [newComment.author_id!]: entry },
        }));
      }
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
    } catch {
      // silent
    }
    setSubmittingComment(prev => ({ ...prev, [postId]: false }));
  };

  const deleteComment = async (postId: string, commentId: string) => {
    try {
      await api.delete(`/feed/${postId}/comments/${commentId}`);
      setCommentsData(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.id !== commentId),
      }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p));
    } catch {
      // silent
    }
  };

  const deletePost = async (postId: string) => {
    setDeletingPost(postId);
    setDeleteError(null);
    try {
      await api.delete(`/feed/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
      setPostToDelete(null);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      const msg = apiErr.response?.data?.error || 'Failed to delete post';
      setDeleteError(msg);
    }
    setDeletingPost(null);
  };

  // Inline comment panel styled as a sticker compartment
  const renderCommentPanel = (post: SocialPost) => {
    if (expandedComments !== post.id) return null;
    const comments = commentsData[post.id] || [];
    const isLoading = loadingComments[post.id];
    const isSubmitting = submittingComment[post.id];
    const text = commentText[post.id] || '';

    return (
      <div key={`${post.id}-comments`} className="bg-white/80 border-t-3 border-[#1B1250] px-5 py-4 animate-pop-in">
        {/* Comment list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-3 border-[#1B1250]" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs font-bold text-[#1B1250]/60 text-center py-3">No comments yet. Be the first to say something.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2.5">
                <Link to={`/profile/${comment.author_id}`} className="block shrink-0">
                  <div className="w-8 h-8 bg-[#9A63E6]/20 border-2 border-[#1B1250] rounded-full flex items-center justify-center shadow-[1px_1px_0_#1B1250]">
                    <span className="text-[#1B1250] text-[11px] font-black">{comment.author_name?.charAt(0)?.toUpperCase() || '?'}</span>
                  </div>
                </Link>
                <div className="flex-1 min-w-0 bg-[#F6FBD4] border-2 border-[#1B1250] rounded-[16px] p-2.5 shadow-[2px_2px_0_#1B1250]">
                  <div className="flex items-center gap-2">
                    <Link to={`/profile/${comment.author_id}`} className="text-xs font-black text-[#1B1250] hover:text-[#9A63E6] transition-colors truncate">
                      {comment.author_name ?? ''}
                    </Link>
                    <span className="text-[10px] font-bold text-[#1B1250]/50">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                    {user?.id === comment.user_id && (
                      <button
                        onClick={() => deleteComment(post.id, comment.id)}
                        className="text-[#1B1250]/40 hover:text-[#E8622B] transition-colors ml-auto"
                        aria-label="Delete comment"
                      >
                        <Trash2 size={12} strokeWidth={2.5} />
                      </button>
                    )}
                    {user && comment.author_id && comment.author_id !== user.id && (
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${comment.author_id}`)}
                        className="text-[#9A63E6] hover:underline text-[10px] font-black ml-auto"
                      >
                        View profile
                      </button>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#1B1250] mt-1 break-words">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comment input */}
        <div className="flex items-center gap-2 pt-2 border-t-2 border-[#1B1250]/20">
          <div className="w-8 h-8 bg-[#1B1250] rounded-full flex items-center justify-center shrink-0 border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250]">
            <span className="text-[#F6FBD4] text-[11px] font-black">{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
          </div>
          <input
            type="text"
            value={text}
            onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(post.id); } }}
            placeholder="Write a comment..."
            className="flex-1 text-xs font-bold px-3.5 py-2 bg-[#F6FBD4] rounded-full border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] focus:shadow-[3px_3px_0_#1B1250] focus:bg-white text-[#1B1250] placeholder:text-[#1B1250]/40 outline-none transition-all"
          />
          <button
            onClick={() => submitComment(post.id)}
            disabled={!text.trim() || isSubmitting}
            className="w-8 h-8 rounded-full bg-[#C5F030] hover:bg-[#bcf01a] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] disabled:opacity-50 flex items-center justify-center text-[#1B1250] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all shrink-0"
            aria-label="Send comment"
          >
            <Send size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  };

  // Render post content: title, description, details pills, and images
  const renderPostBody = (post: SocialPost, plan: PlanDetails | null) => {
    const visibleDetails = plan
      ? plan.details.filter(d => !/max\s+\d+\s+participants?/i.test(d.label))
      : [];
    const images = post.image_urls || [];
    const imageGrid = images.length > 0 && (
      <div className={`grid gap-2 mb-3.5 rounded-[18px] overflow-hidden border-2.5 border-[#1B1250] shadow-[3px_3px_0_#1B1250] ${
        images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
      }`}>
        {images.map((url, i) => (
          <img
            key={`${url}-${i}`}
            src={url}
            alt={`Post image ${i + 1}`}
            loading="lazy"
            className={`w-full object-cover bg-white ${images.length === 1 ? 'max-h-80' : 'h-36'} ${
              images.length === 3 && i === 0 ? 'row-span-2 h-full' : ''
            }`}
          />
        ))}
      </div>
    );

    if (!plan) {
      return (
        <>
          <p className="font-display font-black text-lg text-[#1B1250] leading-snug whitespace-pre-wrap mb-3.5">
            {post.content}
          </p>
          {imageGrid}
        </>
      );
    }

    return (
      <>
        <h2 className="font-display font-black text-xl text-[#1B1250] leading-tight mb-2">
          {plan.title}
        </h2>
        {plan.description && (
          <p className="text-xs sm:text-sm font-semibold text-[#1B1250]/90 whitespace-pre-wrap leading-relaxed mb-3">
            {plan.description}
          </p>
        )}
        {visibleDetails.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3.5">
            {visibleDetails.map((d) => {
              // Check if detail is date/time related -> Yellow pill with calendar icon
              const isDateOrTime = /date|time|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|am|pm|\d{1,2}:\d{2}|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i.test(d.label);

              if (isDateOrTime) {
                return (
                  <span
                    key={`${d.icon}-${d.label}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD41F] text-[#1B1250] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] text-xs font-black"
                  >
                    <Calendar size={13} strokeWidth={2.5} className="shrink-0" />
                    <span>{d.label}</span>
                  </span>
                );
              }

              return (
                <span
                  key={`${d.icon}-${d.label}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#1B1250] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] text-xs font-black"
                >
                  <span aria-hidden="true">{d.icon}</span>
                  <span>{d.label}</span>
                </span>
              );
            })}
          </div>
        )}
        {imageGrid}
      </>
    );
  };

  // Render a Neo-Brutalist Sticker Card (alternately rotated -1° / +1°)
  const renderPostCard = (post: SocialPost, index: number) => {
    const plan = parsePlanPost(post);
    const planRatio = participantRatio(post);

    const openPlan = (e: React.MouseEvent) => {
      if (!plan) return;
      if ((e.target as HTMLElement).closest('button, a')) return;
      navigate(`/linkup/${post.id}`);
    };

    // Category style
    const cat = CATEGORY_STYLES[post.category] || CATEGORY_STYLES.general;
    const authorDisplayName = post.author_name || (user?.id === post.user_id ? user?.name : '') || 'Anonymous';
    const authorInitial = (authorDisplayName || '?').charAt(0).toUpperCase();

    // Alternate rotation: -1° on even cards, +1° on odd cards
    const rotationStyle = index % 2 === 0 ? '-rotate-1 hover:rotate-0' : 'rotate-1 hover:rotate-0';

    // Colored avatar ring cycle
    const ringColors = ['ring-[#E8622B]', 'ring-[#2FA3B5]', 'ring-[#9A63E6]', 'ring-[#C5F030]'];
    const avatarRing = ringColors[index % ringColors.length];
    const staggerClass = `stagger-${Math.min((index % 5) + 1, 5)}`;

    return (
      <div key={post.id} className={`transition-transform duration-200 ease-out animate-sticker-slap ${staggerClass}`}>
        {/* Main Sticker Card */}
        <div
          className={`bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] overflow-hidden transition-all duration-200 ${rotationStyle} ${
            plan ? 'cursor-pointer hover:shadow-[7px_10px_0_#1B1250]' : ''
          }`}
          onClick={openPlan}
        >
          <div className="p-5 sm:p-6">
            {/* Header: Author + Timestamp + Category Tag Badge on Top Right */}
            <div className="flex items-start justify-between gap-3 mb-3.5">
              <div className="flex items-center gap-3 min-w-0">
                {/* Circular Avatar with Colored Ring and Navy Outline */}
                <div className={`w-10 h-10 rounded-full bg-[#1B1250] border-2.5 border-[#1B1250] ring-3 ${avatarRing} shadow-[2px_2px_0_#1B1250] flex items-center justify-center shrink-0 overflow-hidden`}>
                  {post.author_avatar ? (
                    <img src={post.author_avatar} alt={authorDisplayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#F6FBD4] font-black text-sm">{authorInitial}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      to={`/profile/${post.author_id || post.user_id}`}
                      className="font-black text-[#1B1250] text-sm hover:text-[#9A63E6] transition-colors truncate"
                    >
                      {authorDisplayName}
                    </Link>
                    <span className="text-xs font-bold text-[#1B1250]/40">·</span>
                    <span className="text-xs font-bold text-[#1B1250]/60 whitespace-nowrap">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {post.author_city && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#1B1250]/70 mt-0.5">
                      <MapPin size={11} className="text-[#E8622B] shrink-0 fill-[#E8622B]" />
                      <span>{post.author_city}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Category Tag as a Colored Badge on Top-Right Corner */}
              <div
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] text-xs font-black uppercase tracking-wider shrink-0 ${cat.bg} ${cat.text}`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </div>
            </div>

            {/* Post Content Body */}
            {renderPostBody(post, plan)}

            {/* Location Tag */}
            {post.location_name && (
              <div className="inline-flex items-center gap-1.5 bg-white border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] rounded-full px-3 py-1 text-xs font-bold text-[#1B1250] mb-3">
                <MapPin size={13} className="text-[#E8622B] shrink-0" />
                <span>{post.location_name}</span>
              </div>
            )}
          </div>

          {/* Action Row: Participants Pill (Lime) + Chunky Outline Icons */}
          <div className="px-5 py-3 bg-[#F6FBD4] border-t-3 border-[#1B1250] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Participants Counter: Lime Pill */}
              {plan && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5F030] text-[#1B1250] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] text-xs font-black tabular-nums shrink-0">
                  <Users size={14} strokeWidth={2.5} className="shrink-0" />
                  <span>{planRatio || '0/5'}</span>
                </span>
              )}

              {/* Like Button (Chunky Outline with Bounce Physics) */}
              <button
                type="button"
                onClick={() => toggleLike(post.id)}
                disabled={likingPosts[post.id]}
                className={`flex items-center gap-1.5 text-xs font-black text-[#1B1250] transition-transform duration-150 active:scale-75 hover:scale-110 active:translate-y-0.5 select-none ${
                  post.isLiked ? 'text-[#FF5C8A]' : 'hover:text-[#FF5C8A]'
                }`}
                aria-label="Like post"
              >
                <Heart
                  size={20}
                  strokeWidth={2.5}
                  className={`transition-colors ${post.isLiked ? 'fill-[#FF5C8A] text-[#FF5C8A]' : 'text-[#1B1250]'}`}
                />
                <span className="tabular-nums">{Math.max(0, post.likes_count ?? 0)}</span>
              </button>

              {/* Comment Button (Chunky Outline with Bounce Physics) */}
              <button
                type="button"
                onClick={() => toggleComments(post.id)}
                className={`flex items-center gap-1.5 text-xs font-black text-[#1B1250] transition-transform duration-150 active:scale-75 hover:scale-110 active:translate-y-0.5 select-none ${
                  expandedComments === post.id ? 'text-[#9A63E6]' : 'hover:text-[#9A63E6]'
                }`}
                aria-label="Toggle comments"
              >
                <MessageCircle size={20} strokeWidth={2.5} className="text-[#1B1250]" />
                <span className="tabular-nums">{post.comments_count}</span>
              </button>

              {/* Bookmark Button (Chunky Outline with Bounce Physics) */}
              <button
                type="button"
                onClick={() => toggleSave(post.id)}
                className="transition-transform duration-150 active:scale-75 hover:scale-110 active:translate-y-0.5 select-none text-[#1B1250]"
                aria-label="Bookmark post"
              >
                <Bookmark
                  size={20}
                  strokeWidth={2.5}
                  className={post.isSaved ? 'fill-[#FFD41F] text-[#1B1250]' : 'text-[#1B1250]'}
                />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Share Button (Chunky Outline with Bounce Physics) */}
              <button
                type="button"
                onClick={() => sharePost(post.id)}
                className="transition-transform duration-150 active:scale-75 hover:scale-110 active:translate-y-0.5 select-none text-[#1B1250]"
                aria-label="Share post"
              >
                <Share2 size={18} strokeWidth={2.5} />
              </button>

              {/* Delete Button (If owned by current user) */}
              {user?.id === post.user_id && (
                <button
                  type="button"
                  onClick={() => setPostToDelete(post.id)}
                  disabled={deletingPost === post.id}
                  className="w-7 h-7 rounded-full bg-white hover:bg-[#E8622B] text-[#1B1250] hover:text-white border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250] flex items-center justify-center transition-all duration-150 active:scale-75"
                  aria-label="Delete post"
                >
                  <Trash2 size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Comment Drawer if expanded */}
          {renderCommentPanel(post)}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full relative pb-10">
      {/* Neo-Brutalist Heading with Wavy Highlight on "nearby" + Handwritten Note & Doodles */}
      <div className="mb-5 pt-1 relative">
        <div className="flex items-start justify-between">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#1B1250] tracking-tight leading-[1.08]">
            What's happening <br />
            <span className="inline-flex items-center gap-2 mt-1">
              <WavyHighlight>nearby?</WavyHighlight>
              <DoodleStar color="pink" size={24} rotate={12} />
            </span>
          </h1>
          <div className="hidden xs:flex flex-col items-end pt-1">
            <HandwrittenNote rotate={-3} className="text-[#9A63E6]">
              psst, scroll →
            </HandwrittenNote>
            <DoodleSquiggle color="#9A63E6" width={48} height={12} className="mt-0.5" />
          </div>
        </div>
      </div>

      {/* Category Chips: Pill, Cream, 3px Navy Border, Selected = Lime */}
      <div className="flex items-center gap-2.5 mb-6 overflow-x-auto no-scrollbar py-2 px-1 -mx-2 scroll-smooth">
        <button
          type="button"
          onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap border-3 border-[#1B1250] transition-all duration-150 select-none ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            !filter
              ? 'bg-[#C5F030] text-[#1B1250] shadow-[3px_4px_0_#1B1250] scale-[1.02]'
              : 'bg-[#F6FBD4] text-[#1B1250] shadow-[2px_3px_0_#1B1250] hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#1B1250]'
          }`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap border-3 border-[#1B1250] transition-all duration-150 select-none ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              filter === cat
                ? 'bg-[#C5F030] text-[#1B1250] shadow-[3px_4px_0_#1B1250] scale-[1.02]'
                : 'bg-[#F6FBD4] text-[#1B1250] shadow-[2px_3px_0_#1B1250] hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#1B1250]'
            }`}
          >
            {CATEGORY_STYLES[cat].emoji} {CATEGORY_STYLES[cat].label}
          </button>
        ))}
      </div>

      {/* Create Post Modal (Neo-Brutalist Sticker Dialog) */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-[#1B1250]/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 animate-pop-in"
          style={{ paddingBottom: keyboardInset }}
        >
          <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[8px_10px_0_#1B1250] w-full sm:max-w-md rounded-[26px] p-6 max-h-[min(90dvh,100%)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="font-display font-black text-2xl text-[#1B1250] tracking-tight">Create Post</h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 rounded-full bg-[#C5F030] hover:bg-[#FFD41F] border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] flex items-center justify-center text-[#1B1250] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                aria-label="Close"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1 no-scrollbar">
              <div className="mb-4">
                <label className="block text-xs font-black text-[#1B1250] uppercase tracking-wider mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewPost({ ...newPost, category: cat })}
                      className={`px-3 py-1.5 rounded-full text-xs font-black border-2.5 border-[#1B1250] transition-all ${
                        newPost.category === cat
                          ? 'bg-[#C5F030] text-[#1B1250] shadow-[2px_3px_0_#1B1250]'
                          : 'bg-white text-[#1B1250] shadow-[1px_2px_0_#1B1250]'
                      }`}
                    >
                      {CATEGORY_STYLES[cat].emoji} {CATEGORY_STYLES[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              {createError && (
                <div className="mb-4 p-3 bg-[#E8622B]/15 border-2.5 border-[#E8622B] rounded-[16px] text-xs font-black text-[#E8622B]">
                  ⚠️ {createError}
                </div>
              )}

              <textarea
                value={newPost.content}
                onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                className="w-full px-4 py-3.5 bg-white border-3 border-[#1B1250] rounded-[20px] shadow-[3px_4px_0_#1B1250] focus:shadow-[4px_6px_0_#1B1250] focus:outline-none min-h-[120px] resize-none text-[#1B1250] font-bold placeholder:text-[#1B1250]/40 text-sm"
                placeholder="What's happening in your community?"
              />

              <div className="mt-4">
                <ImagePicker
                  value={newPost.imageUrls}
                  onChange={urls => setNewPost(prev => ({ ...prev, imageUrls: urls }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t-2 border-[#1B1250]/20 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-5 py-2.5 text-xs font-black text-[#1B1250] bg-white border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] rounded-full active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createPost}
                disabled={submitting || !newPost.content.trim()}
                className="px-6 py-2.5 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-full text-xs font-black hover:bg-[#bcf01a] disabled:opacity-50 active:translate-x-[2px] active:translate-y-[3px] active:shadow-none transition-all"
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Linkup Modal */}
      {showLinkup && (
        <CreatePlanModal
          onClose={() => setShowLinkup(false)}
          onSuccess={(newPost) => {
            setPosts(prev => [newPost, ...prev]);
            setShowLinkup(false);
          }}
        />
      )}

      {/* Posts Feed */}
      {loading ? (
        <FeedSkeleton count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); fetchPosts(1, false); }} />
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] p-8 -rotate-1 relative overflow-hidden">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CloudSticker size={32} />
            <Mascot size={54} mood="wink" waving />
            <ChaiCupSticker size={32} />
          </div>
          <p className="font-display font-black text-2xl text-[#1B1250] mb-2">Nothing yet</p>
          <p className="text-xs font-bold text-[#1B1250]/70 mb-2">Be the first to share something with your community</p>
          <HandwrittenNote rotate={-2} className="text-[#9A63E6] text-sm">
            tap + Linkup below to get started! ✨
          </HandwrittenNote>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post, index) => renderPostCard(post, index))}

          {hasMore ? (
            <div className="pt-2 pb-6 flex justify-center">
              <button
                type="button"
                onClick={() => { setPage(page + 1); fetchPosts(page + 1, true); }}
                className="px-6 py-3 bg-[#F6FBD4] hover:bg-white text-[#1B1250] font-black text-xs uppercase tracking-wider rounded-full border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#1B1250] transition-all"
              >
                Load more
              </button>
            </div>
          ) : (
            /* Home Feed Footer with Mascot & Dehradun Touch */
            <div className="pt-6 pb-4 flex flex-col items-center justify-center gap-2 text-center select-none opacity-90">
              <div className="flex items-center gap-2.5">
                <CloudSticker size={26} />
                <Mascot size={36} mood="happy" waving />
                <ChaiCupSticker size={26} />
              </div>
              <HandwrittenNote rotate={-1} color="#1B1250" className="text-sm sm:text-base">
                you're all caught up on dehradun! 🏔️✨
              </HandwrittenNote>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 bg-[#1B1250]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-pop-in">
          <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[8px_10px_0_#1B1250] p-6 max-w-sm w-full">
            <h3 className="font-display font-black text-2xl text-[#1B1250] mb-2">Delete this post?</h3>
            <p className="text-xs font-bold text-[#1B1250]/70 mb-5">
              This action cannot be undone. The post will be permanently removed.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-[#E8622B]/15 border-2.5 border-[#E8622B] rounded-[16px] text-xs font-black text-[#E8622B]">
                ⚠️ {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPostToDelete(null)}
                className="flex-1 py-2.5 text-xs font-black text-[#1B1250] bg-white border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] rounded-full active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deletePost(postToDelete)}
                disabled={deletingPost === postToDelete}
                className="flex-1 py-2.5 bg-[#E8622B] text-white border-2.5 border-[#1B1250] shadow-[2px_3px_0_#1B1250] rounded-full text-xs font-black hover:bg-[#d65420] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
              >
                {deletingPost === postToDelete ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Trash2 size={14} strokeWidth={2.5} /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button: "+ Linkup" (Lime pill with navy 3px outline and hard shadow) */}
      <div className="fixed right-4 sm:right-[max(1rem,calc((100vw-480px)/2+1rem))] bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] flex flex-col items-end gap-2.5 z-40">
        <button
          type="button"
          onClick={() => setShowLinkup(true)}
          className="inline-flex items-center gap-2 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_6px_0_#1B1250] rounded-full px-5 py-3 text-sm font-black tracking-tight select-none transition-all duration-200 hover:rotate-2 hover:animate-wiggle active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_#1B1250]"
          aria-label="Create Linkup"
        >
          <Plus size={18} strokeWidth={3} className="shrink-0" />
          <span>+ Linkup</span>
        </button>
      </div>
    </div>
  );
}
