import { getRealtimeDB, COLLECTIONS } from '../db/firestore';
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
 * Create or update a user in RTDB
 */
export async function upsertUser(
  uid: string,
  email: string,
  role: UserRole = 'viewer',
  displayName?: string,
): Promise<User> {
  const db = getRealtimeDB();
  const now = new Date();

  const user: User = {
    id: uid,
    email,
    role,
    displayName: displayName || email.split('@')[0],
    createdAt: now,
  };

  await db.ref(COLLECTIONS.users).child(uid).set({
    ...user,
    createdAt: now.toISOString(),
  });
  return user;
}

/**
 * Get user by ID
 */
export async function getUserById(uid: string): Promise<User | null> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.users).child(uid).get();

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.val();
  return {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
  };
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.users)
    .orderByChild('email')
    .equalTo(email.toLowerCase())
    .limitToFirst(1)
    .get();

  if (!snapshot.exists()) {
    return null;
  }

  const val = snapshot.val();
  const uid = Object.keys(val)[0];
  const data = val[uid];

  return {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
  };
}

/**
 * Update user role
 */
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.users).child(uid).update({ role });
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
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.users)
    .orderByChild('role')
    .equalTo('admin')
    .get();

  if (!snapshot.exists()) return [];

  const val = snapshot.val();
  return Object.keys(val).map(uid => ({
    ...val[uid],
    createdAt: val[uid].createdAt ? new Date(val[uid].createdAt) : undefined,
  }));
}
