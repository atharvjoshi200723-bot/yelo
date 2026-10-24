import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { ForumPost, ForumCategory, College } from '../types';
import { ArrowLeft, Plus, X, ArrowUp, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function ForumCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [college, setCollege] = useState<College | null>(null);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', isAnonymous: false });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  // Lock body scroll when create modal is open
  useEffect(() => {
    if (showCreate) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = '';
    };
    }
    document.body.style.overflow = '';
  }, [showCreate]);

  useEffect(() => {
    if (!slug) return;
    api.get(`/forums/colleges/${slug}`).then(res => {
      setCollege(res.data.college);
      setCategories(res.data.categories || []);
      if (res.data.categories?.length > 0) {
        setSelectedCategory(res.data.categories[0]);
        fetchPosts(res.data.categories[0].id);
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
    fetchPosts(cat.id);
  };

  const createPost = async () => {
    if (!selectedCategory || !newPost.title || !newPost.content) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/forums/categories/${selectedCategory.id}/posts`, newPost);
      setPosts([res.data.post, ...posts]);
      setShowCreate(false);
      setNewPost({ title: '', content: '', isAnonymous: false });
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

  if (!college) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;

  return (
    <div>
      <button onClick={() => navigate('/forums')} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4">
        <ArrowLeft size={18} /> All Colleges
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{college.name}</h1>
      </div>

      <div className="flex gap-4">
        {/* Categories sidebar */}
        <div className="w-48 flex-shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl shadow-sm p-3 space-y-1">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => selectCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory?.id === cat.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                }`}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile categories */}
        <div className="md:hidden mb-4 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => selectCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory?.id === cat.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Posts */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">{selectedCategory?.name || 'Posts'}</h2>
            {selectedCategory && (
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-brand-700">
                <Plus size={14} /> New Post
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl p-4 h-24 skeleton" />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <p className="text-slate-400">No posts yet in this category</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <Link key={post.id} to={`/forums/post/${post.id}`}
                  className="flex gap-4 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={e => { e.preventDefault(); toggleUpvote(post.id); }}
                      className={`p-1.5 rounded-lg transition-colors ${post.isUpvoted ? 'bg-brand-100 text-brand-600' : 'text-slate-400 hover:text-brand-600'}`}>
                      <ArrowUp size={16} />
                    </button>
                    <span className="text-sm font-medium text-slate-700">{post.upvotes}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 line-clamp-1">{post.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-1 mt-1">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>{post.is_anonymous ? '👤 Anonymous' : post.author_name}</span>
                      <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={12} />{post.comment_count}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create post modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6 animate-slide-up max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-lg font-semibold">New Post in {selectedCategory?.name}</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 p-2 -mr-2 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Close"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2">
              <input type="text" value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Post title" />
              <textarea value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl min-h-[120px] focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Write your post..." />
              <div className="flex items-center gap-3 mt-3">
                <input type="checkbox" id="anonymous" checked={newPost.isAnonymous}
                  onChange={e => setNewPost({ ...newPost, isAnonymous: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded" />
                <label htmlFor="anonymous" className="text-sm text-slate-700">Post anonymously</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 flex-shrink-0">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancel</button>
              <button onClick={createPost} disabled={submitting || !newPost.title || !newPost.content}
                className="px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 font-medium">
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
