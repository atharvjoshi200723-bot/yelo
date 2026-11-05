import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ArrowLeft, Clock, MapPin, Calendar, MessageSquare, Check, X, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface BuddyRequest {
  id: string;
  buddy_profile_id: string;
  requester_id: string;
  provider_id: string;
  activity: string;
  message: string | null;
  proposed_date: string;
  proposed_time: string;
  proposed_duration_hours: number;
  proposed_location: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  agreed_price: number | null;
  created_at: string;
  buddy_title: string;

  requester_name: string;
  requester_avatar: string | null;
  requester_city: string | null;
  provider_name: string;
  provider_avatar: string | null;
}

export default function BuddyRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<BuddyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/buddy/requests/${id}`)
      .then(res => {
        setRequest(res.data.request);
        setLoading(false);
      })
      .catch(() => {
        setError('Request not found');
        setLoading(false);
      });
  }, [id]);

  const handleRespond = async (status: 'accepted' | 'rejected') => {
    if (!id || responding) return;
    setResponding(true);
    try {
      const res = await api.put(`/buddy/requests/${id}/respond`, { status });
      setRequest(prev => prev ? { ...prev, status } : null);
      if (res.data.conversationId) {
        setConversationId(res.data.conversationId);
      }
    } catch {
      setError('Failed to respond to request');
    }
    setResponding(false);
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 pb-24">
        <div className="flex items-center justify-center py-20">
          <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[6px_8px_0_#1B1250] rounded-[22px] p-8 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-[#1B1250]" />
            <p className="text-xs font-black text-[#1B1250]/40 uppercase tracking-wider">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 pb-24">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] flex items-center justify-center mb-6 transition-all active:translate-y-[2px] active:shadow-none"
        >
          <ArrowLeft size={18} className="text-[#1B1250]" />
        </button>
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[6px_8px_0_#1B1250] rounded-[22px] p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="font-display font-black text-lg text-[#1B1250] mb-4">{error || 'Request not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase text-sm transition-all active:translate-y-[2px] active:shadow-none"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isPending = request.status === 'pending';
  const isAccepted = request.status === 'accepted';
  const isRejected = request.status === 'rejected';

  return (
    <div className="max-w-lg mx-auto px-4 pt-20 pb-24">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] flex items-center justify-center mb-5 transition-all active:translate-y-[2px] active:shadow-none"
        aria-label="Back"
      >
        <ArrowLeft size={18} className="text-[#1B1250]" />
      </button>

      {/* Heading */}
      <div className="mb-5">
        <h1 className="font-display font-black text-2xl text-[#1B1250]">Buddy Request</h1>
        <p className="text-sm font-bold text-[#1B1250]/50 mt-0.5">From {request.requester_name}</p>
      </div>

      {/* Status banner */}
      {isPending && (
        <div className="bg-[#FFD41F] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-[22px] p-4 flex items-center gap-3 mb-4">
          <Clock size={20} className="text-[#1B1250] flex-shrink-0" />
          <div>
            <p className="font-display font-black text-[#1B1250] uppercase text-sm">Pending</p>
            <p className="text-xs font-bold text-[#1B1250]/60">Awaiting your response</p>
          </div>
        </div>
      )}
      {isAccepted && (
        <div className="bg-[#C5F030] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-[22px] p-4 flex items-center gap-3 mb-4">
          <CheckCircle size={20} className="text-[#1B1250] flex-shrink-0" />
          <div>
            <p className="font-display font-black text-[#1B1250] uppercase text-sm">Accepted</p>
            <p className="text-xs font-bold text-[#1B1250]/60">Buddy request accepted</p>
          </div>
        </div>
      )}
      {isRejected && (
        <div className="bg-[#E8622B] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-[22px] p-4 flex items-center gap-3 mb-4">
          <X size={20} className="text-white flex-shrink-0" />
          <div>
            <p className="font-display font-black text-white uppercase text-sm">Rejected</p>
            <p className="text-xs font-bold text-white/70">This request has been declined</p>
          </div>
        </div>
      )}

      {/* Requester Card */}
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-[22px] p-4 mb-4">
        <p className="text-xs font-black text-[#9A63E6] uppercase tracking-wider mb-3">Requester</p>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#1B1250] rounded-full flex items-center justify-center flex-shrink-0 border-2 border-[#1B1250] ring-2 ring-[#E8622B] overflow-hidden">
            {request.requester_avatar ? (
              <img src={request.requester_avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <span className="text-[#F6FBD4] font-black">{request.requester_name?.charAt(0) || '?'}</span>
            )}
          </div>
          <div>
            <p className="font-display font-black text-[#1B1250]">{request.requester_name}</p>
            <p className="text-xs font-bold text-[#1B1250]/60">{request.requester_city || 'Dehradun'}</p>
          </div>
        </div>

        {/* Request Details */}
        <div className="space-y-3 pt-2 border-t-2 border-[#1B1250]/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#C5F030] rounded-[10px] border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🎯</span>
            </div>
            <div>
              <p className="text-xs font-black text-[#9A63E6] uppercase tracking-wider">Activity</p>
              <p className="text-sm font-bold text-[#1B1250]">{request.activity}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFD41F] rounded-[10px] border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0">
              <Calendar size={14} className="text-[#1B1250]" />
            </div>
            <div>
              <p className="text-xs font-black text-[#9A63E6] uppercase tracking-wider">Date</p>
              <p className="text-sm font-bold text-[#1B1250]">
                {request.proposed_date ? format(new Date(request.proposed_date), 'MMM d, yyyy') : 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#2FA3B5] rounded-[10px] border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0">
              <Clock size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-[#9A63E6] uppercase tracking-wider">Time</p>
              <p className="text-sm font-bold text-[#1B1250]">{request.proposed_time || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#9A63E6] rounded-[10px] border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0">
              <Clock size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-[#9A63E6] uppercase tracking-wider">Duration</p>
              <p className="text-sm font-bold text-[#1B1250]">{request.proposed_duration_hours} hour{request.proposed_duration_hours !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {request.proposed_location && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#E8622B] rounded-[10px] border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0">
                <MapPin size={14} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-[#9A63E6] uppercase tracking-wider">Location</p>
                <p className="text-sm font-bold text-[#1B1250]">{request.proposed_location}</p>
              </div>
            </div>
          )}

          {request.message && (
            <div className="flex items-start gap-3 pt-1">
              <div className="w-8 h-8 bg-[#F6FBD4] rounded-[10px] border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquare size={14} className="text-[#1B1250]" />
              </div>
              <div>
                <p className="text-xs font-black text-[#9A63E6] uppercase tracking-wider">Message</p>
                <p className="text-sm font-semibold italic text-[#1B1250] mt-0.5">"{request.message}"</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status / Actions */}
      {isPending && (
        <div className="space-y-3">
          <button
            onClick={() => handleRespond('accepted')}
            disabled={responding}
            className="w-full py-3.5 bg-[#3F8A12] text-white border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase text-sm disabled:opacity-50 transition-all active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
          >
            <Check size={18} />
            {responding ? 'Accepting...' : 'Accept Request'}
          </button>
          <button
            onClick={() => handleRespond('rejected')}
            disabled={responding}
            className="w-full py-3.5 bg-[#E8622B] text-white border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase text-sm disabled:opacity-50 transition-all active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
          >
            <X size={18} />
            {responding ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      )}

      {isAccepted && (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-[22px] p-5 text-center">
          <div className="w-12 h-12 bg-[#C5F030] rounded-full border-2 border-[#1B1250] flex items-center justify-center mx-auto mb-3">
            <Check size={24} className="text-[#1B1250]" />
          </div>
          <p className="font-display font-black text-lg text-[#1B1250] mb-1">Request Accepted</p>
          <p className="text-sm font-bold text-[#1B1250]/60 mb-4">You can now chat with {request.requester_name}</p>
          {conversationId && (
            <button
              onClick={() => navigate(`/messages?conv=${conversationId}`)}
              className="px-6 py-2.5 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase text-sm transition-all active:translate-y-[2px] active:shadow-none"
            >
              Open Chat
            </button>
          )}
        </div>
      )}

      {isRejected && (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-[22px] p-5 text-center">
          <div className="w-12 h-12 bg-[#E8622B] rounded-full border-2 border-[#1B1250] flex items-center justify-center mx-auto mb-3">
            <X size={24} className="text-white" />
          </div>
          <p className="font-display font-black text-lg text-[#1B1250] mb-1">Request Rejected</p>
          <p className="text-sm font-bold text-[#1B1250]/60">This request has been declined.</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3.5 bg-[#E8622B]/10 border-2 border-[#E8622B] rounded-[16px] text-sm font-bold text-[#E8622B]">
          {error}
        </div>
      )}
    </div>
  );
}