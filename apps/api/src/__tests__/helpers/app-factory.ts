import Fastify, { type FastifyInstance } from 'fastify';
import { setGlobalErrorHandler } from '../../plugins/error-handler.js';
import { authRoutes } from '../../modules/auth/routes.js';
import { productRoutes } from '../../modules/products/routes.js';
import { priceRoutes } from '../../modules/prices/routes.js';
import { stockRoutes } from '../../modules/stock/routes.js';
import { reportRoutes } from '../../modules/reports/routes.js';
import { userRoutes } from '../../modules/users/routes.js';
import { migrationRoutes } from '../../modules/migration/routes.js';
import { checkDbHealth } from '../../db/index.js';

/**
 * Build a Fastify instance configured for testing.
 * Registers all plugins and routes, but with test-friendly defaults.
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  // Error handler (must be set on root instance for Fastify v5 global scope)
  setGlobalErrorHandler(app);

  // Multipart (for migration tests)
  await app.register(import('@fastify/multipart'), {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  // Rate limiting (same as production)
  await app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  });

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(productRoutes, { prefix: '/api/products' });
  await app.register(priceRoutes, { prefix: '/api' });
  await app.register(stockRoutes, { prefix: '/api/stock' });
  await app.register(reportRoutes, { prefix: '/api/reports' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(migrationRoutes, { prefix: '/api/migration' });

  // Health check with DB ping
  app.get('/api/health', async () => {
    const dbStatus = await checkDbHealth();
    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      db: dbStatus,
      timestamp: new Date().toISOString(),
    };
  });

  await app.ready();
  return app;
}
