import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@license-manager/database';
import { authenticate } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const createSchema = z.object({
  name: z.string().min(1),
  version: z.string(),
  description: z.string().optional(),
});

export const productRoutes: FastifyPluginAsync = async (server) => {
  // List products
  server.get('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    const products = await prisma.product.findMany({
      where: { organizationId: request.user!.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({
      success: true,
      data: products,
    });
  });

  // Create product
  server.post('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    const data = createSchema.parse(request.body);

    const product = await prisma.product.create({
      data: {
        ...data,
        organizationId: request.user!.organizationId,
      },
    });

    await logAudit(request, 'PRODUCT_CREATED', 'PRODUCT', product.id);

    return reply.status(201).send({
      success: true,
      data: product,
    });
  });
};
