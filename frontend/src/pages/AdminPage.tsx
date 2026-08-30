import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Users, Package, Users as BuddyIcon, MessageSquare, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';

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

type Tab = 'overview' | 'users' | 'listings' | 'buddies' | 'reports';

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<unknown[]>([]);
  const [listings, setListings] = useState<unknown[]>([]);
  const [reports, setReports] = useState<unknown[]>([]);

  useEffect(() => {
    api.get('/admin/stats').then(res => { setStats(res.data.stats); setLoading(false); });
  }, []);

  const fetchTab = async (t: Tab) => {
    setTab(t);
    if (t === 'users') { const r = await api.get('/admin/users'); setUsers(r.data.users || []); }
    if (t === 'listings') { const r = await api.get('/admin/listings'); setListings(r.data.listings || []); }
    if (t === 'reports') { const r = await api.get('/reports'); setReports(r.data.reports || []); }
  };

  const handleUserAction = async (userId: string, action: string) => {
    const reason = prompt(`Reason for ${action}:`);
    if (!reason) return;
    await api.put(`/admin/users/${userId}/status`, { status: action === 'ban' ? 'banned' : action === 'suspend' ? 'suspended' : 'active', reason });
    fetchTab('users');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['overview', 'users', 'listings', 'buddies', 'reports'] as Tab[]).map(t => (
          <button key={t} onClick={() => fetchTab(t)}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-colors ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-50 text-blue-600' },
              { label: 'Active Users', value: stats.activeUsers, icon: Users, color: 'bg-green-50 text-green-600' },
              { label: 'Listings', value: stats.totalListings, icon: Package, color: 'bg-purple-50 text-purple-600' },
              { label: 'Buddy Profiles', value: stats.buddyProfiles, icon: BuddyIcon, color: 'bg-pink-50 text-pink-600' },
              { label: 'Forum Posts', value: stats.forumPosts, icon: MessageSquare, color: 'bg-indigo-50 text-indigo-600' },
              { label: 'Pending Reports', value: stats.pendingReports, icon: AlertTriangle, color: 'bg-amber-50 text-amber-600' },
              { label: 'Completed Rentals', value: stats.completedRentals, icon: TrendingUp, color: 'bg-teal-50 text-teal-600' },
              { label: 'Commission', value: `₹${stats.totalCommission}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                  <item.icon size={20} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                <p className="text-sm text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(users as Array<Record<string, unknown>>).map(u => (
                <tr key={u.id as string} className="border-t border-slate-100">
                  <td className="px-4 py-3">{(u.name as string) || 'Unknown'}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email as string}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      u.status === 'active' ? 'bg-green-100 text-green-700' :
                      u.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{u.status as string}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.role as string}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => handleUserAction(u.id as string, 'suspend')}
                      className="text-yellow-600 hover:text-yellow-700 text-xs">Suspend</button>
                    <button onClick={() => handleUserAction(u.id as string, 'ban')}
                      className="text-red-600 hover:text-red-700 text-xs">Ban</button>
                    <button onClick={() => handleUserAction(u.id as string, 'restore')}
                      className="text-green-600 hover:text-green-700 text-xs">Restore</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {tab === 'listings' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Owner</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Price</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(listings as Array<Record<string, unknown>>).map(l => (
                <tr key={l.id as string} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{l.title as string}</td>
                  <td className="px-4 py-3 text-slate-500">{(l.owner_name as string) || 'Unknown'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      l.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>{l.status as string}</span>
                  </td>
                  <td className="px-4 py-3 text-right">₹{l.price_per_day as number}/day</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={async () => {
                      if (confirm('Remove this listing?')) {
                        await api.put(`/admin/listings/${l.id}/remove`, { reason: 'Removed by admin' });
                        fetchTab('listings');
                      }
                    }} className="text-red-600 hover:text-red-700 text-xs">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[450px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Reason</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(reports as Array<Record<string, unknown>>).map(r => (
                <tr key={r.id as string} className="border-t border-slate-100">
                  <td className="px-4 py-3">{r.report_type as string}</td>
                  <td className="px-4 py-3 text-slate-500">{r.reason as string}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      r.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      r.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{r.status as string}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'pending' && (
                      <button onClick={async () => {
                        const notes = prompt('Resolution notes:');
                        if (notes) {
                          await api.put(`/reports/${r.id}/resolve`, { adminNotes: notes, status: 'resolved' });
                          fetchTab('reports');
                        }
                      }} className="text-brand-600 hover:text-brand-700 text-xs">Resolve</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
