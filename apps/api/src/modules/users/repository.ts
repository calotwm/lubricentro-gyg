import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { eq, sql } from 'drizzle-orm';

/**
 * Find all users (without password hashes).
 */
export async function findAllUsers() {
  return db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.username);
}

/**
 * Find user by ID (without password hash).
 */
export async function findUserById(id: string) {
  const [result] = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result ?? null;
}

/**
 * Find user by username (WITH password hash for auth purposes).
 */
export async function findUserByUsernameWithPassword(username: string) {
  const [result] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return result ?? null;
}

/**
 * Create a new user.
 */
export async function createUser(data: typeof users.$inferInsert) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

/**
 * Update a user.
 */
export async function updateUser(
  id: string,
  data: Partial<typeof users.$inferInsert>,
) {
  const [user] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();
  return user ?? null;
}

/**
 * Deactivate a user (set isActive = false).
 */
export async function deactivateUser(id: string) {
  const [user] = await db
    .update(users)
    .set({ isActive: false })
    .where(eq(users.id, id))
    .returning();
  return user ?? null;
}

/**
 * Check if a username already exists.
 */
export async function usernameExists(username: string): Promise<boolean> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.username, username));
  return result.count > 0;
}

/**
 * Check if an email already exists.
 */
export async function emailExists(email: string): Promise<boolean> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.email, email));
  return result.count > 0;
}
