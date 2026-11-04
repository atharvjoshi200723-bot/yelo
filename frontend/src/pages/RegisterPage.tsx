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
    <div className="min-h-screen bg-[#9A63E6] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating candy-ball decorations */}
      <svg className="absolute top-8 left-6 animate-candy-float" width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r="25" fill="#E8622B" stroke="#1B1250" strokeWidth="3" />
        <circle cx="16" cy="17" r="6" fill="white" fillOpacity="0.3" />
      </svg>
      <svg className="absolute top-20 right-8 animate-candy-float-slow" width="42" height="42" viewBox="0 0 42 42" aria-hidden="true">
        <circle cx="21" cy="21" r="20" fill="#FFD41F" stroke="#1B1250" strokeWidth="3" />
        <circle cx="13" cy="13" r="5" fill="white" fillOpacity="0.3" />
      </svg>
      <svg className="absolute bottom-24 left-8 animate-candy-float-reverse" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="17" fill="#2FA3B5" stroke="#1B1250" strokeWidth="3" />
        <circle cx="11" cy="11" r="4" fill="white" fillOpacity="0.3" />
      </svg>
      <svg className="absolute bottom-36 right-5 animate-candy-float" width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
        <circle cx="23" cy="23" r="22" fill="#C5F030" stroke="#1B1250" strokeWidth="3" />
        <circle cx="14" cy="14" r="5" fill="white" fillOpacity="0.3" />
      </svg>

      <div className="w-full max-w-md relative z-10 py-8">
        {/* YELO wordmark */}
        <div className="text-center mb-6">
          <div className="inline-block bg-[#1B1250] rounded-[20px] border-3 border-[#1B1250] shadow-neo px-7 py-3 mb-4">
            <span className="font-display font-black text-5xl text-[#C5F030] tracking-tight">YELO</span>
          </div>
          <p className="text-white font-bold text-sm opacity-80">Join your hyperlocal community</p>
        </div>

        {/* Cream sticker card */}
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[28px] shadow-[8px_10px_0_#1B1250] p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#E8622B]/10 border-2 border-[#E8622B] rounded-[16px] text-[#1B1250] font-bold text-sm px-4 py-3">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-black text-[#1B1250] uppercase tracking-wider mb-1.5">Full Name</label>
              <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none"
                placeholder="Your name" required />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-black text-[#1B1250] uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none"
                placeholder="you@example.com" required />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-black text-[#1B1250] uppercase tracking-wider mb-1.5">Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)}
                className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none"
                required />
              <p className="text-xs font-bold text-[#1B1250]/50 mt-1">Must be 16+ to register</p>
            </div>

            {/* Gender + City */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-[#1B1250] uppercase tracking-wider mb-1.5">Gender</label>
                <div className="relative">
                  <select value={form.gender} onChange={e => update('gender', e.target.value)}
                    className="appearance-none bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none pr-9">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#1B1250] font-black text-xs">▾</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-[#1B1250] uppercase tracking-wider mb-1.5">City</label>
                <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
                  className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none" />
              </div>
            </div>

            {/* College */}
            <div>
              <label className="block text-xs font-black text-[#1B1250] uppercase tracking-wider mb-1.5">College (optional)</label>
              <input type="text" value={form.college} onChange={e => update('college', e.target.value)}
                className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none"
                placeholder="Your college/university" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-black text-[#1B1250] uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)}
                className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none"
                placeholder="Min 8 chars, 1 upper, 1 lower, 1 number" required />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-black text-[#1B1250] uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
                className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none"
                placeholder="Confirm password" required />
            </div>

            {/* Create Account Button */}
            <button type="submit" disabled={loading}
              className="bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full font-display font-black uppercase py-3.5 w-full disabled:bg-[#E0E2C8] disabled:text-[#1B1250]/40 disabled:cursor-not-allowed hover:translate-y-[-1px] transition-transform text-sm">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Safety Rules Card */}
            <div className="bg-[#FFD41F]/30 border-3 border-[#1B1250] shadow-neo rounded-[22px] p-4">
              <p className="text-xs font-black text-[#1B1250] uppercase tracking-wide mb-2">By continuing, you agree to the YELO Safety Rules</p>
              <ul className="text-xs font-bold text-[#1B1250] space-y-1.5">
                {SAFETY_RULES.map((rule) => (
                  <li key={rule} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#C5F030] border border-[#1B1250] flex-shrink-0" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t-2 border-[#1B1250]/20" />
              <span className="text-xs font-black text-[#1B1250]/50 uppercase tracking-wider">or continue with</span>
              <div className="flex-1 border-t-2 border-[#1B1250]/20" />
            </div>

            {/* Google Button */}
            <button
              type="button"
              onClick={startGoogle}
              disabled={googleConnecting}
              className="w-full flex items-center justify-center gap-3 bg-white text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full py-3.5 font-display font-black text-sm uppercase hover:translate-y-[-1px] transition-transform disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h10.08c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.44-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l2.39-2.39C17.45 2.67 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.81-1.34 2.63-2.41 4.6-2.41z" />
              </svg>
              {googleConnecting ? 'Connecting…' : 'Log in with Google'}
            </button>

            <div className="flex flex-col gap-2">
              <div className="text-center text-sm font-bold text-[#1B1250]">
                Already have an account?{' '}
                <Link to="/login" className="font-black text-[#1B1250] underline hover:text-[#9A63E6] transition-colors">Sign in</Link>
              </div>
              <div className="text-center text-xs font-bold text-[#1B1250]/50">
                or{' '}
                <Link to="/login" className="text-[#1B1250]/70 hover:text-[#1B1250] underline">sign in below</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
