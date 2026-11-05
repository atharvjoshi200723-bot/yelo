import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { BuddyProfile } from '../types';
import { ArrowLeft, Edit2, Pause, Play, Trash2, Star, MapPin, CheckCircle, Eye, ChevronRight } from 'lucide-react';
import { Mascot, ChaiCupSticker, WavyHighlight } from '../components/neo/Decorations';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-[#1B1250]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pb-24 max-w-lg mx-auto px-4 pt-8">
        <div className="text-center py-14 bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[28px] shadow-neo-card p-8 -rotate-1">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <ChaiCupSticker size={32} />
            <Mascot size={52} mood="happy" waving />
          </div>
          <h2 className="font-display font-black text-2xl text-[#1B1250] mb-2">No buddy profile yet</h2>
          <p className="text-sm font-bold text-[#1B1250]/70 mb-6">Become a buddy and let others find you</p>
          <Link
            to="/buddy/become"
            className="inline-flex items-center gap-2 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full px-6 py-3 font-display font-black uppercase text-sm active:translate-x-[2px] active:translate-y-[3px] active:shadow-none transition-all"
          >
            Become a Buddy
          </Link>
        </div>
      </div>
    );
  }

  const isActive = profile.status === 'active';

  return (
    <div className="pb-28 max-w-lg mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/buddy')}
          className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo flex items-center justify-center text-[#1B1250] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex-shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <h1 className="font-display font-black text-2xl text-[#1B1250]">
          <WavyHighlight>My Buddy Profile</WavyHighlight>
        </h1>
      </div>

      {/* Status Toggle Card */}
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[22px] shadow-neo p-4 mb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-3.5 h-3.5 rounded-full border-2 border-[#1B1250] flex-shrink-0 ${isActive ? 'bg-[#3F8A12] animate-pulse' : 'bg-[#1B1250]/30'}`} />
            <div className="min-w-0">
              <p className="font-display font-black text-[#1B1250] text-sm truncate">{isActive ? 'Visible to others' : 'Paused'}</p>
              <p className="text-xs font-bold text-[#1B1250]/60 truncate">{isActive ? 'People can find and request you' : 'Hidden from new discovery'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={togglePause}
            disabled={actionLoading}
            className={`px-4 py-2 rounded-full border-2.5 border-[#1B1250] font-display font-black text-xs uppercase shadow-[2px_2px_0_#1B1250] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5 flex-shrink-0 ${
              isActive
                ? 'bg-[#FFD41F] text-[#1B1250]'
                : 'bg-[#C5F030] text-[#1B1250]'
            }`}
          >
            {isActive ? <><Pause size={13} strokeWidth={3} /> Pause</> : <><Play size={13} strokeWidth={3} /> Resume</>}
          </button>
        </div>
      </div>

      {/* Profile Preview Sticker Card */}
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[28px] shadow-neo-card overflow-hidden mb-6 -rotate-0.5">
        <div className="bg-gradient-to-r from-[#9A63E6] via-[#B79BF0] to-[#E8622B] p-6 text-center border-b-3 border-[#1B1250] relative">
          <div className="absolute top-3 left-3 bg-[#F6FBD4] text-[#1B1250] border-2 border-[#1B1250] rounded-full px-3 py-0.5 shadow-sm">
            <span className="text-[11px] font-black uppercase">🧑‍🤝‍🧑 Buddy</span>
          </div>
          {profile.image_urls?.[0] ? (
            <img src={profile.image_urls[0]} alt="Your buddy profile" className="w-22 h-22 rounded-full mx-auto mb-3 object-cover border-3 border-[#1B1250] shadow-neo" />
          ) : (
            <div className="w-22 h-22 bg-[#FFD41F] rounded-full mx-auto mb-3 flex items-center justify-center border-3 border-[#1B1250] shadow-neo">
              <span className="text-3xl font-black font-display text-[#1B1250]">{profile.name?.charAt(0) || '?'}</span>
            </div>
          )}
          <h2 className="font-display font-black text-2xl text-white drop-shadow-[2px_2px_0_#1B1250]">{profile.name}</h2>
          <p className="text-white text-xs font-black mt-1 flex items-center justify-center gap-1 drop-shadow-[1px_1px_0_#1B1250]">
            <MapPin size={12} strokeWidth={2.5} /> {profile.location_name || 'Dehradun'}
          </p>
        </div>

        <div className="p-5">
          <h3 className="font-display font-black text-lg text-[#1B1250] mb-1">{profile.title}</h3>
          <p className="text-sm font-semibold text-[#1B1250]/80 italic mb-4 bg-white/70 p-3 rounded-[16px] border-2 border-[#1B1250]/20">"{profile.description}"</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {profile.activities?.map(act => (
              <span key={act} className="px-3 py-1 bg-[#C5F030] text-[#1B1250] border-2 border-[#1B1250] rounded-full text-xs font-black shadow-sm">{act}</span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs font-black text-[#1B1250] mb-4">
            <span className="flex items-center gap-1">
              <Star size={14} className="text-[#FFD41F] fill-[#FFD41F]" />
              <span>{profile.avg_rating ? Number(profile.avg_rating).toFixed(1) : 'New'}</span>
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle size={14} className="text-[#3F8A12]" />
              {profile.total_sessions} sessions
            </span>
          </div>

          <div className="flex items-center justify-between bg-white/80 border-2 border-[#1B1250]/30 rounded-[18px] p-3.5">
            <div>
              <p className="text-2xl font-display font-black text-[#1B1250]">₹{profile.price_per_hour}</p>
              <p className="text-xs font-bold text-[#1B1250]/60">/session {profile.negotiable ? '· Negotiable' : ''}</p>
            </div>
            <div className="text-right text-xs font-black text-[#1B1250]">
              <p className="uppercase">{profile.availability_days?.map(d => d.slice(0, 3)).join(', ')}</p>
              <p className="text-[#1B1250]/60 font-bold">{profile.availability_times}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Menu Rows */}
      <div className="space-y-3">
        <Link
          to="/buddy/become"
          className="flex items-center gap-3.5 bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[22px] p-4 shadow-neo hover:bg-white active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <div className="w-10 h-10 bg-[#FFD41F] border-2 border-[#1B1250] rounded-full flex items-center justify-center flex-shrink-0 text-[#1B1250]">
            <Edit2 size={16} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-black text-sm text-[#1B1250]">Edit Profile</p>
            <p className="text-xs font-bold text-[#1B1250]/60 truncate">Change bio, activities, pricing, availability</p>
          </div>
          <ChevronRight size={18} strokeWidth={3} className="text-[#1B1250]/50" />
        </Link>

        <Link
          to="/buddy"
          className="flex items-center gap-3.5 bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[22px] p-4 shadow-neo hover:bg-white active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <div className="w-10 h-10 bg-[#2FA3B5] border-2 border-[#1B1250] rounded-full flex items-center justify-center flex-shrink-0 text-white">
            <Eye size={16} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-black text-sm text-[#1B1250]">View Public Profile</p>
            <p className="text-xs font-bold text-[#1B1250]/60 truncate">See how others see your profile</p>
          </div>
          <ChevronRight size={18} strokeWidth={3} className="text-[#1B1250]/50" />
        </Link>

        <button
          type="button"
          onClick={removeProfile}
          disabled={actionLoading}
          className="w-full flex items-center gap-3.5 bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[22px] p-4 shadow-neo hover:bg-[#E8622B]/10 active:translate-x-0.5 active:translate-y-0.5 transition-all text-left"
        >
          <div className="w-10 h-10 bg-[#E8622B] border-2 border-[#1B1250] rounded-full flex items-center justify-center flex-shrink-0 text-white">
            <Trash2 size={16} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-black text-sm text-[#E8622B]">Remove Buddy Profile</p>
            <p className="text-xs font-bold text-[#1B1250]/60 truncate">Stop being a buddy permanently</p>
          </div>
          <ChevronRight size={18} strokeWidth={3} className="text-[#E8622B]/50" />
        </button>
      </div>
    </div>
  );
}
