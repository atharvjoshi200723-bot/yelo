import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { RentalRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Calendar, DollarSign, MapPin, MessageSquare, Check, X, Tag, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function RentalRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RentalRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/rentals/requests/${id}`)
      .then(res => {
        const req = res.data.request;
        setRequest(req);
        if (req.conversation_id) {
          setConversationId(req.conversation_id);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        const apiErr = err as { response?: { data?: { error?: string } } };
        setError(apiErr.response?.data?.error || 'Rental request not found');
        setLoading(false);
      });
  }, [id]);

  const handleRespond = async (status: 'accepted' | 'rejected') => {
    if (!id || responding) return;
    setResponding(true);
    try {
      const res = await api.put(`/rentals/requests/${id}/respond`, { status });
      setRequest(prev => prev ? { ...prev, status } : null);
      if (res.data.conversationId) {
        setConversationId(res.data.conversationId);
      }
    } catch {
      setError('Failed to respond to rental request');
    }
    setResponding(false);
  };

  const handleDirectChat = async () => {
    if (!request || chatLoading) return;
    setChatLoading(true);
    try {
      // If we already have a conversation, jump directly to it
      if (conversationId) {
        navigate(`/messages?conv=${conversationId}`);
        return;
      }
      // Otherwise create or reuse direct conversation with requester
      const otherUserId = user?.id === request.owner_id ? request.requester_id : request.owner_id;
      const res = await api.post('/messages', {
        otherUserId,
        type: 'rental',
        title: request.listing_title || 'Rental Inquiry',
      });
      navigate(`/messages?conv=${res.data.id}`);
    } catch {
      setError('Could not open chat with requester. Please try again.');
    }
    setChatLoading(false);
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

  const isOwner = user?.id === request.owner_id;
  const isPending = request.status === 'pending';
  const isAccepted = request.status === 'accepted';
  const isRejected = request.status === 'rejected';

  // Calculate rental duration in days
  const startDate = new Date(request.start_date);
  const endDate = new Date(request.end_date);
  const diffDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const pricePerDay = request.price_per_day ? Number(request.price_per_day) : 0;
  const estimatedRent = pricePerDay > 0 ? pricePerDay * diffDays : null;
  const deposit = request.deposit ? Number(request.deposit) : 0;

  const otherPersonName = isOwner ? request.requester_name : request.owner_name;
  const otherPersonAvatar = isOwner ? request.requester_avatar : request.owner_avatar;
  const otherPersonCity = isOwner ? request.requester_city : request.owner_city;
  const otherPersonId = isOwner ? request.requester_id : request.owner_id;

  return (
    <div className="max-w-lg mx-auto px-4 pt-20 pb-24">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] flex items-center justify-center mb-5 transition-all active:translate-y-[2px] active:shadow-none"
      >
        <ArrowLeft size={18} className="text-[#1B1250]" />
      </button>

      {/* Heading */}
      <div className="mb-5">
        <h1 className="font-display font-black text-2xl text-[#1B1250]">Rental Request</h1>
        <p className="text-sm font-bold text-[#1B1250]/50 mt-0.5">
          {isOwner ? `From ${request.requester_name || 'Requester'}` : `For ${request.listing_title || 'Item'}`}
        </p>
      </div>

      {/* Status banner */}
      {isPending && (
        <div className="bg-[#FFD41F] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-[22px] p-4 flex items-center gap-3 mb-4">
          <Clock size={20} className="text-[#1B1250] flex-shrink-0" />
          <div>
            <p className="font-display font-black text-[#1B1250] uppercase text-sm">Pending</p>
            <p className="text-xs font-bold text-[#1B1250]/60">Awaiting response from owner</p>
          </div>
        </div>
      )}
      {isAccepted && (
        <div className="bg-[#C5F030] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-[22px] p-4 flex items-center gap-3 mb-4">
          <CheckCircle size={20} className="text-[#1B1250] flex-shrink-0" />
          <div>
            <p className="font-display font-black text-[#1B1250] uppercase text-sm">Accepted</p>
            <p className="text-xs font-bold text-[#1B1250]/60">Rental request approved</p>
          </div>
        </div>
      )}
      {isRejected && (
        <div className="bg-[#E8622B] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-[22px] p-4 flex items-center gap-3 mb-4">
          <X size={20} className="text-white flex-shrink-0" />
          <div>
            <p className="font-display font-black text-white uppercase text-sm">Rejected</p>
            <p className="text-xs font-bold text-white/70">This rental request has been declined</p>
          </div>
        </div>
      )}

      {/* Item info sticker card */}
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-[22px] p-4 mb-4">
        <p className="text-xs font-black text-[#9A63E6] uppercase tracking-wider mb-3">Rental Item</p>
        <Link
          to={`/rent/${request.listing_id}`}
          className="flex items-center gap-3"
        >
          {request.listing_images && request.listing_images.length > 0 ? (
            <img
              src={request.listing_images[0]}
              alt={request.listing_title || 'Item'}
              className="w-16 h-16 rounded-[14px] object-cover flex-shrink-0 border-2 border-[#1B1250]"
            />
          ) : (
            <div className="w-16 h-16 bg-[#FFD41F] rounded-[14px] border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0">
              <Tag size={22} className="text-[#1B1250]" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-display font-black text-[#1B1250] truncate">{request.listing_title || 'Item for rent'}</p>
            <p className="text-xs font-bold text-[#1B1250]/60">₹{pricePerDay}/day</p>
          </div>
        </Link>

        {/* Date pills */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="flex items-center gap-1.5 bg-[#FFD41F] border-2 border-[#1B1250] rounded-full px-3 py-1 text-xs font-black text-[#1B1250]">
            <Calendar size={11} />
            {format(startDate, 'MMM d, yyyy')}
          </span>
          <span className="text-[#1B1250]/40 font-black self-center">→</span>
          <span className="flex items-center gap-1.5 bg-[#2FA3B5] border-2 border-[#1B1250] rounded-full px-3 py-1 text-xs font-black text-white">
            <Calendar size={11} />
            {format(endDate, 'MMM d, yyyy')}
          </span>
          <span className="bg-[#1B1250] rounded-full px-3 py-1 text-xs font-black text-white">
            {diffDays} day{diffDays !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Rental details sticker card */}
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-[22px] p-4 mb-4 space-y-3">
        <p className="text-xs font-black text-[#9A63E6] uppercase tracking-wider">Rental Details</p>

        {estimatedRent !== null && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFD41F] rounded-[10px] border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0">
              <DollarSign size={14} className="text-[#1B1250]" />
            </div>
            <div>
              <p className="text-xs font-black text-[#9A63E6] uppercase tracking-wider">Estimated Rent</p>
              <p className="text-sm font-bold text-[#1B1250]">
                ₹{estimatedRent.toLocaleString()}
                {deposit > 0 && (
                  <span className="text-xs font-bold text-[#1B1250]/50 ml-1.5">(+₹{deposit.toLocaleString()} deposit)</span>
                )}
              </p>
            </div>
          </div>
        )}

        {request.listing_location && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E8622B] rounded-[10px] border-2 border-[#1B1250] flex items-center justify-center flex-shrink-0">
              <MapPin size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-[#9A63E6] uppercase tracking-wider">Pickup Location</p>
              <p className="text-sm font-bold text-[#1B1250]">{request.listing_location}</p>
            </div>
          </div>
        )}

        {request.message && (
          <div className="bg-[#F6FBD4] border-2 border-[#1B1250]/20 rounded-[14px] p-3 mt-1">
            <p className="text-xs font-black text-[#9A63E6] uppercase tracking-wider mb-1">Requester Note</p>
            <p className="text-sm font-bold text-[#1B1250] italic leading-relaxed">"{request.message}"</p>
          </div>
        )}
      </div>

      {/* Requester info row */}
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-[22px] p-4 mb-5">
        <p className="text-xs font-black text-[#9A63E6] uppercase tracking-wider mb-3">
          {isOwner ? 'Requester' : 'Owner'}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${otherPersonId}`} className="block flex-shrink-0">
              <div className="w-12 h-12 rounded-full border-3 border-[#9A63E6] overflow-hidden flex items-center justify-center bg-[#1B1250]">
                {otherPersonAvatar ? (
                  <img src={otherPersonAvatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="text-white font-black text-lg">{otherPersonName?.charAt(0) || '?'}</span>
                )}
              </div>
            </Link>
            <div>
              <Link
                to={`/profile/${otherPersonId}`}
                className="font-display font-black text-[#1B1250] hover:text-[#9A63E6] transition-colors"
              >
                {otherPersonName || 'User'}
              </Link>
              <p className="text-xs font-bold text-[#1B1250]/50">{otherPersonCity || 'Dehradun'}</p>
            </div>
          </div>
          <button
            onClick={handleDirectChat}
            disabled={chatLoading}
            className="px-4 py-2 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-black uppercase text-xs flex items-center gap-1.5 transition-all active:translate-y-[2px] active:shadow-none disabled:opacity-50"
          >
            <MessageSquare size={12} />
            {chatLoading ? 'Opening...' : 'Direct Chat'}
          </button>
        </div>
      </div>

      {/* Owner Actions — pending */}
      {isOwner && isPending && (
        <div className="space-y-3 mb-4">
          <button
            onClick={() => handleRespond('accepted')}
            disabled={responding}
            className="w-full py-3.5 bg-[#3F8A12] text-white border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:translate-y-[2px] active:shadow-none"
          >
            <Check size={18} />
            {responding ? 'Accepting...' : 'Accept Rental Request'}
          </button>
          <button
            onClick={() => handleRespond('rejected')}
            disabled={responding}
            className="w-full py-3.5 bg-[#E8622B] text-white border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:translate-y-[2px] active:shadow-none"
          >
            <X size={18} />
            {responding ? 'Declining...' : 'Decline'}
          </button>
        </div>
      )}

      {/* Accepted state — open chat */}
      {isAccepted && (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-[22px] p-5 text-center mb-4">
          <div className="text-4xl mb-3">🎉</div>
          <p className="font-display font-black text-[#1B1250] mb-1">Rental Request Accepted</p>
          <p className="text-sm font-bold text-[#1B1250]/60 mb-4">
            You can now coordinate pickup, return, and payment with {otherPersonName || 'the other party'}.
          </p>
          <button
            onClick={handleDirectChat}
            disabled={chatLoading}
            className="px-6 py-2.5 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase text-sm flex items-center gap-2 mx-auto disabled:opacity-50 transition-all active:translate-y-[2px] active:shadow-none"
          >
            <MessageSquare size={16} />
            {chatLoading ? 'Opening...' : 'Open Chat'}
          </button>
        </div>
      )}

      {/* Rejected state */}
      {isRejected && (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-[22px] p-5 text-center mb-4">
          <div className="text-4xl mb-3">😔</div>
          <p className="font-display font-black text-[#1B1250] mb-1">Request Declined</p>
          <p className="text-sm font-bold text-[#1B1250]/60">This rental request has been declined.</p>
        </div>
      )}

      {/* Non-owner pending */}
      {!isOwner && isPending && (
        <div className="bg-[#FFD41F] border-3 border-[#1B1250] shadow-[3px_4px_0_#1B1250] rounded-[22px] p-4 text-center mb-4">
          <p className="text-sm font-black text-[#1B1250]">Your request has been sent to the owner.</p>
          <p className="text-xs font-bold text-[#1B1250]/60 mt-1">You will be notified once they respond.</p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-4 p-3 bg-[#E8622B]/10 border-2 border-[#E8622B] rounded-[14px] text-sm font-bold text-[#E8622B]">
          {error}
        </div>
      )}
    </div>
  );
}
