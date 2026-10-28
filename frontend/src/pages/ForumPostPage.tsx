import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ForumPost, Comment } from '../types';
import { ArrowLeft, ArrowUp, MessageSquare, Clock, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReportModal from '../components/moderation/ReportModal';
import { ImagePicker } from '../components/ui/ImagePicker';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';

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
  }, [id]);

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

    // 'connect' also fires on reconnect — rooms are re-joined server-side each time
    socket.on('connect', join);
    socket.on('forum_comment', onComment);
    join();
    return () => {
      socket?.off('connect', join);
      socket?.off('forum_comment', onComment);
      socket?.emit('leave_post', id);
    };
  }, [id]);

  // Slow safety-net poll in case a socket push is missed (background tabs, brief
  // disconnects). 60s keeps us well inside the 100-req/15-min rate limit — the
  // earlier 10s cadence silently exhausted it alongside TopBar's 30s polling.
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
      // Functional update + dedupe: the socket push can beat this HTTP response
      // (same comment, same id), and appending blindly would duplicate it.
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;
  if (!post) return null;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 py-2.5 -my-1 text-slate-600 hover:text-slate-800 mb-4">
        <ArrowLeft size={18} /> Back
      </button>

      <article className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-6">
        <div className="flex gap-4">
          <button
            onClick={toggleUpvote}
            className={`shrink-0 p-2 rounded-lg transition-colors ${post.isUpvoted ? 'bg-brand-100 text-brand-600' : 'text-slate-400 hover:text-brand-600'}`}
            aria-label="Upvote"
          >
            <ArrowUp size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 flex-wrap">
              <span className="font-medium">{post.is_anonymous ? 'Anonymous' : post.author_name}</span>
              <span className="opacity-50">·</span>
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              <span className="opacity-50">·</span>
              <span>{post.college_name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 leading-snug">{post.title}</h1>
            <div className="text-slate-700 whitespace-pre-wrap leading-relaxed text-base">{post.content}</div>
            {post.image_urls && post.image_urls.length > 0 && (
              <div className={`grid gap-2 mt-4 ${post.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {post.image_urls.map((url, i) => (
                  <img
                    key={`${url}-${i}`}
                    src={url}
                    alt={`Post image ${i + 1}`}
                    loading="lazy"
                    className={`w-full rounded-xl object-cover ${post.image_urls!.length === 1 ? 'max-h-96' : 'h-40'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </article>

      {!post.is_anonymous && post.user_id !== user?.id && (
        <div className="mb-6 flex justify-start">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cream-50 text-navy-500 rounded-xl text-sm font-medium hover:bg-cream-100 transition-colors"
          >
            <Flag size={16} /> Report Post
          </button>
        </div>
      )}

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          <MessageSquare size={18} className="inline mr-2" />
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </h2>

        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-sm"
            rows={3}
            placeholder="Write a comment..."
          />
          <div className="mt-3">
            <ImagePicker value={commentImages} onChange={setCommentImages} />
          </div>
          <div className="flex items-center justify-between flex-wrap mt-3 gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded"
              />
              Post anonymously
            </label>
            <button
              onClick={addComment}
              disabled={submitting || !newComment.trim()}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm hover:bg-brand-700 disabled:opacity-50 shrink-0"
            >
              {submitting ? 'Posting...' : 'Comment'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {comments.map(comment => (
            <article key={comment.id} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 flex-wrap">
                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs">{comment.is_anonymous ? '?' : comment.author_name?.charAt(0)}</span>
                </div>
                <span className="font-medium">{comment.is_anonymous ? 'Anonymous' : comment.author_name}</span>
                <span className="opacity-50">·</span>
                <Clock size={12} className="shrink-0" />
                <span>{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
              {comment.image_urls && comment.image_urls.length > 0 && (
                <div className={`grid gap-2 mt-3 ${comment.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {comment.image_urls.map((url, i) => (
                    <img
                      key={`${url}-${i}`}
                      src={url}
                      alt={`Comment image ${i + 1}`}
                      loading="lazy"
                      className={`w-full rounded-xl object-cover ${comment.image_urls!.length === 1 ? 'max-h-80' : 'h-36'}`}
                    />
                  ))}
                </div>
              )}
            </article>
          ))}
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
