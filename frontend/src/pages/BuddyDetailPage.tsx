import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

export default function BuddyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [buddy, setBuddy] = useState<BuddyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestState, setRequestState] = useState<BuddyRequest | null>(null);
  const [requestForm, setRequestForm] = useState({
    activity: '',
    message: '',
    proposedDate: '',
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
      setBuddy(res.data.buddy);
      setLoading(false);
    }).catch(() => navigate('/buddy'));
  }, [id]);

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
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-900" />
    </div>
  );

  if (!buddy) return null;

  const age = buddy.date_of_birth
    ? Math.floor((Date.now() - new Date(buddy.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-navy-400 hover:text-navy-600 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <span className="text-xs text-navy-400 font-medium">Back to activities</span>
      </div>

      {/* Profile Card - Always Buddy gradient */}
      <div className="bg-white rounded-3xl shadow-soft overflow-hidden mb-6">
        {/* Avatar Section */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-center relative">
          <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
            <span className="text-xs font-medium text-white">🧑‍🤝‍🧑 Buddy</span>
          </div>
          <div className="w-28 h-28 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border-2 border-white/30">
            <span className="text-5xl font-bold text-white">{buddy.name?.charAt(0)}</span>
          </div>
          <h1 className="font-display text-3xl text-white">{buddy.name} · {age}</h1>
          <p className="text-white/70 text-sm mt-2 flex items-center justify-center gap-1">
            <MapPin size={14} /> {buddy.location_name || 'Dehradun'}
          </p>
        </div>

        <div className="p-6">
          {/* Stats */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <Star size={18} className="text-amber-500 fill-amber-500" />
                <span className="font-bold text-navy-900 text-lg">{buddy.avg_rating ? Number(buddy.avg_rating).toFixed(1) : 'New'}</span>
              </div>
              <p className="text-xs text-navy-400">{buddy.total_reviews} reviews</p>
            </div>
            <div className="w-px h-10 bg-navy-100" />
            <div className="text-center">
              <p className="font-bold text-navy-900 text-lg">{buddy.total_sessions}</p>
              <p className="text-xs text-navy-400">completed</p>
            </div>
            <div className="w-px h-10 bg-navy-100" />
            <div className="text-center">
              <div className="flex items-center gap-1">
                <CheckCircle size={16} className="text-sage-500" />
                <span className="font-bold text-navy-900">✓</span>
              </div>
              <p className="text-xs text-navy-400">Verified</p>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-cream-50 rounded-2xl p-4 mb-6">
            <p className="text-navy-600 text-center italic">"{buddy.description}"</p>
          </div>

          {/* Activities */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-navy-400 tracking-wider uppercase mb-3">Available for</p>
            <div className="flex flex-wrap gap-2">
              {buddy.activities?.map(act => (
                <span key={act} className="px-4 py-2 bg-cream-100 rounded-full text-sm font-medium text-navy-700">{act}</span>
              ))}
            </div>
          </div>

          {/* Price + Availability */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-cream-50 rounded-2xl p-4 text-center">
              <p className="text-xs font-semibold text-navy-400 tracking-wider uppercase">Price</p>
              <p className="text-2xl font-bold text-navy-900 mt-2">₹{buddy.price_per_hour}</p>
              <p className="text-xs text-navy-400">/session</p>
              {buddy.negotiable && <p className="text-xs text-sage-600 mt-1">Negotiable</p>}
            </div>
            <div className="bg-cream-50 rounded-2xl p-4">
              <p className="text-xs font-semibold text-navy-400 tracking-wider uppercase">Available</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {buddy.availability_days?.slice(0, 3).map(day => (
                  <span key={day} className="px-2.5 py-1 bg-white rounded-lg text-xs text-navy-600 capitalize">{day.slice(0, 3)}</span>
                ))}
              </div>
              <p className="text-xs text-navy-400 mt-2">{buddy.availability_times}</p>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Shield size={16} className="text-amber-600 mt-0.5" />
              <div className="text-xs text-navy-600 leading-relaxed">
                <p className="font-semibold mb-1">Safety Rules</p>
                <p>18+ only · Meet in public · Social companionship only · No sexual services</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report & Block Actions */}
      {user?.id !== buddy.user_id && (
        <div className="flex gap-3 mb-6">
          <button onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cream-50 text-navy-500 rounded-xl text-sm font-medium hover:bg-cream-100 transition-colors">
            <Flag size={16} /> Report
          </button>
          <BlockButton targetUserId={buddy.user_id || ''} />
        </div>
      )}

      {/* Request Sent State */}
      {requestState && (
        <div className={`rounded-3xl p-6 text-center mb-6 border ${requestState.status === 'accepted' ? 'bg-sage-50 border-sage-200' : requestState.status === 'rejected' ? 'bg-navy-50 border-navy-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${requestState.status === 'accepted' ? 'bg-sage-500' : requestState.status === 'rejected' ? 'bg-navy-100' : 'bg-amber-500'}`}>
            {requestState.status === 'accepted' ? (
              <CheckCircle size={32} className="text-white" />
            ) : requestState.status === 'rejected' ? (
              <X size={32} className="text-navy-400" />
            ) : (
              <Clock size={32} className="text-white" />
            )}
          </div>
          <h3 className="font-display text-xl text-navy-900 mb-2">
            {requestState.status === 'accepted' ? 'Request accepted!' :
             requestState.status === 'rejected' ? 'Request declined' :
             'Request sent!'}
          </h3>
          <p className="text-sm text-navy-500 mb-4">
            {requestState.status === 'accepted' ? 'You can now chat with this buddy.' :
             requestState.status === 'rejected' ? 'This buddy is no longer interested.' :
             'Wait for the provider to accept, then you can chat.'}
          </p>
          {requestState.status === 'accepted' && conversationId ? (
            <button onClick={openChat} className="bg-navy-900 text-cream-50 px-6 py-3 rounded-2xl font-medium hover:bg-navy-800 transition-all btn-press">
              Open Chat
            </button>
          ) : requestState.status === 'accepted' && !conversationId ? (
            <button disabled className="bg-navy-200 text-navy-400 px-6 py-3 rounded-2xl font-medium cursor-not-allowed" aria-label="Chat being set up">
              Setting up chat...
            </button>
          ) : requestState.status === 'rejected' ? (
            <button onClick={() => { setRequestState(null); setConversationId(null); }} className="bg-navy-900 text-cream-50 px-6 py-3 rounded-2xl font-medium hover:bg-navy-800 transition-all btn-press">
              Try another buddy
            </button>
          ) : (
            <button disabled className="bg-navy-200 text-navy-400 px-6 py-3 rounded-2xl font-medium cursor-not-allowed" aria-label="Waiting for approval">
              Request sent — waiting for approval
            </button>
          )}
        </div>
      )}

      {/* CTA */}
      {!requestState && user?.id !== buddy.user_id && (
        <div className="flex gap-3">
          <button
            onClick={() => setShowRequestForm(true)}
            className="flex-1 bg-navy-900 text-cream-50 py-4 rounded-2xl font-medium hover:bg-navy-800 transition-all btn-press text-lg"
          >
            Request
          </button>
          <button
            onClick={() => {
              if (conversationId) {
                navigate(`/messages?conv=${conversationId}`);
              } else {
                alert('No chat available right now.');
              }
            }}
            className="w-16 h-16 bg-white border border-navy-100/30 rounded-2xl flex items-center justify-center hover:bg-navy-50 transition-colors"
            aria-label="Open chat"
          >
            <MessageCircle size={24} className={conversationId ? 'text-navy-600' : 'text-navy-300'} />
          </button>
        </div>
      )}

      {/* Request Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-1">
              <h2 className="font-display text-2xl text-navy-900">Request {buddy.name}</h2>
              <button onClick={() => { setShowRequestForm(false); setRequestError(null); }} className="p-2 -mt-1 -mr-2 hover:bg-navy-50 rounded-xl transition-colors" aria-label="Close">
                <X size={20} className="text-navy-400" />
              </button>
            </div>
            <p className="text-sm text-navy-400 mb-6">What would you like to do together?</p>

            {requestError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 whitespace-pre-line">
                {requestError}
              </div>
            )}

            <div className="space-y-5">
              {/* Activity Selection */}
              <div>
                <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-3">Activity</label>
                <div className="grid grid-cols-3 gap-2">
                  {REQUEST_ACTIVITIES.map(act => (
                    <button
                      key={act.name}
                      onClick={() => setRequestForm({ ...requestForm, activity: act.name })}
                      className={`p-3 rounded-2xl text-center transition-all ${
                        requestForm.activity === act.name
                          ? 'bg-navy-900 text-cream-50'
                          : 'bg-cream-100 text-navy-700 hover:bg-cream-200'
                      }`}
                    >
                      <span className="text-xl block mb-1">{act.emoji}</span>
                      <span className="text-xs font-medium">{act.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-2">Date</label>
                  <input
                    type="date"
                    value={requestForm.proposedDate}
                    onChange={e => setRequestForm({ ...requestForm, proposedDate: e.target.value })}
                    className="w-full px-4 py-3 border border-navy-100/30 rounded-xl text-sm text-navy-800 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-2">Time</label>
                  <input
                    type="time"
                    value={requestForm.proposedTime}
                    onChange={e => setRequestForm({ ...requestForm, proposedTime: e.target.value })}
                    className="w-full px-4 py-3 border border-navy-100/30 rounded-xl text-sm text-navy-800 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-2">Duration</label>
                <select
                  value={requestForm.proposedDurationHours}
                  onChange={e => setRequestForm({ ...requestForm, proposedDurationHours: e.target.value })}
                  className="w-full px-4 py-3 border border-navy-100/30 rounded-xl text-sm text-navy-800 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
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
                <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-2">Your message</label>
                <textarea
                  value={requestForm.message}
                  onChange={e => setRequestForm({ ...requestForm, message: e.target.value })}
                  className="w-full px-4 py-3 border border-navy-100/30 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
                  rows={3}
                  placeholder={`Would you like to ${requestForm.activity?.toLowerCase() || 'hang out'}?`}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-2">Suggested location</label>
                <input
                  type="text"
                  value={requestForm.proposedLocation}
                  onChange={e => setRequestForm({ ...requestForm, proposedLocation: e.target.value })}
                  className="w-full px-4 py-3 border border-navy-100/30 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  placeholder="e.g., Pacific Mall, Rajpur Road"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRequestForm(false)}
                className="flex-1 py-3.5 text-navy-500 border border-navy-100/30 rounded-2xl font-medium hover:bg-navy-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequest}
                disabled={submitting || !requestForm.proposedDate || !requestForm.activity}
                className="flex-1 py-3.5 bg-navy-900 text-cream-50 rounded-2xl font-medium hover:bg-navy-800 disabled:opacity-50 transition-all btn-press flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cream-50" />
                ) : (
                  <>
                    <Send size={16} /> Send Request
                  </>
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
    </div>
  );
}
