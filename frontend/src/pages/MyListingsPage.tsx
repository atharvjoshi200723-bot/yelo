import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { RentalListing } from '../types';
import { ArrowLeft, MapPin, Eye, Pencil, Trash2, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ErrorState, EmptyState, ListSkeleton } from '../components/ui/FeedbackStates';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#3F8A12] text-white border-2 border-[#1B1250] rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase',
  rented: 'bg-[#FFD41F] text-[#1B1250] border-2 border-[#1B1250] rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase',
  inactive: 'bg-[#1B1250]/20 text-[#1B1250] border-2 border-[#1B1250]/40 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase',
};

export default function MyListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<RentalListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listingToRemove, setListingToRemove] = useState<RentalListing | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => { fetchListings(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function fetchListings() {
    setLoading(true);
    setError(null);
    api.get('/rentals/my-listings')
      .then(res => {
        setListings(res.data.listings || []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const apiErr = err as { response?: { data?: { error?: string } } };
        setError(apiErr.response?.data?.error || 'Failed to load your listings');
        setLoading(false);
      });
  }

  const removeListing = async (id: string) => {
    setRemoving(true);
    setRemoveError(null);
    try {
      await api.delete(`/rentals/${id}`);
      setListings(prev => prev.filter(listing => listing.id !== id));
      setListingToRemove(null);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setRemoveError(apiErr.response?.data?.error || 'Could not remove this listing. Please try again.');
    }
    setRemoving(false);
  };

  if (loading) return <ListSkeleton count={3} height="h-24" />;

  if (error) return <ErrorState message={error} onRetry={() => fetchListings()} />;

  return (
    <div className="pb-24 px-4" style={{ backgroundColor: '#EAE4FB', minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between pt-6 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/rent')}
            className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo flex items-center justify-center flex-shrink-0 hover:shadow-neo-pressed transition-all"
          >
            <ArrowLeft size={18} className="text-[#1B1250]" />
          </button>
          <div>
            <h1 className="font-display font-black text-2xl text-[#1B1250]">My Listings</h1>
            <p className="text-xs font-black uppercase tracking-wider text-[#1B1250]/60">
              {listings.length} {listings.length === 1 ? 'item' : 'items'} listed by you
            </p>
          </div>
        </div>
        <Link
          to="/rent/create"
          className="flex items-center gap-1.5 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full px-4 py-2 font-black text-sm uppercase hover:shadow-neo-pressed transition-all"
        >
          <Plus size={15} /> New
        </Link>
      </div>

      {listings.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-20 h-20 rounded-[22px] border-3 border-[#1B1250] shadow-neo bg-[#E8622B] flex items-center justify-center mb-5">
            <span className="text-4xl">📦</span>
          </div>
          <p className="font-display font-black text-xl text-[#1B1250] mb-2">No listings yet</p>
          <p className="text-sm font-bold text-[#1B1250]/60 mb-6">Start renting out your stuff</p>
          <Link
            to="/rent/create"
            className="inline-flex items-center gap-2 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full px-6 py-2.5 font-black uppercase text-sm hover:shadow-neo-pressed transition-all"
          >
            Add your first listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing, idx) => {
            const rotate = idx % 2 === 0 ? '-rotate-1' : 'rotate-1';
            const statusClass = STATUS_STYLES[listing.status] || STATUS_STYLES.inactive;
            return (
              <div
                key={listing.id}
                className={`bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[24px] shadow-[4px_6px_0_#1B1250] overflow-hidden transition-all duration-200 hover:rotate-0 ${rotate}`}
              >
                <Link to={`/rent/${listing.id}`} className="flex gap-3 p-4">
                  {/* Thumbnail / emoji */}
                  <div className="flex-shrink-0">
                    {listing.image_urls && listing.image_urls.length > 0 ? (
                      <img
                        src={listing.image_urls[0]}
                        alt={listing.title}
                        className="w-20 h-20 rounded-[16px] border-2 border-[#1B1250] object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-[16px] border-2 border-[#1B1250] bg-[#EAE4FB] flex items-center justify-center text-3xl">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h2 className="font-display font-black text-base text-[#1B1250] truncate">{listing.title}</h2>
                      <span className={`flex-shrink-0 ${statusClass}`}>{listing.status}</span>
                    </div>

                    {/* Price + views row */}
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      <span className="bg-[#FFD41F] text-[#1B1250] border-2 border-[#1B1250] rounded-full px-2.5 py-0.5 text-[10px] font-black">
                        ₹{listing.price_per_day}/day
                      </span>
                      <span className="bg-[#1B1250] text-[#F6FBD4] text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Eye size={10} /> {listing.views} views
                      </span>
                    </div>

                    {/* Location + time */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#1B1250]/60">
                        <MapPin size={9} /> {listing.location_name || 'Dehradun'}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#1B1250]/60">
                        {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Action buttons */}
                <div className="flex items-center gap-2 px-4 pb-4">
                  <button
                    onClick={() => navigate(`/rent/edit/${listing.id}`)}
                    className="flex items-center gap-1.5 bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] shadow-neo-sm rounded-full px-4 py-1.5 text-xs font-black uppercase hover:shadow-neo-pressed transition-all"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => { setRemoveError(null); setListingToRemove(listing); }}
                    className="flex items-center gap-1.5 bg-[#E8622B] text-white border-3 border-[#1B1250] shadow-neo-sm rounded-full px-4 py-1.5 text-xs font-black uppercase hover:shadow-neo-pressed transition-all"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Remove confirmation dialog */}
      {listingToRemove && (
        <div className="fixed inset-0 bg-[#1B1250]/60 z-50 flex items-end justify-center">
          <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo-card rounded-[28px] rounded-b-none p-6 w-full max-w-lg animate-slide-up">
            <h3 className="font-display font-black text-xl text-[#1B1250] mb-2">Remove listing?</h3>
            <p className="text-sm font-bold text-[#1B1250]/70 mb-4">
              "<span className="text-[#1B1250]">{listingToRemove.title}</span>" will be taken down and can no longer be rented out. This cannot be undone.
            </p>

            {removeError && (
              <div className="mb-4 p-3 bg-[#E8622B]/10 border-2 border-[#E8622B] rounded-[16px] text-sm font-bold text-[#E8622B]">
                {removeError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setListingToRemove(null)}
                className="flex-1 py-3 bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] rounded-full font-black text-sm hover:shadow-neo-pressed transition-all"
              >
                Keep it
              </button>
              <button
                onClick={() => removeListing(listingToRemove.id)}
                disabled={removing}
                className="flex-1 py-3 bg-[#E8622B] text-white border-3 border-[#1B1250] rounded-full font-black text-sm disabled:opacity-50 hover:shadow-neo-pressed transition-all"
              >
                {removing ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
