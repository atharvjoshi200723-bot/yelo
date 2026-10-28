import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGoogleSignInUrl, googleRedirectUrl, googleErrorMessage } from '../lib/googleAuth';
const SAFETY_RULES = [
  'Meet publicly and keep personal details private until you trust someone',
  'No harassment, hate speech, or inappropriate behavior on YELO',
  'You must be 16+ to use this app',
  'Report anyone who breaks these rules using the in-app report tool',
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    dateOfBirth: '', gender: 'prefer_not_to_say', city: 'Dehradun', college: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Same flow as the login page: fetch the Google URL, then navigate to it, so
  // the browser never parks on the backend host while it boots.
  const startGoogle = async () => {
    setGoogleConnecting(true);
    setError('');
    const result = await getGoogleSignInUrl('register');
    if (result.ok) {
      window.location.href = result.url;
      return;
    }
    if (result.reason === 'legacy') {
      window.location.href = googleRedirectUrl('register');
      return;
    }
    setError(
      googleErrorMessage(
        result.reason,
        result.reason === 'offline' ? result.message : undefined,
        result.reason === 'unavailable' ? result.missing : undefined,
      ),
    );
    setGoogleConnecting(false);
  };

  // Google redirects back with ?error=... — surface it rather than ignoring it.
  useEffect(() => {
    const providerError = searchParams.get('error');
    if (providerError) {
      setError(
        providerError === 'google'
          ? 'Google sign-up failed. Please try again.'
          : `Google sign-up failed (${providerError}). Please try again.`
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({
        email: form.email, password: form.password, name: form.name,
        dateOfBirth: form.dateOfBirth, gender: form.gender,
        city: form.city, college: form.college || undefined,
      });
      navigate('/');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-amber-400 font-display text-2xl">Y</span>
          </div>
          <h1 className="font-display text-3xl text-navy-900">Join YELO</h1>
          <p className="text-navy-400 mt-2">What's around you</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Your name" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="you@example.com" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
            <input type="date" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              required />
            <p className="text-xs text-slate-400 mt-1">Must be 16+ to register</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select value={form.gender} onChange={e => update('gender', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">College (optional)</label>
            <input type="text" value={form.college} onChange={e => update('college', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Your college/university" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Min 8 chars, 1 upper, 1 lower, 1 number" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Confirm password" required />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-medium hover:bg-brand-700 transition-colors disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-medium text-amber-800 mb-2">By continuing, you agree to the YELO Safety Rules</p>
            <ul className="text-xs text-amber-700 space-y-1">
              {SAFETY_RULES.map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-slate-500">or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={startGoogle}
            disabled={googleConnecting}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h10.08c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.44-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l2.39-2.39C17.45 2.67 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.81-1.34 2.63-2.41 4.6-2.41z" />
            </svg>
            {googleConnecting ? 'Connecting…' : 'Sign up with Google'}
          </button>

          <div className="flex flex-col gap-2">
            <div className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
            </div>
            <div className="text-center text-xs text-slate-400">
              or{' '}
              <Link to="/login" className="text-slate-500 hover:text-slate-700">sign in below</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
