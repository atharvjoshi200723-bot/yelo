import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { RentalListing } from '../types';
import { ArrowLeft, MapPin, Eye, Pencil, Trash2, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ErrorState, EmptyState, ListSkeleton } from '../components/ui/FeedbackStates';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-sage-500/15 text-sage-600',
  rented: 'bg-navy-100 text-navy-600',
  inactive: 'bg-cream-200 text-navy-500',
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
    <div className="pb-24">
      <button onClick={() => navigate('/rent')} className="flex items-center gap-2 py-2.5 -my-1 text-slate-600 hover:text-slate-800 mb-4">
        <ArrowLeft size={18} /> Rent
      </button>

      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-display-lg text-navy-900">My Listings</h1>
          <p className="text-sm text-navy-400 mt-1">
            {listings.length} {listings.length === 1 ? 'item' : 'items'} listed by you
          </p>
        </div>
        <Link
          to="/rent/create"
          className="flex items-center gap-2 bg-navy-900 text-cream-50 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-navy-800 transition-colors btn-press shrink-0"
        >
          <Plus size={16} /> New
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          emoji="📦"
          title="You have not listed anything yet"
          description="Items you list for rent will show up here so you can edit or remove them."
          action={{ label: 'List something', to: '/rent/create' }}
        />
      ) : (
        <div className="space-y-3">
          {listings.map(listing => (
            <div key={listing.id} className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <Link to={`/rent/${listing.id}`} className="flex gap-3 p-3">
                <div className="w-20 h-20 rounded-xl bg-navy-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {listing.image_urls && listing.image_urls.length > 0 ? (
                    <img src={listing.image_urls[0]} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-navy-900 text-sm truncate">{listing.title}</h2>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${STATUS_STYLES[listing.status] || 'bg-cream-200 text-navy-500'}`}>
                      {listing.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-navy-400 mt-1">
                    <MapPin size={10} />
                    <span className="truncate">{listing.location_name || 'Dehradun'}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-bold text-navy-900">
                      ₹{listing.price_per_day}
                      <span className="text-xs text-navy-400 font-normal">/day</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-navy-400">
                      <Eye size={12} /> {listing.views}
                    </span>
                    <span className="text-xs text-navy-400">
                      {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>

              <div className="flex items-stretch border-t border-navy-100/30">
                <button
                  onClick={() => navigate(`/rent/edit/${listing.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-navy-600 hover:bg-cream-50 transition-colors"
                >
                  <Pencil size={14} /> Edit
                </button>
                <div className="w-px bg-navy-100/30" />
                <button
                  onClick={() => { setRemoveError(null); setListingToRemove(listing); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-coral-500 hover:bg-coral-500/5 transition-colors"
                >
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Remove confirmation */}
      {listingToRemove && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-sm animate-slide-up shadow-lifted">
            <h3 className="font-display text-xl text-navy-900 mb-2">Remove this listing?</h3>
            <p className="text-sm text-navy-500 mb-4">
              “{listingToRemove.title}” will be taken down and can no longer be rented out. This cannot be undone.
            </p>
            {removeError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {removeError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setListingToRemove(null)}
                className="flex-1 py-3 text-navy-600 border border-navy-100/30 rounded-xl font-medium hover:bg-navy-50 transition-colors"
              >
                Keep it
              </button>
              <button
                onClick={() => removeListing(listingToRemove.id)}
                disabled={removing}
                className="flex-1 py-3 bg-coral-500 text-white rounded-xl font-medium hover:bg-coral-600 disabled:opacity-50 transition-colors btn-press"
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
