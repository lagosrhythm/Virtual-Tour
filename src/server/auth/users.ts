import { getFirestore, COLLECTIONS } from '../db/firestore';
import type { User } from '../db/types';

// Roles
export type UserRole = 'admin' | 'host' | 'viewer';

export interface TokenPayload {
  uid: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Create or update a user in Firestore
 */
export async function upsertUser(
  uid: string,
  email: string,
  role: UserRole = 'viewer',
  displayName?: string,
): Promise<User> {
  const db = getFirestore();
  const now = new Date();

  const user: User = {
    id: uid,
    email,
    role,
    displayName: displayName || email.split('@')[0],
    createdAt: now,
  };

  await db.collection(COLLECTIONS.users).doc(uid).set(user, { merge: true });
  return user;
}

/**
 * Get user by ID
 */
export async function getUserById(uid: string): Promise<User | null> {
  const db = getFirestore();
  const doc = await db.collection(COLLECTIONS.users).doc(uid).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as User;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getFirestore();
  const query = await db
    .collection(COLLECTIONS.users)
    .where('email', '==', email.toLowerCase())
    .limit(1)
    .get();

  if (query.empty) {
    return null;
  }

  return query.docs[0].data() as User;
}

/**
 * Update user role
 */
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const db = getFirestore();
  await db.collection(COLLECTIONS.users).doc(uid).update({ role });
}

/**
 * Check if user is admin
 */
export async function isAdmin(uid: string): Promise<boolean> {
  const user = await getUserById(uid);
  return user?.role === 'admin';
}

/**
 * Check if user is host or admin
 */
export async function isHostOrAdmin(uid: string): Promise<boolean> {
  const user = await getUserById(uid);
  return user?.role === 'admin' || user?.role === 'host';
}

/**
 * Get all admins (for setup/verification)
 */
export async function getAllAdmins(): Promise<User[]> {
  const db = getFirestore();
  const query = await db
    .collection(COLLECTIONS.users)
    .where('role', '==', 'admin')
    .get();

  return query.docs.map((doc) => doc.data() as User);
}
