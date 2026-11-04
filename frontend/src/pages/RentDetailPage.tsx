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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-neo-card p-8 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#1B1250] border-t-[#C5F030]" />
          <span className="text-xs font-black text-[#1B1250] uppercase tracking-wider">Loading…</span>
        </div>
      </div>
    );
  }
  if (!listing) return null;

  const isOwner = user?.id === listing.owner_id;

  return (
    <div className="pb-28 max-w-lg mx-auto px-4 pt-4 bg-[#EAE4FB] min-h-screen">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo flex items-center justify-center mb-5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
      >
        <ArrowLeft size={18} className="text-[#1B1250]" />
      </button>

      {/* Owner review request banner */}
      {isOwner && incomingRequest && (
        <div className="bg-[#FFD41F] border-3 border-[#1B1250] rounded-[26px] shadow-neo-card p-4 mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-black text-[#1B1250] text-sm uppercase tracking-wide">New Rental Request</p>
            <p className="text-xs font-semibold text-[#1B1250]/70 truncate">{incomingRequest.requester_name || 'Someone'} requested to rent this item</p>
          </div>
          <button
            onClick={() => navigate(`/rentals/requests/${incomingRequest.id}`)}
            className="bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full font-display font-black uppercase px-4 py-2 text-xs active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all flex-shrink-0"
          >
            Review
          </button>
        </div>
      )}

      {/* Image gallery */}
      <div className="relative bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[28px] shadow-neo-card overflow-hidden mb-5">
        {/* Negotiable badge */}
        {listing.negotiable && (
          <span className="bg-[#3F8A12] text-white text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-[#1B1250] rotate-2 absolute -top-2 -right-2 z-10 select-none">
            ✓ Negotiable
          </span>
        )}

        <div className="h-56 sm:h-72 bg-[#EAE4FB] relative">
          {listing.image_urls && listing.image_urls.length > 0 ? (
            <>
              <img src={listing.image_urls[currentImage]} alt={listing.title} className="w-full h-full object-cover" />
              {listing.image_urls.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {listing.image_urls.map((_, i) => (
                    <button key={i} onClick={() => setCurrentImage(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImage ? 'bg-[#C5F030] w-4 border border-[#1B1250]' : 'bg-white/70'}`} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-24 h-24 bg-[#C5F030] rounded-full border-3 border-[#1B1250] shadow-neo flex items-center justify-center text-5xl">
                {listing.category_icon || '📦'}
              </div>
            </div>
          )}
        </div>

        <div className="p-5">
          {/* Title */}
          <h1 className="font-display font-black text-2xl text-[#1B1250] mb-4 leading-tight">{listing.title}</h1>

          {/* Info pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#1B1250] bg-[#FFD41F] text-[#1B1250] text-xs font-black shadow-neo-sm">
              <DollarSign size={12} /> ₹{listing.price_per_day}/day
            </span>
            {listing.location_name && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#1B1250] bg-[#2FA3B5] text-white text-xs font-black shadow-neo-sm">
                <MapPin size={12} /> {listing.location_name}
              </span>
            )}
            {listing.condition && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#1B1250] bg-[#E8622B] text-white text-xs font-black shadow-neo-sm capitalize">
                {listing.condition.replace('_', ' ')}
              </span>
            )}
            {listing.price_per_week && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#1B1250] bg-[#F6FBD4] text-[#1B1250] text-xs font-bold shadow-neo-sm">
                ₹{listing.price_per_week}/wk
              </span>
            )}
            {listing.price_per_month && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#1B1250] bg-[#F6FBD4] text-[#1B1250] text-xs font-bold shadow-neo-sm">
                ₹{listing.price_per_month}/mo
              </span>
            )}
          </div>

          {/* Owner row */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-[#1B1250] text-[#F6FBD4] font-black flex items-center justify-center border-2 border-[#1B1250] ring-2 ring-[#E8622B] flex-shrink-0">
              <span className="text-sm">{listing.owner_name?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-[#1B1250] text-sm truncate">{listing.owner_name}</p>
              <p className="text-xs text-[#1B1250]/50 font-semibold">{listing.owner_city || 'Dehradun'}</p>
            </div>
          </div>

          {/* Progressive disclosure sections */}
          {[
            { key: 'details', label: 'Details', content: (
              <p className="text-sm font-semibold text-[#1B1250] leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            )},
            { key: 'availability', label: 'Availability', content: (
              <div className="space-y-1 text-sm font-semibold text-[#1B1250]">
                <p className="flex items-center gap-2"><Calendar size={14} /> From: {listing.available_from}</p>
                {listing.available_until && <p className="flex items-center gap-2"><Calendar size={14} /> Until: {listing.available_until}</p>}
                {listing.deposit && <p className="flex items-center gap-2"><DollarSign size={14} /> Deposit: ₹{listing.deposit}</p>}
              </div>
            )},
          ].map(section => (
            <div key={section.key} className="border-t-2 border-dashed border-[#1B1250]/20 first:border-0">
              <button
                onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                className="w-full flex items-center justify-between py-4 text-left"
              >
                <span className="text-xs font-black text-[#1B1250] uppercase tracking-wider">{section.label}</span>
                <ChevronDown size={16} className={`text-[#1B1250] transition-transform ${
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
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] rounded-full shadow-neo text-xs font-black uppercase active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Flag size={14} /> Report
          </button>
          <BlockButton targetUserId={listing.owner_id || ''} />
        </div>
      )}

      {/* Request Status — shown after request is sent */}
      {!isOwner && requestStatus && (
        <div className={`bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-neo-card p-6 text-center mb-5 ${
          requestStatus === 'accepted' ? 'shadow-[6px_8px_0_#3F8A12]' :
          requestStatus === 'rejected' ? 'shadow-[6px_8px_0_#E8622B]' :
          'shadow-[6px_8px_0_#FFD41F]'
        }`}>
          <div className={`w-16 h-16 rounded-full border-3 border-[#1B1250] flex items-center justify-center mx-auto mb-4 shadow-neo ${
            requestStatus === 'accepted' ? 'bg-[#C5F030]' :
            requestStatus === 'rejected' ? 'bg-[#E8622B]' :
            'bg-[#FFD41F]'
          }`}>
            {requestStatus === 'rejected' ? (
              <X size={32} className="text-[#1B1250]" />
            ) : (
              <CheckCircle size={32} className="text-[#1B1250]" />
            )}
          </div>
          <h3 className="font-display font-black text-xl text-[#1B1250] mb-2">
            {requestStatus === 'accepted' ? 'Rental accepted!' :
             requestStatus === 'rejected' ? 'Request declined' :
             'Request sent!'}
          </h3>
          <p className="text-sm font-semibold text-[#1B1250]/60 mb-5">
            {requestStatus === 'accepted' ? 'Chat with the owner to arrange pickup.' :
             requestStatus === 'rejected' ? 'The owner declined this request. Try another listing.' :
             'Waiting for the owner to respond.'}
          </p>
          {requestStatus === 'accepted' && (
            <button
              onClick={openChat}
              className="bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full font-display font-black uppercase px-6 py-3 active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all"
            >
              Open Chat
            </button>
          )}
          {requestStatus === 'rejected' && (
            <button
              onClick={() => setRequestStatus(null)}
              className="bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full font-display font-black uppercase px-6 py-3 active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* CTA — only for non-owners with no active request */}
      {!isOwner && !requestStatus && (
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => setShowRequestForm(true)}
            className="flex-1 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full font-display font-black uppercase py-3.5 active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all"
          >
            Request to Rent
          </button>
          <button
            onClick={openChat}
            className="w-14 h-14 bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo rounded-full flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <MessageCircle size={20} className="text-[#1B1250]" />
          </button>
        </div>
      )}

      {/* Request modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-[#1B1250]/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo-card w-full sm:max-w-md sm:rounded-[28px] rounded-t-[28px] p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <h2 className="font-display font-black text-2xl text-[#1B1250]">Request this item?</h2>
              <button
                onClick={() => { setShowRequestForm(false); setRequestError(null); }}
                className="w-8 h-8 rounded-full bg-[#EAE4FB] border-2 border-[#1B1250] flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Close"
              >
                <X size={16} className="text-[#1B1250]" />
              </button>
            </div>

            {requestError && (
              <div className="mb-4 p-3 bg-[#F6FBD4] border-3 border-[#E8622B] rounded-[20px] text-sm font-bold text-[#E8622B] whitespace-pre-line">
                {requestError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#1B1250] uppercase tracking-wider mb-1.5">When do you need it?</label>
                  <input
                    type="date"
                    value={requestForm.startDate}
                    onChange={e => setRequestForm({ ...requestForm, startDate: e.target.value })}
                    className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-neo-sm px-4 py-3.5 w-full focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#1B1250] uppercase tracking-wider mb-1.5">Until?</label>
                  <input
                    type="date"
                    value={requestForm.endDate}
                    onChange={e => setRequestForm({ ...requestForm, endDate: e.target.value })}
                    className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-neo-sm px-4 py-3.5 w-full focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-[#1B1250] uppercase tracking-wider mb-1.5">Add a message</label>
                <textarea
                  value={requestForm.message}
                  onChange={e => setRequestForm({ ...requestForm, message: e.target.value })}
                  className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-neo-sm px-4 py-3.5 w-full focus:outline-none resize-none"
                  rows={3}
                  placeholder="Tell the owner about your needs..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowRequestForm(false); setRequestError(null); }}
                className="flex-1 py-3.5 bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] rounded-full font-display font-black uppercase shadow-neo active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRequest}
                disabled={submitting || !requestForm.startDate || !requestForm.endDate}
                className="flex-1 py-3.5 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] rounded-full font-display font-black uppercase shadow-neo active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
              >
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
