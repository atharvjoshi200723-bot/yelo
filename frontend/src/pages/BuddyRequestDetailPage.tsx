import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ArrowLeft, Clock, MapPin, Calendar, MessageSquare, Check, X, User } from 'lucide-react';
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
  buddy_type: string;
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

  const isPending = request.status === 'pending';
  const isAccepted = request.status === 'accepted';
  const isRejected = request.status === 'rejected';

  return (
    <div className="max-w-lg mx-auto px-4 pt-20 pb-24">
      {/* Header */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-navy-500 hover:text-navy-700 mb-4">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="mb-6">
        <h1 className="font-display text-display-sm text-navy-900 mb-1">Buddy Request</h1>
        <p className="text-sm text-navy-400">From {request.requester_name}</p>
      </div>

      {/* Requester Card */}
      <div className="bg-white rounded-2xl shadow-soft p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-navy-900 rounded-full flex items-center justify-center flex-shrink-0">
            {request.requester_avatar ? (
              <img src={request.requester_avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <span className="text-cream-50 font-medium">{request.requester_name?.charAt(0) || '?'}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-navy-900">{request.requester_name}</p>
            <p className="text-xs text-navy-400">{request.requester_city || 'Dehradun'}</p>
          </div>
        </div>

        {/* Request Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🎯</span>
            </div>
            <div>
              <p className="text-xs text-navy-400 uppercase tracking-wider font-medium">Activity</p>
              <p className="text-sm text-navy-800 font-medium">{request.activity}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sage-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar size={14} className="text-sage-600" />
            </div>
            <div>
              <p className="text-xs text-navy-400 uppercase tracking-wider font-medium">Date</p>
              <p className="text-sm text-navy-800 font-medium">
                {request.proposed_date ? format(new Date(request.proposed_date), 'MMM d, yyyy') : 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-navy-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock size={14} className="text-navy-600" />
            </div>
            <div>
              <p className="text-xs text-navy-400 uppercase tracking-wider font-medium">Time</p>
              <p className="text-sm text-navy-800 font-medium">{request.proposed_time || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-coral-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock size={14} className="text-coral-500" />
            </div>
            <div>
              <p className="text-xs text-navy-400 uppercase tracking-wider font-medium">Duration</p>
              <p className="text-sm text-navy-800 font-medium">{request.proposed_duration_hours} hour{request.proposed_duration_hours !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {request.proposed_location && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin size={14} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-navy-400 uppercase tracking-wider font-medium">Location</p>
                <p className="text-sm text-navy-800 font-medium">{request.proposed_location}</p>
              </div>
            </div>
          )}

          {request.message && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-cream-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquare size={14} className="text-navy-500" />
              </div>
              <div>
                <p className="text-xs text-navy-400 uppercase tracking-wider font-medium">Message</p>
                <p className="text-sm text-navy-800 mt-0.5">"{request.message}"</p>
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
            className="w-full py-3.5 bg-sage-600 text-white rounded-xl font-medium hover:bg-sage-700 disabled:opacity-50 transition-all duration-200 btn-press flex items-center justify-center gap-2"
          >
            <Check size={18} />
            {responding ? 'Accepting...' : 'Accept Request'}
          </button>
          <button
            onClick={() => handleRespond('rejected')}
            disabled={responding}
            className="w-full py-3.5 bg-white text-navy-600 border border-navy-200 rounded-xl font-medium hover:bg-navy-50 disabled:opacity-50 transition-all duration-200 btn-press flex items-center justify-center gap-2"
          >
            <X size={18} />
            {responding ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      )}

      {isAccepted && (
        <div className="bg-sage-50 border border-sage-200 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check size={24} className="text-sage-600" />
          </div>
          <p className="font-semibold text-sage-800 mb-1">Request Accepted</p>
          <p className="text-sm text-sage-600 mb-4">You can now chat with {request.requester_name}</p>
          {conversationId && (
            <button
              onClick={() => navigate(`/messages?conv=${conversationId}`)}
              className="px-6 py-2.5 bg-sage-600 text-white rounded-xl font-medium hover:bg-sage-700 transition-all duration-200 btn-press"
            >
              Open Chat
            </button>
          )}
        </div>
      )}

      {isRejected && (
        <div className="bg-navy-50 border border-navy-200 rounded-2xl p-5 text-center">
          <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <X size={24} className="text-navy-400" />
          </div>
          <p className="font-semibold text-navy-700 mb-1">Request Rejected</p>
          <p className="text-sm text-navy-500">This request has been declined.</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
