import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { getGoogleSignInUrl, googleRedirectUrl, googleErrorMessage } from '../lib/googleAuth';
import { Mascot, DoodleStar, HandwrittenNote } from '../components/neo/Decorations';

function GoogleLogin({ onError }: { onError: (message: string) => void }) {
  const [connecting, setConnecting] = useState(false);

  // Fetch the Google URL, then jump to it: navigating to the API host first
  // leaves the user on the backend's cold-start screen before Google loads.
  const start = async () => {
    setConnecting(true);
    onError('');
    const result = await getGoogleSignInUrl('login');
    if (result.ok) {
      window.location.href = result.url;
      return;
    }
    if (result.reason === 'legacy') {
      window.location.href = googleRedirectUrl('login');
      return;
    }
    onError(
      googleErrorMessage(
        result.reason,
        result.reason === 'offline' ? result.message : undefined,
        result.reason === 'unavailable' ? result.missing : undefined,
      ),
    );
    setConnecting(false);
  };

  return (
    <button
      type="button"
      onClick={start}
      disabled={connecting}
      className="w-full flex items-center justify-center gap-3 bg-white text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full py-3.5 font-display font-black text-sm uppercase hover:translate-y-[-1px] transition-transform disabled:opacity-60"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h10.08c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.44-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l2.39-2.39C17.45 2.67 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.81-1.34 2.63-2.41 4.6-2.41z" />
      </svg>
      {connecting ? 'Connecting…' : 'Sign in with Google'}
    </button>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Google redirects back with ?error=... — show it instead of failing silently.
  useEffect(() => {
    const providerError = searchParams.get('error');
    if (providerError) {
      setError(
        providerError === 'google_unavailable'
          ? 'Google sign-in is not set up on the server yet. Please sign in with your email instead.'
          : providerError === 'google'
            ? 'Google sign-in failed. Please try again.'
            : `Google sign-in failed (${providerError}). Please try again.`
      );
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#9A63E6] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating candy-ball decorations */}
      <svg className="absolute top-8 left-6 animate-candy-float" width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="27" fill="#E8622B" stroke="#1B1250" strokeWidth="3" />
        <circle cx="17" cy="18" r="7" fill="white" fillOpacity="0.3" />
      </svg>
      <svg className="absolute top-16 right-8 animate-candy-float-slow" width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="21" fill="#FFD41F" stroke="#1B1250" strokeWidth="3" />
        <circle cx="13" cy="13" r="5" fill="white" fillOpacity="0.3" />
      </svg>
      <svg className="absolute bottom-20 left-10 animate-candy-float-reverse" width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
        <circle cx="19" cy="19" r="18" fill="#2FA3B5" stroke="#1B1250" strokeWidth="3" />
        <circle cx="11" cy="12" r="4" fill="white" fillOpacity="0.3" />
      </svg>
      <svg className="absolute bottom-32 right-6 animate-candy-float" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="23" fill="#C5F030" stroke="#1B1250" strokeWidth="3" />
        <circle cx="15" cy="15" r="6" fill="white" fillOpacity="0.3" />
      </svg>

      <div className="w-full max-w-md relative z-10">
        {/* YELO wordmark */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center gap-2 bg-[#1B1250] rounded-[20px] border-3 border-[#1B1250] shadow-neo px-7 py-3 mb-3 relative">
            <span className="font-display font-black text-5xl text-[#C5F030] tracking-tight">YELO</span>
            <DoodleStar color="pink" size={26} rotate={15} className="absolute -top-3 -right-3" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <Mascot size={32} mood="happy" waving />
            <p className="text-white font-bold text-sm opacity-90">Welcome back — sign in</p>
          </div>
        </div>

        {/* Cream sticker card */}
        <div className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[28px] shadow-[8px_10px_0_#1B1250] p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-[#E8622B]/10 border-2 border-[#E8622B] rounded-[16px] text-[#1B1250] font-bold text-sm px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-[#1B1250] uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-[#1B1250] uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#F6FBD4] border-3 border-[#1B1250] rounded-[20px] text-sm font-bold text-[#1B1250] placeholder:text-[#1B1250]/40 shadow-[2px_3px_0_#1B1250] px-4 py-3.5 w-full focus:outline-none pr-14"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-3 border-[#1B1250] bg-[#F6FBD4] flex items-center justify-center text-[#1B1250] hover:bg-[#1B1250] hover:text-[#F6FBD4] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-neo rounded-full font-display font-black uppercase py-3.5 w-full disabled:bg-[#E0E2C8] disabled:text-[#1B1250]/40 disabled:cursor-not-allowed hover:translate-y-[-1px] transition-transform text-sm"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t-2 border-[#1B1250]/20" />
              <span className="text-xs font-black text-[#1B1250]/50 uppercase tracking-wider">or</span>
              <div className="flex-1 border-t-2 border-[#1B1250]/20" />
            </div>

            <GoogleLogin onError={setError} />

            <p className="text-center text-sm font-bold text-[#1B1250] mt-2">
              Don't have an account?{' '}
              <Link to="/register" className="font-black text-[#1B1250] underline hover:text-[#9A63E6] transition-colors">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
