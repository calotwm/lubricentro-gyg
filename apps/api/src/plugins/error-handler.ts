import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';

/**
 * Error handler for all API routes.
 * In Fastify v5, this must be set on the root instance (not inside a plugin)
 * to apply globally across plugin boundaries.
 */
export function setGlobalErrorHandler(fastify: FastifyInstance): void {
  fastify.setErrorHandler(
    (error: FastifyError | ZodError | AppError, request: FastifyRequest, reply: FastifyReply) => {
      // Check for ZodError by duck-typing first (handles ESM instanceof issues)
      const isZodError = error instanceof ZodError ||
        (typeof error === 'object' && error !== null && 'issues' in error && Array.isArray((error as any).issues));
      if (isZodError) {
        const zodErr = error as ZodError;
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: zodErr.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }

      // AppError — use its status code and message
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }

      // Fastify validation error (schema-based)
      if ('validation' in error && error.validation) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.validation.map((e) => ({
              path: e.params?.instancePath || e.message,
              message: e.message,
            })),
          },
        });
      }

      // Postgres unique violation (23505)
      if ('code' in error && (error as { code: string }).code === '23505') {
        const detail = (error as { detail?: string }).detail || '';
        return reply.status(409).send({
          error: {
            code: 'CONFLICT',
            message: `Duplicate entry${detail ? `: ${detail}` : ''}`,
          },
        });
      }

      // Fallback — 500
      request.log.error(error, 'Unhandled error');
      const statusCode = 'statusCode' in error ? (error as any).statusCode : 500;
      return reply.status(statusCode).send({
        error: {
          code: 'INTERNAL_ERROR',
          message:
            process.env.NODE_ENV === 'production'
              ? 'Internal server error'
              : error.message,
        },
      });
    },
  );
}
