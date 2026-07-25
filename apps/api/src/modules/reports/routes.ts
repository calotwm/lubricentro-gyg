import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { movementReportFilterSchema, valuationFilterSchema } from '@lubricentro/shared';
import { getMovementReport, getValuation, getLowStockReport, getMovementReportCSV } from './service.js';
import { authGuard } from '../../middleware/auth-guard.js';

export async function reportRoutes(fastify: FastifyInstance): Promise<void> {
  // All report routes require auth
  fastify.addHook('preHandler', authGuard);

  // GET /api/reports/movements — movement aggregation report
  fastify.get('/movements', {
    schema: {
      tags: ['reports'],
      summary: 'Movement aggregation report',
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Start date (ISO)' },
          to: { type: 'string', description: 'End date (ISO)' },
          groupBy: { type: 'string', enum: ['day', 'week', 'month'] },
          productId: { type: 'string', format: 'uuid' },
          brandId: { type: 'string', format: 'uuid' },
          movementType: { type: 'string', enum: ['entry', 'exit', 'adjustment'] },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string>;
    const filters = movementReportFilterSchema.parse({
      from: query.from,
      to: query.to,
      groupBy: query.groupBy || 'day',
      productId: query.productId,
      brandId: query.brandId,
      movementType: query.movementType,
    });

    const result = await getMovementReport(filters);
    return reply.status(200).send(result);
  });

  // GET /api/reports/valuation — stock valuation summary
  fastify.get('/valuation', {
    schema: {
      tags: ['reports'],
      summary: 'Stock valuation summary',
      description: 'Calculates current_stock × cost_price per brand and grand total',
      querystring: {
        type: 'object',
        properties: {
          brandId: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string>;
    const filters = valuationFilterSchema.parse({
      brandId: query.brandId,
    });

    const result = await getValuation(filters);
    return reply.status(200).send(result);
  });

  // GET /api/reports/low-stock — low-stock alert report
  fastify.get('/low-stock', {
    schema: {
      tags: ['reports'],
      summary: 'Low-stock alert report',
      description: 'Products where current_stock ≤ min_stock_threshold',
    },
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const result = await getLowStockReport();
    return reply.status(200).send(result);
  });

  // GET /api/reports/movements/export — CSV export of movement report
  fastify.get('/movements/export', {
    schema: {
      tags: ['reports'],
      summary: 'Export movement report as CSV',
      description: 'Same filters as /movements but returns CSV content-type',
      querystring: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Start date (ISO)' },
          to: { type: 'string', description: 'End date (ISO)' },
          groupBy: { type: 'string', enum: ['day', 'week', 'month'] },
          productId: { type: 'string', format: 'uuid' },
          brandId: { type: 'string', format: 'uuid' },
          movementType: { type: 'string', enum: ['entry', 'exit', 'adjustment'] },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, string>;
    const filters = movementReportFilterSchema.parse({
      from: query.from,
      to: query.to,
      groupBy: query.groupBy || 'day',
      productId: query.productId,
      brandId: query.brandId,
      movementType: query.movementType,
    });

    const csv = await getMovementReportCSV(filters);
    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="movements-${filters.from || 'all'}-${filters.to || 'all'}.csv"`);
    return reply.status(200).send(csv);
  });
}
