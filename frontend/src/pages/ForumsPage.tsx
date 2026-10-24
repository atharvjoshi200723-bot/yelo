import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { College } from '../types';
import { TrendingUp, Users, MessageSquare } from 'lucide-react';
import { ErrorState, EmptyState, ListSkeleton } from '../components/ui/FeedbackStates';

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

  if (loading) return <ListSkeleton count={3} height="h-20" />;

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="font-display text-display-lg text-navy-900 mb-2">
          What's happening<br />on campus?
        </h1>
      </div>

      {/* College tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto activity-scroll -mx-4 px-4 pb-2">
        {colleges.map(college => (
          <button key={college.id} onClick={() => setActiveCollege(college.slug)}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-2 ${
              activeCollege === college.slug
                ? 'text-navy-900 border-navy-900'
                : 'text-navy-400 border-transparent hover:text-navy-600'
            }`}>
            {college.name.length > 15 ? college.name.split(' ').slice(0, 2).join(' ') : college.name}
          </button>
        ))}
      </div>

      {/* Live campus signal */}
      <div className="bg-white rounded-2xl p-4 shadow-soft mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-sage-500 rounded-full animate-pulse" />
          <div>
            <p className="text-xs font-semibold text-navy-600">LIVE CAMPUS SIGNAL</p>
            <p className="text-sm text-navy-400">126 people active at {colleges.find(c => c.slug === activeCollege)?.name || 'campus'} right now</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-sage-500/10 rounded-xl flex items-center justify-center">
          <Users size={18} className="text-sage-600" />
        </div>
      </div>

      {/* Category groups */}
      <div className="bg-white rounded-2xl shadow-soft mb-6 overflow-hidden">
        <Link to={`/forums/${activeCollege}`} className="block">
          <div className="p-5">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">📚</span>
                <div>
                  <h3 className="font-semibold text-navy-900 text-sm">ACADEMICS</h3>
                  <p className="text-xs text-navy-400 mt-0.5">Assignments · Exams · Teachers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🍕</span>
                <div>
                  <h3 className="font-semibold text-navy-900 text-sm">LIFE</h3>
                  <p className="text-xs text-navy-400 mt-0.5">Food · Hostel · Events</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🤝</span>
                <div>
                  <h3 className="font-semibold text-navy-900 text-sm">SOCIAL</h3>
                  <p className="text-xs text-navy-400 mt-0.5">Meetups · Clubs · Sports</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">❓</span>
                <div>
                  <h3 className="font-semibold text-navy-900 text-sm">RANDOM</h3>
                  <p className="text-xs text-navy-400 mt-0.5">Questions · Memes · Off-topic</p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-5 py-3 bg-cream-50 border-t border-navy-100/20 flex items-center justify-between">
            <span className="text-xs font-medium text-navy-500">Browse all discussions</span>
            <span className="text-xs text-amber-600 font-medium">→</span>
          </div>
        </Link>
      </div>

      {/* Trending */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-amber-500" />
          <h2 className="text-sm font-semibold text-navy-500 tracking-wider uppercase">People are talking about</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          {[
            'DBMS assignment deadline',
            'Freshers event date',
            'Best momo near campus',
            'Exam schedule update',
          ].map((topic, i) => (
            <Link key={i} to={`/forums/${activeCollege}`}
              className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-cream-50 ${
                i < 3 ? 'border-b border-navy-100/20' : ''
              }`}>
              <span className="text-lg font-display text-navy-300 w-8">{String(i + 1).padStart(2, '0')}</span>
              <span className="font-medium text-navy-800 text-sm">{topic}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
