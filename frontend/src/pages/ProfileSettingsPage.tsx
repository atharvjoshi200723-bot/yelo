import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { User, BuddyProfile } from '../types';
import { ArrowLeft, User as UserIcon, Shield, MapPin, GraduationCap, Edit2, Upload, Check, Mail, Phone, LogOut, ChevronRight, BookOpen, Package, FileText, UserPlus, Trash2, AlertTriangle, X } from 'lucide-react';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete('/users/me');
      logout();
      navigate('/login');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setDeleteError(apiErr.response?.data?.error || 'Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

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
    <div className="pb-24 max-w-lg mx-auto px-4 pt-6">
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] p-8 flex flex-col items-center gap-4">
        <div className="animate-spin w-10 h-10 rounded-full border-4 border-[#1B1250] border-t-[#C5F030]" />
        <p className="font-black text-sm text-[#1B1250]/60 uppercase tracking-widest">Loading…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="pb-24 max-w-lg mx-auto px-4 pt-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] flex items-center justify-center active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all"
        >
          <ArrowLeft size={18} className="text-[#1B1250]" />
        </button>
        <h1 className="font-display font-black text-2xl text-[#1B1250]">Settings</h1>
      </div>
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] p-10 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="font-display font-black text-xl text-[#1B1250] mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase px-6 py-3 active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  if (!profile) return null;

  return (
    <div className="pb-24 max-w-lg mx-auto px-4 pt-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] flex items-center justify-center active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all"
        >
          <ArrowLeft size={18} className="text-[#1B1250]" />
        </button>
        <h1 className="font-display font-black text-2xl text-[#1B1250]">Settings</h1>
      </div>

      {/* ── Profile Card ── */}
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] p-6">

        {/* Avatar + Name row */}
        <div className="flex items-center gap-4">
          {/* Avatar upload */}
          <label className="relative cursor-pointer shrink-0">
            <div className="w-24 h-24 rounded-full border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] ring-4 ring-[#9A63E6] overflow-hidden bg-[#EAE4FB] flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Your avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display font-black text-3xl text-[#9A63E6]">{profile.name?.charAt(0) || '?'}</span>
              )}
            </div>
            {/* Upload overlay button */}
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#C5F030] border-3 border-[#1B1250] rounded-full flex items-center justify-center shadow-[2px_2px_0_#1B1250]">
              {uploading ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-[#1B1250]" />
              ) : (
                <Upload size={13} className="text-[#1B1250]" />
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>

          {/* Name + email */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-black text-xl text-[#1B1250]">{profile.name}</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] shadow-[2px_3px_0_#1B1250] rounded-full font-black uppercase text-xs px-3 py-1.5 hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                >
                  <Edit2 size={11} />
                  Edit
                </button>
              )}
            </div>
            <p className="text-sm font-bold text-[#1B1250]/60 mt-0.5">{profile.email}</p>
            {profile.college && (
              <p className="text-xs font-black text-[#1B1250]/50 uppercase tracking-wide mt-1">{profile.college}</p>
            )}
          </div>
        </div>

        {/* ── Edit Form ── */}
        {editing && (
          <div className="mt-5 bg-[#EAE4FB] border-3 border-[#1B1250] rounded-[20px] p-5 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-black text-[#1B1250] uppercase tracking-widest mb-1.5">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none"
              />
            </div>
            {/* Bio */}
            <div>
              <label className="block text-xs font-black text-[#1B1250] uppercase tracking-widest mb-1.5">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none resize-none"
                rows={3}
                placeholder="Tell people about yourself"
                maxLength={500}
              />
            </div>
            {/* City + College */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-[#1B1250] uppercase tracking-widest mb-1.5">City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                  className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[#1B1250] uppercase tracking-widest mb-1.5">College</label>
                <input
                  type="text"
                  value={editForm.college}
                  onChange={e => setEditForm({ ...editForm, college: e.target.value })}
                  className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none"
                />
              </div>
            </div>
            {/* Save / Cancel */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-full font-black uppercase text-sm px-4 py-3 active:translate-x-[2px] active:translate-y-[3px] active:shadow-none transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex-1 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase text-sm px-4 py-3 flex items-center justify-center gap-2 active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1B1250]" />
                ) : (
                  <><Check size={15} /> Save</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Verification Card ── */}
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] p-5">
        <h3 className="font-display font-black text-xs text-[#1B1250] uppercase tracking-widest flex items-center gap-2 mb-4">
          <Shield size={13} className="text-[#9A63E6]" /> Verification
        </h3>
        <div className="space-y-3">
          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#2FA3B5] border-2 border-[#1B1250] flex items-center justify-center">
                <Mail size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-[#1B1250]">Email</p>
                <p className="text-xs font-bold text-[#1B1250]/50">{profile.email}</p>
              </div>
            </div>
            {profile.email_verified ? (
              <span className="inline-flex items-center gap-1 bg-[#C5F030] text-[#1B1250] border-2 border-[#1B1250] rounded-full px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_#1B1250]">
                <Check size={11} /> Verified
              </span>
            ) : (
              <button className="bg-[#FFD41F] text-[#1B1250] border-2 border-[#1B1250] rounded-full px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_#1B1250] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
                Verify
              </button>
            )}
          </div>
          {/* Phone */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#E8622B] border-2 border-[#1B1250] flex items-center justify-center">
                <Phone size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-[#1B1250]">Phone</p>
                <p className="text-xs font-bold text-[#1B1250]/50">{profile.phone || 'Not added'}</p>
              </div>
            </div>
            {profile.phone_verified ? (
              <span className="inline-flex items-center gap-1 bg-[#C5F030] text-[#1B1250] border-2 border-[#1B1250] rounded-full px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_#1B1250]">
                <Check size={11} /> Verified
              </span>
            ) : (
              <button className="bg-[#FFD41F] text-[#1B1250] border-2 border-[#1B1250] rounded-full px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0_#1B1250] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
                Verify
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Buddy Section ── */}
      {buddyProfile ? (
        <div className="bg-[#2FA3B5] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] p-5">
          <h3 className="font-display font-black text-xs text-white uppercase tracking-widest mb-3">Buddy</h3>
          <Link
            to="/buddy/manage"
            className="flex items-center justify-between bg-white/20 border-2 border-white/40 rounded-[20px] px-4 py-3.5 hover:bg-white/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border-2 border-[#1B1250] flex items-center justify-center">
                <span className="text-base">🧑‍🤝‍🧑</span>
              </div>
              <div>
                <p className="text-sm font-black text-white">My Buddy Profile</p>
                <p className="text-xs font-bold text-white/70">{buddyProfile.status === 'active' ? '🟢 Active' : '⚪ Paused'}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/70" />
          </Link>
        </div>
      ) : null}

      {/* ── Settings Menu Rows ── */}
      <div className="space-y-3">
        {/* Manage Buddy Profile */}
        <Link
          to="/buddy/manage"
          className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[2px_3px_0_#1B1250] rounded-full px-5 py-3.5 flex items-center gap-3 hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-[#C5F030] border-2 border-[#1B1250] flex items-center justify-center shrink-0">
            <UserPlus size={16} className="text-[#1B1250]" />
          </div>
          <span className="flex-1 text-sm font-black text-[#1B1250]">Manage Buddy Profile</span>
          <ChevronRight size={18} className="text-[#1B1250]/60" />
        </Link>

        {/* Privacy & Safety */}
        <Link
          to="/privacy"
          className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[2px_3px_0_#1B1250] rounded-full px-5 py-3.5 flex items-center gap-3 hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-[#9A63E6] border-2 border-[#1B1250] flex items-center justify-center shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <span className="flex-1 text-sm font-black text-[#1B1250]">Privacy &amp; Safety</span>
          <ChevronRight size={18} className="text-[#1B1250]/60" />
        </Link>

        {/* Community Guidelines */}
        <Link
          to="/community-guidelines"
          className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[2px_3px_0_#1B1250] rounded-full px-5 py-3.5 flex items-center gap-3 hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-[#2FA3B5] border-2 border-[#1B1250] flex items-center justify-center shrink-0">
            <BookOpen size={16} className="text-white" />
          </div>
          <span className="flex-1 text-sm font-black text-[#1B1250]">Community Guidelines</span>
          <ChevronRight size={18} className="text-[#1B1250]/60" />
        </Link>

        {/* Rental Guidelines */}
        <Link
          to="/rental-guidelines"
          className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[2px_3px_0_#1B1250] rounded-full px-5 py-3.5 flex items-center gap-3 hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-[#FFD41F] border-2 border-[#1B1250] flex items-center justify-center shrink-0">
            <Package size={16} className="text-[#1B1250]" />
          </div>
          <span className="flex-1 text-sm font-black text-[#1B1250]">Rental Guidelines</span>
          <ChevronRight size={18} className="text-[#1B1250]/60" />
        </Link>

        {/* Terms of Service */}
        <Link
          to="/terms"
          className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[2px_3px_0_#1B1250] rounded-full px-5 py-3.5 flex items-center gap-3 hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-[#E8622B] border-2 border-[#1B1250] flex items-center justify-center shrink-0">
            <FileText size={16} className="text-white" />
          </div>
          <span className="flex-1 text-sm font-black text-[#1B1250]">Terms of Service</span>
          <ChevronRight size={18} className="text-[#1B1250]/60" />
        </Link>
      </div>

      {/* ── Logout & Delete Account ── */}
      <div className="space-y-3 pt-2">
        <button
          onClick={handleLogout}
          className="bg-[#1B1250] text-[#F6FBD4] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase px-6 py-3.5 w-full flex items-center justify-center gap-2 active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
        >
          <LogOut size={18} />
          Sign Out
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="bg-white hover:bg-red-50 text-[#E8622B] border-3 border-[#E8622B] shadow-[3px_4px_0_#1B1250] rounded-full font-display font-black uppercase px-6 py-3 w-full flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[3px] active:shadow-none transition-all text-xs tracking-wider cursor-pointer"
        >
          <Trash2 size={16} />
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B1250]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[28px] shadow-[6px_8px_0_#1B1250] p-6 max-w-sm w-full relative">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteError(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={16} strokeWidth={3} />
            </button>

            <div className="w-12 h-12 rounded-full bg-[#E8622B]/20 border-2.5 border-[#E8622B] flex items-center justify-center text-[#E8622B] mb-3">
              <AlertTriangle size={24} strokeWidth={2.5} />
            </div>

            <h3 className="font-display font-black text-xl text-[#1B1250] mb-1">Delete Account?</h3>
            <p className="text-xs font-bold text-[#1B1250]/70 mb-5 leading-relaxed">
              Are you sure? This will permanently delete your account, rentals, linkups, and profile. <strong className="text-[#E8622B]">This action cannot be undone.</strong>
            </p>

            {deleteError && (
              <div className="mb-4 bg-[#E8622B] text-white border-2 border-[#1B1250] rounded-[16px] px-3.5 py-2 text-xs font-black shadow-[2px_2px_0_#1B1250]">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="flex-1 bg-white hover:bg-gray-100 text-[#1B1250] border-3 border-[#1B1250] shadow-[3px_3px_0_#1B1250] rounded-full py-2.5 text-xs font-black uppercase transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-[#E8622B] hover:bg-[#d45320] text-white border-3 border-[#1B1250] shadow-[3px_3px_0_#1B1250] rounded-full py-2.5 text-xs font-black uppercase transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
