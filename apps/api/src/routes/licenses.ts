import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@license-manager/database';
import { licenseSigner } from '@license-manager/crypto';
import { authenticate } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import type { CreateLicenseRequest, UpdateLicenseRequest, LicenseListQuery } from '@license-manager/types';

const createSchema = z.object({
  productId: z.string().uuid(),
  licenseType: z.enum(['perpetual', 'subscription', 'trial']),
  maxActivations: z.number().int().positive(),
  expiresAt: z.string().optional(),
  features: z.record(z.boolean()).optional(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  maxActivations: z.number().int().positive().optional(),
  expiresAt: z.string().optional(),
  features: z.record(z.boolean()).optional(),
  status: z.enum(['active', 'suspended', 'revoked']).optional(),
  notes: z.string().optional(),
});

function generateLicenseKey(productName: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const prefix = productName.substring(0, 3).toUpperCase();

  return `${prefix}-${timestamp}-${random}`;
}

export const licenseRoutes: FastifyPluginAsync = async (server) => {
  // List licenses
  server.get<{ Querystring: LicenseListQuery }>('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    // Convert query params to numbers (HTTP query params are always strings)
    const page = parseInt(request.query.page as string, 10) || 1;
    const limit = parseInt(request.query.limit as string, 10) || 20;
    const { productId, status, licenseType, search } = request.query;
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: request.user!.organizationId,
    };

    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (licenseType) where.licenseType = licenseType;
    if (search) where.licenseKey = { contains: search, mode: 'insensitive' };

    const [licenses, total] = await Promise.all([
      prisma.license.findMany({
        where,
        include: {
          product: { select: { name: true } },
          _count: { select: { activations: { where: { status: 'active' } } } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.license.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: licenses.map(lic => ({
        ...lic,
        features: lic.features ? JSON.parse(lic.features) : null,
        productName: lic.product.name,
        currentActivations: lic._count.activations,
      })),
      meta: { page, limit, total },
    });
  });

  // Create license
  server.post<{ Body: CreateLicenseRequest }>('/', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    // Validate request body
    const result = createSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: result.error.format(),
        },
      });
    }
    const data = result.data;

    // Verify product belongs to organization
    const product = await prisma.product.findFirst({
      where: {
        id: data.productId,
        organizationId: request.user!.organizationId,
      },
    });

    if (!product) {
      return reply.status(404).send({
        success: false,
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
      });
    }

    // Generate license key
    const licenseKey = generateLicenseKey(product.name);

    // Create license
    const license = await prisma.license.create({
      data: {
        organizationId: request.user!.organizationId,
        productId: data.productId,
        licenseKey,
        licenseType: data.licenseType,
        maxActivations: data.maxActivations,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        features: data.features ? JSON.stringify(data.features) : null,
        notes: data.notes,
      },
      include: { product: true },
    });

    // Audit log
    await logAudit(request, 'LICENSE_CREATED', 'LICENSE', license.id, { licenseKey });

    return reply.status(201).send({
      success: true,
      data: {
        ...license,
        features: license.features ? JSON.parse(license.features) : null,
        productName: license.product.name,
        currentActivations: 0,
      },
    });
  });

  // Get license
  server.get<{ Params: { id: string } }>('/:id', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    const license = await prisma.license.findFirst({
      where: {
        id: request.params.id,
        organizationId: request.user!.organizationId,
      },
      include: {
        product: true,
        activations: {
          where: { status: 'active' },
          orderBy: { activatedAt: 'desc' },
        },
      },
    });

    if (!license) {
      return reply.status(404).send({
        success: false,
        error: { code: 'LICENSE_NOT_FOUND', message: 'License not found' },
      });
    }

    return reply.send({
      success: true,
      data: {
        ...license,
        features: license.features ? JSON.parse(license.features) : null,
        productName: license.product.name,
        currentActivations: license.activations.length,
      },
    });
  });

  // Update license
  server.put<{ Params: { id: string }; Body: UpdateLicenseRequest }>('/:id', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    // Validate request body
    const result = updateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: result.error.format(),
        },
      });
    }
    const data = result.data;

    const license = await prisma.license.findFirst({
      where: {
        id: request.params.id,
        organizationId: request.user!.organizationId,
      },
    });

    if (!license) {
      return reply.status(404).send({
        success: false,
        error: { code: 'LICENSE_NOT_FOUND', message: 'License not found' },
      });
    }

    const updated = await prisma.license.update({
      where: { id: request.params.id },
      data: {
        ...data,
        features: data.features ? JSON.stringify(data.features) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
      include: { product: true },
    });

    await logAudit(request, 'LICENSE_UPDATED', 'LICENSE', updated.id, data);

    return reply.send({
      success: true,
      data: {
        ...updated,
        features: updated.features ? JSON.parse(updated.features) : null,
      },
    });
  });

  // Delete license
  server.delete<{ Params: { id: string } }>('/:id', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    const license = await prisma.license.findFirst({
      where: {
        id: request.params.id,
        organizationId: request.user!.organizationId,
      },
    });

    if (!license) {
      return reply.status(404).send({
        success: false,
        error: { code: 'LICENSE_NOT_FOUND', message: 'License not found' },
      });
    }

    await prisma.license.delete({ where: { id: request.params.id } });

    await logAudit(request, 'LICENSE_DELETED', 'LICENSE', request.params.id);

    return reply.send({ success: true });
  });

  // Get license activations
  server.get<{ Params: { id: string } }>('/:id/activations', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    const license = await prisma.license.findFirst({
      where: {
        id: request.params.id,
        organizationId: request.user!.organizationId,
      },
      include: {
        activations: {
          orderBy: { activatedAt: 'desc' },
        },
      },
    });

    if (!license) {
      return reply.status(404).send({
        success: false,
        error: { code: 'LICENSE_NOT_FOUND', message: 'License not found' },
      });
    }

    return reply.send({
      success: true,
      data: license.activations,
    });
  });

  // Revoke activation
  server.delete<{ Params: { id: string; activationId: string } }>('/:id/activations/:activationId', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    const activation = await prisma.activation.findFirst({
      where: {
        id: request.params.activationId,
        license: {
          id: request.params.id,
          organizationId: request.user!.organizationId,
        },
      },
    });

    if (!activation) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ACTIVATION_NOT_FOUND', message: 'Activation not found' },
      });
    }

    await prisma.activation.update({
      where: { id: request.params.activationId },
      data: { status: 'revoked', revokedAt: new Date() },
    });

    await logAudit(request, 'ACTIVATION_REVOKED', 'ACTIVATION', request.params.activationId);

    return reply.send({ success: true });
  });
};
