import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { RentalListing } from '../types';
import { Search, Plus, MapPin, Clock, ArrowRight } from 'lucide-react';
import { ErrorState, EmptyState, GridSkeleton } from '../components/ui/FeedbackStates';

interface Category { id: string; name: string; icon: string; slug: string; }

const QUICK_SEARCHES = ['projector', 'camera', 'bike', 'guitar', 'laptop'];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Newest' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'distance', label: 'Nearest' },
  { value: 'popular', label: 'Popular' },
];

export default function RentPage() {
  const [listings, setListings] = useState<RentalListing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [radius, setRadius] = useState('50');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    api.get('/rentals/categories').then(res => setCategories(res.data.categories || []));
    // Get user location for radius search
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 30.3165, lng: 78.0322 }) // Default: Dehradun
      );
    } else {
      setUserLocation({ lat: 30.3165, lng: 78.0322 });
    }
  }, []);

  const fetchListings = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { page: String(pageNum), limit: '20', sort, radius };
      if (userLocation) {
        params.lat = String(userLocation.lat);
        params.lng = String(userLocation.lng);
      }
      if (searchQuery) params.q = searchQuery;
      if (selectedCategory) params.categoryId = selectedCategory;
      const res = await api.get('/rentals/search', { params });
      const data = res.data.listings || [];
      setListings(prev => append ? [...prev, ...data] : data);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Failed to load listings');
    }
    setLoading(false);
  }, [searchQuery, selectedCategory, radius, sort, userLocation]);

  useEffect(() => { setPage(1); fetchListings(1, false); }, [fetchListings]);

  const handleSearch = () => { setPage(1); fetchListings(1, false); };

  const handleQuickSearch = (term: string) => {
    setSearchQuery(term);
    setPage(1);
    setTimeout(() => fetchListings(1, false), 0);
  };

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="font-display text-display-lg text-navy-900 mb-3">
          What do you<br />need today?
        </h1>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300" />
          <input type="text" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-navy-100/30 rounded-2xl text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-soft transition-all"
            placeholder="Search for something..." />
        </div>
        {/* Quick search tags */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {QUICK_SEARCHES.map(term => (
            <button key={term} onClick={() => handleQuickSearch(term)}
              className="px-3 py-1.5 bg-white border border-navy-100/30 rounded-full text-xs font-medium text-navy-500 hover:bg-navy-50 hover:border-navy-200 transition-all btn-press">
              [{term}]
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm font-semibold text-navy-700">Within {radius === '50' ? 'Dehradun' : `${radius} km`}</span>
          <span className="text-sm text-navy-400 ml-2">{listings.length} things available</span>
        </div>
        <div className="flex gap-2">
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="text-xs bg-white border border-navy-100/30 rounded-xl px-3 py-1.5 text-navy-500 focus:ring-2 focus:ring-amber-500/30">
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select value={radius} onChange={e => setRadius(e.target.value)}
            className="text-xs bg-white border border-navy-100/30 rounded-xl px-3 py-1.5 text-navy-500 focus:ring-2 focus:ring-amber-500/30">
            <option value="1">1 km</option>
            <option value="5">5 km</option>
            <option value="10">10 km</option>
            <option value="25">25 km</option>
            <option value="50">Entire Dehradun</option>
          </select>
        </div>
      </div>

      {/* Categories horizontal scroll */}
      <div className="flex gap-2 mb-6 overflow-x-auto activity-scroll pb-2 -mx-4 px-4">
        <button onClick={() => setSelectedCategory('')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 btn-press ${
            !selectedCategory ? 'bg-navy-900 text-cream-50' : 'bg-white text-navy-500 shadow-soft'
          }`}>
          All
        </button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 btn-press ${
              selectedCategory === cat.id ? 'bg-navy-900 text-cream-50' : 'bg-white text-navy-500 shadow-soft'
            }`}>
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Masonry-style listings grid */}
      {loading ? (
        <GridSkeleton count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchListings(1, false)} />
      ) : listings.length === 0 ? (
        <EmptyState
          emoji="📦"
          title="Nothing found nearby"
          description="Try a different search or be the first to list something"
          action={{ label: 'List something', to: '/rent/create' }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {listings.map((listing, i) => {
            const isLarge = i % 5 === 0;
            return (
              <Link key={listing.id} to={`/rent/${listing.id}`}
                className={`bg-white rounded-2xl overflow-hidden shadow-soft card-hover group ${
                  isLarge ? 'col-span-2 row-span-2' : ''
                }`}>
                <div className={`relative ${isLarge ? 'h-56' : 'h-32'} bg-navy-50 overflow-hidden`}>
                  {listing.image_urls && listing.image_urls.length > 0 ? (
                    <img src={listing.image_urls[0]} alt={`Rent: ${listing.title}`} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className={`${isLarge ? 'text-5xl' : 'text-3xl'}`}>{listing.category_icon || '📦'}</span>
                    </div>
                  )}
                  {listing.negotiable && (
                    <span className="absolute top-2 right-2 bg-sage-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Negotiable
                    </span>
                  )}
                  {listing.views > 0 && (
                    <span className="absolute bottom-2 left-2 bg-navy-900/70 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {listing.views} views
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className={`font-semibold text-navy-900 line-clamp-1 group-hover:text-amber-600 transition-colors ${isLarge ? 'text-base' : 'text-sm'}`}>
                    {listing.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-navy-400 mt-1">
                    <MapPin size={10} />
                    <span className="truncate">{listing.location_name || 'Dehradun'}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <span className={`font-bold text-navy-900 ${isLarge ? 'text-lg' : 'text-base'}`}>₹{listing.price_per_day}</span>
                      <span className="text-xs text-navy-400">/day</span>
                    </div>
                    {listing.category_name && (
                      <span className="text-[10px] text-navy-400 bg-navy-50 px-2 py-0.5 rounded-full">{listing.category_name}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create listing FAB */}
      <Link to="/rent/create"
        className="fixed bottom-24 right-4 sm:right-auto sm:ml-[22rem] bg-navy-900 text-cream-50 rounded-2xl px-5 py-3 shadow-lifted hover:bg-navy-800 transition-all duration-200 btn-press flex items-center gap-2 z-40">
        <Plus size={18} />
        <span className="text-sm font-medium">List Item</span>
      </Link>
    </div>
  );
}
