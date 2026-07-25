import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createProductInput, updateProductInput, productFilterSchema } from '@lubricentro/shared';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from './service.js';
import { authGuard } from '../../middleware/auth-guard.js';
import { roleGuard } from '../../middleware/role-guard.js';
import { zodToJsonSchema } from '../../lib/zod-to-json-schema.js';

const createBodySchema = zodToJsonSchema(createProductInput);
const updateBodySchema = zodToJsonSchema(updateProductInput);

export async function productRoutes(fastify: FastifyInstance): Promise<void> {
  // All product routes require auth
  fastify.addHook('preHandler', authGuard);

  fastify.get('/', {
    schema: {
      tags: ['products'],
      summary: 'List products with pagination and filters',
      querystring: {
        type: 'object',
        properties: {
          brandId: { type: 'string', format: 'uuid' },
          categoryId: { type: 'string', format: 'uuid' },
          search: { type: 'string' },
          isActive: { type: 'string' },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string>;
    const filters = {
      brandId: query.brandId,
      categoryId: query.categoryId,
      search: query.search,
      isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
    };
    const pagination = {
      page: parseInt(query.page || '1', 10),
      limit: parseInt(query.limit || '20', 10),
    };

    const result = await listProducts(filters, pagination);
    return reply.status(200).send(result);
  });

  fastify.get('/:id', {
    schema: {
      tags: ['products'],
      summary: 'Get product by ID',
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const product = await getProduct(id);
    return reply.status(200).send(product);
  });

  fastify.post('/', {
    schema: {
      tags: ['products'],
      summary: 'Create a new product',
      body: createBodySchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const data = createProductInput.parse(request.body);
    const product = await createProduct({
      ...data,
      crossRefs: data.crossRefs ?? undefined,
      specifications: data.specifications ?? undefined,
      extras: data.extras ?? undefined,
    } as any);
    return reply.status(201).send(product);
  });

  fastify.put('/:id', {
    schema: {
      tags: ['products'],
      summary: 'Full update of a product',
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
      body: updateBodySchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const data = updateProductInput.parse(request.body);
    const product = await updateProduct(id, data as any);
    return reply.status(200).send(product);
  });

  fastify.patch('/:id', {
    schema: {
      tags: ['products'],
      summary: 'Partial update of a product',
      params: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' } },
        required: ['id'],
      },
      body: updateBodySchema,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const data = updateProductInput.parse(request.body);
    const product = await updateProduct(id, data as any);
    return reply.status(200).send(product);
  });

  fastify.delete(
    '/:id',
    {
      preHandler: [roleGuard('admin')],
      schema: {
        tags: ['products'],
        summary: 'Delete a product (admin only)',
        description: 'Blocked if stock movements exist. Use deactivate instead.',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      await deleteProduct(id);
      return reply.status(204).send();
    },
  );
}
