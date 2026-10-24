import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../lib/db';
import { config } from '../../lib/config';
import { AppError } from '../../middleware/errorHandler';
import { RegisterInput, LoginInput } from './validators';

function generateTokens(user: { id: string; email: string; role: string }) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as unknown as number }
  );
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn as unknown as number }
  );
  return { accessToken, refreshToken };
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export async function register(data: RegisterInput) {
  const age = calculateAge(data.dateOfBirth);

  if (age < 16) {
    throw new AppError(400, 'You must be at least 16 years old to register');
  }

  const existingUser = await query('SELECT id FROM users WHERE email = $1', [data.email]);
  if (existingUser.rows.length > 0) {
    throw new AppError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const result = await query(
    `INSERT INTO users (email, password_hash, date_of_birth)
     VALUES ($1, $2, $3)
     RETURNING id, email, role, created_at`,
    [data.email, passwordHash, data.dateOfBirth]
  );

  const user = result.rows[0] as { id: string; email: string; role: string; created_at: string };

  // Create profile
  await query(
    `INSERT INTO profiles (user_id, name, gender, city, college, date_of_birth)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [user.id, data.name, data.gender || 'prefer_not_to_say', data.city, data.college || null, data.dateOfBirth]
  );

  const tokens = generateTokens(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: (user as unknown as { created_at: string }).created_at,
    },
    ...tokens,
  };
}

export async function login(data: LoginInput) {
  const result = await query(
    'SELECT id, email, password_hash, role, status FROM users WHERE email = $1',
    [data.email]
  );

  if (result.rows.length === 0) {
    throw new AppError(401, 'Invalid email or password');
  }

  const user = result.rows[0] as { id: string; email: string; password_hash: string; role: string; status: string };

  if (user.status !== 'active') {
    throw new AppError(403, 'Your account has been ' + user.status);
  }

  const validPassword = await bcrypt.compare(data.password, user.password_hash);
  if (!validPassword) {
    throw new AppError(401, 'Invalid email or password');
  }

  const tokens = generateTokens(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  };
}

export async function refreshToken(token: string) {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as { id: string; email: string; role: string };

    const result = await query(
      'SELECT id, email, role, status FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      throw new AppError(401, 'User not found');
    }

    const user = result.rows[0] as { id: string; email: string; role: string; status: string };
    if (user.status !== 'active') {
      throw new AppError(403, 'Account is ' + user.status);
    }

    const tokens = generateTokens(user);
    return tokens;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'Invalid refresh token');
  }
}

export async function createTokens(user: { id: string; email: string; name: string }) {
  return generateTokens({ id: user.id, email: user.email, role: 'user' });
}

export async function linkOrUpdateGoogleAccount(profile: any, accessToken: string) {
  const providerId = String(profile.id || profile.sub || '');
  const email = String(profile.emails?.[0]?.value || profile.email || '').toLowerCase();
  const name = String(profile.displayName || profile.name?.givenName || 'Google User');
  const avatarUrl = profile.photos?.[0]?.value || null;

  if (!providerId || !email) {
    throw new AppError(400, 'Google profile missing required id or email');
  }

  interface GoogleAccountRow {
    id: string;
    user_id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    access_token: string | null;
    created_at: string;
  }

  interface UserRowLite {
    id: string;
  }

  const existingAccountRaw = await query(
    `SELECT ga.id, ga.user_id, ga.email, ga.name, ga.avatar_url, ga.access_token, ga.created_at
     FROM google_accounts ga
     JOIN users u ON u.id = ga.user_id
     WHERE ga.provider_id = $1`,
    [providerId]
  );

  const existingAccount: GoogleAccountRow[] = existingAccountRaw.rows as GoogleAccountRow[];

  if (existingAccount.length > 0) {
    const account = existingAccount[0];
    await query(
      `UPDATE google_accounts SET access_token = $1, email = $2, name = $3, avatar_url = $4 WHERE id = $5`,
      [accessToken, email, name, avatarUrl, account.id]
    );
    return { id: account.user_id, email: account.email, name: account.name };
  }

  const existingUserRaw = await query(
    `SELECT id FROM users WHERE LOWER(email) = $1`,
    [email]
  );

  const existingUser: UserRowLite[] = existingUserRaw.rows as UserRowLite[];

  let userId: string;
  if (existingUser.length > 0) {
    userId = existingUser[0].id;
  } else {
    userId = uuidv4();
    await query(
      `INSERT INTO users (id, email, provider, provider_id, avatar_url)
       VALUES ($1, $2, 'google', $3, $4)`,
      [userId, email, providerId, avatarUrl]
    );
  }

  await query(
    `INSERT INTO google_accounts (id, user_id, provider_id, email, name, avatar_url, access_token)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
     ON CONFLICT (provider_id) DO UPDATE SET access_token = EXCLUDED.access_token, email = EXCLUDED.email, name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url`,
    [userId, providerId, email, name, avatarUrl, accessToken]
  );

  return { id: userId, email, name };
}
