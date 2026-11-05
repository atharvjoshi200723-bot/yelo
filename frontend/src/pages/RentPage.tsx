import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import { RentalListing } from '../types';
import { Search, Plus, MapPin, Package, ChevronDown } from 'lucide-react';
import { ErrorState, EmptyState, GridSkeleton } from '../components/ui/FeedbackStates';
import {
  CandyBall,
  WavyHighlight,
  DoodleStar,
  DoodleSquiggle,
  HandwrittenNote,
  Mascot,
  ChaiCupSticker,
} from '../components/neo/Decorations';

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
  const { user } = useAuth();
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

  // Real-time: prepend new listings from other users without a reload
  const filtersRef = useRef({ searchQuery, selectedCategory, sort, userId: user?.id });
  useEffect(() => {
    filtersRef.current = { searchQuery, selectedCategory, sort, userId: user?.id };
  }, [searchQuery, selectedCategory, sort, user]);
  useEffect(() => {
    let socket: ReturnType<typeof getSocket> | null = null;
    try { socket = getSocket(); } catch { /* not signed in */ }
    if (!socket) return;
    const onListing = (listing: RentalListing) => {
      const f = filtersRef.current;
      if (f.userId && listing.owner_id === f.userId) return;
      if (f.selectedCategory && listing.category_id !== f.selectedCategory) return;
      if (f.searchQuery) {
        const q = f.searchQuery.toLowerCase();
        if (!listing.title.toLowerCase().includes(q) && !(listing.description || '').toLowerCase().includes(q)) return;
      }
      if (f.sort !== 'recent') return;
      setListings(prev => prev.some(l => l.id === listing.id) ? prev : [listing, ...prev]);
    };
    socket.on('listing_created', onListing);
    return () => { socket?.off('listing_created', onListing); };
  }, []);

  const handleSearch = () => { setPage(1); fetchListings(1, false); };

  const handleQuickSearch = (term: string) => {
    setSearchQuery(term);
    setPage(1);
    setTimeout(() => fetchListings(1, false), 0);
  };

  return (
    <div className="w-full relative pb-12">
      {/* Orange-Themed Hero Header Section */}
      <div className="relative mb-6 bg-[#E8622B] border-3 border-[#1B1250] rounded-[28px] shadow-[6px_8px_0_#1B1250] p-5 sm:p-6 overflow-hidden">
        {/* Decorative candy ball in corner */}
        <div className="absolute -top-3 -right-3 pointer-events-none opacity-85">
          <CandyBall color="yellow" size={72} float />
        </div>

        {/* Heading */}
        <div className="flex items-start justify-between relative z-10 mb-4">
          <h1
            className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-[1.08]"
            style={{ textShadow: '2px 2px 0 #1B1250' }}
          >
            What do you <br />
            <span className="inline-flex items-center gap-2 mt-1">
              <WavyHighlight>need today?</WavyHighlight>
              <DoodleStar color="yellow" size={24} rotate={15} />
            </span>
          </h1>
          <div className="hidden xs:flex flex-col items-end pt-1">
            <HandwrittenNote rotate={-3} className="text-[#FFD41F] drop-shadow-[1px_1px_0_#1B1250]">
              rent & save ₹
            </HandwrittenNote>
            <DoodleSquiggle color="#FFD41F" width={48} height={12} className="mt-0.5" />
          </div>
        </div>

        {/* Big Cream Search Bar with Navy Border & Hard Shadow */}
        <div className="relative z-10 mb-3">
          <Search size={20} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1B1250]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full pl-12 pr-4 py-3.5 bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] shadow-[3px_4px_0_#1B1250] text-[#1B1250] font-bold placeholder:text-[#1B1250]/45 placeholder:font-medium focus:shadow-[4px_6px_0_#1B1250] focus:bg-white focus:outline-none transition-all text-sm"
            placeholder="Search for something..."
          />
        </div>

        {/* Quick Search Suggestion Chips: Small Lime Pills */}
        <div className="flex gap-2 flex-wrap items-center relative z-10 mb-3">
          {QUICK_SEARCHES.map(term => (
            <button
              key={term}
              type="button"
              onClick={() => handleQuickSearch(term)}
              className="px-3 py-1 bg-[#C5F030] hover:bg-[#bcf01a] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] rounded-full text-xs font-black text-[#1B1250] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              [{term}]
            </button>
          ))}
        </div>

        {/* "My Listing" Button: Cream Pill Button with Box Icon */}
        <div className="relative z-10 pt-1">
          <Link
            to="/rent/my-listings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F6FBD4] hover:bg-white border-2.5 border-[#1B1250] shadow-[3px_3px_0_#1B1250] rounded-full text-xs font-black text-[#1B1250] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Package size={15} strokeWidth={2.5} className="text-[#E8622B]" />
            <span>My Listing</span>
          </Link>
        </div>
      </div>

      {/* Stats Bar & Dropdowns (Big Stat Style) */}
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[24px] shadow-[4px_5px_0_#1B1250] p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Big Stat Count */}
        <div>
          <div className="text-[11px] font-black uppercase tracking-wider text-[#1B1250]/70">
            Within {radius === '50' ? 'Dehradun' : `${radius} km`}
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-display font-black text-3xl sm:text-4xl text-[#1B1250] leading-none">
              {listings.length}
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-[#1B1250]">
              things available
            </span>
          </div>
        </div>

        {/* Pill Selects with Navy Border */}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="appearance-none text-xs font-black bg-white border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] rounded-full pl-3.5 pr-7 py-1.5 text-[#1B1250] focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={13} strokeWidth={3} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#1B1250]" />
          </div>

          <div className="relative">
            <select
              value={radius}
              onChange={e => setRadius(e.target.value)}
              className="appearance-none text-xs font-black bg-white border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] rounded-full pl-3.5 pr-7 py-1.5 text-[#1B1250] focus:outline-none cursor-pointer"
            >
              <option value="1">1 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">Entire Dehradun</option>
            </select>
            <ChevronDown size={13} strokeWidth={3} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#1B1250]" />
          </div>
        </div>
      </div>

      {/* Categories Horizontal Scroll Chips */}
      <div className="flex gap-2.5 mb-6 overflow-x-auto no-scrollbar py-2 px-1 -mx-2 scroll-smooth">
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap border-3 border-[#1B1250] transition-all duration-150 select-none ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            !selectedCategory
              ? 'bg-[#C5F030] text-[#1B1250] shadow-[3px_4px_0_#1B1250] scale-[1.02]'
              : 'bg-[#F6FBD4] text-[#1B1250] shadow-[2px_3px_0_#1B1250] hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#1B1250]'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black whitespace-nowrap border-3 border-[#1B1250] transition-all duration-150 select-none ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              selectedCategory === cat.id
                ? 'bg-[#C5F030] text-[#1B1250] shadow-[3px_4px_0_#1B1250] scale-[1.02]'
                : 'bg-[#F6FBD4] text-[#1B1250] shadow-[2px_3px_0_#1B1250] hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#1B1250]'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Listings Grid (Sticker Cards) */}
      {loading ? (
        <GridSkeleton count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchListings(1, false)} />
      ) : listings.length === 0 ? (
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] p-8 -rotate-1 text-center">
          <EmptyState
            emoji="📦"
            title="Nothing found nearby"
            description="Try a different search or be the first to list something"
            action={{ label: 'List something', to: '/rent/create' }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {listings.map((listing, i) => {
            const isLarge = i % 5 === 0;
            const rotation = i % 2 === 0 ? '-rotate-1 hover:rotate-0' : 'rotate-1 hover:rotate-0';
            const staggerClass = `stagger-${Math.min((i % 5) + 1, 5)}`;

            return (
              <Link
                key={listing.id}
                to={`/rent/${listing.id}`}
                className={`bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[24px] shadow-[4px_6px_0_#1B1250] hover:shadow-[6px_8px_0_#1B1250] overflow-hidden transition-all duration-200 group relative flex flex-col animate-sticker-slap ${staggerClass} ${rotation} ${
                  isLarge ? 'col-span-2' : ''
                }`}
              >
                {/* Large Emoji / Image Area */}
                <div className={`relative ${isLarge ? 'h-48 sm:h-56' : 'h-36'} bg-white border-b-2.5 border-[#1B1250] overflow-hidden flex items-center justify-center`}>
                  {listing.image_urls && listing.image_urls.length > 0 ? (
                    <img
                      src={listing.image_urls[0]}
                      alt={`Rent: ${listing.title}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#EAE4FB]/50 flex items-center justify-center">
                      <span className={`${isLarge ? 'text-6xl' : 'text-4xl'}`}>
                        {listing.category_icon || '📦'}
                      </span>
                    </div>
                  )}

                  {/* "Negotiable" as a Green Rotated Badge */}
                  {listing.negotiable && (
                    <span className="absolute top-2.5 right-2.5 bg-[#3F8A12] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] -rotate-3 uppercase tracking-wider">
                      Negotiable
                    </span>
                  )}

                  {/* "2 views" as a Navy Pill */}
                  {listing.views > 0 && (
                    <span className="absolute bottom-2.5 left-2.5 bg-[#1B1250] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250]">
                      {listing.views} views
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-3.5 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className={`font-display font-black text-[#1B1250] line-clamp-1 group-hover:text-[#E8622B] transition-colors ${
                      isLarge ? 'text-lg' : 'text-sm'
                    }`}>
                      {listing.title}
                    </h3>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#1B1250]/70 mt-1">
                      <MapPin size={11} className="text-[#E8622B] shrink-0 fill-[#E8622B]" />
                      <span className="truncate">{listing.location_name || 'Dehradun'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t-2 border-[#1B1250]/15">
                    {/* Big Price with /day */}
                    <div className="flex items-baseline gap-1">
                      <span className={`font-display font-black text-[#1B1250] ${isLarge ? 'text-xl' : 'text-base'}`}>
                        ₹{listing.price_per_day}
                      </span>
                      <span className="text-[10px] font-black uppercase text-[#1B1250]/60">
                        /day
                      </span>
                    </div>

                    {listing.category_name && (
                      <span className="text-[10px] font-black text-[#1B1250] bg-white border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250] px-2 py-0.5 rounded-full truncate max-w-[80px]">
                        {listing.category_name}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Floating Action Button: "+ List Item" (Lime Pill with Navy 3px Outline) */}
      <div className="fixed right-4 sm:right-[max(1rem,calc((100vw-480px)/2+1rem))] bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-40">
        <Link
          to="/rent/create"
          className="inline-flex items-center gap-2 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_6px_0_#1B1250] rounded-full px-5 py-3 text-sm font-black tracking-tight select-none transition-all duration-200 hover:rotate-2 hover:animate-wiggle active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_#1B1250]"
          aria-label="List Item"
        >
          <Plus size={18} strokeWidth={3} className="shrink-0" />
          <span>+ List Item</span>
        </Link>
      </div>
    </div>
  );
}
