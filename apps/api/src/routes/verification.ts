import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@license-manager/database';
import { licenseSigner } from '@license-manager/crypto';
import type { VerifyLicenseRequest, ActivateLicenseRequest } from '@license-manager/types';

const verifySchema = z.object({
  licenseKey: z.string(),
  deviceFingerprint: z.string().optional(),
  productVersion: z.string().optional(),
});

const activateSchema = z.object({
  licenseKey: z.string(),
  deviceFingerprint: z.string(),
  deviceInfo: z.object({
    platform: z.string().optional(),
    hostname: z.string().optional(),
    osVersion: z.string().optional(),
  }).optional(),
});

export const verificationRoutes: FastifyPluginAsync = async (server) => {
  // Public: Verify license
  server.post<{ Body: VerifyLicenseRequest }>('/verify', async (request, reply) => {
    const { licenseKey, deviceFingerprint, productVersion } = verifySchema.parse(request.body);

    const license = await prisma.license.findUnique({
      where: { licenseKey },
      include: {
        product: true,
        activations: {
          where: { status: 'active' },
        },
      },
    });

    if (!license) {
      return reply.status(404).send({
        valid: false,
        error: {
          code: 'LICENSE_NOT_FOUND',
          message: 'License key not found',
        },
      });
    }

    // Check status
    if (license.status !== 'active') {
      return reply.send({
        valid: false,
        error: {
          code: license.status === 'expired' ? 'LICENSE_EXPIRED' : 'LICENSE_SUSPENDED',
          message: `License is ${license.status}`,
        },
      });
    }

    // Check expiration
    if (license.expiresAt && license.expiresAt < new Date()) {
      await prisma.license.update({
        where: { id: license.id },
        data: { status: 'expired' },
      });

      return reply.send({
        valid: false,
        error: {
          code: 'LICENSE_EXPIRED',
          message: 'License has expired',
        },
      });
    }

    // Check activation limit
    if (deviceFingerprint) {
      const existingActivation = license.activations.find(
        (a) => a.deviceFingerprint === deviceFingerprint
      );

      if (!existingActivation && license.activations.length >= license.maxActivations) {
        return reply.send({
          valid: false,
          error: {
            code: 'MAX_ACTIVATIONS_REACHED',
            message: `Maximum activations (${license.maxActivations}) reached`,
          },
        });
      }
    }

    // Parse features from JSON string
    const features = license.features ? JSON.parse(license.features) : {};

    // Create offline certificate (valid for 30 days)
    await licenseSigner.initialize();
    const certificate = await licenseSigner.createOfflineCertificate(
      {
        productId: license.productId,
        licenseKey: license.licenseKey,
        licenseType: license.licenseType as any,
        maxActivations: license.maxActivations,
        features,
        expiresAt: license.expiresAt?.toISOString(),
        issuedAt: new Date().toISOString(),
      },
      process.env.LICENSE_PRIVATE_KEY!,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    return reply.send({
      valid: true,
      license: {
        licenseKey: license.licenseKey,
        productId: license.productId,
        licenseType: license.licenseType,
        maxActivations: license.maxActivations,
        currentActivations: license.activations.length,
        features,
        expiresAt: license.expiresAt?.toISOString() || null,
      },
      certificate, // For offline validation
    });
  });

  // Public: Activate license
  server.post<{ Body: ActivateLicenseRequest }>('/activate', async (request, reply) => {
    const { licenseKey, deviceFingerprint, deviceInfo } = activateSchema.parse(request.body);

    const license = await prisma.license.findUnique({
      where: { licenseKey },
      include: {
        activations: {
          where: { status: 'active' },
        },
      },
    });

    if (!license) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'LICENSE_NOT_FOUND',
          message: 'License key not found',
        },
      });
    }

    if (license.status !== 'active') {
      return reply.send({
        success: false,
        error: {
          code: 'LICENSE_INACTIVE',
          message: `License is ${license.status}`,
        },
      });
    }

    // Check if already activated
    const existing = await prisma.activation.findUnique({
      where: {
        licenseId_deviceFingerprint: {
          licenseId: license.id,
          deviceFingerprint,
        },
      },
    });

    if (existing) {
      if (existing.status === 'active') {
        // Update last check-in
        await prisma.activation.update({
          where: { id: existing.id },
          data: { lastCheckInAt: new Date() },
        });

        return reply.send({
          success: true,
          activationId: existing.id,
        });
      } else {
        return reply.send({
          success: false,
          error: {
            code: 'ACTIVATION_REVOKED',
            message: 'This device activation was revoked',
          },
        });
      }
    }

    // Check activation limit
    if (license.activations.length >= license.maxActivations) {
      return reply.send({
        success: false,
        error: {
          code: 'MAX_ACTIVATIONS_REACHED',
          message: `Maximum activations (${license.maxActivations}) reached`,
        },
      });
    }

    // Create activation
    const activation = await prisma.activation.create({
      data: {
        licenseId: license.id,
        deviceFingerprint,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: license.organizationId,
        action: 'ACTIVATION_CREATED',
        resourceType: 'ACTIVATION',
        resourceId: activation.id,
        metadata: JSON.stringify({ licenseKey, deviceFingerprint }),
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });

    return reply.status(201).send({
      success: true,
      activationId: activation.id,
    });
  });

  // Public: Heartbeat (check-in)
  server.post<{ Body: { licenseKey: string; deviceFingerprint: string } }>('/heartbeat', async (request, reply) => {
    const { licenseKey, deviceFingerprint } = request.body;

    const activation = await prisma.activation.findFirst({
      where: {
        license: { licenseKey },
        deviceFingerprint,
        status: 'active',
      },
      include: { license: true },
    });

    if (!activation) {
      return reply.status(404).send({
        valid: false,
        error: { code: 'ACTIVATION_NOT_FOUND', message: 'Activation not found' },
      });
    }

    // Update last check-in
    await prisma.activation.update({
      where: { id: activation.id },
      data: { lastCheckInAt: new Date() },
    });

    // Check license validity
    const isExpired = activation.license.expiresAt && activation.license.expiresAt < new Date();

    return reply.send({
      valid: !isExpired && activation.license.status === 'active',
      expiresAt: activation.license.expiresAt?.toISOString(),
    });
  });
};
