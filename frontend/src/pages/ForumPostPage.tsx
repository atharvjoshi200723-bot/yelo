import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ForumPost, Comment } from '../types';
import { ArrowLeft, ArrowUp, MessageSquare, Clock, Flag, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReportModal from '../components/moderation/ReportModal';
import { ImagePicker } from '../components/ui/ImagePicker';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { DoodleStar, DoodleSquiggle } from '../components/neo/Decorations';

export default function ForumPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentImages, setCommentImages] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/forums/posts/${id}`),
      api.get(`/forums/posts/${id}/comments`),
    ]).then(([postRes, commentsRes]) => {
      setPost(postRes.data.post);
      setComments(commentsRes.data.comments || []);
      setLoading(false);
    }).catch(() => navigate('/forums'));
  }, [id, navigate]);

  // Real-time: join this post's room so comments from other phones are pushed
  // to us the moment they are posted — no reload needed.
  useEffect(() => {
    if (!id) return;
    let socket: ReturnType<typeof getSocket> | null = null;
    try { socket = getSocket(); } catch { /* not signed in */ }
    if (!socket) return;

    const join = () => socket?.emit('join_post', id);
    const onComment = (comment: Comment & { post_id?: string }) => {
      if (comment.post_id !== id) return;
      setComments(prev => prev.some(c => c.id === comment.id) ? prev : [...prev, comment]);
    };

    socket.on('connect', join);
    socket.on('forum_comment', onComment);
    join();
    return () => {
      socket?.off('connect', join);
      socket?.off('forum_comment', onComment);
      socket?.emit('leave_post', id);
    };
  }, [id]);

  // Slow safety-net poll in case a socket push is missed
  useEffect(() => {
    if (!id) return;
    const refreshComments = () => {
      if (document.hidden) return;
      api.get(`/forums/posts/${id}/comments`)
        .then(res => setComments(res.data.comments || []))
        .catch(() => { /* keep what is on screen */ });
    };

    const interval = window.setInterval(refreshComments, 60000);
    window.addEventListener('focus', refreshComments);
    document.addEventListener('visibilitychange', refreshComments);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshComments);
      document.removeEventListener('visibilitychange', refreshComments);
    };
  }, [id]);

  const addComment = async () => {
    if (!id || !newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/forums/posts/${id}/comments`, {
        content: newComment,
        isAnonymous,
        imageUrls: commentImages.length > 0 ? commentImages : undefined,
      });
      setComments(prev => prev.some(c => c.id === res.data.comment.id) ? prev : [...prev, res.data.comment]);
      setNewComment('');
      setCommentImages([]);
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const toggleUpvote = async () => {
    if (!id) return;
    try {
      const res = await api.post(`/forums/posts/${id}/upvote`);
      setPost(prev => prev ? { ...prev, isUpvoted: res.data.upvoted, upvotes: prev.upvotes + (res.data.upvoted ? 1 : -1) } : prev);
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="pb-24 max-w-lg mx-auto px-4 pt-6 space-y-4">
        <div className="w-10 h-10 rounded-full bg-[#1B1250]/10 border-2 border-dashed border-[#1B1250]/30 animate-pulse" />
        <div className="bg-[#F6FBD4] border-3 border-dashed border-[#1B1250]/30 rounded-[28px] h-64 animate-pulse p-6" />
      </div>
    );
  }

  if (!post) return null;

  const authorDisplayName = post.is_anonymous ? 'Anonymous' : (post.author_name || 'Anonymous');
  const authorInitial = authorDisplayName.charAt(0).toUpperCase();

  return (
    <div className="pb-28 max-w-lg mx-auto px-4 pt-4">
      {/* Header back button */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo flex items-center justify-center text-[#1B1250] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          aria-label="Back"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-1.5">
          <DoodleStar color="teal" size={20} rotate={12} />
          <span className="text-xs font-black text-[#1B1250] uppercase tracking-wider">Discussion</span>
        </div>
      </div>

      {/* Hero Post Sticker Card */}
      <article className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[28px] shadow-neo-card p-5 sm:p-6 mb-5 relative">
        {/* Category tag badge */}
        <span className="bg-[#2FA3B5] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border-2 border-[#1B1250] shadow-neo-sm absolute -top-2.5 right-6 rotate-2 select-none">
          {post.college_name || 'Campus'}
        </span>

        {/* Author Header */}
        <div className="flex items-center gap-3 mb-4 pt-1">
          <div className="w-11 h-11 rounded-full bg-[#1B1250] border-2.5 border-[#1B1250] ring-3 ring-[#9A63E6] shadow-[2px_2px_0_#1B1250] flex items-center justify-center shrink-0">
            <span className="text-[#F6FBD4] font-black text-sm">{authorInitial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-black text-sm text-[#1B1250] truncate">{authorDisplayName}</p>
            <p className="text-[10px] font-bold text-[#1B1250]/60 uppercase tracking-wider">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display font-black text-2xl text-[#1B1250] leading-tight tracking-tight mb-3">
          {post.title}
        </h1>

        {/* Content */}
        <div className="font-semibold text-sm sm:text-base text-[#1B1250] whitespace-pre-wrap leading-relaxed mb-4">
          {post.content}
        </div>

        {/* Images */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className={`grid gap-2 mb-4 rounded-[18px] overflow-hidden border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] ${
            post.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}>
            {post.image_urls.map((url, i) => (
              <img
                key={`${url}-${i}`}
                src={url}
                alt={`Post image ${i + 1}`}
                loading="lazy"
                className={`w-full bg-white object-cover ${post.image_urls!.length === 1 ? 'max-h-96' : 'h-40'}`}
              />
            ))}
          </div>
        )}

        {/* Footer actions: Upvote + Report */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-[#1B1250]/15">
          <button
            type="button"
            onClick={toggleUpvote}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2.5 border-[#1B1250] text-xs font-black select-none transition-all active:translate-x-0.5 active:translate-y-0.5 ${
              post.isUpvoted
                ? 'bg-[#C5F030] text-[#1B1250] shadow-[2px_2px_0_#1B1250]'
                : 'bg-white text-[#1B1250] shadow-[1px_2px_0_#1B1250] hover:bg-[#F5F2FF]'
            }`}
            aria-label="Upvote"
          >
            <ArrowUp size={16} strokeWidth={3} className={post.isUpvoted ? 'text-[#1B1250]' : 'text-[#1B1250]'} />
            <span>{post.upvotes || 0}</span>
          </button>

          {!post.is_anonymous && post.user_id !== user?.id && (
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#EAE4FB] text-[#1B1250] rounded-full border-2 border-[#1B1250] text-xs font-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <Flag size={12} strokeWidth={2.5} /> Report
            </button>
          )}
        </div>
      </article>

      {/* Comments Section */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-black text-[#1B1250] uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare size={14} strokeWidth={2.5} />
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </h2>
          <DoodleSquiggle color="#9A63E6" width={36} height={10} />
        </div>

        {/* Add Comment Card */}
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[24px] shadow-neo p-4 mb-5">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2.5 border-[#1B1250] rounded-[18px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_2px_0_#1B1250] focus:outline-none resize-none"
            rows={3}
            placeholder="Write a comment..."
          />
          <div className="mt-3">
            <ImagePicker value={commentImages} onChange={setCommentImages} />
          </div>
          <div className="flex items-center justify-between flex-wrap mt-3 gap-3 pt-2 border-t-2 border-[#1B1250]/15">
            <label className="flex items-center gap-2 text-xs font-black text-[#1B1250] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-[#1B1250] text-[#9A63E6] focus:ring-0"
              />
              Post anonymously
            </label>
            <button
              type="button"
              onClick={addComment}
              disabled={submitting || !newComment.trim()}
              className="px-5 py-2.5 bg-[#C5F030] hover:bg-[#bcf01a] text-[#1B1250] border-2.5 border-[#1B1250] shadow-[2px_3px_0_#1B1250] rounded-full font-display font-black text-xs uppercase disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              {submitting ? 'Posting...' : 'Comment'}
            </button>
          </div>
        </div>

        {/* Comment Bubbles */}
        <div className="space-y-3.5">
          {comments.map((comment, index) => {
            const commentAuthorName = comment.is_anonymous ? 'Anonymous' : (comment.author_name || 'User');
            const commentInitial = commentAuthorName.charAt(0).toUpperCase();
            const rotation = index % 2 === 0 ? '-rotate-0.5' : 'rotate-0.5';

            return (
              <article
                key={comment.id}
                className={`bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[22px] rounded-tl-sm shadow-[3px_4px_0_#1B1250] p-4 relative ${rotation}`}
              >
                <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                  <div className="w-6 h-6 rounded-full bg-[#1B1250] border-1.5 border-[#1B1250] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-[#F6FBD4]">{commentInitial}</span>
                  </div>
                  <span className="font-black text-xs text-[#1B1250]">{commentAuthorName}</span>
                  <span className="text-[#1B1250]/40">·</span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#1B1250]/60">
                    <Clock size={11} className="shrink-0" />
                    <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#1B1250] whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
                {comment.image_urls && comment.image_urls.length > 0 && (
                  <div className={`grid gap-2 mt-3 rounded-[14px] overflow-hidden border-2 border-[#1B1250] ${
                    comment.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                  }`}>
                    {comment.image_urls.map((url, i) => (
                      <img
                        key={`${url}-${i}`}
                        src={url}
                        alt={`Comment image ${i + 1}`}
                        loading="lazy"
                        className={`w-full bg-white object-cover ${comment.image_urls!.length === 1 ? 'max-h-80' : 'h-36'}`}
                      />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {showReportModal && (
        <ReportModal
          targetType="forum_post"
          targetId={post.id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
