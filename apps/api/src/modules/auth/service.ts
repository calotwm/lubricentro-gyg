import { findByUsername, findById } from './repository.js';
import { comparePassword } from '../../lib/password.js';
import { signToken } from '../../lib/jwt.js';
import { AppError } from '../../lib/errors.js';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export async function login(
  username: string,
  password: string,
): Promise<LoginResult> {
  const user = await findByUsername(username);

  if (!user) {
    throw AppError.unauthorized('Invalid credentials');
  }

  if (!user.isActive) {
    throw AppError.unauthorized('Invalid credentials');
  }

  const validPassword = await comparePassword(password, user.passwordHash);
  if (!validPassword) {
    throw AppError.unauthorized('Invalid credentials');
  }

  const token = signToken({ sub: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  };
}

export async function getMe(userId: string) {
  const user = await findById(userId);

  if (!user) {
    throw AppError.notFound('User not found');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}
