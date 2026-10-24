import { Router, RequestHandler, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { loginLimiter, registerLimiter, refreshLimiter } from '../../middleware/rateLimit';
import * as controller from './controller';
import { asyncHandler } from '../../lib/utils';
import { config } from '../../lib/config';

const router = Router();

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

  router.get(
    '/google',
    passport.authenticate('google', { scope: ['email', 'profile'], session: false })
  );

  router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    asyncHandler(async (req: any, res: any) => {
      const user = req.user as { id: string; email: string; name: string } | undefined;
      if (!user) return res.redirect('/login');
      const token = await controller.signTokens(user);
      const redirectParam = req.query.redirectTo as string | undefined;
      const redirectTo = redirectParam || new URL(req.originalUrl || req.url, 'http://localhost').searchParams.get('redirectTo');
      const mode = (req.query.mode as string | undefined) || 'login';
      if (mode === 'register') {
        res.redirect(`/register?token=${encodeURIComponent(token.accessToken)}&refreshToken=${encodeURIComponent(token.refreshToken)}`);
      } else if (redirectTo) {
        res.redirect(`${redirectTo}?token=${encodeURIComponent(token.accessToken)}`);
      } else {
        res.redirect(`/?token=${encodeURIComponent(token.accessToken)}&refreshToken=${encodeURIComponent(token.refreshToken)}`);
      }
    })
  );
}

export default router;
