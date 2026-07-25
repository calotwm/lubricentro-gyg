import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createUserSchema, updateUserSchema } from '@lubricentro/shared';
import {
  listUsers,
  getUser,
  createUserAccount,
  updateUserAccount,
  deactivateUserAccount,
} from './service.js';
import { authGuard } from '../../middleware/auth-guard.js';
import { roleGuard } from '../../middleware/role-guard.js';

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  // All user routes require auth + admin role
  fastify.addHook('preHandler', authGuard);
  fastify.addHook('preHandler', roleGuard('admin'));

  // GET /api/users — list all users
  fastify.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    const result = await listUsers();
    return reply.status(200).send(result);
  });

  // GET /api/users/:id — get single user
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = await getUser(id);
    return reply.status(200).send(user);
  });

  // POST /api/users — create user
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = createUserSchema.parse(request.body);
    const user = await createUserAccount(data);
    return reply.status(201).send(user);
  });

  // PUT /api/users/:id — update user
  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const data = updateUserSchema.parse(request.body);
    const user = await updateUserAccount(id, data);
    return reply.status(200).send(user);
  });

  // DELETE /api/users/:id — deactivate user
  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = await deactivateUserAccount(id);
    return reply.status(200).send(user);
  });
}
