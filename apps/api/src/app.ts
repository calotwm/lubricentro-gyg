import Fastify, { type FastifyInstance } from 'fastify';
import { setGlobalErrorHandler } from './plugins/error-handler.js';
import { authRoutes } from './modules/auth/routes.js';
import { productRoutes } from './modules/products/routes.js';
import { priceRoutes } from './modules/prices/routes.js';
import { stockRoutes } from './modules/stock/routes.js';
import { reportRoutes } from './modules/reports/routes.js';
import { userRoutes } from './modules/users/routes.js';
import { migrationRoutes } from './modules/migration/routes.js';
import { checkDbHealth, runMigrations } from './db/index.js';

export async function buildApp(opts?: { logger?: boolean }): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opts?.logger ?? process.env.NODE_ENV !== 'test',
  });

  // Error handler (must be set on root instance for Fastify v5 global scope)
  setGlobalErrorHandler(app);

  // CORS
  await app.register(import('@fastify/cors'), {
    origin: process.env.CORS_ORIGIN === '*' ? true : (process.env.CORS_ORIGIN || 'http://localhost:5173'),
    credentials: true,
  });

  // Multipart (for Excel file uploads in migration)
  await app.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  });

  // Rate limiting — protects auth endpoints from brute-force attacks
  await app.register(import('@fastify/rate-limit'), {
    max: 100, // default: 100 requests per window
    timeWindow: '1 minute',
  });

  // Swagger / OpenAPI documentation
  await app.register(import('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'Lubricentro GYG API',
        description: 'API for Lubricentro GYG — product catalog, stock control, price management',
        version: '1.0.0',
      },
      servers: [
        {
          url: process.env.API_URL || 'http://localhost:3000',
          description: 'API server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await app.register(import('@fastify/swagger-ui'), {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Health check with DB connectivity check
  app.get('/api/health', async () => {
    const dbStatus = await checkDbHealth();
    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      db: dbStatus,
      timestamp: new Date().toISOString(),
    };
  });

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(productRoutes, { prefix: '/api/products' });
  await app.register(priceRoutes, { prefix: '/api' });
  await app.register(stockRoutes, { prefix: '/api/stock' });
  await app.register(reportRoutes, { prefix: '/api/reports' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(migrationRoutes, { prefix: '/api/migration' });

  return app;
}

export async function startApp(): Promise<void> {
  const app = await buildApp({ logger: true });
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = '0.0.0.0';

  try {
    // Run migrations on startup (safe to run multiple times)
    if (process.env.NODE_ENV === 'production') {
      await runMigrations();
    }
    await app.listen({ port, host });
    console.log(`Server listening on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Auto-start when executed directly
startApp();
