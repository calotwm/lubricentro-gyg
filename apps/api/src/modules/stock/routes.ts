import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { stockMovementSchema, movementFilterSchema } from '@lubricentro/shared';
import { createMovement, listMovements, getStockBalance } from './service.js';
import { authGuard } from '../../middleware/auth-guard.js';
import { zodToJsonSchema } from '../../lib/zod-to-json-schema.js';

const movementBodySchema = zodToJsonSchema(stockMovementSchema.omit({ userId: true }));

export async function stockRoutes(fastify: FastifyInstance): Promise<void> {
  // All stock routes require auth
  fastify.addHook('preHandler', authGuard);

  // GET /api/stock — current stock balance
  fastify.get('/', {
    schema: {
      tags: ['stock'],
      summary: 'Get current stock balance',
      querystring: {
        type: 'object',
        properties: {
          lowStock: { type: 'string', description: 'Filter low stock items (true/false)' },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string>;
    const filters = {
      lowStock: query.lowStock === 'true' ? true : undefined,
    };
    const pagination = {
      page: parseInt(query.page || '1', 10),
      limit: parseInt(query.limit || '20', 10),
    };

    const result = await getStockBalance(filters, pagination);
    return reply.status(200).send(result);
  });

  // GET /api/stock/movements — movement log
  fastify.get('/movements', {
    schema: {
      tags: ['stock'],
      summary: 'List stock movements with filters',
      querystring: {
        type: 'object',
        properties: {
          productId: { type: 'string', format: 'uuid' },
          movementType: { type: 'string', enum: ['entry', 'exit', 'adjustment'] },
          from: { type: 'string', format: 'date' },
          to: { type: 'string', format: 'date' },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string>;
    const filters = movementFilterSchema.parse({
      productId: query.productId,
      movementType: query.movementType,
      from: query.from,
      to: query.to,
    });
    const pagination = {
      page: parseInt(query.page || '1', 10),
      limit: parseInt(query.limit || '20', 10),
    };

    const result = await listMovements(filters, pagination);
    return reply.status(200).send(result);
  });

  // POST /api/stock/movements — create movement (entry/exit/adjustment)
  fastify.post('/movements', {
    schema: {
      tags: ['stock'],
      summary: 'Create a stock movement (entry, exit, or adjustment)',
      description: 'Uses SELECT FOR UPDATE for concurrent safety. Exits prevent negative stock.',
      body: movementBodySchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    // Parse body without userId (it comes from auth), override userId from auth
    const inputSchema = stockMovementSchema.omit({ userId: true });
    const data = inputSchema.parse(request.body);

    const movement = await createMovement({
      productId: data.productId,
      movementType: data.movementType,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      reference: data.reference,
      notes: data.notes,
      userId: request.user.id,
    });

    return reply.status(201).send(movement);
  });
}
