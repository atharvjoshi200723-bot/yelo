import { Link } from 'react-router-dom';
import { MapPin, ArrowLeft, Compass } from 'lucide-react';
import { useEffect } from 'react';
import { Mascot, DoodleStar, HandwrittenNote, CloudSticker } from '../components/neo/Decorations';

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
    <div className="min-h-screen bg-[#EAE4FB] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      {/* Floating candy-ball SVG decorations */}
      <svg className="absolute top-10 left-8 animate-candy-float" width="54" height="54" viewBox="0 0 54 54" aria-hidden="true">
        <circle cx="27" cy="27" r="26" fill="#E8622B" stroke="#1B1250" strokeWidth="3" />
        <circle cx="17" cy="17" r="7" fill="white" fillOpacity="0.3" />
      </svg>
      <svg className="absolute top-16 right-10 animate-candy-float-slow" width="42" height="42" viewBox="0 0 42 42" aria-hidden="true">
        <circle cx="21" cy="21" r="20" fill="#2FA3B5" stroke="#1B1250" strokeWidth="3" />
        <circle cx="13" cy="13" r="5" fill="white" fillOpacity="0.3" />
      </svg>
      <svg className="absolute bottom-20 right-16 animate-candy-float-reverse" width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
        <circle cx="19" cy="19" r="18" fill="#FFD41F" stroke="#1B1250" strokeWidth="3" />
        <circle cx="12" cy="12" r="4" fill="white" fillOpacity="0.3" />
      </svg>

      {/* Big emoji in cream sticker circle with Mascot */}
      <div className="relative mb-6 animate-pop-in flex items-center justify-center gap-3">
        <CloudSticker size={32} />
        <div className="w-24 h-24 bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo rounded-[26px] flex items-center justify-center relative">
          <span className="text-4xl" role="img" aria-label="Map">🗺️</span>
          <DoodleStar color="pink" size={24} rotate={15} className="absolute -top-2.5 -right-2.5" />
        </div>
        <Mascot size={42} mood="wink" waving />
      </div>

      {/* Heading */}
      <h1 className="font-display font-black text-4xl text-[#1B1250] mb-3 leading-tight">
        Looks like you've<br />wandered off
      </h1>

      <p className="font-bold text-[#1B1250]/70 text-sm sm:text-base max-w-xs mb-3">
        This place isn't on the map yet.
      </p>

      {/* Location pill */}
      <div className="inline-flex items-center gap-1.5 bg-[#FFD41F] border-3 border-[#1B1250] rounded-full px-4 py-1.5 shadow-neo-sm mb-8">
        <MapPin size={13} className="text-[#1B1250]" />
        <span className="text-xs font-black text-[#1B1250] uppercase tracking-wide">Dehradun · Unknown location</span>
      </div>

      {/* Primary CTA */}
      <Link
        to="/"
        className="w-full max-w-xs bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full font-display font-black uppercase py-3.5 flex items-center justify-center gap-2 mb-3 hover:translate-y-[-1px] transition-transform text-sm"
      >
        <ArrowLeft size={16} />
        Back to YELO
      </Link>

      {/* Suggestions label */}
      <p className="text-xs font-black text-[#1B1250]/50 tracking-wider uppercase mt-4 mb-3">
        Or explore nearby
      </p>

      {/* Suggestions grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {SUGGESTIONS.map((s, i) => (
          <Link
            key={s.path}
            to={s.path}
            style={{ transform: `rotate(${i % 2 === 0 ? '-1deg' : '1deg'})` }}
            className="bg-[#F6FBD4] border-3 border-[#1B1250] shadow-neo rounded-[24px] py-3 px-4 text-left flex items-center gap-2 hover:translate-y-[-1px] transition-transform"
          >
            <span className="text-lg">{s.emoji}</span>
            <span className="text-xs font-black text-[#1B1250]">{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
