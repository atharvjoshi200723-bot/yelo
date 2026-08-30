import { Link } from 'react-router-dom';
import { MapPin, ArrowLeft, Compass } from 'lucide-react';
import { useEffect } from 'react';

const SUGGESTIONS = [
  { label: 'Home Feed', path: '/', emoji: '🏠' },
  { label: 'Rent Something', path: '/rent', emoji: '📦' },
  { label: 'Find a Buddy', path: '/buddy', emoji: '👥' },
  { label: 'Join a Forum', path: '/forums', emoji: '💬' },
];

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page Not Found — YELO';
    let tag = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'robots');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', 'noindex, nofollow');
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      {/* Animated compass icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-cream-200 rounded-3xl flex items-center justify-center animate-pulse-slow">
          <Compass size={40} className="text-navy-300" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center shadow-glow">
          <span className="text-navy-900 font-bold text-sm">?</span>
        </div>
      </div>

      {/* Headline */}
      <h1 className="font-display text-3xl sm:text-4xl text-navy-900 mb-3 leading-tight">
        Looks like you've<br />wandered off
      </h1>

      <p className="text-navy-400 text-sm sm:text-base max-w-xs mb-2">
        This place isn't on the map yet.
      </p>

      <div className="flex items-center gap-1.5 text-navy-300 text-xs mb-8">
        <MapPin size={12} />
        <span>Dehradun · Unknown location</span>
      </div>

      {/* Primary CTA */}
      <Link
        to="/"
        className="w-full max-w-xs bg-navy-900 text-cream-50 py-3.5 rounded-2xl font-medium hover:bg-navy-800 transition-all btn-press flex items-center justify-center gap-2 mb-3"
      >
        <ArrowLeft size={16} />
        Back to YELO
      </Link>

      {/* Secondary suggestions */}
      <p className="text-xs text-navy-400 font-medium tracking-wider uppercase mt-4 mb-3">
        Or explore nearby
      </p>

      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {SUGGESTIONS.map(s => (
          <Link
            key={s.path}
            to={s.path}
            className="bg-white border border-navy-100/30 rounded-xl py-3 px-4 text-left card-hover btn-press transition-all flex items-center gap-2"
          >
            <span className="text-lg">{s.emoji}</span>
            <span className="text-xs font-medium text-navy-700">{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
