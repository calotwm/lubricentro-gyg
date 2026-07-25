import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { loginSchema } from '@lubricentro/shared';
import { login, getMe } from './service.js';
import { authGuard } from '../../middleware/auth-guard.js';
import { zodToJsonSchema } from '../../lib/zod-to-json-schema.js';

const loginBodySchema = zodToJsonSchema(loginSchema);

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Login with strict rate limiting: 10 requests per minute per IP
  fastify.post(
    '/login',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
      schema: {
        tags: ['auth'],
        summary: 'Login with username and password',
        description: 'Returns a JWT token valid for the configured TTL (default 8h)',
        body: loginBodySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  username: { type: 'string' },
                  role: { type: 'string', enum: ['admin', 'employee'] },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = loginSchema.parse(request.body);
      const result = await login(body.username, body.password);
      return reply.status(200).send(result);
    },
  );

  fastify.get(
    '/me',
    {
      preHandler: [authGuard],
      schema: {
        tags: ['auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              username: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string', enum: ['admin', 'employee'] },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await getMe(request.user.id);
      return reply.status(200).send(user);
    },
  );
}
