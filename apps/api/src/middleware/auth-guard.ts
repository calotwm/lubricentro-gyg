import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../lib/jwt.js';
import { AppError } from '../lib/errors.js';

export interface AuthUser {
  id: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser;
  }
}

export async function authGuard(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    request.user = { id: payload.sub, role: payload.role };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Token expired');
    }
    throw AppError.unauthorized('Token invalid');
  }
}
