import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Package,
  Users as BuddyIcon,
  MessageSquare,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Shield,
  Trash2,
  Ban,
  CheckCircle,
  Search,
  Sparkles,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalListings: number;
  activeListings: number;
  buddyProfiles: number;
  activeBuddyProfiles: number;
  forumPosts: number;
  totalReports: number;
  pendingReports: number;
  totalRentals: number;
  completedRentals: number;
  totalCommission: number;
}

type Tab = 'overview' | 'users' | 'listings' | 'feed' | 'buddies' | 'reports';

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [buddies, setBuddies] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [claimStatus, setClaimStatus] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.stats);
    } catch {
      /* ignore */
    }
  };

  const fetchTab = async (t: Tab) => {
    setTab(t);
    setSearch('');
    try {
      if (t === 'overview') await fetchStats();
      if (t === 'users') {
        const r = await api.get('/admin/users');
        setUsers(r.data.users || []);
      }
      if (t === 'listings') {
        const r = await api.get('/admin/listings');
        setListings(r.data.listings || []);
      }
      if (t === 'feed') {
        const r = await api.get('/admin/social-posts');
        setFeedPosts(r.data.posts || []);
      }
      if (t === 'buddies') {
        const r = await api.get('/admin/buddy-profiles');
        setBuddies(r.data.profiles || []);
      }
      if (t === 'reports') {
        const r = await api.get('/reports');
        setReports(r.data.reports || []);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchStats().finally(() => setLoading(false));
  }, []);

  const handleUserAction = async (userId: string, action: string) => {
    const reason = prompt(`Reason for ${action}:`) || `Admin ${action}`;
    try {
      await api.put(`/admin/users/${userId}/status`, {
        status: action === 'ban' ? 'banned' : action === 'suspend' ? 'suspended' : 'active',
        reason,
      });
      fetchTab('users');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  const handleRemoveListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to remove this listing?')) return;
    try {
      await api.put(`/admin/listings/${listingId}/remove`, { reason: 'Removed by admin' });
      fetchTab('listings');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove listing');
    }
  };

  const handleDeleteFeedPost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/admin/social-posts/${postId}`);
      fetchTab('feed');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete post');
    }
  };

  const handleSuspendBuddy = async (profileId: string) => {
    if (!confirm('Are you sure you want to suspend this buddy profile?')) return;
    try {
      await api.put(`/admin/buddy-profiles/${profileId}/suspend`, { reason: 'Suspended by admin' });
      fetchTab('buddies');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to suspend buddy profile');
    }
  };

  const handleResolveReport = async (reportId: string) => {
    const notes = prompt('Resolution notes:') || 'Resolved by admin';
    try {
      await api.put(`/reports/${reportId}/resolve`, { adminNotes: notes, status: 'resolved' });
      fetchTab('reports');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to resolve report');
    }
  };

  const handleClaimAdmin = async () => {
    try {
      setClaimStatus(null);
      const res = await api.post('/users/claim-admin', { key: adminKey || 'yelo_admin_2026' });
      if (res.data.success) {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        setClaimStatus('Admin privileges activated! Refreshing...');
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch (err: any) {
      setClaimStatus(err.response?.data?.error || 'Failed to claim admin status.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-[#1B1250] border-t-[#C5F030] animate-spin" />
      </div>
    );
  }

  const isUserAdmin = user?.role === 'admin' || user?.email?.toLowerCase() === 'atharvjoshi200723@gmail.com';

  return (
    <div className="pb-16 max-w-4xl mx-auto px-1">
      {/* Neo-brutalist Header */}
      <div className="bg-[#1B1250] text-[#F6FBD4] rounded-[26px] p-6 mb-6 border-3 border-[#1B1250] shadow-[5px_6px_0_#C5F030] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[18px] bg-[#C5F030] text-[#1B1250] border-2.5 border-[#1B1250] flex items-center justify-center shadow-[2px_2px_0_white]">
            <Shield size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl tracking-tight text-white">YELO Control Center</h1>
            <p className="text-xs font-bold text-[#F6FBD4]/70">Admin moderation, management, and oversight</p>
          </div>
        </div>

        {/* Claim admin button for quick promotion */}
        {!isUserAdmin && (
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder="Admin key"
              value={adminKey}
              onChange={e => setAdminKey(e.target.value)}
              className="bg-white text-[#1B1250] text-xs font-bold px-3 py-2 rounded-full border-2 border-[#1B1250] focus:outline-none"
            />
            <button
              onClick={handleClaimAdmin}
              className="bg-[#C5F030] text-[#1B1250] px-4 py-2 rounded-full font-black text-xs uppercase border-2 border-[#1B1250] shadow-[2px_2px_0_white] cursor-pointer"
            >
              Claim Admin
            </button>
          </div>
        )}
      </div>

      {claimStatus && (
        <div className="mb-5 p-3.5 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] rounded-[18px] font-black text-xs shadow-[3px_3px_0_#1B1250]">
          {claimStatus}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'users', label: 'Users' },
          { id: 'listings', label: 'Rental Listings' },
          { id: 'feed', label: 'Home Feed Posts' },
          { id: 'buddies', label: 'Buddies' },
          { id: 'reports', label: 'Reports' },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => fetchTab(t.id as Tab)}
            className={`px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap border-3 border-[#1B1250] transition-all cursor-pointer ${
              tab === t.id
                ? 'bg-[#C5F030] text-[#1B1250] shadow-[3px_4px_0_#1B1250] scale-[1.02]'
                : 'bg-[#F6FBD4] text-[#1B1250] shadow-[2px_2px_0_#1B1250] hover:bg-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, bg: 'bg-[#2FA3B5]' },
            { label: 'Active Users', value: stats.activeUsers, icon: CheckCircle, bg: 'bg-[#C5F030]' },
            { label: 'Rental Listings', value: stats.totalListings, icon: Package, bg: 'bg-[#FFD41F]' },
            { label: 'Buddy Profiles', value: stats.buddyProfiles, icon: BuddyIcon, bg: 'bg-[#9A63E6]' },
            { label: 'Forum Posts', value: stats.forumPosts, icon: MessageSquare, bg: 'bg-[#FF9A1F]' },
            { label: 'Pending Reports', value: stats.pendingReports, icon: AlertTriangle, bg: 'bg-[#FF5C8A]' },
            { label: 'Completed Rentals', value: stats.completedRentals, icon: TrendingUp, bg: 'bg-[#B79BF0]' },
            { label: 'Platform Revenue', value: `₹${stats.totalCommission}`, icon: DollarSign, bg: 'bg-[#C5F030]' },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[22px] p-4 shadow-[4px_5px_0_#1B1250]"
            >
              <div className={`w-9 h-9 ${item.bg} border-2 border-[#1B1250] rounded-full flex items-center justify-center mb-3 shadow-[1px_1px_0_#1B1250]`}>
                <item.icon size={18} className="text-[#1B1250]" />
              </div>
              <p className="font-display font-black text-2xl sm:text-3xl text-[#1B1250] leading-none mb-1">
                {item.value}
              </p>
              <p className="text-[11px] font-black uppercase text-[#1B1250]/70">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] overflow-hidden p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-black text-xl text-[#1B1250]">Registered Accounts ({users.length})</h2>
          </div>
          <div className="space-y-3">
            {users.map(u => (
              <div
                key={u.id}
                className="bg-white border-2.5 border-[#1B1250] rounded-[18px] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_3px_0_#1B1250]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-[#1B1250] truncate">{u.name || 'User'}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-[#1B1250] ${
                      u.role === 'admin' ? 'bg-[#FF5C8A] text-white' : 'bg-[#EAE4FB] text-[#1B1250]'
                    }`}>
                      {u.role}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-[#1B1250] ${
                      u.status === 'active' ? 'bg-[#C5F030] text-[#1B1250]' : 'bg-[#FF5C8A] text-white'
                    }`}>
                      {u.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#1B1250]/60 mt-0.5 truncate">{u.email} · {u.city || 'Dehradun'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {u.status === 'active' ? (
                    <>
                      <button
                        onClick={() => handleUserAction(u.id, 'suspend')}
                        className="px-3 py-1 bg-[#FFD41F] text-[#1B1250] border-2 border-[#1B1250] rounded-full text-xs font-black shadow-[1px_1px_0_#1B1250] cursor-pointer"
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => handleUserAction(u.id, 'ban')}
                        className="px-3 py-1 bg-[#FF5C8A] text-white border-2 border-[#1B1250] rounded-full text-xs font-black shadow-[1px_1px_0_#1B1250] cursor-pointer"
                      >
                        Ban
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleUserAction(u.id, 'restore')}
                      className="px-3 py-1 bg-[#C5F030] text-[#1B1250] border-2 border-[#1B1250] rounded-full text-xs font-black shadow-[1px_1px_0_#1B1250] cursor-pointer"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LISTINGS TAB */}
      {tab === 'listings' && (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] overflow-hidden p-4 sm:p-5">
          <h2 className="font-display font-black text-xl text-[#1B1250] mb-4">Rental Listings ({listings.length})</h2>
          <div className="space-y-3">
            {listings.map(l => (
              <div
                key={l.id}
                className="bg-white border-2.5 border-[#1B1250] rounded-[18px] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_3px_0_#1B1250]"
              >
                <div className="min-w-0">
                  <h3 className="font-black text-sm text-[#1B1250] truncate">{l.title}</h3>
                  <p className="text-xs font-semibold text-[#1B1250]/60 mt-0.5">
                    ₹{l.price_per_day}/day · Owner: {l.owner_name} · Status: {l.status}
                  </p>
                </div>
                {l.status === 'active' && (
                  <button
                    onClick={() => handleRemoveListing(l.id)}
                    className="px-3 py-1 bg-[#FF5C8A] text-white border-2 border-[#1B1250] rounded-full text-xs font-black shadow-[1px_1px_0_#1B1250] flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Trash2 size={12} strokeWidth={2.5} /> Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FEED POSTS TAB */}
      {tab === 'feed' && (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] overflow-hidden p-4 sm:p-5">
          <h2 className="font-display font-black text-xl text-[#1B1250] mb-4">Home Feed Posts ({feedPosts.length})</h2>
          <div className="space-y-3">
            {feedPosts.map(p => (
              <div
                key={p.id}
                className="bg-white border-2.5 border-[#1B1250] rounded-[18px] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_3px_0_#1B1250]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-[#1B1250]">{p.author_name || 'Anonymous'}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#EAE4FB] border border-[#1B1250]">
                      {p.category}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#1B1250]/80 mt-1 line-clamp-2">{p.content}</p>
                </div>
                <button
                  onClick={() => handleDeleteFeedPost(p.id)}
                  className="px-3 py-1 bg-[#FF5C8A] text-white border-2 border-[#1B1250] rounded-full text-xs font-black shadow-[1px_1px_0_#1B1250] flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Trash2 size={12} strokeWidth={2.5} /> Delete Post
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BUDDIES TAB */}
      {tab === 'buddies' && (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] overflow-hidden p-4 sm:p-5">
          <h2 className="font-display font-black text-xl text-[#1B1250] mb-4">Buddy Profiles ({buddies.length})</h2>
          <div className="space-y-3">
            {buddies.map(b => (
              <div
                key={b.id}
                className="bg-white border-2.5 border-[#1B1250] rounded-[18px] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_3px_0_#1B1250]"
              >
                <div className="min-w-0">
                  <h3 className="font-black text-sm text-[#1B1250]">{b.name} — "{b.title}"</h3>
                  <p className="text-xs font-semibold text-[#1B1250]/60 mt-0.5">
                    ₹{b.price_per_hour}/session · Status: {b.status} · City: {b.city || 'Dehradun'}
                  </p>
                </div>
                {b.status === 'active' && (
                  <button
                    onClick={() => handleSuspendBuddy(b.id)}
                    className="px-3 py-1 bg-[#FF5C8A] text-white border-2 border-[#1B1250] rounded-full text-xs font-black shadow-[1px_1px_0_#1B1250] flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Ban size={12} strokeWidth={2.5} /> Suspend
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {tab === 'reports' && (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] overflow-hidden p-4 sm:p-5">
          <h2 className="font-display font-black text-xl text-[#1B1250] mb-4">User Reports ({reports.length})</h2>
          {reports.length === 0 ? (
            <p className="text-xs font-bold text-[#1B1250]/60 text-center py-6">No reports submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {reports.map(r => (
                <div
                  key={r.id}
                  className="bg-white border-2.5 border-[#1B1250] rounded-[18px] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_3px_0_#1B1250]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs uppercase px-2 py-0.5 rounded-full bg-[#FFD41F] border border-[#1B1250]">
                        {r.report_type}
                      </span>
                      <span className="font-black text-xs text-[#E8622B]">Reason: {r.reason}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-[#1B1250] ${
                        r.status === 'pending' ? 'bg-[#FF5C8A] text-white' : 'bg-[#C5F030] text-[#1B1250]'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    {r.description && (
                      <p className="text-xs font-semibold text-[#1B1250]/80 mt-1 italic">"{r.description}"</p>
                    )}
                    <p className="text-[10px] font-bold text-[#1B1250]/50 mt-1">
                      Reported by: {r.reporter_name || r.reporter_email || 'User'} · Target ID: {r.target_id}
                    </p>
                  </div>
                  {r.status === 'pending' && (
                    <button
                      onClick={() => handleResolveReport(r.id)}
                      className="px-3.5 py-1.5 bg-[#C5F030] hover:bg-[#bcf01a] text-[#1B1250] border-2 border-[#1B1250] rounded-full text-xs font-black shadow-[1px_1px_0_#1B1250] shrink-0 cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
