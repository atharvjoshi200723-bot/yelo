import { useState, useEffect } from 'react';
import { ImagePicker } from '../components/ui/ImagePicker';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { ArrowLeft } from 'lucide-react';
import { ErrorState } from '../components/ui/FeedbackStates';

interface Category { id: string; name: string; icon: string; }

const MIN_TITLE = 5;
const MIN_DESCRIPTION = 10;

export default function CreateListingPage() {
  const navigate = useNavigate();
  // /rent/edit/:id reuses this form to edit an existing listing.
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
    condition: 'good', locationName: '', availableFrom: '', availableUntil: '',
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

  // Editing: load the listing and fill the form with what is already there.
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
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  // Client-side validation matching backend rules
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
        // Backend returned structured field errors
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
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          {isEditing ? 'Edit Listing' : 'List an Item for Rent'}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-coral-50 border border-coral-200 rounded-xl">
            <p className="text-sm text-coral-600">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-coral-500 underline mt-1">Dismiss</button>
          </div>
        )}

        {listingLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-12 skeleton rounded-xl" />)}
          </div>
        ) : listingError ? (
          <div className="mb-4 p-3 bg-coral-50 border border-coral-200 rounded-xl">
            <p className="text-sm text-coral-600">{listingError}</p>
          </div>
        ) : categoriesLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-12 skeleton rounded-xl" />)}
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {categories.map(cat => (
                <button key={cat.id} type="button" onClick={() => update('categoryId', cat.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-colors ${
                    form.categoryId === cat.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <span className="text-2xl block mb-1">{cat.icon}</span>
                  <span className="text-xs text-slate-700">{cat.name}</span>
                </button>
              ))}
            </div>
            {fieldErrors.categoryId && <p className="text-xs text-coral-500 mt-1">{fieldErrors.categoryId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={e => update('title', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                fieldErrors.title ? 'border-coral-300 bg-coral-50/30' : 'border-slate-200'
              }`}
              placeholder="e.g., Sony Projector - Great for presentations" />
            <div className="flex justify-between mt-1">
              {fieldErrors.title ? (
                <p className="text-xs text-coral-500">{fieldErrors.title}</p>
              ) : (
                <p className="text-xs text-slate-400">Min {MIN_TITLE} characters</p>
              )}
              <p className={`text-xs ${form.title.length < MIN_TITLE && form.title.length > 0 ? 'text-coral-500' : 'text-slate-400'}`}>
                {form.title.length} / {MIN_TITLE}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[120px] ${
                fieldErrors.description ? 'border-coral-300 bg-coral-50/30' : 'border-slate-200'
              }`}
              placeholder="Describe your item, its condition, any accessories included..." />
            <div className="flex justify-between mt-1">
              {fieldErrors.description ? (
                <p className="text-xs text-coral-500">{fieldErrors.description}</p>
              ) : (
                <p className="text-xs text-slate-400">Min {MIN_DESCRIPTION} characters</p>
              )}
              <p className={`text-xs ${form.description.trim().length > 0 && form.description.trim().length < MIN_DESCRIPTION ? 'text-coral-500' : 'text-slate-400'}`}>
                {form.description.trim().length} / {MIN_DESCRIPTION}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Photos</label>
            <ImagePicker value={imageUrls} onChange={setImageUrls} max={5} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Condition *</label>
            <select value={form.condition} onChange={e => update('condition', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                fieldErrors.condition ? 'border-coral-300 bg-coral-50/30' : 'border-slate-200'
              }`}>
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
            {fieldErrors.condition && <p className="text-xs text-coral-500 mt-1">{fieldErrors.condition}</p>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">₹/Day *</label>
              <input type="number" value={form.pricePerDay} onChange={e => update('pricePerDay', e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  fieldErrors.pricePerDay ? 'border-coral-300 bg-coral-50/30' : 'border-slate-200'
                }`}
                placeholder="0" min="1" />
              {fieldErrors.pricePerDay && <p className="text-xs text-coral-500 mt-1">{fieldErrors.pricePerDay}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">₹/Week</label>
              <input type="number" value={form.pricePerWeek} onChange={e => update('pricePerWeek', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">₹/Month</label>
              <input type="number" value={form.pricePerMonth} onChange={e => update('pricePerMonth', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Deposit</label>
              <input type="number" value={form.deposit} onChange={e => update('deposit', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Optional" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="negotiable" checked={form.negotiable} onChange={e => update('negotiable', e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded" />
            <label htmlFor="negotiable" className="text-sm text-slate-700">Price is negotiable</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input type="text" value={form.locationName} onChange={e => update('locationName', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g., Near Graphic Era University, Dehradun" />
            <p className="text-xs text-slate-400 mt-1">Your exact location is never shared publicly</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Available From *</label>
              <input type="date" value={form.availableFrom} onChange={e => update('availableFrom', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  fieldErrors.availableFrom ? 'border-coral-300 bg-coral-50/30' : 'border-slate-200'
                }`} />
              {fieldErrors.availableFrom && <p className="text-xs text-coral-500 mt-1">{fieldErrors.availableFrom}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Available Until</label>
              <input type="date" value={form.availableUntil} onChange={e => update('availableUntil', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <button type="submit" disabled={loading || !isFormValid}
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Listing')}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
