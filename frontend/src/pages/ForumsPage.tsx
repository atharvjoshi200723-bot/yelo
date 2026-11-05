import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { College } from '../types';
import { TrendingUp, Users, ArrowRight } from 'lucide-react';
import { ErrorState, ListSkeleton } from '../components/ui/FeedbackStates';
import {
  WavyHighlight,
  DoodleStar,
  DoodleSquiggle,
  HandwrittenNote,
} from '../components/neo/Decorations';

export default function ForumsPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCollege, setActiveCollege] = useState<string>('');

  useEffect(() => {
    api.get('/forums/colleges').then(res => {
      const data = res.data.colleges || [];
      setColleges(data);
      if (data.length > 0) setActiveCollege(data[0].slug);
      setLoading(false);
    }).catch((err: unknown) => {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Failed to load colleges');
      setLoading(false);
    });
  }, []);

  // Long college names are shortened for the tab strip, but extended if collisions occur
  const collegeLabels = useMemo(() => {
    const words = colleges.map(college => college.name.trim().split(/\s+/));
    const labels = colleges.map((college, i) =>
      college.name.length > 15 ? words[i].slice(0, 2).join(' ') : college.name
    );

    for (let depth = 3; depth <= 5; depth++) {
      const counts = new Map<string, number>();
      labels.forEach(label => counts.set(label, (counts.get(label) ?? 0) + 1));
      labels.forEach((label, i) => {
        if ((counts.get(label) ?? 0) > 1 && words[i].length >= depth) {
          labels[i] = words[i].slice(0, depth).join(' ');
        }
      });
    }

    return labels;
  }, [colleges]);

  if (loading) return <ListSkeleton count={3} height="h-20" />;

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const currentCollegeName = colleges.find(c => c.slug === activeCollege)?.name || 'campus';

  return (
    <div className="w-full relative pb-14">
      {/* Neo-Brutalist Heading with Wavy Highlight on "on campus?" */}
      <div className="mb-5 pt-1">
        <div className="flex items-start justify-between">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-[#1B1250] tracking-tight leading-[1.08]">
            What's happening <br />
            <span className="inline-flex items-center gap-2 mt-1">
              <WavyHighlight>on campus?</WavyHighlight>
              <DoodleStar color="teal" size={24} rotate={15} />
            </span>
          </h1>
          <div className="hidden xs:flex flex-col items-end pt-1">
            <HandwrittenNote rotate={-3} className="text-[#2FA3B5]">
              campus tea ☕
            </HandwrittenNote>
            <DoodleSquiggle color="#2FA3B5" width={44} height={12} className="mt-0.5" />
          </div>
        </div>
      </div>

      {/* College Tabs: Scrollable Chip Row (Selected = Lime) */}
      <div className="flex gap-2.5 mb-6 overflow-x-auto no-scrollbar py-2 px-1 -mx-2 scroll-smooth">
        {colleges.map((college, index) => {
          const isSelected = activeCollege === college.slug;
          return (
            <button
              key={college.id}
              type="button"
              onClick={() => setActiveCollege(college.slug)}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap border-3 border-[#1B1250] transition-all duration-150 select-none ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                isSelected
                  ? 'bg-[#C5F030] text-[#1B1250] shadow-[3px_4px_0_#1B1250] scale-[1.02]'
                  : 'bg-[#F6FBD4] text-[#1B1250] shadow-[2px_3px_0_#1B1250] hover:bg-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_#1B1250]'
              }`}
            >
              {collegeLabels[index]}
            </button>
          );
        })}
      </div>

      {/* Floating White Notification Card: Live Campus Signal */}
      <div className="bg-white border-3 border-[#1B1250] rounded-[24px] p-4.5 shadow-[0_12px_32px_-4px_rgba(27,18,80,0.18)] mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Pulsing Pink Dot (New Accent Color) */}
          <div className="relative flex h-3.5 w-3.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5C8A] opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#FF5C8A] border-2 border-[#1B1250]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#1B1250] bg-[#C5F030] px-2 py-0.5 rounded-full border-1.5 border-[#1B1250]">
                LIVE CAMPUS SIGNAL
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#1B1250] mt-1 leading-snug truncate">
              126 people active at {currentCollegeName} right now
            </p>
          </div>
        </div>

        {/* Users Icon Badge */}
        <div className="w-10 h-10 rounded-full bg-[#F6FBD4] border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] flex items-center justify-center shrink-0">
          <Users size={18} strokeWidth={2.5} className="text-[#1B1250]" />
        </div>
      </div>

      {/* 4 Colored Category Sticker Cards (Teal, Orange, Yellow, Purple) */}
      <div className="space-y-3.5 mb-5">
        {/* Academics (Teal, -1° tilt) */}
        <Link
          to={`/forums/${activeCollege}`}
          className="block bg-[#2FA3B5] text-white border-3 border-[#1B1250] rounded-[22px] p-4 shadow-[4px_5px_0_#1B1250] -rotate-1 hover:rotate-0 hover:shadow-[6px_7px_0_#1B1250] transition-all duration-150 active:translate-x-0.5 active:translate-y-0.5 group select-none"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white rounded-[16px] border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-white tracking-tight">ACADEMICS</h3>
                <p className="text-xs font-bold text-white/90 mt-0.5">Assignments · Exams · Teachers</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250] flex items-center justify-center text-[#1B1250] shrink-0">
              <ArrowRight size={16} strokeWidth={3} />
            </div>
          </div>
        </Link>

        {/* Life (Orange, +1° tilt) */}
        <Link
          to={`/forums/${activeCollege}`}
          className="block bg-[#E8622B] text-white border-3 border-[#1B1250] rounded-[22px] p-4 shadow-[4px_5px_0_#1B1250] rotate-1 hover:rotate-0 hover:shadow-[6px_7px_0_#1B1250] transition-all duration-150 active:translate-x-0.5 active:translate-y-0.5 group select-none"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white rounded-[16px] border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="text-2xl">🍕</span>
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-white tracking-tight">LIFE</h3>
                <p className="text-xs font-bold text-white/90 mt-0.5">Food · Hostel · Events</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250] flex items-center justify-center text-[#1B1250] shrink-0">
              <ArrowRight size={16} strokeWidth={3} />
            </div>
          </div>
        </Link>

        {/* Social (Yellow, -1° tilt) */}
        <Link
          to={`/forums/${activeCollege}`}
          className="block bg-[#FFD41F] text-[#1B1250] border-3 border-[#1B1250] rounded-[22px] p-4 shadow-[4px_5px_0_#1B1250] -rotate-1 hover:rotate-0 hover:shadow-[6px_7px_0_#1B1250] transition-all duration-150 active:translate-x-0.5 active:translate-y-0.5 group select-none"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white rounded-[16px] border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="text-2xl">🤝</span>
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-[#1B1250] tracking-tight">SOCIAL</h3>
                <p className="text-xs font-bold text-[#1B1250]/80 mt-0.5">Meetups · Clubs · Sports</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250] flex items-center justify-center text-[#1B1250] shrink-0">
              <ArrowRight size={16} strokeWidth={3} />
            </div>
          </div>
        </Link>

        {/* Random (Purple, +1° tilt) */}
        <Link
          to={`/forums/${activeCollege}`}
          className="block bg-[#9A63E6] text-white border-3 border-[#1B1250] rounded-[22px] p-4 shadow-[4px_5px_0_#1B1250] rotate-1 hover:rotate-0 hover:shadow-[6px_7px_0_#1B1250] transition-all duration-150 active:translate-x-0.5 active:translate-y-0.5 group select-none"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white rounded-[16px] border-2.5 border-[#1B1250] shadow-[2px_2px_0_#1B1250] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <span className="text-2xl">❓</span>
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-white tracking-tight">RANDOM</h3>
                <p className="text-xs font-bold text-white/90 mt-0.5">Questions · Memes · Off-topic</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250] flex items-center justify-center text-[#1B1250] shrink-0">
              <ArrowRight size={16} strokeWidth={3} />
            </div>
          </div>
        </Link>
      </div>

      {/* "Browse all discussions" — Lime Pill Button */}
      <div className="mb-7">
        <Link
          to={`/forums/${activeCollege}`}
          className="inline-flex items-center justify-center gap-2.5 w-full bg-[#C5F030] hover:bg-[#bcf01a] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full py-3.5 px-6 font-display font-black text-sm uppercase tracking-wider select-none active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0_#1B1250] transition-all text-center"
        >
          <span>Browse all discussions</span>
          <ArrowRight size={18} strokeWidth={3} />
        </Link>
      </div>

      {/* "People are talking about" Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-6 h-6 rounded-full bg-[#FFD41F] border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250] flex items-center justify-center text-[#1B1250]">
            <TrendingUp size={14} strokeWidth={3} />
          </div>
          <h2 className="text-xs font-black text-[#1B1250] tracking-wider uppercase">
            People are talking about
          </h2>
        </div>

        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[26px] shadow-[6px_8px_0_#1B1250] overflow-hidden -rotate-1">
          {[
            'DBMS assignment deadline',
            'Freshers event date',
            'Best momo near campus',
            'Exam schedule update',
          ].map((topic, i) => (
            <Link
              key={i}
              to={`/forums/${activeCollege}`}
              className={`flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-white select-none ${
                i < 3 ? 'border-b-2.5 border-[#1B1250]/15' : ''
              }`}
            >
              <span className="w-8 h-8 rounded-full bg-[#FFD41F] border-2 border-[#1B1250] shadow-[1px_1px_0_#1B1250] flex items-center justify-center font-display font-black text-xs text-[#1B1250] shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-display font-black text-[#1B1250] text-sm flex-1 truncate">
                {topic}
              </span>
              <ArrowRight size={14} strokeWidth={2.5} className="text-[#1B1250]/40 shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
