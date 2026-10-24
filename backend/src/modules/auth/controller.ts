import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as authService from './service';
import { registerSchema, loginSchema } from './validators';

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const result = await authService.register(data);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);
  res.json(result);
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }
  const tokens = await authService.refreshToken(refreshToken);
  res.json(tokens);
}

export async function getMe(req: AuthRequest, res: Response) {
  const { query } = await import('../../lib/db');
  const result = await query(
    `SELECT u.id, u.email, u.phone, u.phone_verified, u.email_verified, u.role, u.status, u.date_of_birth, u.created_at,
            p.name, p.avatar_url, p.bio, p.gender, p.city, p.college, p.college_verified, p.interests, p.location_name
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [req.user!.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  const user = result.rows[0] as Record<string, unknown>;
  res.json({ user });
}

export async function signTokens(user: { id: string; email: string; name: string }) {
  return authService.createTokens(user);
}

export async function linkOrUpdateGoogleAccount(profile: any, accessToken: string) {
  try {
    return await authService.linkOrUpdateGoogleAccount(profile, accessToken);
  } catch (err) {
    console.error('[Google OAuth] Error linking account:', err);
    throw err;
  }
}
