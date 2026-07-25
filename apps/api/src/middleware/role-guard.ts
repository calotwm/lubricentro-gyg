import type { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../lib/errors.js';

export function roleGuard(requiredRole: string) {
  return async (
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> => {
    if (!request.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (request.user.role !== requiredRole) {
      throw AppError.forbidden('Insufficient permissions');
    }
  };
}
