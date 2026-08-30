import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, ArrowRight, Check, Upload, X, MapPin, Shield, AlertCircle } from 'lucide-react';

const ACTIVITIES = [
  { name: 'Coffee', emoji: '☕' },
  { name: 'Movies', emoji: '🎬' },
  { name: 'Walking', emoji: '🚶' },
  { name: 'Sports', emoji: '🏸' },
  { name: 'College Events', emoji: '🎓' },
  { name: 'Studying', emoji: '📚' },
  { name: 'Shopping', emoji: '🛍' },
  { name: 'Exploring', emoji: '🌄' },
  { name: 'Gaming', emoji: '🎮' },
  { name: 'Food', emoji: '🍕' },
  { name: 'Events', emoji: '🎉' },
  { name: 'Other', emoji: '✨' },
];

const BUDDY_TYPES = [
  { id: 'buddy', label: 'Buddy', emoji: '🧑‍🤝‍🧑', desc: 'General social companion' },
  { id: 'boyfriend', label: 'Boyfriend', emoji: '❤️', desc: 'Dating-style companionship (18+)', requiresAge: 18 },
  { id: 'girlfriend', label: 'Girlfriend', emoji: '💕', desc: 'Dating-style companionship (18+)', requiresAge: 18 },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function BecomeBuddyPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<Record<string, unknown> | null>(null);

  // Form state
  const [buddyType, setBuddyType] = useState('buddy');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [availabilityDays, setAvailabilityDays] = useState<string[]>([]);
  const [availabilityTimes, setAvailabilityTimes] = useState('5 PM - 9 PM');
  const [pricePerHour, setPricePerHour] = useState('200');
  const [negotiable, setNegotiable] = useState(true);
  const [city, setCity] = useState(user?.city || 'Dehradun');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/buddy/profile').then(res => {
      if (res.data.profile) {
        setExistingProfile(res.data.profile);
        setBuddyType(res.data.profile.buddy_type || 'buddy');
        setTitle(res.data.profile.title || '');
        setDescription(res.data.profile.description || '');
        setSelectedActivities(res.data.profile.activities || []);
        setAvailabilityDays(res.data.profile.availability_days || []);
        setAvailabilityTimes(res.data.profile.availability_times || '5 PM - 9 PM');
        setPricePerHour(String(res.data.profile.price_per_hour || 200));
        setNegotiable(!!res.data.profile.negotiable);
        setCity(res.data.profile.location_name || user?.city || 'Dehradun');
        setImageUrls(res.data.profile.image_urls || []);
      }
    }).catch(() => {});
  }, [user]);

  const calculateAge = (dob?: string): number | null => {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const age = calculateAge(user?.date_of_birth);
  const isUnder18 = age !== null && age < 18;

  const toggleActivity = (name: string) => {
    setSelectedActivities(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const toggleDay = (day: string) => {
    setAvailabilityDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('buddyImage', file);
      const res = await api.post('/buddy/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrls(prev => [...prev, res.data.imageUrl]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Unknown error';
      alert('Failed to upload image: ' + msg);
    }
    setUploading(false);
  };

  const removeImage = async (imageUrl: string) => {
    try {
      await api.delete('/buddy/profile/image', { data: { imageUrl } });
      setImageUrls(prev => prev.filter(u => u !== imageUrl));
    } catch { /* ignore */ }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return true;
      case 2: return title.length >= 5 && description.length >= 10;
      case 3: return selectedActivities.length > 0;
      case 4: return availabilityDays.length > 0;
      case 5: return parseFloat(pricePerHour) > 0;
      case 6: return true;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        buddyType,
        title,
        description,
        activities: selectedActivities,
        pricePerHour: parseFloat(pricePerHour),
        negotiable,
        availabilityDays,
        availabilityTimes,
        locationLat: 30.3165,
        locationLng: 78.0322,
        locationName: city,
        imageUrls,
      };

      if (existingProfile) {
        await api.patch('/buddy/profile', payload);
      } else {
        await api.post('/buddy/profile', payload);
      }
      await refreshUser();
      navigate('/buddy/manage');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      alert(apiErr.response?.data?.error || 'Failed to save buddy profile');
    }
    setLoading(false);
  };

  const stepLabels = ['Type', 'About You', 'Activities', 'Availability', 'Pricing', 'Preview'];

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/buddy')} className="text-navy-400 hover:text-navy-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-2xl text-navy-900">
            {existingProfile ? 'Edit Buddy Profile' : 'Become a Buddy'}
          </h1>
          <p className="text-xs text-navy-400">Step {step} of {stepLabels.length}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-1 mb-8">
        {stepLabels.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-amber-500' : 'bg-navy-100/30'}`} />
        ))}
      </div>

      {/* Under 18 Warning */}
      {isUnder18 && (
        <div className="bg-coral-50 border border-coral-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-coral-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-navy-600">
            <p className="font-semibold text-coral-700">Age restriction</p>
            <p>You must be 18+ to create a boyfriend/girlfriend buddy profile. You can still create a general Buddy profile.</p>
          </div>
        </div>
      )}

      {/* Step 1: Buddy Type */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-navy-500 tracking-wider uppercase">What kind of buddy?</h2>
          <div className="space-y-3">
            {BUDDY_TYPES.map(type => {
              const isDisabled = !!(type.requiresAge) && isUnder18;
              return (
                <button
                  key={type.id}
                  onClick={() => !isDisabled && setBuddyType(type.id)}
                  disabled={isDisabled}
                  className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4 ${
                    buddyType === type.id
                      ? 'bg-navy-900 text-cream-50'
                      : isDisabled
                        ? 'bg-navy-50 text-navy-300 cursor-not-allowed'
                        : 'bg-white border border-navy-100/30 text-navy-800 hover:border-navy-200'
                  }`}
                >
                  <span className="text-3xl">{type.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{type.label}</h3>
                    <p className={`text-xs ${buddyType === type.id ? 'text-cream-50/60' : 'text-navy-400'}`}>{type.desc}</p>
                  </div>
                  {buddyType === type.id && <Check size={20} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: About You */}
      {step === 2 && (
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-navy-500 tracking-wider uppercase">About you</h2>
          
          <div>
            <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-2">Profile title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-navy-100/30 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              placeholder="Love exploring cafes and watching movies"
              maxLength={200}
            />
            <p className="text-xs text-navy-400 mt-1">{title.length}/200</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-navy-100/30 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 resize-none"
              rows={4}
              placeholder="Tell people about yourself. What do you like to do? What kind of companion are you?"
              maxLength={2000}
            />
            <p className="text-xs text-navy-400 mt-1">{description.length}/2000</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-2">Profile photo</label>
            <div className="flex gap-3 items-start">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-2xl overflow-hidden bg-navy-100">
                  <img src={url} alt="Buddy profile photo" loading="lazy" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(url)} className="absolute top-1 right-1 bg-navy-900/60 rounded-full p-0.5">
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-navy-200 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition-colors">
                {uploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-navy-400" />
                ) : (
                  <>
                    <Upload size={18} className="text-navy-300" />
                    <span className="text-[10px] text-navy-400 mt-1">Upload</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Activities */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-navy-500 tracking-wider uppercase">What can you do together?</h2>
          <p className="text-xs text-navy-400">Select at least one activity</p>
          <div className="grid grid-cols-3 gap-3">
            {ACTIVITIES.map(act => (
              <button
                key={act.name}
                onClick={() => toggleActivity(act.name)}
                className={`p-4 rounded-2xl text-center transition-all ${
                  selectedActivities.includes(act.name)
                    ? 'bg-navy-900 text-cream-50'
                    : 'bg-cream-100 text-navy-700 hover:bg-cream-200'
                }`}
              >
                <span className="text-2xl block mb-1">{act.emoji}</span>
                <span className="text-xs font-medium">{act.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Availability */}
      {step === 4 && (
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-navy-500 tracking-wider uppercase">When are you available?</h2>
          
          <div>
            <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-3">Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all capitalize ${
                    availabilityDays.includes(day)
                      ? 'bg-navy-900 text-cream-50'
                      : 'bg-cream-100 text-navy-600 hover:bg-cream-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-2">Time range</label>
            <input
              type="text"
              value={availabilityTimes}
              onChange={e => setAvailabilityTimes(e.target.value)}
              className="w-full px-4 py-3 border border-navy-100/30 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              placeholder="e.g., 5 PM - 9 PM"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-400 tracking-wider uppercase mb-2">City</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300" />
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-navy-100/30 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                placeholder="Dehradun"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Pricing */}
      {step === 5 && (
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-navy-500 tracking-wider uppercase">Set your rate</h2>
          
          <div className="bg-cream-50 rounded-2xl p-6 text-center">
            <p className="text-xs font-semibold text-navy-400 tracking-wider uppercase mb-4">Price per session</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl text-navy-300">₹</span>
              <input
                type="number"
                value={pricePerHour}
                onChange={e => setPricePerHour(e.target.value)}
                className="text-5xl font-display text-navy-900 bg-transparent w-40 text-center focus:outline-none"
                min={1}
                max={10000}
              />
            </div>
            <p className="text-xs text-navy-400 mt-2">/session (1-2 hours)</p>
          </div>

          <button
            onClick={() => setNegotiable(!negotiable)}
            className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4 ${
              negotiable
                ? 'bg-sage-50 border border-sage-200'
                : 'bg-white border border-navy-100/30'
            }`}
          >
            <div className={`w-10 h-6 rounded-full transition-colors relative ${negotiable ? 'bg-sage-500' : 'bg-navy-200'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${negotiable ? 'left-[18px]' : 'left-0.5'}`} />
            </div>
            <div>
              <p className="font-medium text-navy-800 text-sm">Negotiable</p>
              <p className="text-xs text-navy-400">Allow price discussion in chat</p>
            </div>
          </button>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
            <Shield size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-navy-600 leading-relaxed">
              <span className="font-semibold">Payment note:</span> YELO does not handle payments directly. 
              You and the requester agree on payment in chat. Meet in a public place.
            </p>
          </div>
        </div>
      )}

      {/* Step 6: Preview */}
      {step === 6 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-navy-500 tracking-wider uppercase">Preview your profile</h2>
          
          <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
            {/* Header */}
            <div className={`p-6 text-center ${
              buddyType === 'boyfriend' ? 'bg-gradient-to-br from-rose-500 to-pink-600' :
              buddyType === 'girlfriend' ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600' :
              'bg-gradient-to-br from-amber-500 to-orange-600'
            }`}>
              {imageUrls[0] ? (
                <img src={imageUrls[0]} alt="Buddy profile preview" className="w-24 h-24 rounded-2xl mx-auto mb-3 object-cover border-2 border-white/30" />
              ) : (
                <div className="w-24 h-24 bg-white/20 rounded-2xl mx-auto mb-3 flex items-center justify-center border-2 border-white/30">
                  <span className="text-4xl font-bold text-white">{user?.name?.charAt(0) || '?'}</span>
                </div>
              )}
              <h3 className="font-display text-2xl text-white">{user?.name}</h3>
              <p className="text-white/70 text-sm mt-1">📍 {city}</p>
            </div>

            <div className="p-6">
              <h4 className="font-semibold text-navy-900 text-lg mb-1">{title}</h4>
              <p className="text-sm text-navy-500 italic mb-4">"{description}"</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {selectedActivities.map(act => {
                  const info = ACTIVITIES.find(a => a.name === act);
                  return (
                    <span key={act} className="px-3 py-1.5 bg-cream-100 rounded-full text-xs font-medium text-navy-700">
                      {info?.emoji} {act}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-navy-900">₹{pricePerHour}</span>
                  <span className="text-xs text-navy-400">/session</span>
                  {negotiable && <span className="text-xs text-sage-600 ml-2">Negotiable</span>}
                </div>
                <div className="text-right text-xs text-navy-400">
                  <p>{availabilityDays.map(d => d.slice(0, 3)).join(', ')}</p>
                  <p>{availabilityTimes}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
            <Shield size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-navy-600 leading-relaxed">
              By publishing, you agree to YELO's safety rules. Social companionship only. 
              No sexual services. 18+ for boyfriend/girlfriend categories.
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3.5 text-navy-500 border border-navy-100/30 rounded-2xl font-medium hover:bg-navy-50 transition-colors"
          >
            Back
          </button>
        )}
        {step < 6 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex-1 py-3.5 bg-navy-900 text-cream-50 rounded-2xl font-medium hover:bg-navy-800 disabled:opacity-50 transition-all btn-press flex items-center justify-center gap-2"
          >
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3.5 bg-amber-500 text-navy-900 rounded-2xl font-bold hover:bg-amber-400 disabled:opacity-50 transition-all btn-press flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-navy-900" />
            ) : (
              <>
                <Check size={18} /> {existingProfile ? 'Update Profile' : 'Publish Buddy Profile'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
