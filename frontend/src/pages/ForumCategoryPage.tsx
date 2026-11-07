import { useState, useEffect, useRef } from 'react';
import { ImagePicker } from '../components/ui/ImagePicker';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { ForumPost, ForumCategory, College } from '../types';
import { ArrowLeft, Plus, X, ArrowUp, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';

// Avatar accent colours cycling for non-anonymous authors
const AVATAR_COLORS = ['bg-[#C5F030]', 'bg-[#9A63E6]', 'bg-[#E8622B]', 'bg-[#2FA3B5]', 'bg-[#FFD41F]'];

export default function ForumCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [college, setCollege] = useState<College | null>(null);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState<{ title: string; content: string; isAnonymous: boolean; imageUrls: string[] }>({ title: '', content: '', isAnonymous: false, imageUrls: [] });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  // Lock body scroll when create modal is open
  useEffect(() => {
    if (showCreate) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
    document.body.style.overflow = '';
  }, [showCreate]);

  useEffect(() => {
    if (!slug) return;
    api.get(`/forums/colleges/${slug}`).then(res => {
      setCollege(res.data.college);
      const cats: ForumCategory[] = res.data.categories || [];
      setCategories(cats);
      if (cats.length > 0) {
        const targetSlug = searchParams.get('category')?.toLowerCase();
        const found = cats.find(c => c.slug.toLowerCase() === targetSlug || c.name.toLowerCase() === targetSlug) || cats[0];
        setSelectedCategory(found);
        fetchPosts(found.id);
      }
      setLoading(false);
    });
  }, [slug]);

  const fetchPosts = async (categoryId: string, pageNum: number = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/forums/categories/${categoryId}/posts?page=${pageNum}`);
      setPosts(res.data.posts || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const selectCategory = (cat: ForumCategory) => {
    setSelectedCategory(cat);
    setSearchParams({ category: cat.slug });
    fetchPosts(cat.id);
  };

  // Real-time: watch the selected category so new posts and comment-count bumps
  // from other phones appear without a reload. Re-joins on every category switch.
  const activeCategoryId = selectedCategory?.id;
  useEffect(() => {
    if (!activeCategoryId) return;
    let socket: ReturnType<typeof getSocket> | null = null;
    try { socket = getSocket(); } catch { /* not signed in */ }
    if (!socket) return;
    const categoryId = activeCategoryId;

    const join = () => socket?.emit('join_category', categoryId);
    const onPost = (post: ForumPost) => {
      if (post.category_id !== categoryId) return;
      setPosts(prev => prev.some(p => p.id === post.id) ? prev : [post, ...prev]);
    };
    const onCount = (payload: { postId: string; comment_count: number }) => {
      setPosts(prev => prev.map(p => p.id === payload.postId ? { ...p, comment_count: payload.comment_count } : p));
    };

    socket.on('connect', join);
    socket.on('forum_post', onPost);
    socket.on('forum_comment_count', onCount);
    join();
    return () => {
      socket?.off('connect', join);
      socket?.off('forum_post', onPost);
      socket?.off('forum_comment_count', onCount);
      socket?.emit('leave_category', categoryId);
    };
  }, [activeCategoryId]);

  const createPost = async () => {
    if (!selectedCategory || !newPost.title || !newPost.content) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/forums/categories/${selectedCategory.id}/posts`, newPost);
      // Functional update + dedupe: the socket `forum_post` event may arrive first
      // with the same post id — appending blindly would duplicate it.
      setPosts(prev => prev.some(p => p.id === res.data.post.id) ? prev : [res.data.post, ...prev]);
      setShowCreate(false);
      setNewPost({ title: '', content: '', isAnonymous: false, imageUrls: [] });
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      alert(apiErr.response?.data?.error || 'Failed to create post');
    }
    setSubmitting(false);
  };

  const toggleUpvote = async (postId: string) => {
    try {
      const res = await api.post(`/forums/posts/${postId}/upvote`);
      setPosts(posts.map(p => p.id === postId ? { ...p, isUpvoted: res.data.upvoted, upvotes: p.upvotes + (res.data.upvoted ? 1 : -1) } : p));
    } catch { /* ignore */ }
  };

  if (!college) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 rounded-full border-4 border-[#1B1250] border-t-[#C5F030] animate-spin" />
    </div>
  );

  return (
    <div className="pb-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/forums')}
        className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] flex items-center justify-center mb-5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
      >
        <ArrowLeft size={18} strokeWidth={2.5} className="text-[#1B1250]" />
      </button>

      {/* College heading */}
      <h1 className="font-display font-black text-2xl text-[#1B1250] tracking-tight mb-5">
        {college.name}
      </h1>

      {/* Category chip row — horizontally scrollable, no-scrollbar */}
      <div className="overflow-x-auto pb-2 mb-5 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-2 w-max">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat)}
              className={
                selectedCategory?.id === cat.id
                  ? 'bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full px-4 py-2 text-xs font-black uppercase whitespace-nowrap transition-all'
                  : 'bg-[#F6FBD4] text-[#1B1250] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] rounded-full px-4 py-2 text-xs font-black uppercase whitespace-nowrap transition-all'
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Posts header + FAB */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-black text-lg text-[#1B1250] truncate min-w-0">
          {selectedCategory?.name || 'Posts'}
        </h2>
        {selectedCategory && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full px-4 py-2 font-black text-xs uppercase tracking-wide shrink-0 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <Plus size={14} strokeWidth={3} /> New Post
          </button>
        )}
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="bg-[#F6FBD4] border-2 border-dashed border-[#1B1250] rounded-[24px] h-28 animate-pulse"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] flex items-center justify-center mb-5 text-4xl">
            💬
          </div>
          <p className="font-display font-black text-xl text-[#1B1250] mb-2">No posts yet</p>
          <p className="text-xs font-bold text-[#1B1250]/60 mb-6">Be the first to start a conversation!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full px-6 py-2.5 font-black text-xs uppercase tracking-wider active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            Be the first to post
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, index) => {
            const rotation = index % 2 === 0 ? '-rotate-1 hover:rotate-0' : 'rotate-1 hover:rotate-0';
            const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

            return (
              <Link
                key={post.id}
                to={`/forums/post/${post.id}`}
                className={`block bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[24px] shadow-[4px_6px_0_#1B1250] p-4 hover:shadow-[6px_8px_0_#1B1250] transition-all duration-200 ${rotation}`}
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="shrink-0">
                    {post.is_anonymous ? (
                      <div className="w-9 h-9 rounded-full bg-[#1B1250]/10 border-2 border-[#1B1250] flex items-center justify-center text-base">
                        👤
                      </div>
                    ) : (
                      <div className={`w-9 h-9 rounded-full ${avatarColor} border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250] flex items-center justify-center`}>
                        <span className="font-black text-xs text-[#1B1250]">
                          {post.author_name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Author + time */}
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[11px] font-black text-[#1B1250] uppercase tracking-wide">
                        {post.is_anonymous ? 'Anonymous' : post.author_name}
                      </span>
                      {post.is_anonymous && (
                        <span className="px-1.5 py-0.5 bg-[#1B1250]/10 border border-[#1B1250]/20 rounded-full text-[9px] font-black text-[#1B1250]/60 uppercase">
                          Anon
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-[#1B1250]/40">
                        · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-display font-black text-base text-[#1B1250] leading-tight mb-1">
                      {post.title}
                    </h3>

                    {/* Content preview */}
                    <p className="text-sm font-semibold text-[#1B1250]/80 line-clamp-2 leading-snug mb-2">
                      {post.content}
                    </p>

                    {/* Image thumbnails */}
                    {post.image_urls && post.image_urls.length > 0 && (
                      <div className="flex gap-1.5 mb-2">
                        {post.image_urls.slice(0, 3).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="w-14 h-14 rounded-[12px] border-2 border-[#1B1250] object-cover"
                          />
                        ))}
                      </div>
                    )}

                    {/* Stats pills */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.preventDefault(); toggleUpvote(post.id); }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border-2 border-[#1B1250] text-[11px] font-black transition-all ${
                          post.isUpvoted
                            ? 'bg-[#C5F030] text-[#1B1250] shadow-[2px_2px_0_#1B1250]'
                            : 'bg-[#1B1250] text-white'
                        }`}
                      >
                        <ArrowUp size={11} strokeWidth={3} />
                        {post.upvotes}
                      </button>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1B1250] text-white border-2 border-[#1B1250] text-[11px] font-black">
                        <MessageSquare size={11} strokeWidth={2.5} />
                        {post.comment_count}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Load more */}
          {posts.length >= 20 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  if (selectedCategory) fetchPosts(selectedCategory.id, next);
                }}
                className="bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full px-6 py-2.5 font-black text-xs uppercase tracking-wider active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create post modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-[#1B1250]/60 z-50 flex items-start justify-center px-4 pt-16 overflow-y-auto">
          <div className="relative bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[6px_8px_0_#1B1250] rounded-[28px] p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            {/* Candy ball decoration */}
            <div
              className="absolute -top-5 -right-5 w-10 h-10 rounded-full bg-[#C5F030] border-3 border-[#1B1250] shadow-[2px_2px_0_#1B1250] pointer-events-none"
              aria-hidden="true"
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-black text-xl text-[#1B1250]">
                New Post
                {selectedCategory && (
                  <span className="ml-2 text-sm font-black text-[#1B1250]/60">
                    in {selectedCategory.name}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                aria-label="Close"
                className="w-9 h-9 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[2px_2px_0_#1B1250] flex items-center justify-center active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                <X size={16} strokeWidth={2.5} className="text-[#1B1250]" />
              </button>
            </div>

            {/* Category selection */}
            <div className="mb-4">
              <label className="block text-xs font-black uppercase text-[#1B1250] mb-1.5">
                Post Category
              </label>
              <div className="flex gap-1.5 flex-wrap max-h-28 overflow-y-auto p-1.5 bg-white border-2 border-[#1B1250]/30 rounded-[18px]">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-black border-2 border-[#1B1250] transition-all cursor-pointer ${
                      selectedCategory?.id === cat.id
                        ? 'bg-[#C5F030] text-[#1B1250] shadow-[2px_2px_0_#1B1250]'
                        : 'bg-[#F6FBD4] text-[#1B1250]/70 hover:text-[#1B1250]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Title input */}
            <input
              type="text"
              value={newPost.title}
              onChange={e => setNewPost({ ...newPost, title: e.target.value })}
              className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none mb-3"
              placeholder="Post title"
            />

            {/* Content textarea */}
            <textarea
              value={newPost.content}
              onChange={e => setNewPost({ ...newPost, content: e.target.value })}
              className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none resize-none min-h-[120px] mb-3"
              placeholder="Write your post..."
            />

            {/* Image picker */}
            <div className="mb-4">
              <ImagePicker value={newPost.imageUrls} onChange={urls => setNewPost(prev => ({ ...prev, imageUrls: urls }))} />
            </div>

            {/* Anonymous toggle */}
            <label className="flex items-center gap-3 cursor-pointer mb-5">
              <div className="relative">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={newPost.isAnonymous}
                  onChange={e => setNewPost({ ...newPost, isAnonymous: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full border-2 border-[#1B1250] transition-colors ${newPost.isAnonymous ? 'bg-[#C5F030]' : 'bg-[#1B1250]/10'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-[#1B1250] border border-[#1B1250] absolute top-0.5 transition-transform ${newPost.isAnonymous ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>
              <span className="text-sm font-black text-[#1B1250]">Post anonymously</span>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full px-5 py-2.5 font-black text-xs uppercase tracking-wider active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createPost}
                disabled={submitting || !newPost.title || !newPost.content}
                className="bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full px-6 py-2.5 font-black text-xs uppercase tracking-wider disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                {submitting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
