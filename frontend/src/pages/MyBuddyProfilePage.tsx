import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { BuddyProfile } from '../types';
import { ArrowLeft, Edit2, Pause, Play, Trash2, Star, MapPin, CheckCircle, Eye } from 'lucide-react';

const BUDDY_TYPE_INFO: Record<string, { label: string; emoji: string; gradient: string }> = {
  boyfriend: { label: 'Boyfriend', emoji: '❤️', gradient: 'from-rose-500 to-pink-600' },
  girlfriend: { label: 'Girlfriend', emoji: '💕', gradient: 'from-fuchsia-500 to-purple-600' },
  buddy: { label: 'Buddy', emoji: '🧑‍🤝‍🧑', gradient: 'from-amber-500 to-orange-600' },
};

export default function MyBuddyProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<BuddyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api.get('/buddy/profile').then(res => {
      setProfile(res.data.profile);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const togglePause = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/buddy/profile/pause');
      setProfile(res.data.profile);
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  const removeProfile = async () => {
    if (!confirm('Remove your buddy profile? You can always become a buddy again later.')) return;
    setActionLoading(true);
    try {
      await api.delete('/buddy/profile');
      navigate('/buddy');
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-900" />
    </div>
  );

  if (!profile) return (
    <div className="text-center py-16 pb-24">
      <div className="w-20 h-20 bg-cream-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl">🧑‍🤝‍🧑</span>
      </div>
      <h2 className="font-display text-xl text-navy-900 mb-2">No buddy profile yet</h2>
      <p className="text-sm text-navy-400 mb-6">Become a buddy and let others find you</p>
      <Link
        to="/buddy/become"
        className="inline-flex items-center gap-2 bg-navy-900 text-cream-50 px-6 py-3 rounded-2xl font-medium hover:bg-navy-800 transition-all btn-press"
      >
        Become a Buddy
      </Link>
    </div>
  );

  const typeInfo = BUDDY_TYPE_INFO[profile.buddy_type] || BUDDY_TYPE_INFO.buddy;
  const isActive = profile.status === 'active';

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/buddy')} className="text-navy-400 hover:text-navy-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-2xl text-navy-900">My Buddy Profile</h1>
      </div>

      {/* Status Toggle */}
      <div className="bg-white rounded-2xl p-4 mb-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-sage-500' : 'bg-navy-300'}`} />
            <div>
              <p className="font-medium text-navy-900 text-sm">{isActive ? 'Visible to others' : 'Paused'}</p>
              <p className="text-xs text-navy-400">{isActive ? 'People can find and request you' : 'Hidden from new discovery'}</p>
            </div>
          </div>
          <button
            onClick={togglePause}
            disabled={actionLoading}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? 'bg-navy-100 text-navy-600 hover:bg-navy-200'
                : 'bg-sage-500 text-white hover:bg-sage-600'
            }`}
          >
            {isActive ? <><Pause size={14} className="inline mr-1" /> Pause</> : <><Play size={14} className="inline mr-1" /> Resume</>}
          </button>
        </div>
      </div>

      {/* Profile Preview Card */}
      <div className="bg-white rounded-3xl shadow-soft overflow-hidden mb-4">
        <div className={`bg-gradient-to-br ${typeInfo.gradient} p-6 text-center relative`}>
          <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
            <span className="text-xs font-medium text-white">{typeInfo.emoji} {typeInfo.label}</span>
          </div>
          {profile.image_urls?.[0] ? (
            <img src={profile.image_urls[0]} alt="Your buddy profile photo" className="w-20 h-20 rounded-2xl mx-auto mb-3 object-cover border-2 border-white/30" />
          ) : (
            <div className="w-20 h-20 bg-white/20 rounded-2xl mx-auto mb-3 flex items-center justify-center border-2 border-white/30">
              <span className="text-3xl font-bold text-white">{profile.name?.charAt(0) || '?'}</span>
            </div>
          )}
          <h2 className="font-display text-xl text-white">{profile.name}</h2>
          <p className="text-white/70 text-sm mt-1 flex items-center justify-center gap-1">
            <MapPin size={12} /> {profile.location_name || 'Dehradun'}
          </p>
        </div>

        <div className="p-5">
          <h3 className="font-semibold text-navy-900 mb-1">{profile.title}</h3>
          <p className="text-sm text-navy-500 italic mb-3">"{profile.description}"</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {profile.activities?.map(act => (
              <span key={act} className="px-2.5 py-1 bg-cream-100 rounded-full text-xs font-medium text-navy-600">{act}</span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs text-navy-400 mb-4">
            <span className="flex items-center gap-1">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              <span className="font-medium">{profile.avg_rating ? Number(profile.avg_rating).toFixed(1) : 'New'}</span>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle size={14} className="text-sage-500" />
              {profile.total_sessions} sessions
            </span>
          </div>

          <div className="flex items-center justify-between bg-cream-50 rounded-xl p-3">
            <div>
              <p className="text-lg font-bold text-navy-900">₹{profile.price_per_hour}</p>
              <p className="text-xs text-navy-400">/session {profile.negotiable ? '· Negotiable' : ''}</p>
            </div>
            <div className="text-right text-xs text-navy-500">
              <p>{profile.availability_days?.map(d => d.slice(0, 3)).join(', ')}</p>
              <p>{profile.availability_times}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link
          to="/buddy/become"
          className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-soft card-hover transition-all"
        >
          <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center">
            <Edit2 size={18} className="text-navy-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-navy-900 text-sm">Edit Profile</p>
            <p className="text-xs text-navy-400">Change bio, activities, pricing, availability</p>
          </div>
        </Link>

        <Link
          to="/buddy"
          className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-soft card-hover transition-all"
        >
          <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center">
            <Eye size={18} className="text-navy-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-navy-900 text-sm">View Public Profile</p>
            <p className="text-xs text-navy-400">See how others see your profile</p>
          </div>
        </Link>

        <button
          onClick={removeProfile}
          disabled={actionLoading}
          className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-soft card-hover transition-all text-left"
        >
          <div className="w-10 h-10 bg-coral-50 rounded-xl flex items-center justify-center">
            <Trash2 size={18} className="text-coral-600" />
          </div>
          <div>
            <p className="font-medium text-coral-600 text-sm">Remove Buddy Profile</p>
            <p className="text-xs text-navy-400">Stop being a buddy permanently</p>
          </div>
        </button>
      </div>
    </div>
  );
}
