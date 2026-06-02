import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';
import { getUserById, isAdmin, isHostOrAdmin } from './users';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: 'admin' | 'host' | 'viewer';
  };
}

/**
 * Middleware to verify Firebase ID token from Authorization header
 * Expected format: Authorization: Bearer <firebase-id-token>
 */
export async function verifyFirebaseToken(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get user from Firestore to include role
    const user = await getUserById(decodedToken.uid);

    if (!user) {
      next();
      return;
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.warn('Token verification failed:', error instanceof Error ? error.message : error);
    next();
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Please log in.' });
    return;
  }

  next();
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Please log in.' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Admin access required.' });
    return;
  }

  next();
}

/**
 * Middleware to require host or admin role
 */
export function requireHostOrAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Please log in.' });
    return;
  }

  if (req.user.role !== 'admin' && req.user.role !== 'host') {
    res.status(403).json({ error: 'Forbidden: Host or admin access required.' });
    return;
  }

  next();
}
