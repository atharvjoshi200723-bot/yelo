import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { RentalRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Calendar, DollarSign, MapPin, MessageSquare, Check, X, Tag } from 'lucide-react';
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 pb-24">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-navy-500 hover:text-navy-700 mb-6">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="text-center py-12">
          <p className="text-navy-500">{error || 'Request not found'}</p>
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
      {/* Header */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-navy-500 hover:text-navy-700 mb-4 transition-colors">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="mb-6">
        <h1 className="font-display text-display-sm text-navy-900 mb-1">Rental Request</h1>
        <p className="text-sm text-navy-400">
          {isOwner ? `From ${request.requester_name || 'Requester'}` : `For ${request.listing_title || 'Item'}`}
        </p>
      </div>

      {/* User Card */}
      <div className="bg-white rounded-2xl shadow-soft p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${otherPersonId}`} className="block">
              <div className="w-12 h-12 bg-navy-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                {otherPersonAvatar ? (
                  <img src={otherPersonAvatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="text-cream-50 font-medium text-lg">{otherPersonName?.charAt(0) || '?'}</span>
                )}
              </div>
            </Link>
            <div>
              <Link to={`/profile/${otherPersonId}`} className="font-semibold text-navy-900 hover:text-navy-700 transition-colors">
                {otherPersonName || 'User'}
              </Link>
              <p className="text-xs text-navy-400">{otherPersonCity || 'Dehradun'}</p>
            </div>
          </div>

          <button
            onClick={handleDirectChat}
            disabled={chatLoading}
            className="px-3.5 py-2 bg-cream-100 hover:bg-cream-200 text-navy-800 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 btn-press"
          >
            <MessageSquare size={14} />
            {chatLoading ? 'Opening...' : 'Direct Chat'}
          </button>
        </div>

        {/* Listing preview banner */}
        <Link
          to={`/rent/${request.listing_id}`}
          className="flex items-center gap-3 p-3 bg-cream-50 hover:bg-cream-100/80 rounded-xl transition-colors border border-navy-100/30"
        >
          {request.listing_images && request.listing_images.length > 0 ? (
            <img
              src={request.listing_images[0]}
              alt={request.listing_title || 'Item'}
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Tag size={20} className="text-amber-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-navy-400 font-medium">Rental Item</p>
            <p className="text-sm font-semibold text-navy-900 truncate">{request.listing_title || 'Item for rent'}</p>
            <p className="text-xs text-navy-500 font-medium">₹{pricePerDay}/day</p>
          </div>
        </Link>
      </div>

      {/* Request Details */}
      <div className="bg-white rounded-2xl shadow-soft p-5 mb-6 space-y-4">
        <h3 className="font-semibold text-navy-900 text-sm border-b border-navy-100/30 pb-2">Rental Details</h3>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sage-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar size={14} className="text-sage-600" />
          </div>
          <div>
            <p className="text-xs text-navy-400 uppercase tracking-wider font-medium">Rental Period</p>
            <p className="text-sm text-navy-800 font-medium">
              {format(startDate, 'MMM d, yyyy')} – {format(endDate, 'MMM d, yyyy')}
            </p>
            <p className="text-xs text-navy-400">{diffDays} day{diffDays !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {estimatedRent !== null && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign size={14} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-navy-400 uppercase tracking-wider font-medium">Estimated Rent</p>
              <p className="text-sm text-navy-800 font-semibold">
                ₹{estimatedRent.toLocaleString()}
                {deposit > 0 && (
                  <span className="text-xs font-normal text-navy-400 ml-1.5">(+₹{deposit.toLocaleString()} deposit)</span>
                )}
              </p>
            </div>
          </div>
        )}

        {request.listing_location && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-navy-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin size={14} className="text-navy-600" />
            </div>
            <div>
              <p className="text-xs text-navy-400 uppercase tracking-wider font-medium">Pickup Location</p>
              <p className="text-sm text-navy-800 font-medium">{request.listing_location}</p>
            </div>
          </div>
        )}

        {request.message && (
          <div className="flex items-start gap-3 pt-1 border-t border-navy-100/20">
            <div className="w-8 h-8 bg-cream-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageSquare size={14} className="text-navy-500" />
            </div>
            <div>
              <p className="text-xs text-navy-400 uppercase tracking-wider font-medium">Requester Note</p>
              <p className="text-sm text-navy-800 mt-0.5 leading-relaxed">"{request.message}"</p>
            </div>
          </div>
        )}
      </div>

      {/* Owner Actions */}
      {isOwner && isPending && (
        <div className="space-y-3">
          <button
            onClick={() => handleRespond('accepted')}
            disabled={responding}
            className="w-full py-3.5 bg-sage-600 text-white rounded-xl font-medium hover:bg-sage-700 disabled:opacity-50 transition-all duration-200 btn-press flex items-center justify-center gap-2 shadow-sm"
          >
            <Check size={18} />
            {responding ? 'Accepting...' : 'Accept Rental Request'}
          </button>
          <button
            onClick={() => handleRespond('rejected')}
            disabled={responding}
            className="w-full py-3.5 bg-white text-navy-600 border border-navy-200 rounded-xl font-medium hover:bg-navy-50 disabled:opacity-50 transition-all duration-200 btn-press flex items-center justify-center gap-2"
          >
            <X size={18} />
            {responding ? 'Declining...' : 'Decline'}
          </button>
        </div>
      )}

      {isAccepted && (
        <div className="bg-sage-50 border border-sage-200 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check size={24} className="text-sage-600" />
          </div>
          <p className="font-semibold text-sage-800 mb-1">Rental Request Accepted</p>
          <p className="text-sm text-sage-600 mb-4">
            You can now coordinate pickup, return, and payment with {otherPersonName || 'the other party'}.
          </p>
          <button
            onClick={handleDirectChat}
            disabled={chatLoading}
            className="px-6 py-2.5 bg-sage-600 text-white rounded-xl font-medium hover:bg-sage-700 transition-all duration-200 btn-press inline-flex items-center gap-2"
          >
            <MessageSquare size={16} />
            {chatLoading ? 'Opening...' : 'Open Chat'}
          </button>
        </div>
      )}

      {isRejected && (
        <div className="bg-navy-50 border border-navy-200 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <X size={24} className="text-navy-400" />
          </div>
          <p className="font-semibold text-navy-700 mb-1">Request Declined</p>
          <p className="text-sm text-navy-500">This rental request has been declined.</p>
        </div>
      )}

      {!isOwner && isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-amber-800 font-medium">Your request has been sent to the owner.</p>
          <p className="text-xs text-amber-600 mt-1">You will be notified once they respond.</p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
