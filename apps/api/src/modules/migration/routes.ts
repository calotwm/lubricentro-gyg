import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { processImport, getImportStatus } from './service.js';
import { authGuard } from '../../middleware/auth-guard.js';
import { roleGuard } from '../../middleware/role-guard.js';

export async function migrationRoutes(fastify: FastifyInstance): Promise<void> {
  // All migration routes require auth + admin role
  fastify.addHook('preHandler', authGuard);
  fastify.addHook('preHandler', roleGuard('admin'));

  // POST /api/migration/import — upload Excel and trigger import
  fastify.post('/import', async (request: FastifyRequest, reply: FastifyReply) => {
    // Read multipart file
    const file = await request.file();

    if (!file) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: 'No file uploaded. Send a multipart form with an Excel file.',
        },
      });
    }

    // Validate file type
    const mimeType = file.mimetype;
    const validMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!validMimes.includes(mimeType)) {
      return reply.status(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: `Invalid file type: ${mimeType}. Expected Excel file (.xlsx or .xls).`,
        },
      });
    }

    // Read file buffer
    const buffer = await file.toBuffer();

    try {
      const result = await processImport(buffer);
      return reply.status(200).send(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({
        error: {
          code: 'IMPORT_FAILED',
          message,
        },
      });
    }
  });

  // GET /api/migration/status — check latest import progress
  fastify.get('/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    const status = getImportStatus();

    if (!status) {
      return reply.status(200).send({
        status: 'none',
        message: 'No imports have been run yet.',
      });
    }

    return reply.status(200).send(status);
  });
}
