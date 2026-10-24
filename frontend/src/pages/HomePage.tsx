import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { SocialPost, Comment } from '../types';
import { Heart, MessageCircle, Bookmark, Share2, Plus, X, MapPin, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { ErrorState, FeedSkeleton } from '../components/ui/FeedbackStates';
import { CreatePlanModal } from '../components/plans/CreatePlanModal';

const CATEGORIES = ['general', 'rent', 'buddy', 'college', 'event', 'question', 'discussion'];
const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  general: { label: 'General', emoji: '💬', color: 'bg-navy-100 text-navy-600' },
  rent: { label: 'Rent', emoji: '📦', color: 'bg-amber-500/10 text-amber-600' },
  buddy: { label: 'Buddy', emoji: '👥', color: 'bg-sage-500/10 text-sage-600' },
  college: { label: 'College', emoji: '🎓', color: 'bg-navy-100 text-navy-600' },
  event: { label: 'Event', emoji: '🎉', color: 'bg-coral-500/10 text-coral-500' },
  question: { label: 'Question', emoji: '❓', color: 'bg-amber-500/10 text-amber-600' },
  discussion: { label: 'Discussion', emoji: '💭', color: 'bg-navy-100 text-navy-600' },
};

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showLinkup, setShowLinkup] = useState(false);
  const [newPost, setNewPost] = useState({ category: 'general', content: '' });
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

  const createPost = async () => {
    if (!newPost.content.trim()) return;
    setSubmitting(true);
    setCreateError(null);
    try {
      const res = await api.post('/feed', newPost);
      setPosts([res.data.post, ...posts]);
      setShowCreate(false);
      setNewPost({ category: 'general', content: '' });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setCreateError(apiErr.response?.data?.error || 'Couldn\'t create your post. Please try again.');
    }
    setSubmitting(false);
  };

  const toggleLike = async (postId: string) => {
    try {
      const res = await api.post(`/feed/${postId}/like`);
      setPosts(posts.map(p => p.id === postId ? { ...p, isLiked: res.data.liked, likes_count: p.likes_count + (res.data.liked ? 1 : -1) } : p));
    } catch { /* silent - optimistic UI */ }
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
    // Load comments if not already loaded
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
      // Update comment count in post list
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

  // Delete post function
  const deletePost = async (postId: string) => {
    setDeletingPost(postId);
    setDeleteError(null);
    try {
      await api.delete(`/feed/${postId}`);
      // Remove from list optimistically
      setPosts(prev => prev.filter(p => p.id !== postId));
      setPostToDelete(null);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      const msg = apiErr.response?.data?.error || 'Failed to delete post';
      setDeleteError(msg);
      // If 403 or other error, keep the post in the list
    }
    setDeletingPost(null);
  };

  // Inline comment panel rendered below a post card
  const renderCommentPanel = (post: SocialPost) => {
    if (expandedComments !== post.id) return null;
    const comments = commentsData[post.id] || [];
    const isLoading = loadingComments[post.id];
    const isSubmitting = submittingComment[post.id];
    const text = commentText[post.id] || '';

    return (
      <div key={`${post.id}-comments`} className="bg-white border-t border-navy-100/30 px-5 py-4 animate-fade-in">
        {/* Comment list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-navy-300 text-center py-3">No comments yet. Be the first to say something.</p>
        ) : (          <div className="space-y-3 mb-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2.5">
                <Link to={`/profile/${comment.author_id}`} className="block">
                  <div className="w-7 h-7 bg-navy-100 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-navy-200 transition-colors">
                    <span className="text-navy-600 text-[10px] font-medium">{comment.author_name?.charAt(0) || '?'}</span>
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">                    <Link to={`/profile/${comment.author_id}`} className="text-xs font-semibold text-navy-700 hover:text-navy-900 transition-colors">
                      {comment.author_name ?? ''}
                    </Link>
                    <span className="text-[10px] text-navy-300">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                    {user?.id === comment.user_id && (
                      <button
                        onClick={() => deleteComment(post.id, comment.id)}
                        className="text-navy-300 hover:text-red-500 transition-colors"
                        aria-label="Delete comment"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                      {user && comment.author_id && comment.author_id !== user.id && !isRequestButtonVisible(post.id, comment.author_id!) && (
                        <button
                          type="button"
                          onClick={() => navigate(`/profile/${comment.author_id}?request=1`)}
                          className="text-amber-600 hover:text-amber-700 text-[10px] font-medium"
                        >
                          View profile
                        </button>
                      )}
                  </div>
                  <p className="text-sm text-navy-800 mt-0.5 break-words">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comment input */}
        <div className="flex items-center gap-2 pt-2 border-t border-navy-100/30">
          <div className="w-7 h-7 bg-navy-900 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-cream-50 text-[10px] font-medium">{user?.name?.charAt(0) || '?'}</span>
          </div>
          <input
            type="text"
            value={text}
            onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(post.id); } }}
            placeholder="Write a comment..."
            className="flex-1 text-sm px-3 py-2 bg-cream-50 rounded-full border border-navy-100/30 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 text-navy-800 placeholder-navy-300 outline-none"
          />
          <button
            onClick={() => submitComment(post.id)}
            disabled={!text.trim() || isSubmitting}
            className="p-2 text-amber-500 hover:text-amber-600 disabled:text-navy-200 transition-colors"
            aria-label="Send comment"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Request-to-chat state is tracked per post so the temporary button does not flash for the same person
  const requestButtonsInFlight = useRef(new Set<string>());

  const isRequestButtonVisible = (postId: string, authorId: string) => requestButtonsInFlight.current.has(`${postId}:${authorId}`);

  const handleRequestBuddy = async (postId: string, authorId: string, authorName: string) => {
    const key = `${postId}:${authorId}`;
    requestButtonsInFlight.current.add(key);
    try {
      await api.post('/buddy/request', {
        buddy_profile_id: authorId,          message: `Lets chat about your post`,
      });
    } catch {
    } finally {
      requestButtonsInFlight.current.delete(key);
    }
  };

  // Render different card styles based on post category
  const renderPostCard = (post: SocialPost, index: number) => {
    const cat = CATEGORY_LABELS[post.category] || CATEGORY_LABELS.general;
    const isLarge = index % 5 === 0;
    const isCompact = index % 3 === 1;
    const commentBtn = (
      <button onClick={() => toggleComments(post.id)} className={`flex items-center gap-1.5 text-sm transition-colors ${expandedComments === post.id ? 'text-navy-700' : 'text-navy-400 hover:text-navy-600'}`}>
        <MessageCircle size={18} />
        <span>{post.comments_count}</span>
      </button>
    );

    // Large hero card
    if (isLarge && post.content.length > 50) {
      return (
        <div key={post.id} className="animate-fade-in">
          <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-navy-900 rounded-full flex items-center justify-center">
                  <span className="text-cream-50 font-medium text-sm">{post.author_name?.charAt(0) || '?'}</span>
                </div>              <div className="flex-1">
                <Link to={`/profile/${post.author_id}`} className="font-semibold text-navy-900 text-sm hover:text-navy-700 transition-colors">                      {post.author_name ?? ''}
                </Link>


                <div className="flex items-center gap-2 text-xs text-navy-400">
                  <span>{post.author_city || 'Dehradun'}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cat.color}`}>
                {cat.emoji} {cat.label}
              </span>
            </div>

            <h2 className="font-display text-display-md text-navy-900 leading-tight mb-4">
              {post.content}
            </h2>

            {post.location_name && (
              <div className="flex items-center gap-1.5 text-sm text-navy-400 mb-4">
                <MapPin size={14} />
                <span>{post.location_name}</span>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t border-navy-100/30">
                {user && post.user_id !== user.id && (
                  <button
                    type="button"
                    onClick={() => handleRequestBuddy(post.id, post.author_id!, post.author_name!)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Request to chat
                  </button>
                )}
                <button onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${post.isLiked ? 'text-coral-500' : 'text-navy-400 hover:text-coral-500'}`}>
                  <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
                  <span>{post.likes_count}</span>
                </button>
                {commentBtn}
                <button onClick={() => toggleSave(post.id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${post.isSaved ? 'text-amber-500' : 'text-navy-400 hover:text-amber-500'}`}>
                  <Bookmark size={18} fill={post.isSaved ? 'currentColor' : 'none'} />
                </button>
                <button onClick={() => sharePost(post.id)} className="ml-auto text-navy-400 hover:text-navy-600 transition-colors">
                  <Share2 size={16} />
                </button>
                {user?.id === post.user_id && (
                  <button
                    onClick={() => setPostToDelete(post.id)}
                    disabled={deletingPost === post.id}
                    className="text-navy-300 hover:text-red-500 transition-colors ml-2"
                    aria-label="Delete post"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

            </div>
          </div>
          {renderCommentPanel(post)}
        </div>
      );
    }

    // Compact text card
    if (isCompact) {
      return (
        <div key={post.id} className="animate-fade-in">
          <div className="bg-white rounded-2xl shadow-soft p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-navy-600 text-xs font-medium">{post.author_name?.charAt(0) || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">                  <div className="flex items-center gap-2 mb-1">
                  <Link to={`/profile/${post.author_id}`} className="text-xs font-medium text-navy-700 hover:text-navy-900 transition-colors">
                    {post.author_name}
                  </Link>
                  <span className="text-xs text-navy-300">· {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>
                <p className="text-sm text-navy-800 line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-navy-400">
                  {user && post.user_id !== user.id && (
                    <button
                      type="button"
                      onClick={() => {
                        const authorId = post.author_id;
                        if (!authorId) return;
                        handleRequestBuddy(post.id, authorId, post.author_name!);
                      }}
                      className="text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Request to chat
                    </button>
                  )}
                  <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1 transition-colors ${post.isLiked ? 'text-coral-500' : ''}`}><Heart size={12} /> {post.likes_count}</button>
                  <button onClick={() => toggleComments(post.id)} className={`flex items-center gap-1 transition-colors ${expandedComments === post.id ? 'text-navy-700' : ''}`}><MessageCircle size={12} /> {post.comments_count}</button>
                </div>
              </div>
            </div>
          </div>
          {renderCommentPanel(post)}
        </div>
      );
    }

    // Default card
    return (
      <div key={post.id} className="animate-fade-in">
        <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
          <div className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-navy-900 rounded-full flex items-center justify-center">
                <span className="text-cream-50 font-medium text-sm">{post.author_name?.charAt(0) || '?'}</span>
              </div>
              <div className="flex-1">
                <Link to={`/profile/${post.author_id}`} className="font-semibold text-navy-900 text-sm hover:text-navy-700 transition-colors">                      {post.author_name ?? ''}
                </Link>


                <div className="flex items-center gap-2 text-xs text-navy-400">
                  <span>{post.author_city || 'Dehradun'}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cat.color}`}>
                {cat.emoji} {cat.label}
              </span>
            </div>

            <p className="text-navy-800 whitespace-pre-wrap mb-4 leading-relaxed">{post.content}</p>

            {post.location_name && (
              <div className="flex items-center gap-1.5 text-sm text-navy-400 mb-4">
                <MapPin size={14} />
                <span>{post.location_name}</span>
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-navy-100/20 flex items-center gap-5">
          </div>

          <div className="px-5 py-3 border-t border-navy-100/20 flex items-center gap-5">
            {user && post.user_id !== user.id && (
              <button
                type="button"
                onClick={() => handleRequestBuddy(post.id, post.author_id!, post.author_name!)}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Request to chat
              </button>
            )}
            <button onClick={() => toggleLike(post.id)}
              className={`flex items-center gap-1.5 text-sm transition-colors ${post.isLiked ? 'text-coral-500' : 'text-navy-400 hover:text-coral-500'}`}>
              <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
              <span>{post.likes_count}</span>
            </button>
            {commentBtn}
            <button onClick={() => toggleSave(post.id)}
              className={`transition-colors ${post.isSaved ? 'text-amber-500' : 'text-navy-400 hover:text-amber-500'}`}>
              <Bookmark size={18} fill={post.isSaved ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => sharePost(post.id)} className="ml-auto text-navy-400 hover:text-navy-600 transition-colors">
              <Share2 size={16} />
            </button>
            {user?.id === post.user_id && (
              <button
                onClick={() => setPostToDelete(post.id)}
                disabled={deletingPost === post.id}
                className="text-navy-300 hover:text-red-500 transition-colors"
                aria-label="Delete post"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
        {renderCommentPanel(post)}
      </div>
    );
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-display-lg text-navy-900">
          What's happening
          <br />nearby?
        </h1>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto activity-scroll pb-1 -mx-4 px-4">

        <button onClick={() => setFilter('')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 btn-press ${
            !filter ? 'bg-navy-900 text-cream-50' : 'bg-white text-navy-500 hover:bg-navy-50 shadow-soft'
          }`}>
          All
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 btn-press ${
              filter === cat ? 'bg-navy-900 text-cream-50' : 'bg-white text-navy-500 hover:bg-navy-50 shadow-soft'
            }`}>
            {CATEGORY_LABELS[cat].emoji} {CATEGORY_LABELS[cat].label}
          </button>
        ))}
      </div>

      {/* Create post modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl p-6 animate-slide-up max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h2 className="font-display text-display-sm text-navy-900">Create Post</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-navy-50 rounded-xl transition-colors" aria-label="Close">
                <X size={20} className="text-navy-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2">
              <div className="mb-5">
                <label className="block text-xs font-semibold text-navy-500 tracking-wider uppercase mb-3">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setNewPost({ ...newPost, category: cat })}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 btn-press ${
                        newPost.category === cat
                          ? 'bg-navy-900 text-cream-50'
                          : 'bg-cream-100 text-navy-500 hover:bg-cream-200'
                      }`}>
                      {CATEGORY_LABELS[cat].emoji} {CATEGORY_LABELS[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              {createError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {createError}
                </div>
              )}

              <textarea
                value={newPost.content}
                onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                className="w-full px-4 py-4 border border-navy-100/30 rounded-2xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 min-h-[140px] resize-none text-navy-800 placeholder-navy-300"
                placeholder="What's happening in your community?"
              />
            </div>

            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-navy-100/30 flex-shrink-0">
              <button onClick={() => setShowCreate(false)}
                className="px-5 py-2.5 text-navy-500 hover:text-navy-700 font-medium transition-colors">
                Cancel
              </button>
              <button onClick={createPost}
                disabled={submitting || !newPost.content.trim()}
                className="px-6 py-2.5 bg-navy-900 text-cream-50 rounded-xl font-medium hover:bg-navy-800 disabled:opacity-50 transition-all duration-200 btn-press">
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Linkup modal — create a new Linkup post */}
      {showLinkup && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl p-6 animate-slide-up max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-5 flex-shrink-0">
              <h2 className="font-display text-display-sm text-navy-900">Create Linkup</h2>
              <button onClick={() => setShowLinkup(false)} className="p-2 hover:bg-navy-50 rounded-xl transition-colors" aria-label="Close">
                <X size={20} className="text-navy-400" />
              </button>
            </div>

            <CreatePlanModal onClose={() => setShowLinkup(false)} />
          </div>
        </div>
      )}

      {/* Posts feed with varied visual density */}
      {loading ? (
        <FeedSkeleton count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => { setLoading(true); fetchPosts(1, false); }} />
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-cream-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔍</span>
          </div>
          <p className="font-display text-display-sm text-navy-800 mb-2">Nothing yet</p>
          <p className="text-sm text-navy-400">Be the first to share something with your community</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => renderPostCard(post, index))}

          {hasMore && (
            <button onClick={() => { setPage(page + 1); fetchPosts(page + 1, true); }}
              className="w-full py-4 text-navy-500 hover:text-navy-700 font-medium text-sm transition-colors">
              Load more
            </button>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {postToDelete && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full animate-fade-in">
            <h3 className="font-display text-xl text-navy-900 mb-2">Delete this post?</h3>
            <p className="text-sm text-navy-500 mb-6">
              This action cannot be undone. The post will be permanently removed.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setPostToDelete(null)}
                className="flex-1 py-3 text-navy-500 border border-navy-100/30 rounded-xl font-medium hover:bg-navy-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deletePost(postToDelete)}
                disabled={deletingPost === postToDelete}
                className="flex-1 py-3 bg-coral-500 text-white rounded-xl font-medium hover:bg-coral-600 disabled:opacity-50 transition-all btn-press flex items-center justify-center gap-2"
              >
                {deletingPost === postToDelete ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <><Trash2 size={16} /> Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Create Buttons — Post first, Linkup to the left of it */}
      <div className="fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] flex flex-col-reverse items-stretch justify-end gap-3 px-4 pt-4 z-40">
        <button
          type="button"
          className="bg-navy-900 text-cream-50 shrink-0 rounded-2xl px-3 py-3 shadow-lifted hover:bg-navy-800 active:bg-navy-800 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none transition-all duration-200 btn-press flex items-center justify-center text-sm font-medium"
          aria-label="Create post"
        >
          <Plus size={18} />
          Post
        </button>
        <button
          type="button"
          className="bg-navy-900 text-cream-50 shrink-0 rounded-2xl px-3 py-3 shadow-lifted hover:bg-navy-800 active:bg-navy-800 focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:outline-none transition-all duration-200 btn-press flex items-center justify-center text-sm font-medium"
          aria-label="Open linkup"
          onClick={() => setShowLinkup(true)}
          style={{ marginLeft: "0.75rem" }}
        >
          Linkup
        </button>
      </div>
    </div>
  );
}
