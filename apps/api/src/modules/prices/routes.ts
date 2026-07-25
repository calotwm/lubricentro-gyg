import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createPriceInput } from '@lubricentro/shared';
import { getPriceHistory, setPrice } from './service.js';
import { authGuard } from '../../middleware/auth-guard.js';

export async function priceRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authGuard);

  fastify.get(
    '/products/:id/prices',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const query = request.query as Record<string, string>;
      const prices = await getPriceHistory(id, query.priceType);
      return reply.status(200).send(prices);
    },
  );

  fastify.post(
    '/products/:id/prices',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const data = createPriceInput.parse(request.body);

      const price = await setPrice(id, {
        priceType: data.priceType,
        price: data.price,
        discountPct: data.discountPct,
        effectiveFrom: new Date(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
        notes: data.notes,
      });

      return reply.status(201).send(price);
    },
  );
}
