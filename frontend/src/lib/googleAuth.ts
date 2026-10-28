import api from './api';

export type GoogleSignInMode = 'login' | 'register';

export type GoogleStartResult =
  | { ok: true; url: string }
  | { ok: false; reason: 'unavailable' | 'offline' | 'legacy'; message?: string };

/**
 * Ask the API where to send the browser for Google sign-in.
 *
 * The buttons used to navigate straight to `<api>/auth/google`. That puts the
 * backend host in the address bar, and when the server is cold (free hosting
 * spins down) the user lands on the backend's "application loading" screen
 * before Google ever appears — on a phone that looks like a broken sign-in.
 * Fetching the consent URL warms the server in the background and keeps the
 * browser on the app's own domain until it jumps to accounts.google.com.
 */
export async function getGoogleSignInUrl(mode: GoogleSignInMode): Promise<GoogleStartResult> {
  const attempt = async (): Promise<GoogleStartResult> => {
    try {
      // No short timeout: a waking server can take ~a minute, and the button says
      // "Connecting…" meanwhile instead of failing fast.
      // returnTo: where the server should hand the session back. The server
      // only accepts this app's origin or a loopback dev server.
      const res = await api.get('/auth/google/start', {
        params: { mode, returnTo: window.location.origin },
        timeout: 90000,
      });
      const url = (res.data as { url?: unknown } | undefined)?.url;
      if (typeof url === 'string' && url.startsWith('https://accounts.google.com/')) {
        return { ok: true, url };
      }
      return { ok: false, reason: 'unavailable' };
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { status?: number; data?: { error?: string } };
        message?: string;
      };
      const status = apiErr.response?.status;
      // Older deployments have no /google/start; fall back to the redirect route.
      if (status === 404) return { ok: false, reason: 'legacy' };
      if (status === 503) return { ok: false, reason: 'unavailable' };
      // Keep the server's own wording (e.g. the rate-limit message) when it has one.
      return {
        ok: false,
        reason: 'offline',
        message: apiErr.response?.data?.error || apiErr.message,
      };
    }
  };

  // A sleeping server sometimes drops the very first request; one retry saves
  // the user from a pointless "try again" tap.
  const first = await attempt();
  if (first.ok || first.reason === 'unavailable' || first.reason === 'legacy') return first;
  await new Promise(resolve => setTimeout(resolve, 3000));
  return attempt();
}

/** Classic redirect route, used when the server has no /google/start yet. */
export function googleRedirectUrl(mode: GoogleSignInMode): string {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  return `${apiUrl}/auth/google?mode=${mode}`;
}

export function googleErrorMessage(reason: 'unavailable' | 'offline', detail?: string): string {
  if (reason === 'unavailable') {
    return 'Google sign-in is not set up on the server yet. Please sign in with your email instead.';
  }
  return detail || 'Could not reach the server. Check your connection and try again.';
}
