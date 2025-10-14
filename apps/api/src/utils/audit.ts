import { prisma } from '@license-manager/database';
import { FastifyRequest } from 'fastify';

export async function logAudit(
  request: FastifyRequest,
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata?: any
) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: request.user?.organizationId || 'system',
        userId: request.user?.id,
        action,
        resourceType,
        resourceId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });
  } catch (error) {
    // Log but don't fail the request
    console.error('Failed to create audit log:', error);
  }
}
