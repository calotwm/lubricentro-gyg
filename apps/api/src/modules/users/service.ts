import {
  findAllUsers,
  findUserById,
  createUser,
  updateUser,
  deactivateUser,
  usernameExists,
  emailExists,
} from './repository.js';
import { hashPassword } from '../../lib/password.js';
import { AppError } from '../../lib/errors.js';

/**
 * List all users (admin only).
 */
export async function listUsers() {
  const data = await findAllUsers();
  return { data };
}

/**
 * Get a single user by ID.
 */
export async function getUser(id: string) {
  const user = await findUserById(id);
  if (!user) {
    throw AppError.notFound('User not found');
  }
  return user;
}

/**
 * Create a new user with hashed password.
 */
export async function createUserAccount(data: {
  username: string;
  email: string;
  password: string;
  role?: string;
}) {
  // Check for duplicate username
  const usernameTaken = await usernameExists(data.username);
  if (usernameTaken) {
    throw AppError.conflict(`Username '${data.username}' already exists`);
  }

  // Check for duplicate email
  const emailTaken = await emailExists(data.email);
  if (emailTaken) {
    throw AppError.conflict(`Email '${data.email}' already exists`);
  }

  const passwordHash = await hashPassword(data.password);

  const user = await createUser({
    username: data.username,
    email: data.email,
    passwordHash,
    role: data.role ?? 'employee',
  });

  // Return without password hash
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

/**
 * Update a user's details.
 */
export async function updateUserAccount(
  id: string,
  data: {
    username?: string;
    email?: string;
    password?: string;
    role?: string;
    isActive?: boolean;
  },
) {
  const existing = await findUserById(id);
  if (!existing) {
    throw AppError.notFound('User not found');
  }

  const updateData: Record<string, unknown> = {};

  if (data.username && data.username !== existing.username) {
    const taken = await usernameExists(data.username);
    if (taken) {
      throw AppError.conflict(`Username '${data.username}' already exists`);
    }
    updateData.username = data.username;
  }

  if (data.email && data.email !== existing.email) {
    const taken = await emailExists(data.email);
    if (taken) {
      throw AppError.conflict(`Email '${data.email}' already exists`);
    }
    updateData.email = data.email;
  }

  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  if (data.role !== undefined) {
    updateData.role = data.role;
  }

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  if (Object.keys(updateData).length === 0) {
    return existing;
  }

  const updated = await updateUser(id, updateData as any);
  if (!updated) {
    throw AppError.notFound('User not found');
  }

  return {
    id: updated.id,
    username: updated.username,
    email: updated.email,
    role: updated.role,
    isActive: updated.isActive,
    createdAt: updated.createdAt,
  };
}

/**
 * Deactivate a user (soft-delete).
 */
export async function deactivateUserAccount(id: string) {
  const existing = await findUserById(id);
  if (!existing) {
    throw AppError.notFound('User not found');
  }

  const updated = await deactivateUser(id);
  if (!updated) {
    throw AppError.notFound('User not found');
  }

  return {
    id: updated.id,
    username: updated.username,
    email: updated.email,
    role: updated.role,
    isActive: updated.isActive,
    createdAt: updated.createdAt,
  };
}
