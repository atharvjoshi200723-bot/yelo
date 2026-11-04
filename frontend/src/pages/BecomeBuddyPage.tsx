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

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Precalculated 10-lobed scalloped stamp path centered at (20, 20) with r1=17, r2=14
const SCALLOP_PATH =
  'M 20.0 3.0 Q 20.0 3.0 22.2 4.8 Q 24.3 6.7 27.2 6.5 Q 30.0 6.2 30.7 9.0 Q 31.3 11.8 33.7 13.3 Q 36.2 14.7 35.1 17.4 Q 34.0 20.0 35.1 22.6 Q 36.2 25.3 33.7 26.7 Q 31.3 28.2 30.7 31.0 Q 30.0 33.8 27.2 33.5 Q 24.3 33.3 22.2 35.2 Q 20.0 37.0 17.8 35.2 Q 15.7 33.3 12.8 33.5 Q 10.0 33.8 9.3 31.0 Q 8.7 28.2 6.3 26.7 Q 3.8 25.3 4.9 22.6 Q 6.0 20.0 4.9 17.4 Q 3.8 14.7 6.3 13.3 Q 8.7 11.8 9.3 9.0 Q 10.0 6.2 12.8 6.5 Q 15.7 6.7 17.8 4.8 Z';

export default function BecomeBuddyPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<Record<string, unknown> | null>(null);

  // Form state - buddyType is always 'buddy' now, no selection needed
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
        // Always use 'buddy' type now
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
      case 1: return title.length >= 5 && description.length >= 10;
      case 2: return selectedActivities.length > 0;
      case 3: return availabilityDays.length > 0;
      case 4: return parseFloat(pricePerHour) > 0;
      case 5: return true;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        // Always 'buddy' - no type selection anymore
        buddyType: 'buddy',
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

  // Step labels: 5 steps
  const stepLabels = ['About You', 'Activities', 'Availability', 'Pricing', 'Preview'];

  return (
    <div className="pb-28 max-w-lg mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3.5 mb-6">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : navigate('/buddy'))}
          aria-label="Back"
          className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo flex items-center justify-center text-[#1B1250] hover:bg-white active:translate-x-[2px] active:translate-y-[3px] active:shadow-none transition-all flex-shrink-0"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <div className="flex-1">
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#9A63E6] border-2 border-[#1B1250] text-white text-[10px] font-black uppercase tracking-wider mb-1">
            Step {step} of {stepLabels.length} • {stepLabels[step - 1]}
          </div>
          <h1 className="font-display font-black text-2xl md:text-3xl text-[#1B1250] leading-tight tracking-tight">
            {existingProfile ? 'Edit Buddy Profile' : 'Become a Buddy'}
          </h1>
        </div>
      </div>

      {/* Progress Bar: 5 Scalloped Wavy-Edge Circles Connected by a Navy Line */}
      <div className="relative mb-8 px-2 py-3 bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo rounded-[22px]">
        {/* Navy connecting track line */}
        <div className="absolute top-[28px] left-8 right-8 h-[3px] bg-[#1B1250] z-0" />

        <div className="relative z-10 flex items-center justify-between">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < step;
            const isCurrent = stepNum === step;

            // Fill color based on state: completed = lime, current = purple, upcoming = cream
            const fillColor = isCompleted ? '#C5F030' : isCurrent ? '#9A63E6' : '#FFFFFF';
            const textColor = isCompleted ? '#1B1250' : isCurrent ? '#FFFFFF' : '#1B1250';

            return (
              <div
                key={label}
                className="flex flex-col items-center flex-1 cursor-pointer group"
                onClick={() => {
                  if (stepNum < step) setStep(stepNum);
                }}
              >
                {/* Scalloped Circle Stamp */}
                <div
                  className={`relative w-11 h-11 flex items-center justify-center transition-transform ${
                    isCurrent ? 'scale-110 drop-shadow-[2px_3px_0_#1B1250]' : 'group-hover:scale-105'
                  }`}
                >
                  <svg viewBox="0 0 40 40" className="w-full h-full">
                    <path
                      d={SCALLOP_PATH}
                      fill={fillColor}
                      stroke="#1B1250"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    className="absolute inset-0 flex items-center justify-center text-xs font-black"
                    style={{ color: textColor }}
                  >
                    {isCompleted ? <Check size={14} strokeWidth={3.5} /> : stepNum}
                  </span>
                </div>

                <span
                  className={`text-[9px] font-black uppercase tracking-wider mt-1.5 text-center leading-tight transition-colors ${
                    isCurrent
                      ? 'text-[#9A63E6]'
                      : isCompleted
                      ? 'text-[#1B1250]'
                      : 'text-[#1B1250]/40'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: About You */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-[#9A63E6] tracking-wider uppercase bg-[#9A63E6]/10 px-3 py-1 rounded-full border-2 border-[#1B1250]">
              About you
            </h2>
            <span className="text-[11px] font-bold text-[#1B1250]/70">
              Basic info for students & locals
            </span>
          </div>

          {/* Profile title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-[#1B1250] tracking-wider uppercase">
                Profile title <span className="text-[#E8622B]">*</span>
              </label>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1B1250] text-[#C5F030] text-[10px] font-black">
                {title.length}/200
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-neo focus:outline-none focus:border-[#9A63E6] transition-colors"
              placeholder="Love exploring cafes and watching movies"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-[#1B1250] tracking-wider uppercase">
                Description <span className="text-[#E8622B]">*</span>
              </label>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1B1250] text-[#C5F030] text-[10px] font-black">
                {description.length}/2000
              </span>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-neo focus:outline-none focus:border-[#9A63E6] resize-none transition-colors"
              rows={4}
              placeholder="Tell people about yourself. What do you like to do? What kind of companion are you?"
              maxLength={2000}
            />
          </div>

          {/* Profile photo upload */}
          <div>
            <label className="block text-xs font-black text-[#1B1250] tracking-wider uppercase mb-2">
              Profile photo
            </label>
            <div className="flex gap-3 items-start flex-wrap">
              {imageUrls.map((url, i) => (
                <div
                  key={i}
                  className="relative w-24 h-24 rounded-[22px] overflow-hidden bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo"
                >
                  <img src={url} alt="Buddy profile photo" loading="lazy" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(url)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-[#E8622B] border-2 border-[#1B1250] rounded-full flex items-center justify-center text-white shadow-sm hover:scale-110 transition-transform"
                    aria-label="Remove photo"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>
              ))}

              <label className="w-24 h-24 rounded-[22px] border-3 border-dashed border-[#1B1250] bg-[#F6FBD4] flex flex-col items-center justify-center cursor-pointer hover:bg-white shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                {uploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-[#1B1250]" />
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-[#C5F030] border-2 border-[#1B1250] flex items-center justify-center text-[#1B1250] mb-1">
                      <Upload size={18} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-[#1B1250] tracking-wider">
                      Upload
                    </span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Activities */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-[#9A63E6] tracking-wider uppercase bg-[#9A63E6]/10 px-3 py-1 rounded-full border-2 border-[#1B1250]">
              What can you do together?
            </h2>
            <span className="text-[11px] font-bold text-[#1B1250]/70">
              Select at least one activity
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {ACTIVITIES.map((act, index) => {
              const isSelected = selectedActivities.includes(act.name);
              const tilt = index % 2 === 0 ? '-rotate-1' : 'rotate-1';
              return (
                <button
                  key={act.name}
                  onClick={() => toggleActivity(act.name)}
                  className={`p-3.5 rounded-[20px] border-3 border-[#1B1250] text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[96px] ${
                    isSelected
                      ? `bg-[#C5F030] text-[#1B1250] shadow-neo-card scale-105 ${tilt}`
                      : 'bg-[#F6FBD4] text-[#1B1250] shadow-neo hover:bg-white hover:scale-102 active:translate-x-[2px] active:translate-y-[3px] active:shadow-none'
                  }`}
                >
                  <span className="text-3xl block mb-1.5 drop-shadow-sm">{act.emoji}</span>
                  <span className="text-xs font-black tracking-tight">{act.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Availability */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-[#9A63E6] tracking-wider uppercase bg-[#9A63E6]/10 px-3 py-1 rounded-full border-2 border-[#1B1250]">
              When are you available?
            </h2>
            <span className="text-[11px] font-bold text-[#1B1250]/70">Pick your free slots</span>
          </div>

          <div>
            <label className="block text-xs font-black text-[#1B1250] tracking-wider uppercase mb-2.5">
              Days <span className="text-[#E8622B]">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => {
                const isSelected = availabilityDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-full border-3 border-[#1B1250] text-xs font-black uppercase tracking-wider transition-all capitalize ${
                      isSelected
                        ? 'bg-[#C5F030] text-[#1B1250] shadow-neo scale-105'
                        : 'bg-[#F6FBD4] text-[#1B1250] shadow-neo hover:bg-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-[#1B1250] tracking-wider uppercase mb-2">
              Time range
            </label>
            <input
              type="text"
              value={availabilityTimes}
              onChange={e => setAvailabilityTimes(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-neo focus:outline-none focus:border-[#9A63E6] transition-colors"
              placeholder="e.g., 5 PM - 9 PM"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#1B1250] tracking-wider uppercase mb-2">
              City
            </label>
            <div className="relative">
              <MapPin
                size={18}
                strokeWidth={2.5}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1B1250]"
              />
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-neo focus:outline-none focus:border-[#9A63E6] transition-colors"
                placeholder="Dehradun"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Pricing */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-[#9A63E6] tracking-wider uppercase bg-[#9A63E6]/10 px-3 py-1 rounded-full border-2 border-[#1B1250]">
              Set your rate
            </h2>
            <span className="text-[11px] font-bold text-[#1B1250]/70">Simple per session pricing</span>
          </div>

          {/* Big price display card */}
          <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo-card rounded-[26px] p-6 text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FFD41F] border-2 border-[#1B1250] text-[10px] font-black uppercase tracking-wider text-[#1B1250] mb-3">
              Price per session
            </span>
            <div className="flex items-center justify-center gap-1.5 my-2">
              <span className="text-4xl font-display font-black text-[#1B1250]">₹</span>
              <input
                type="number"
                value={pricePerHour}
                onChange={e => setPricePerHour(e.target.value)}
                className="text-5xl md:text-6xl font-display font-black text-[#1B1250] bg-transparent w-44 text-center focus:outline-none border-b-3 border-[#1B1250]"
                min={1}
                max={10000}
              />
            </div>
            <p className="text-xs font-bold text-[#1B1250]/70 mt-2">/session (1-2 hours)</p>
          </div>

          {/* Negotiable switch card */}
          <button
            type="button"
            onClick={() => setNegotiable(!negotiable)}
            className="w-full p-4 rounded-[22px] bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo text-left transition-all flex items-center justify-between hover:bg-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <div>
              <p className="font-display font-black text-[#1B1250] text-sm">Negotiable</p>
              <p className="text-xs font-bold text-[#1B1250]/60">Allow price discussion in chat</p>
            </div>
            <div
              className={`w-14 h-8 rounded-full border-3 border-[#1B1250] relative transition-colors ${
                negotiable ? 'bg-[#C5F030]' : 'bg-[#EAE4FB]'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-[#1B1250] rounded-full transition-transform ${
                  negotiable ? 'left-[26px]' : 'left-0.5'
                }`}
              />
            </div>
          </button>

          {/* Safety note card */}
          <div className="bg-[#FFD41F]/30 border-3 border-[#1B1250] shadow-neo rounded-[22px] p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFD41F] border-2 border-[#1B1250] flex items-center justify-center text-[#1B1250] flex-shrink-0 mt-0.5">
              <Shield size={16} strokeWidth={2.5} />
            </div>
            <p className="text-xs font-bold text-[#1B1250] leading-relaxed">
              <span className="font-black uppercase tracking-wider underline">Payment note:</span> YELO does not handle payments directly.
              You and the requester agree on payment in chat. Meet in a public place.
            </p>
          </div>
        </div>
      )}

      {/* Step 5: Preview */}
      {step === 5 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-[#9A63E6] tracking-wider uppercase bg-[#9A63E6]/10 px-3 py-1 rounded-full border-2 border-[#1B1250]">
              Preview your profile
            </h2>
            <span className="text-[11px] font-bold text-[#1B1250]/70">Live sticker card look</span>
          </div>

          {/* Profile Card Preview */}
          <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo-card rounded-[28px] overflow-hidden -rotate-0.5">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-[#9A63E6] via-[#B79BF0] to-[#E8622B] p-6 text-center border-b-3 border-[#1B1250] relative">
              {imageUrls[0] ? (
                <img
                  src={imageUrls[0]}
                  alt="Buddy profile preview"
                  className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-3 border-[#1B1250] shadow-neo"
                />
              ) : (
                <div className="w-24 h-24 bg-[#FFD41F] rounded-full mx-auto mb-3 flex items-center justify-center border-3 border-[#1B1250] shadow-neo">
                  <span className="text-4xl font-black font-display text-[#1B1250]">
                    {user?.name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <h3 className="font-display font-black text-2xl text-white drop-shadow-[2px_2px_0_#1B1250]">
                {user?.name}
              </h3>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F6FBD4] border-2 border-[#1B1250] text-[#1B1250] text-xs font-black mt-2 shadow-sm">
                <MapPin size={12} strokeWidth={2.5} /> {city}
              </div>
            </div>

            <div className="p-6">
              <h4 className="font-display font-black text-[#1B1250] text-lg mb-1.5">{title}</h4>
              <p className="text-sm font-semibold text-[#1B1250]/80 italic mb-4 bg-white/70 p-3.5 rounded-[18px] border-2 border-[#1B1250]/20">
                "{description}"
              </p>

              <div className="flex flex-wrap gap-2 mb-5">
                {selectedActivities.map(act => {
                  const info = ACTIVITIES.find(a => a.name === act);
                  return (
                    <span
                      key={act}
                      className="px-3 py-1.5 bg-[#C5F030] rounded-full text-xs font-black text-[#1B1250] border-2 border-[#1B1250] shadow-sm flex items-center gap-1"
                    >
                      <span>{info?.emoji}</span>
                      <span>{act}</span>
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t-2 border-[#1B1250]/20">
                <div>
                  <span className="text-2xl font-black font-display text-[#1B1250]">₹{pricePerHour}</span>
                  <span className="text-xs font-bold text-[#1B1250]/60 ml-1">/session</span>
                  {negotiable && (
                    <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#3F8A12] text-white border border-[#1B1250] ml-2">
                      Negotiable
                    </span>
                  )}
                </div>
                <div className="text-right text-xs font-black text-[#1B1250]">
                  <p className="uppercase">{availabilityDays.map(d => d.slice(0, 3)).join(', ')}</p>
                  <p className="text-[#1B1250]/60 text-[11px] font-bold">{availabilityTimes}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Safety rule card */}
          <div className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo rounded-[22px] p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E8622B] border-2 border-[#1B1250] flex items-center justify-center text-white flex-shrink-0 mt-0.5">
              <Shield size={16} strokeWidth={2.5} />
            </div>
            <p className="text-xs font-bold text-[#1B1250] leading-relaxed">
              By publishing, you agree to YELO's safety rules. Social companionship only.
              No sexual services.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3.5 px-5 bg-[#F6FBD4] text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full font-display font-black uppercase text-sm hover:bg-white active:translate-x-[2px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowLeft size={16} strokeWidth={2.5} /> Back
          </button>
        )}

        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className={`flex-1 py-3.5 px-6 rounded-full font-display font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 transition-all ${
              canProceed()
                ? 'bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[3px] active:translate-y-[4px] active:shadow-none cursor-pointer'
                : 'bg-[#E0E2C8] text-[#1B1250]/40 border-3 border-[#1B1250]/40 cursor-not-allowed shadow-none'
            }`}
          >
            Next <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-4 px-6 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full font-display font-black uppercase text-base tracking-wider hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[3px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-3 border-[#1B1250]" />
            ) : (
              <>
                <Check size={20} strokeWidth={3} />
                <span>{existingProfile ? 'Update Profile' : 'Publish Buddy Profile'}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
