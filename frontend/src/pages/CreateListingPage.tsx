import { useState, useEffect } from 'react';
import { ImagePicker } from '../components/ui/ImagePicker';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { ArrowLeft, Check } from 'lucide-react';

interface Category { id: string; name: string; icon: string; }

const MIN_TITLE = 5;
const MIN_DESCRIPTION = 10;

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditing = Boolean(editId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [listingLoading, setListingLoading] = useState(isEditing);
  const [listingError, setListingError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    categoryId: '', title: '', description: '', pricePerDay: '',
    pricePerWeek: '', pricePerMonth: '', deposit: '', negotiable: true,
    condition: 'good', locationName: '', availableFrom: new Date().toISOString().slice(0, 10), availableUntil: '',
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    api.get('/rentals/categories').then(res => {
      setCategories(res.data.categories || []);
      setCategoriesLoading(false);
    }).catch((err: unknown) => {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Failed to load categories');
      setCategoriesLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!editId) return;
    setListingLoading(true);
    api.get(`/rentals/${editId}`).then(res => {
      const listing = res.data.listing;
      if (!listing) {
        setListingError('This listing no longer exists');
        return;
      }
      setForm({
        categoryId: listing.category_id || '',
        title: listing.title || '',
        description: listing.description || '',
        pricePerDay: listing.price_per_day != null ? String(listing.price_per_day) : '',
        pricePerWeek: listing.price_per_week != null ? String(listing.price_per_week) : '',
        pricePerMonth: listing.price_per_month != null ? String(listing.price_per_month) : '',
        deposit: listing.deposit != null ? String(listing.deposit) : '',
        negotiable: Boolean(listing.negotiable),
        condition: listing.condition || 'good',
        locationName: listing.location_name || '',
        availableFrom: listing.available_from ? String(listing.available_from).slice(0, 10) : '',
        availableUntil: listing.available_until ? String(listing.available_until).slice(0, 10) : '',
      });
      setImageUrls(listing.image_urls || []);
    }).catch(() => setListingError('Failed to load this listing'))
      .finally(() => setListingLoading(false));
  }, [editId]);

  const update = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.categoryId) errors.categoryId = 'Please select a category';
    if (!form.title.trim()) errors.title = 'Title is required';
    else if (form.title.trim().length < MIN_TITLE) errors.title = `Title must be at least ${MIN_TITLE} characters`;
    if (!form.description.trim()) errors.description = 'Description is required';
    else if (form.description.trim().length < MIN_DESCRIPTION) errors.description = `Description must be at least ${MIN_DESCRIPTION} characters`;
    if (!form.pricePerDay || parseFloat(form.pricePerDay) < 1) errors.pricePerDay = 'Price per day is required (min ₹1)';
    if (!form.condition) errors.condition = 'Please select a condition';
    if (!form.availableFrom) errors.availableFrom = 'Availability start date is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      setError('Please fix the highlighted fields below.');
      return;
    }

    setLoading(true);
    try {
      const data = {
        categoryId: form.categoryId,
        title: form.title.trim(),
        description: form.description.trim(),
        pricePerDay: parseFloat(form.pricePerDay),
        pricePerWeek: form.pricePerWeek ? parseFloat(form.pricePerWeek) : undefined,
        pricePerMonth: form.pricePerMonth ? parseFloat(form.pricePerMonth) : undefined,
        deposit: form.deposit ? parseFloat(form.deposit) : undefined,
        negotiable: form.negotiable,
        condition: form.condition,
        locationLat: 30.3165,
        locationLng: 78.0322,
        locationName: form.locationName.trim() || 'Dehradun',
        availableFrom: form.availableFrom,
        availableUntil: form.availableUntil || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      };
      const res = isEditing
        ? await api.put(`/rentals/${editId}`, data)
        : await api.post('/rentals', data);
      navigate(`/rent/${res.data.listing.id}`);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string; code?: string; fields?: Record<string, string> } } };
      const data = apiErr.response?.data;

      if (data?.code === 'VALIDATION_ERROR' && data?.fields) {
        setFieldErrors(data.fields);
        setError(data.error || 'Please fix the highlighted fields below.');
      } else {
        setError(data?.error || `Failed to ${isEditing ? 'save' : 'create'} listing. Please try again.`);
      }
    }
    setLoading(false);
  };

  const isFormValid = form.categoryId && form.title.trim().length >= MIN_TITLE && form.description.trim().length >= MIN_DESCRIPTION && form.pricePerDay && parseFloat(form.pricePerDay) >= 1 && form.availableFrom;

  return (
    <div className="w-full relative pb-16">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#F6FBD4] hover:bg-white text-[#1B1250] border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] rounded-full text-xs font-black mb-5 transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        <ArrowLeft size={16} strokeWidth={2.5} /> Back
      </button>

      {/* Main Sticker Card Container */}
      <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[28px] shadow-[6px_8px_0_#1B1250] p-5 sm:p-7 relative overflow-hidden">
        {/* Title */}
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#1B1250] tracking-tight leading-tight mb-6">
          {isEditing ? (
            <>
              Edit <span className="inline-block bg-[#FFD41F] px-2 py-0.5 rounded-[8px] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] -rotate-1">Listing</span>
            </>
          ) : (
            <>
              List an Item for <span className="inline-block bg-[#C5F030] px-2 py-0.5 rounded-[8px] border-2 border-[#1B1250] shadow-[2px_2px_0_#1B1250] -rotate-1">Rent</span>
            </>
          )}
        </h1>

        {error && (
          <div className="mb-5 p-3.5 bg-[#E8622B]/15 border-2.5 border-[#E8622B] rounded-[18px]">
            <p className="text-xs font-black text-[#E8622B]">⚠️ {error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-[10px] font-black text-[#E8622B] underline mt-1 uppercase tracking-wider"
            >
              Dismiss
            </button>
          </div>
        )}

        {listingLoading || categoriesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-white/70 border-2.5 border-[#1B1250]/30 rounded-[18px] animate-pulse" />
            ))}
          </div>
        ) : listingError ? (
          <div className="p-4 bg-[#E8622B]/15 border-2.5 border-[#E8622B] rounded-[18px]">
            <p className="text-xs font-black text-[#E8622B]">⚠️ {listingError}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Category Grid: Square Sticker Cards */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#1B1250] mb-2.5">
                Category <span className="text-[#E8622B]">*</span>
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {categories.map((cat, index) => {
                  const isSelected = form.categoryId === cat.id;
                  const tiltClass = index % 2 === 0 ? '-rotate-2' : 'rotate-2';

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => update('categoryId', cat.id)}
                      className={`aspect-square flex flex-col items-center justify-center p-2.5 rounded-[20px] transition-all duration-200 select-none cursor-pointer border-3 border-[#1B1250] ${
                        isSelected
                          ? `bg-[#C5F030] text-[#1B1250] shadow-[4px_5px_0_#1B1250] scale-[1.05] ${tiltClass} z-10`
                          : 'bg-white hover:bg-[#F6FBD4] text-[#1B1250] shadow-[2px_3px_0_#1B1250] active:scale-95'
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl block mb-1.5 transition-transform">
                        {cat.icon}
                      </span>
                      <span className="text-[11px] font-black text-[#1B1250] leading-tight text-center line-clamp-2">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {fieldErrors.categoryId && (
                <p className="text-xs font-black text-[#E8622B] mt-1.5 flex items-center gap-1">
                  ⚠️ {fieldErrors.categoryId}
                </p>
              )}
            </div>

            {/* Title with min 5 characters counter */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#1B1250] mb-1.5">
                Title <span className="text-[#E8622B]">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="e.g., Sony Projector - Great for presentations"
                className={`w-full px-4 py-3.5 bg-white border-3 border-[#1B1250] rounded-[20px] shadow-[3px_4px_0_#1B1250] focus:shadow-[4px_6px_0_#1B1250] focus:outline-none text-[#1B1250] font-bold text-sm placeholder:text-[#1B1250]/40 transition-all ${
                  fieldErrors.title ? 'border-[#E8622B] shadow-[3px_4px_0_#E8622B]' : ''
                }`}
              />

              <div className="flex justify-between items-center mt-1.5 px-1">
                {fieldErrors.title ? (
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#E8622B]">
                    ⚠️ {fieldErrors.title}
                  </p>
                ) : (
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#1B1250]/60">
                    MIN {MIN_TITLE} CHARACTERS
                  </p>
                )}
                <p
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    form.title.length < MIN_TITLE && form.title.length > 0
                      ? 'text-[#E8622B]'
                      : 'text-[#1B1250]/70'
                  }`}
                >
                  {form.title.length} / {MIN_TITLE}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#1B1250] mb-1.5">
                Description <span className="text-[#E8622B]">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Describe your item, its condition, any accessories included..."
                className={`w-full px-4 py-3.5 bg-white border-3 border-[#1B1250] rounded-[20px] shadow-[3px_4px_0_#1B1250] focus:shadow-[4px_6px_0_#1B1250] focus:outline-none min-h-[120px] resize-none text-[#1B1250] font-bold text-sm placeholder:text-[#1B1250]/40 transition-all ${
                  fieldErrors.description ? 'border-[#E8622B] shadow-[3px_4px_0_#E8622B]' : ''
                }`}
              />

              <div className="flex justify-between items-center mt-1.5 px-1">
                {fieldErrors.description ? (
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#E8622B]">
                    ⚠️ {fieldErrors.description}
                  </p>
                ) : (
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#1B1250]/60">
                    MIN {MIN_DESCRIPTION} CHARACTERS
                  </p>
                )}
                <p
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    form.description.trim().length > 0 && form.description.trim().length < MIN_DESCRIPTION
                      ? 'text-[#E8622B]'
                      : 'text-[#1B1250]/70'
                  }`}
                >
                  {form.description.trim().length} / {MIN_DESCRIPTION}
                </p>
              </div>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#1B1250] mb-1.5">
                Photos
              </label>
              <div className="bg-white border-2.5 border-[#1B1250] rounded-[20px] p-3.5 shadow-[2px_3px_0_#1B1250]">
                <ImagePicker value={imageUrls} onChange={setImageUrls} max={5} />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#1B1250] mb-1.5">
                Condition <span className="text-[#E8622B]">*</span>
              </label>
              <select
                value={form.condition}
                onChange={e => update('condition', e.target.value)}
                className={`w-full px-4 py-3 bg-white border-3 border-[#1B1250] rounded-[20px] shadow-[3px_4px_0_#1B1250] focus:shadow-[4px_6px_0_#1B1250] text-[#1B1250] font-bold text-sm focus:outline-none cursor-pointer ${
                  fieldErrors.condition ? 'border-[#E8622B]' : ''
                }`}
              >
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
              {fieldErrors.condition && (
                <p className="text-xs font-black text-[#E8622B] mt-1.5">⚠️ {fieldErrors.condition}</p>
              )}
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#1B1250] mb-1.5">
                  ₹/Day <span className="text-[#E8622B]">*</span>
                </label>
                <input
                  type="number"
                  value={form.pricePerDay}
                  onChange={e => update('pricePerDay', e.target.value)}
                  placeholder="0"
                  min="1"
                  className={`w-full px-3.5 py-2.5 bg-white border-2.5 border-[#1B1250] rounded-[18px] shadow-[2px_3px_0_#1B1250] text-[#1B1250] font-bold text-sm focus:outline-none ${
                    fieldErrors.pricePerDay ? 'border-[#E8622B]' : ''
                  }`}
                />
                {fieldErrors.pricePerDay && (
                  <p className="text-[10px] font-black text-[#E8622B] mt-1">⚠️ {fieldErrors.pricePerDay}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#1B1250] mb-1.5">
                  ₹/Week
                </label>
                <input
                  type="number"
                  value={form.pricePerWeek}
                  onChange={e => update('pricePerWeek', e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2.5 bg-white border-2.5 border-[#1B1250] rounded-[18px] shadow-[2px_3px_0_#1B1250] text-[#1B1250] font-bold text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#1B1250] mb-1.5">
                  ₹/Month
                </label>
                <input
                  type="number"
                  value={form.pricePerMonth}
                  onChange={e => update('pricePerMonth', e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2.5 bg-white border-2.5 border-[#1B1250] rounded-[18px] shadow-[2px_3px_0_#1B1250] text-[#1B1250] font-bold text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#1B1250] mb-1.5">
                  Deposit
                </label>
                <input
                  type="number"
                  value={form.deposit}
                  onChange={e => update('deposit', e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3.5 py-2.5 bg-white border-2.5 border-[#1B1250] rounded-[18px] shadow-[2px_3px_0_#1B1250] text-[#1B1250] font-bold text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Price is negotiable checkbox */}
            <div
              onClick={() => update('negotiable', !form.negotiable)}
              className="flex items-center gap-3 p-3 bg-white border-2.5 border-[#1B1250] rounded-[18px] shadow-[2px_2px_0_#1B1250] cursor-pointer select-none active:translate-x-0.5 active:translate-y-0.5"
            >
              <div
                className={`w-5 h-5 rounded-md border-2 border-[#1B1250] flex items-center justify-center transition-colors ${
                  form.negotiable ? 'bg-[#C5F030]' : 'bg-white'
                }`}
              >
                {form.negotiable && <Check size={14} strokeWidth={3} className="text-[#1B1250]" />}
              </div>
              <label htmlFor="negotiable" className="text-xs font-black text-[#1B1250] cursor-pointer">
                Price is negotiable
              </label>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#1B1250] mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={form.locationName}
                onChange={e => update('locationName', e.target.value)}
                placeholder="e.g., Near Graphic Era University, Dehradun"
                className="w-full px-4 py-3.5 bg-white border-3 border-[#1B1250] rounded-[20px] shadow-[3px_4px_0_#1B1250] focus:shadow-[4px_6px_0_#1B1250] text-[#1B1250] font-bold text-sm placeholder:text-[#1B1250]/40 focus:outline-none transition-all"
              />
              <p className="text-[10px] font-black uppercase tracking-wider text-[#1B1250]/60 mt-1.5 px-1">
                Your exact location is never shared publicly
              </p>
            </div>

            {/* Availability Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#1B1250] mb-1.5">
                  Available From <span className="text-[#E8622B]">*</span>
                </label>
                <input
                  type="date"
                  value={form.availableFrom}
                  onChange={e => update('availableFrom', e.target.value)}
                  className={`w-full px-3.5 py-3 bg-white border-2.5 border-[#1B1250] rounded-[18px] shadow-[2px_3px_0_#1B1250] text-[#1B1250] font-bold text-xs focus:outline-none ${
                    fieldErrors.availableFrom ? 'border-[#E8622B]' : ''
                  }`}
                />
                {fieldErrors.availableFrom && (
                  <p className="text-[10px] font-black text-[#E8622B] mt-1">⚠️ {fieldErrors.availableFrom}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#1B1250] mb-1.5">
                  Available Until
                </label>
                <input
                  type="date"
                  value={form.availableUntil}
                  onChange={e => update('availableUntil', e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border-2.5 border-[#1B1250] rounded-[18px] shadow-[2px_3px_0_#1B1250] text-[#1B1250] font-bold text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Big Lime Post / Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-full font-display font-black text-base uppercase tracking-wider select-none transition-all duration-150 flex items-center justify-center gap-2 bg-[#C5F030] hover:bg-[#bcf01a] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_6px_0_#1B1250] active:translate-x-[2px] active:translate-y-[3px] active:shadow-[1px_1px_0_#1B1250] cursor-pointer disabled:opacity-50"
              >
                {loading
                  ? (isEditing ? 'Saving...' : 'Posting...')
                  : (isEditing ? 'Save Changes' : 'Post Listing ✨')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
