import { Request, RequestHandler, Response, NextFunction } from 'express';

import jwt from 'jsonwebtoken';
import { config } from '../lib/config';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser | { id: string; email: string; role: string };
}


export const authenticate: RequestHandler = (req, res, next) => {
  const r = req as AuthRequest;
  const authHeader = r.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
    r.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  const r = req as AuthRequest;
  if (!r.user || r.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const optionalAuth: RequestHandler = (req, _res, next) => {
  const r = req as AuthRequest;
  const authHeader = r.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthUser;
      r.user = decoded;
    } catch {
      // Token invalid, proceed without user
    }
  }
  next();
};
