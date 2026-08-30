import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { User, BuddyProfile } from '../types';
import { ArrowLeft, User as UserIcon, Shield, MapPin, GraduationCap, Edit2, Upload, Check, Mail, Phone, LogOut, ChevronRight } from 'lucide-react';

export default function ProfileSettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [buddyProfile, setBuddyProfile] = useState<BuddyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    city: '',
    college: '',
  });

  useEffect(() => {
    Promise.all([
      api.get('/users/me'),
      api.get('/buddy/profile').catch(() => ({ data: { profile: null } })),
    ]).then(([profileRes, buddyRes]) => {
      setProfile(profileRes.data.profile);
      const p = profileRes.data.profile;
      setEditForm({ name: p.name || '', bio: p.bio || '', city: p.city || '', college: p.college || '' });
      setBuddyProfile(buddyRes.data.profile);
      setLoading(false);
    }).catch((err: unknown) => {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Failed to load profile');
      setLoading(false);
    });
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.put('/users/me', editForm);
      setProfile(res.data.profile);
      setEditing(false);
      refreshUser();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      alert(apiErr.response?.data?.error || 'Failed to save profile');
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(prev => prev ? { ...prev, avatar_url: res.data.imageUrl } : prev);
      refreshUser();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      alert(apiErr.response?.data?.error || 'Failed to upload avatar');
    }
    setUploading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-6 h-6 skeleton rounded" />
        <div className="w-40 h-6 skeleton rounded" />
      </div>
      <div className="bg-white rounded-3xl shadow-soft overflow-hidden mb-6">
        <div className="h-24 skeleton" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-md border-4 border-white skeleton" />
            <div className="flex-1 pb-1 space-y-2">
              <div className="w-32 h-5 skeleton" />
              <div className="w-40 h-4 skeleton" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-navy-400 hover:text-navy-600">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-2xl text-navy-900">Profile Settings</h1>
      </div>
      <div className="text-center py-16">
        <p className="text-navy-400 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-navy-900 text-cream-50 rounded-xl font-medium hover:bg-navy-800 transition-all btn-press">
          Try again
        </button>
      </div>
    </div>
  );

  if (!profile) return null;

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-navy-400 hover:text-navy-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-2xl text-navy-900">Profile Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl shadow-soft overflow-hidden mb-6">
        {/* Avatar */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-24" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10">
            <label className="relative cursor-pointer">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center border-4 border-white overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Your avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-amber-600">{profile.name?.charAt(0) || '?'}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-navy-900 rounded-full flex items-center justify-center">
                {uploading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                ) : (
                  <Upload size={12} className="text-white" />
                )}
              </div>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-navy-900">{profile.name}</h2>
                <button onClick={() => setEditing(!editing)} className="text-navy-300 hover:text-navy-600 transition-colors">
                  <Edit2 size={16} />
                </button>
              </div>
              <p className="text-sm text-navy-400">{profile.email}</p>
            </div>
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="mt-4 space-y-3 p-4 bg-cream-50 rounded-2xl">
              <div>
                <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-1">Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-navy-100/30 rounded-xl text-sm text-navy-800 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-1">Bio</label>
                <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-4 py-2.5 border border-navy-100/30 rounded-xl text-sm text-navy-800 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
                  rows={3} placeholder="Tell people about yourself" maxLength={500} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-1">City</label>
                  <input type="text" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-4 py-2.5 border border-navy-100/30 rounded-xl text-sm text-navy-800 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-1">College</label>
                  <input type="text" value={editForm.college} onChange={e => setEditForm({ ...editForm, college: e.target.value })}
                    className="w-full px-4 py-2.5 border border-navy-100/30 rounded-xl text-sm text-navy-800 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)}
                  className="px-4 py-2 text-navy-500 border border-navy-100/30 rounded-xl text-sm hover:bg-navy-50 transition-colors">
                  Cancel
                </button>
                <button onClick={saveProfile} disabled={saving}
                  className="px-4 py-2 bg-navy-900 text-cream-50 rounded-xl text-sm hover:bg-navy-800 flex items-center gap-1 disabled:opacity-50 transition-all btn-press">
                  {saving ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cream-50" /> : <><Check size={14} /> Save</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification */}
      <div className="bg-white rounded-2xl shadow-soft p-5 mb-4">
        <h3 className="text-xs font-semibold text-navy-500 tracking-wider uppercase mb-4 flex items-center gap-2">
          <Shield size={14} /> Verification
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-navy-400" />
              <div>
                <p className="text-sm font-medium text-navy-800">Email</p>
                <p className="text-xs text-navy-400">{profile.email}</p>
              </div>
            </div>
            {profile.email_verified ? (
              <span className="flex items-center gap-1 text-sage-600 text-xs font-medium">
                <Check size={14} /> Verified
              </span>
            ) : (
              <button className="px-3 py-1.5 bg-amber-500/10 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors">
                Verify
              </button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-navy-400" />
              <div>
                <p className="text-sm font-medium text-navy-800">Phone</p>
                <p className="text-xs text-navy-400">{profile.phone || 'Not added'}</p>
              </div>
            </div>
            {profile.phone_verified ? (
              <span className="flex items-center gap-1 text-sage-600 text-xs font-medium">
                <Check size={14} /> Verified
              </span>
            ) : (
              <button className="px-3 py-1.5 bg-amber-500/10 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors">
                Verify
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Buddy Section */}
      <div className="bg-white rounded-2xl shadow-soft p-5 mb-4">
        <h3 className="text-xs font-semibold text-navy-500 tracking-wider uppercase mb-4">Buddy</h3>
        {buddyProfile ? (
          <Link to="/buddy/manage" className="flex items-center justify-between p-3 bg-cream-50 rounded-xl hover:bg-cream-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                buddyProfile.buddy_type === 'boyfriend' ? 'bg-rose-100' :
                buddyProfile.buddy_type === 'girlfriend' ? 'bg-fuchsia-100' : 'bg-amber-100'
              }`}>
                <span className="text-lg">{buddyProfile.buddy_type === 'boyfriend' ? '❤️' : buddyProfile.buddy_type === 'girlfriend' ? '💕' : '🧑‍🤝‍🧑'}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-navy-800">My Buddy Profile</p>
                <p className="text-xs text-navy-400">{buddyProfile.status === 'active' ? '🟢 Active' : '⚪ Paused'}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-navy-300" />
          </Link>
        ) : (
          <Link to="/buddy/become" className="flex items-center justify-center gap-2 p-4 bg-cream-50 rounded-xl border-2 border-dashed border-navy-200 hover:border-amber-400 transition-colors">
            <span className="text-sm font-medium text-navy-600">Become a Buddy</span>
            <ChevronRight size={16} className="text-navy-400" />
          </Link>
        )}
      </div>

      {/* Account */}
      <div className="bg-white rounded-2xl shadow-soft p-5 mb-4">
        <h3 className="text-xs font-semibold text-navy-500 tracking-wider uppercase mb-4">Account</h3>
        <div className="space-y-2">
          {profile.city && (
            <div className="flex items-center gap-3 p-3 rounded-xl">
              <MapPin size={16} className="text-navy-400" />
              <div>
                <p className="text-sm font-medium text-navy-800">{profile.city}</p>
                <p className="text-xs text-navy-400">City</p>
              </div>
            </div>
          )}
          {profile.college && (
            <div className="flex items-center gap-3 p-3 rounded-xl">
              <GraduationCap size={16} className="text-navy-400" />
              <div>
                <p className="text-sm font-medium text-navy-800">{profile.college}</p>
                <p className="text-xs text-navy-400">College</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legal Links */}
      <div className="bg-white rounded-2xl shadow-soft p-5 mb-4">
        <h3 className="text-xs font-semibold text-navy-500 tracking-wider uppercase mb-4">Legal</h3>
        <div className="space-y-1">
          <Link to="/privacy" className="flex items-center justify-between p-3 rounded-xl hover:bg-cream-50 transition-colors">
            <span className="text-sm text-navy-700">Privacy Policy</span>
            <ChevronRight size={16} className="text-navy-300" />
          </Link>
          <Link to="/terms" className="flex items-center justify-between p-3 rounded-xl hover:bg-cream-50 transition-colors">
            <span className="text-sm text-navy-700">Terms of Service</span>
            <ChevronRight size={16} className="text-navy-300" />
          </Link>
          <Link to="/community-guidelines" className="flex items-center justify-between p-3 rounded-xl hover:bg-cream-50 transition-colors">
            <span className="text-sm text-navy-700">Community Guidelines</span>
            <ChevronRight size={16} className="text-navy-300" />
          </Link>
          <Link to="/rental-guidelines" className="flex items-center justify-between p-3 rounded-xl hover:bg-cream-50 transition-colors">
            <span className="text-sm text-navy-700">Rental Guidelines</span>
            <ChevronRight size={16} className="text-navy-300" />
          </Link>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-4 bg-coral-50 text-coral-600 rounded-2xl font-medium hover:bg-coral-100 transition-colors"
      >
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  );
}
