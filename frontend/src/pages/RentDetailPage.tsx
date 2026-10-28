import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { RentalListing, RentalRequest } from '../types';
import { MapPin, Calendar, DollarSign, MessageCircle, ArrowLeft, ChevronDown, Star, Flag, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/moderation/ReportModal';
import BlockButton from '../components/moderation/BlockButton';

export default function RentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<RentalListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ message: '', startDate: '', endDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Request + conversation state
  const [requestStatus, setRequestStatus] = useState<string | null>(null); // 'pending' | 'accepted' | 'rejected'
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/rentals/${id}`).then(res => {
      setListing(res.data.listing);
      setLoading(false);
    }).catch(() => { navigate('/rent'); });
  }, [id]);

  // Check if current user already has a request for this listing
  useEffect(() => {
    if (!id || !user) return;
    api.get('/rentals/my-requests').then(res => {
      const requests = res.data.requests || [];
      const myRequest = requests.find((r: any) => r.listing_id === id);
      if (myRequest) {
        setRequestStatus(myRequest.status);
        // If accepted, find the conversation
        if (myRequest.status === 'accepted' && listing?.owner_id) {
          api.get(`/messages/find?userId=${listing.owner_id}&type=rental`).then(r => {
            if (r.data.conversationId) setConversationId(r.data.conversationId);
          }).catch(() => {});
        }
      }
    }).catch(() => {});
  }, [id, user, listing?.owner_id]);

  const handleRequest = async () => {
    if (!id || !requestForm.startDate || !requestForm.endDate) return;
    setRequestError(null);
    setSubmitting(true);
    try {
      await api.post(`/rentals/${id}/requests`, requestForm);
      setShowRequestForm(false);
      setRequestStatus('pending');
      setRequestForm({ message: '', startDate: '', endDate: '' });
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

  const [incomingRequest, setIncomingRequest] = useState<RentalRequest | null>(null);

  // Check incoming requests if current user is owner
  useEffect(() => {
    if (!id || !user || !listing || user.id !== listing.owner_id) return;
    api.get('/rentals/incoming-requests').then(res => {
      const requests = res.data.requests || [];
      const match = requests.find((r: RentalRequest) => r.listing_id === id && r.status === 'pending');
      if (match) {
        setIncomingRequest(match);
      }
    }).catch(() => {});
  }, [id, user, listing]);

  const openChat = async () => {
    if (conversationId) {
      navigate(`/messages?conv=${conversationId}`);
      return;
    }
    if (listing?.owner_id) {
      try {
        const res = await api.post('/messages', {
          otherUserId: listing.owner_id,
          type: 'rental',
          title: listing.title,
        });
        if (res.data.id) {
          navigate(`/messages?conv=${res.data.id}`);
        }
      } catch {
        alert('Unable to open chat right now. Please try again.');
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900" /></div>;
  if (!listing) return null;

  const isOwner = user?.id === listing.owner_id;

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-navy-400 hover:text-navy-600 mb-4 text-sm font-medium transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Owner review request banner */}
      {isOwner && incomingRequest && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 mb-5 flex items-center justify-between gap-3 animate-fade-in shadow-soft">
          <div className="min-w-0">
            <p className="font-semibold text-amber-900 text-sm">New Rental Request</p>
            <p className="text-xs text-amber-700 truncate">{incomingRequest.requester_name || 'Someone'} requested to rent this item</p>
          </div>
          <button
            onClick={() => navigate(`/rentals/requests/${incomingRequest.id}`)}
            className="px-4 py-2 bg-navy-900 text-cream-50 rounded-xl text-xs font-semibold hover:bg-navy-800 transition-colors btn-press flex-shrink-0"
          >
            Review Request
          </button>
        </div>
      )}

      {/* Image */}
      <div className="bg-white rounded-3xl shadow-soft overflow-hidden mb-6">
        <div className="h-56 sm:h-72 bg-navy-50 relative">
          {listing.image_urls && listing.image_urls.length > 0 ? (
            <>
              <img src={listing.image_urls[currentImage]} alt={listing.title} className="w-full h-full object-cover" />
              {listing.image_urls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {listing.image_urls.map((_, i) => (
                    <button key={i} onClick={() => setCurrentImage(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImage ? 'bg-white w-4' : 'bg-white/50'}`} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {listing.category_icon || '📦'}
            </div>
          )}
        </div>

        <div className="p-5">
          {/* Title + condition */}
          <div className="flex items-start justify-between mb-3">
            <h1 className="font-display text-display-sm text-navy-900">{listing.title}</h1>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
              listing.condition === 'new' ? 'bg-sage-500/10 text-sage-600' :
              listing.condition === 'like_new' ? 'bg-navy-100 text-navy-600' :
              listing.condition === 'good' ? 'bg-amber-500/10 text-amber-600' :
              'bg-coral-500/10 text-coral-500'
            }`}>
              {listing.condition?.replace('_', ' ')}
            </span>
          </div>

          {/* Price + location */}
          <div className="flex items-center gap-4 text-sm text-navy-400 mb-4">
            <span className="flex items-center gap-1"><MapPin size={14} /> {listing.location_name}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> Available from {listing.available_from}</span>
          </div>

          {/* Price card */}
          <div className="bg-cream-100 rounded-2xl p-4 mb-5">
            <div className="flex items-end gap-6">
              <div>
                <p className="text-[10px] font-semibold text-navy-400 tracking-wider uppercase">Per Day</p>
                <p className="text-2xl font-bold text-navy-900">₹{listing.price_per_day}</p>
              </div>
              {listing.price_per_week && (
                <div>
                  <p className="text-[10px] font-semibold text-navy-400 tracking-wider uppercase">Per Week</p>
                  <p className="text-lg font-semibold text-navy-700">₹{listing.price_per_week}</p>
                </div>
              )}
              {listing.price_per_month && (
                <div>
                  <p className="text-[10px] font-semibold text-navy-400 tracking-wider uppercase">Per Month</p>
                  <p className="text-lg font-semibold text-navy-700">₹{listing.price_per_month}</p>
                </div>
              )}
            </div>
            {listing.negotiable && (
              <p className="text-xs text-sage-600 mt-2 font-medium">✓ Price is negotiable</p>
            )}
          </div>

          {/* Progressive disclosure sections */}
          {[
            { key: 'details', label: 'Details', content: (
              <p className="text-sm text-navy-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            )},
            { key: 'owner', label: 'Owner', content: (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-navy-900 rounded-2xl flex items-center justify-center">
                  <span className="text-cream-50 font-medium text-sm">{listing.owner_name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-navy-900 text-sm">{listing.owner_name}</p>
                  <p className="text-xs text-navy-400">{listing.owner_city || 'Dehradun'}</p>
                </div>
              </div>
            )},
            { key: 'availability', label: 'Availability', content: (
              <div className="space-y-1 text-sm text-navy-600">
                <p>From: {listing.available_from}</p>
                {listing.available_until && <p>Until: {listing.available_until}</p>}
                {listing.deposit && <p>Deposit: ₹{listing.deposit}</p>}
              </div>
            )},
          ].map(section => (
            <div key={section.key} className="border-b border-navy-100/20 last:border-0">
              <button onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                className="w-full flex items-center justify-between py-4 text-left">
                <span className="font-medium text-navy-800 text-sm">{section.label}</span>
                <ChevronDown size={16} className={`text-navy-400 transition-transform ${
                  expandedSection === section.key ? 'rotate-180' : ''
                }`} />
              </button>
              {expandedSection === section.key && (
                <div className="pb-4 animate-slide-up">{section.content}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Report & Block Actions */}
      {!isOwner && (
        <div className="flex gap-3 mb-6">
          <button onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cream-50 text-navy-500 rounded-xl text-sm font-medium hover:bg-cream-100 transition-colors">
            <Flag size={16} /> Report
          </button>
          <BlockButton targetUserId={listing.owner_id || ''} />
        </div>
      )}

      {/* Request Status — shown after request is sent */}
      {!isOwner && requestStatus && (
        <div className={`rounded-3xl p-6 text-center mb-6 ${
          requestStatus === 'accepted' ? 'bg-sage-50 border border-sage-200' :
          requestStatus === 'rejected' ? 'bg-coral-50 border border-coral-200' :
          'bg-amber-50 border border-amber-200'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            requestStatus === 'accepted' ? 'bg-sage-500' :
            requestStatus === 'rejected' ? 'bg-coral-500' :
            'bg-amber-500'
          }`}>
            {requestStatus === 'rejected' ? (
              <X size={32} className="text-white" />
            ) : (
              <CheckCircle size={32} className="text-white" />
            )}
          </div>
          <h3 className="font-display text-xl text-navy-900 mb-2">
            {requestStatus === 'accepted' ? 'Rental accepted!' :
             requestStatus === 'rejected' ? 'Request declined' :
             'Request sent!'}
          </h3>
          <p className="text-sm text-navy-500 mb-4">
            {requestStatus === 'accepted' ? 'Chat with the owner to arrange pickup.' :
             requestStatus === 'rejected' ? 'The owner declined this request. Try another listing.' :
             'Waiting for the owner to respond.'}
          </p>
          {requestStatus === 'accepted' && (
            <button onClick={openChat}
              className="bg-navy-900 text-cream-50 px-6 py-3 rounded-2xl font-medium hover:bg-navy-800 transition-all btn-press">
              Open Chat
            </button>
          )}
          {requestStatus === 'rejected' && (
            <button onClick={() => setRequestStatus(null)}
              className="bg-navy-900 text-cream-50 px-6 py-3 rounded-2xl font-medium hover:bg-navy-800 transition-all btn-press">
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* CTA — only for non-owners with no active request */}
      {!isOwner && !requestStatus && (
        <div className="flex gap-3">
          <button onClick={() => setShowRequestForm(true)}
            className="flex-1 bg-navy-900 text-cream-50 py-3.5 rounded-2xl font-medium hover:bg-navy-800 transition-all btn-press">
            Request to Rent
          </button>
          <button onClick={openChat}
            className="w-14 h-14 bg-white border border-navy-100/30 rounded-2xl flex items-center justify-center hover:bg-navy-50 transition-colors">
            <MessageCircle size={20} className="text-navy-600" />
          </button>
        </div>
      )}

      {/* Request modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <h2 className="font-display text-display-sm text-navy-900">Request this item?</h2>
              <button onClick={() => { setShowRequestForm(false); setRequestError(null); }}
                className="p-2 -mt-1 -mr-2 hover:bg-navy-50 rounded-xl transition-colors" aria-label="Close">
                <X size={20} className="text-navy-400" />
              </button>
            </div>

            {requestError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 whitespace-pre-line">
                {requestError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-navy-400 tracking-wider uppercase mb-1.5">When do you need it?</label>
                  <input type="date" value={requestForm.startDate} onChange={e => setRequestForm({ ...requestForm, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-navy-100/30 rounded-xl text-sm text-navy-800 focus:ring-2 focus:ring-amber-500/30" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-navy-400 tracking-wider uppercase mb-1.5">Until?</label>
                  <input type="date" value={requestForm.endDate} onChange={e => setRequestForm({ ...requestForm, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-navy-100/30 rounded-xl text-sm text-navy-800 focus:ring-2 focus:ring-amber-500/30" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-navy-400 tracking-wider uppercase mb-1.5">Add a message</label>
                <textarea value={requestForm.message} onChange={e => setRequestForm({ ...requestForm, message: e.target.value })}
                  className="w-full px-4 py-3 border border-navy-100/30 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-amber-500/30 resize-none"
                  rows={3} placeholder="Tell the owner about your needs..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowRequestForm(false); setRequestError(null); }}
                className="flex-1 py-3 text-navy-500 border border-navy-100/30 rounded-2xl font-medium hover:bg-navy-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleRequest}
                disabled={submitting || !requestForm.startDate || !requestForm.endDate}
                className="flex-1 py-3 bg-navy-900 text-cream-50 rounded-2xl font-medium hover:bg-navy-800 disabled:opacity-50 transition-all btn-press">
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          targetType="listing"
          targetId={listing.id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
