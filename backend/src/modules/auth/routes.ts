import { Router, RequestHandler, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { loginLimiter, registerLimiter, refreshLimiter } from '../../middleware/rateLimit';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';
import { config } from '../../lib/config';

const router = Router();

// Frontend origin that Google sign-in should hand control back to.
const frontendBase = (): string => config.frontendUrl.replace(/\/+$/, '');

// Google only accepts the callback URIs registered in its console, so both legs
// of the exchange must use config.google.redirectUri. Where the browser should
// end up afterwards is carried in the OAuth `state` parameter instead — that is
// what lets a local dev server hand the session back to localhost without
// registering http://localhost as a callback.
const isLoopbackOrigin = (origin: string): boolean =>
  /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin);

const encodeState = (returnTo: string): string =>
  Buffer.from(JSON.stringify({ r: returnTo }), 'utf8').toString('base64url');

// Only honour origins we actually serve: the configured frontend or a loopback
// dev server. Anything else falls back to the configured frontend, so neither
// the request nor the round-tripped state can turn this into an open redirect.
const safeReturnTo = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string' || value.length === 0) return fallback;
  try {
    const origin = new URL(value).origin;
    if (origin === frontendBase() || isLoopbackOrigin(origin)) return origin;
  } catch {
    // Not a URL — fall through.
  }
  return fallback;
};

// Decode the callback's state (which we wrote in /google/start).
const returnToFromState = (state: unknown): string => {
  if (typeof state !== 'string' || state.length === 0) return frontendBase();
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as { r?: unknown };
    return safeReturnTo(parsed.r, frontendBase());
  } catch {
    return frontendBase();
  }
};

// The URL we send the browser to for the consent screen. Built by hand so the
// frontend can fetch it as JSON (see /google/start) instead of navigating the
// browser to the API host — on a cold server that navigation parks the user on
// the backend's "application loading" page before Google is ever reached.
const googleAuthorizeUrl = (returnTo: string): string => {
  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: 'code',
    scope: 'email profile',
    prompt: 'select_account',
    state: encodeState(returnTo),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// Where the browser should land after the callback: a local dev server keeps
// its own origin, production returns to the configured site.
const startReturnTo = (req: Request): string =>
  isLoopbackOrigin(`${req.protocol}://${req.get('host')}`)
    ? `${req.protocol}://${req.get('host')}`
    : frontendBase();

router.post('/register', registerLimiter, asyncHandler(controller.register));
router.post('/login', loginLimiter, asyncHandler(controller.login));
router.post('/refresh', refreshLimiter, asyncHandler(controller.refreshToken));
router.get('/me', authenticate, asyncHandler(controller.getMe));

if (config.google.enabled) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const passport = require('passport');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const GoogleStrategy = require('passport-google-oauth20').Strategy;

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.redirectUri,
        passReqToCallback: true,
      },
      async (_req: any, accessToken: string, _refreshToken: string | undefined, profile: any, done: (err: Error | null, user?: any) => void) => {
        try {
          const user = await controller.linkOrUpdateGoogleAccount(profile, accessToken);
          return done(null, user);
        } catch (err) {
          return done(err as Error, false);
        }
      }
    )
  );

  // JSON variant used by the login/signup buttons: the app fetches this, then
  // navigates straight to Google. Keeps the backend host out of the address bar.
  router.get('/google/start', (req, res) => {
    // The browser reports its own origin: behind the Vite dev proxy the request
    // host is the API, so only the client knows where the session belongs next.
    const returnTo = safeReturnTo(req.query.returnTo, frontendBase());
    res.json({ url: googleAuthorizeUrl(returnTo) });
  });

  router.get(
    '/google',
    (req, res, next) =>
      passport.authenticate('google', {
        scope: ['email', 'profile'],
        session: false,
        callbackURL: config.google.redirectUri,
        state: encodeState(startReturnTo(req)),
      })(req, res, next),
  );

  router.get('/google/callback', (req, res, next) => {
    // Custom callback instead of failureRedirect: Google reports a denied
    // consent or an expired/reused code as an *error*, not a failed login, and
    // passport's failureRedirect ignores those — the user would get a raw 500
    // page from the API instead of being sent back to the login screen.
    passport.authenticate(
      'google',
      { session: false, callbackURL: config.google.redirectUri },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: unknown, user: any) => {
        const returnTo = returnToFromState(req.query.state);
        if (err || !user) {
          if (err) console.warn('[auth] Google callback failed:', (err as Error).message || err);
          return res.redirect(`${returnTo}/login?error=google`);
        }
        controller.signTokens(user).then(token => {
          // Hand the session back to the frontend origin, which stores both tokens.
          res.redirect(
            `${returnTo}/?token=${encodeURIComponent(token.accessToken)}&refreshToken=${encodeURIComponent(token.refreshToken)}`
          );
        }).catch(next);
      }
    )(req, res, next);
  });

  console.log(
    `[auth] Google sign-in ENABLED — callback ${config.google.redirectUri}, redirecting to ${frontendBase()}`
  );
} else {
  // Without this a missing env var looked exactly like a broken route: a bare
  // "Cannot GET /api/auth/google" page. Answer with the same redirect flow the
  // real route uses, carrying an error the frontend can explain.
  const unavailableRedirect: RequestHandler = (_req, res) => {
    res.redirect(`${frontendBase()}/login?error=google_unavailable`);
  };
  router.get('/google', unavailableRedirect);
  router.get('/google/callback', unavailableRedirect);
  // The frontend asks this first; answer in its own format so the button can
  // explain the problem instead of leaving the user on an API error page.
  router.get('/google/start', (_req, res) => {
    res.status(503).json({ error: 'Google sign-in is not configured on this server' });
  });

  console.warn(
    '[auth] Google sign-in DISABLED — set GOOGLE_OAUTH_ENABLED=true plus GOOGLE_CLIENT_ID and ' +
      'GOOGLE_CLIENT_SECRET. /api/auth/google now redirects to /login?error=google_unavailable.'
  );
}

export default router;
