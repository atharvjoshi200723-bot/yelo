import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { BuddyProfile, BuddyRequest } from '../types';
import { MapPin, Star, ArrowLeft, MessageCircle, Shield, CheckCircle, Clock, Heart, Calendar, Send, Flag, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/moderation/ReportModal';
import BlockButton from '../components/moderation/BlockButton';

const REQUEST_ACTIVITIES = [
  { name: 'Coffee', emoji: '☕' },
  { name: 'Movie', emoji: '🎬' },
  { name: 'Walk', emoji: '🚶' },
  { name: 'Event', emoji: '🎓' },
  { name: 'Explore', emoji: '🌄' },
  { name: 'Date', emoji: '❤️' },
];

const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function BuddyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [buddy, setBuddy] = useState<BuddyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestState, setRequestState] = useState<BuddyRequest | null>(null);
  const [requestForm, setRequestForm] = useState({
    activity: 'Coffee',
    message: '',
    proposedDate: new Date().toISOString().slice(0, 10),
    proposedTime: '17:00',
    proposedDurationHours: '2',
    proposedLocation: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/buddy/${id}`).then(res => {
      const b = res.data.buddy;
      setBuddy(b);
      if (b?.activities?.length) {
        setRequestForm(prev => ({ ...prev, activity: prev.activity || b.activities[0] }));
      }
      setLoading(false);
      if (searchParams.get('action') === 'request') {
        setShowRequestForm(true);
      }
    }).catch(() => navigate('/buddy'));
  }, [id, searchParams]);

  // Check request status + conversation for this buddy profile
  useEffect(() => {
    if (!buddy?.id || !user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        // Find an existing request from the current user to this buddy profile
        const statusRes = await api.get(`/buddy/${buddy.id}/request-status`, { params: { requesterId: user.id } });
        const existingRequest = statusRes.data.request || null;
        if (cancelled) return;          if (existingRequest) {
          setRequestState((prev: BuddyRequest | null) => {
            if (prev?.id !== existingRequest.id) return { ...prev, ...existingRequest, fromCache: false };
            return prev;
          });

          // If accepted, look up the conversation
          if (existingRequest.status === 'accepted' && existingRequest.conversation_id) {
            setConversationId(existingRequest.conversation_id);
          }
        } else {
          // No request yet; check whether a conversation exists directly
          try {
            const convRes = await api.get(`/messages/find?userId=${buddy.user_id}&type=buddy`);
            if (convRes.data.conversationId && !cancelled) {
              setConversationId(convRes.data.conversationId);
            }
          } catch {
            // Conversation may not exist yet
          }
        }
      } catch {
        // Ignore request-status fetch failures
      }
    })();
    return () => { cancelled = true; };
  }, [buddy?.id, buddy?.user_id, user?.id]);  const handleRequest = async () => {
    if (!id) return;
    if (!requestForm.activity) {
      setRequestError('Please choose an activity.');
      return;
    }
    if (!requestForm.proposedDate) {
      setRequestError('Please select a date.');
      return;
    }
    setRequestError(null);
    setSubmitting(true);
    try {
      const res = await api.post(`/buddy/${id}/requests`, {
        activity: requestForm.activity,
        message: requestForm.message || undefined,
        proposedDate: requestForm.proposedDate,
        proposedTime: requestForm.proposedTime,
        proposedDurationHours: parseFloat(requestForm.proposedDurationHours),
        proposedLocation: requestForm.proposedLocation || undefined,
      });
      setRequestState(res.data.request || null);
      setShowRequestForm(false);
      setRequestError(null);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string; fields?: Record<string, string> } } };
      const fields = apiErr.response?.data?.fields;
      if (fields) {
        const msgs = Object.entries(fields).map(([f, m]) => `${f}: ${m}`).join('\n');
        setRequestError(msgs);
      } else {
        setRequestError(apiErr.response?.data?.error || 'Failed to send request. Please try again.');
      }
    }
    setSubmitting(false);
  };

  const openChat = () => {
    if (conversationId) {
      navigate(`/messages?conv=${conversationId}`);
    } else {
      alert('Chat is not available yet. The buddy provider needs to accept your request first.');
    }
  };

  if (loading) return (
    <div className="pb-24 px-1 animate-pulse space-y-4">
      <div className="w-10 h-10 rounded-full bg-[#1B1250]/10 border-2 border-dashed border-[#1B1250]/30" />
      <div className="h-72 rounded-[28px] border-2 border-dashed border-[#1B1250]/30 bg-[#F6FBD4]/60" />
      <div className="h-32 rounded-[22px] border-2 border-dashed border-[#1B1250]/30 bg-[#F6FBD4]/60" />
      <div className="h-14 rounded-full border-2 border-dashed border-[#1B1250]/30 bg-[#F6FBD4]/60" />
    </div>
  );

  if (!buddy) return null;

  const age = buddy.date_of_birth
    ? Math.floor((Date.now() - new Date(buddy.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="pb-28 px-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo flex items-center justify-center active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all"
          aria-label="Go back"
        >
          <ArrowLeft size={18} className="text-[#1B1250]" />
        </button>
        <span className="text-xs font-bold text-[#1B1250]/50 uppercase tracking-widest">Buddy Profile</span>
      </div>

      {/* Hero Card */}
      <div className="relative bg-[#F6FBD4] rounded-[28px] border-3 border-[#1B1250] shadow-neo-card mb-5 overflow-visible">
        {/* Buddy type badge — rotated top-right */}
        <div className="absolute -top-3 right-5 z-10 bg-[#9A63E6] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border-2 border-[#1B1250] rotate-2 shadow-neo-sm">
          🧑‍🤝‍🧑 Buddy
        </div>

        <div className="p-6 pt-8">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-5">
            <div className="w-28 h-28 rounded-[22px] border-3 border-[#1B1250] bg-[#9A63E6] flex items-center justify-center shadow-neo mb-4 overflow-hidden">
              <span className="font-display font-black text-5xl text-white">{buddy.name?.charAt(0)}</span>
            </div>
            <h1 className="font-display font-black text-2xl text-[#1B1250]">{buddy.name}{age ? ` · ${age}` : ''}</h1>
            {buddy.description && (
              <p className="italic font-semibold text-[#1B1250]/80 text-sm mt-1 text-center max-w-xs">"{buddy.description}"</p>
            )}
          </div>

          {/* Price stat */}
          <div className="flex items-baseline justify-center gap-1 mb-4">
            <span className="font-bold text-[#1B1250] text-lg">₹</span>
            <span className="font-display font-black text-5xl text-[#1B1250]">{buddy.price_per_hour}</span>
            <span className="font-bold text-[#1B1250]/60 text-sm">/session</span>
          </div>

          {/* Rating + sessions */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <Star
                  key={s}
                  size={14}
                  className={Number(buddy.avg_rating) >= s ? 'text-[#FFD41F] fill-[#FFD41F]' : 'text-[#1B1250]/20'}
                />
              ))}
              <span className="font-black text-[#1B1250] text-sm ml-1">
                {buddy.avg_rating ? Number(buddy.avg_rating).toFixed(1) : 'New'}
              </span>
            </div>
            <span className="text-[#1B1250]/30 font-bold">·</span>
            <span className="font-bold text-sm text-[#1B1250]">{buddy.total_sessions} sessions</span>
          </div>

          {/* Location pill */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-1.5 bg-[#2FA3B5] text-white text-xs font-black px-3 py-1.5 rounded-full border-2 border-[#1B1250] shadow-neo-sm">
              <MapPin size={12} /> {buddy.location_name || 'Dehradun'}
            </span>
          </div>

          {/* Activities */}
          {buddy.activities && buddy.activities.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#1B1250]/50 mb-2 text-center">Available for</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {buddy.activities.map(act => (
                  <span key={act} className="px-3 py-1 bg-[#C5F030] text-[#1B1250] text-xs font-black rounded-full border-2 border-[#1B1250] shadow-neo-sm">
                    {act}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Availability days */}
          {buddy.availability_days && buddy.availability_days.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#1B1250]/50 mb-2 text-center">Availability</p>
              <div className="flex gap-1.5 justify-center flex-wrap">
                {ALL_DAYS.map(day => {
                  const active = buddy.availability_days!.some(d => d.toLowerCase().startsWith(day.slice(0,3)));
                  return (
                    <span
                      key={day}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border-2 border-[#1B1250] ${active ? 'bg-[#C5F030] text-[#1B1250]' : 'bg-[#F6FBD4] text-[#1B1250]/40'}`}
                    >
                      {day.slice(0,3)}
                    </span>
                  );
                })}
              </div>
              {buddy.availability_times && (
                <p className="text-xs font-semibold text-[#1B1250]/60 text-center mt-2">{buddy.availability_times}</p>
              )}
            </div>
          )}

          {/* Negotiable badge */}
          {buddy.negotiable && (
            <div className="flex justify-center mb-2">
              <span className="px-3 py-1 bg-[#3F8A12] text-white text-xs font-black rounded-full border-2 border-[#1B1250] shadow-neo-sm">
                ✓ Negotiable
              </span>
            </div>
          )}

          {/* Safety Notice */}
          <div className="mt-5 bg-[#EAE4FB] rounded-[16px] border-2 border-[#1B1250]/20 p-3 flex items-start gap-2">
            <Shield size={14} className="text-[#9A63E6] mt-0.5 shrink-0" />
            <p className="text-[11px] font-bold text-[#1B1250]/70 leading-relaxed">
              18+ only · Meet in public · Social companionship only · No sexual services
            </p>
          </div>

          {/* In-Card Send Request Action Button */}
          {user?.id !== buddy.user_id && !requestState && (
            <div className="mt-5 pt-4 border-t-2.5 border-[#1B1250]/15">
              <button
                type="button"
                onClick={() => setShowRequestForm(true)}
                className="w-full py-4 bg-[#C5F030] hover:bg-[#bcf01a] text-[#1B1250] border-3 border-[#1B1250] rounded-full font-display font-black uppercase text-base shadow-[4px_5px_0_#1B1250] active:translate-x-[2px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={18} strokeWidth={2.5} />
                <span>Send Request to {buddy.name}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Own profile notice */}
      {user?.id === buddy.user_id && (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[22px] shadow-neo p-4 mb-5 flex items-center justify-between">
          <span className="font-black text-[#1B1250] text-sm">This is your profile</span>
          <button
            onClick={() => navigate('/buddy/edit')}
            className="px-4 py-2 bg-[#C5F030] text-[#1B1250] font-black text-xs uppercase rounded-full border-3 border-[#1B1250] shadow-neo active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all"
          >
            Edit Profile
          </button>
        </div>
      )}

      {/* Report & Block Actions */}
      {user?.id !== buddy.user_id && (
        <div className="flex gap-3 mb-5">
          <button onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#F6FBD4] text-[#E8622B] border-3 border-[#1B1250] rounded-full text-xs font-black shadow-neo-sm hover:bg-[#EAE4FB] transition-colors">
            <Flag size={14} /> Report
          </button>
          <BlockButton targetUserId={buddy.user_id || ''} />
        </div>
      )}

      {/* Request Status Display */}
      {requestState && (
        <div className={`rounded-[22px] border-3 border-[#1B1250] p-6 text-center mb-5 shadow-neo ${
          requestState.status === 'accepted'
            ? 'bg-[#C5F030]'
            : requestState.status === 'rejected'
            ? 'bg-[#F6FBD4]'
            : 'bg-[#FFD41F]'
        }`}>
          <div className={`w-14 h-14 rounded-full border-3 border-[#1B1250] flex items-center justify-center mx-auto mb-3 shadow-neo-sm ${
            requestState.status === 'accepted' ? 'bg-[#1B1250]' : requestState.status === 'rejected' ? 'bg-[#E8622B]' : 'bg-[#1B1250]'
          }`}>
            {requestState.status === 'accepted' ? (
              <CheckCircle size={28} className="text-white" />
            ) : requestState.status === 'rejected' ? (
              <X size={28} className="text-white" />
            ) : (
              <Clock size={28} className="text-white" />
            )}
          </div>
          <h3 className="font-display font-black text-xl text-[#1B1250] mb-2">
            {requestState.status === 'accepted' ? 'Request accepted!' :
             requestState.status === 'rejected' ? 'Request declined' :
             'Request sent!'}
          </h3>
          <p className="text-sm font-bold text-[#1B1250]/70 mb-4">
            {requestState.status === 'accepted' ? 'You can now chat with this buddy.' :
             requestState.status === 'rejected' ? 'This buddy is no longer interested.' :
             'Wait for the provider to accept, then you can chat.'}
          </p>
          {requestState.status === 'accepted' && conversationId ? (
            <button onClick={openChat} className="inline-flex items-center gap-2 bg-[#1B1250] text-white px-6 py-3 rounded-full font-black text-sm border-3 border-[#1B1250] shadow-neo active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all">
              <MessageCircle size={16} /> Open Chat
            </button>
          ) : requestState.status === 'accepted' && !conversationId ? (
            <button disabled className="inline-flex items-center gap-2 bg-[#1B1250]/30 text-[#1B1250]/50 px-6 py-3 rounded-full font-black text-sm border-3 border-[#1B1250]/30 cursor-not-allowed" aria-label="Chat being set up">
              Setting up chat...
            </button>
          ) : requestState.status === 'rejected' ? (
            <button onClick={() => { setRequestState(null); setConversationId(null); }} className="bg-[#F6FBD4] text-[#1B1250] px-6 py-3 rounded-full font-black text-sm border-3 border-[#1B1250] shadow-neo active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all">
              Try another buddy
            </button>
          ) : (
            <button disabled className="bg-[#1B1250]/20 text-[#1B1250]/50 px-6 py-3 rounded-full font-black text-sm border-3 border-[#1B1250]/20 cursor-not-allowed" aria-label="Waiting for approval">
              Waiting for approval…
            </button>
          )}
        </div>
      )}

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-[#1B1250]/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#EAE4FB] w-full sm:max-w-md sm:rounded-[28px] rounded-t-[28px] border-3 border-[#1B1250] shadow-neo-card p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-1">
              <h2 className="font-display font-black text-2xl text-[#1B1250]">Request {buddy.name}</h2>
              <button
                onClick={() => { setShowRequestForm(false); setRequestError(null); }}
                className="w-8 h-8 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] flex items-center justify-center shadow-neo-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                aria-label="Close"
              >
                <X size={16} className="text-[#1B1250]" />
              </button>
            </div>
            <p className="text-sm font-bold text-[#1B1250]/60 mb-6">What would you like to do together?</p>

            {requestError && (
              <div className="mb-4 p-3 bg-[#E8622B] border-3 border-[#1B1250] rounded-[16px] text-sm font-bold text-white whitespace-pre-line shadow-neo-sm">
                {requestError}
              </div>
            )}

            <div className="space-y-5">
              {/* Activity Selection */}
              <div>
                <label className="block text-[10px] font-black text-[#1B1250]/50 tracking-widest uppercase mb-3">Activity</label>
                <div className="grid grid-cols-3 gap-2">
                  {REQUEST_ACTIVITIES.map(act => (
                    <button
                      key={act.name}
                      onClick={() => setRequestForm({ ...requestForm, activity: act.name })}
                      className={`p-3 rounded-[18px] text-center border-3 border-[#1B1250] font-black text-xs transition-all ${
                        requestForm.activity === act.name
                          ? 'bg-[#C5F030] text-[#1B1250] shadow-neo-sm translate-x-[2px] translate-y-[2px]'
                          : 'bg-[#F6FBD4] text-[#1B1250] shadow-neo-sm'
                      }`}
                    >
                      <span className="text-xl block mb-1">{act.emoji}</span>
                      <span>{act.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-[#1B1250]/50 tracking-widest uppercase mb-2">Date</label>
                  <input
                    type="date"
                    value={requestForm.proposedDate}
                    onChange={e => setRequestForm({ ...requestForm, proposedDate: e.target.value })}
                    className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#1B1250]/50 tracking-widest uppercase mb-2">Time</label>
                  <input
                    type="time"
                    value={requestForm.proposedTime}
                    onChange={e => setRequestForm({ ...requestForm, proposedTime: e.target.value })}
                    className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-[10px] font-black text-[#1B1250]/50 tracking-widest uppercase mb-2">Duration</label>
                <select
                  value={requestForm.proposedDurationHours}
                  onChange={e => setRequestForm({ ...requestForm, proposedDurationHours: e.target.value })}
                  className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none"
                >
                  <option value="1">1 hour</option>
                  <option value="1.5">1.5 hours</option>
                  <option value="2">2 hours</option>
                  <option value="3">3 hours</option>
                  <option value="4">4 hours</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-[10px] font-black text-[#1B1250]/50 tracking-widest uppercase mb-2">Your message</label>
                <textarea
                  value={requestForm.message}
                  onChange={e => setRequestForm({ ...requestForm, message: e.target.value })}
                  className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none resize-none"
                  rows={3}
                  placeholder={`Would you like to ${requestForm.activity?.toLowerCase() || 'hang out'}?`}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-[10px] font-black text-[#1B1250]/50 tracking-widest uppercase mb-2">Suggested location</label>
                <input
                  type="text"
                  value={requestForm.proposedLocation}
                  onChange={e => setRequestForm({ ...requestForm, proposedLocation: e.target.value })}
                  className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none"
                  placeholder="e.g., Pacific Mall, Rajpur Road"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="flex-1 py-3.5 bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] rounded-full font-black text-sm shadow-neo active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequest}
                disabled={submitting}
                className="flex-1 py-3.5 bg-[#C5F030] hover:bg-[#bcf01a] text-[#1B1250] border-3 border-[#1B1250] rounded-full font-black text-sm shadow-neo active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1B1250]" />
                ) : (
                  <><Send size={15} strokeWidth={2.5} /> Send Request</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          targetType="buddy_profile"
          targetId={buddy.id}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Sticky action bar (floats safely above BottomNav) */}
      {user?.id !== buddy.user_id && (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 pointer-events-none">
          <div className="max-w-[480px] mx-auto px-4">
            <div className="pointer-events-auto bg-[#F6FBD4] border-3 border-[#1B1250] rounded-full p-2 flex gap-2 items-center shadow-[4px_6px_0_#1B1250]">
              {!requestState ? (
                <>
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className="flex-1 py-3 bg-[#C5F030] hover:bg-[#bcf01a] text-[#1B1250] border-2.5 border-[#1B1250] rounded-full font-display font-black uppercase text-sm shadow-[2px_2px_0_#1B1250] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send size={15} strokeWidth={2.5} />
                    <span>Send Request</span>
                  </button>
                  <button
                    onClick={() => {
                      if (conversationId) {
                        navigate(`/messages?conv=${conversationId}`);
                      } else {
                        alert('No chat available yet. Send a request to connect!');
                      }
                    }}
                    className="w-11 h-11 bg-white border-2.5 border-[#1B1250] rounded-full flex items-center justify-center shadow-[2px_2px_0_#1B1250] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all shrink-0 cursor-pointer"
                    aria-label="Open chat"
                  >
                    <MessageCircle size={20} className={conversationId ? 'text-[#1B1250]' : 'text-[#1B1250]/40'} />
                  </button>
                </>
              ) : requestState.status === 'accepted' && conversationId ? (
                <button
                  onClick={openChat}
                  className="flex-1 py-3 bg-[#C5F030] text-[#1B1250] border-2.5 border-[#1B1250] rounded-full font-display font-black uppercase text-sm shadow-[2px_2px_0_#1B1250] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle size={16} /> Chat Now
                </button>
              ) : (
                <div className="flex-1 py-2.5 px-4 text-center font-black text-xs uppercase text-[#1B1250]/60">
                  Request Sent · Waiting for response
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
