import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

export async function findByUsername(username: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return user ?? null;
}

export async function findById(id: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user ?? null;
}
