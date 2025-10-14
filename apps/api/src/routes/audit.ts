import { FastifyPluginAsync } from 'fastify';
import { prisma } from '@license-manager/database';
import { authenticate } from '../middleware/auth';
import type { AuditLogQuery } from '@license-manager/types';

export const auditRoutes: FastifyPluginAsync = async (server) => {
  server.get<{ Querystring: AuditLogQuery }>('/logs', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    const {
      page = 1,
      limit = 50,
      action,
      resourceType,
      userId,
      startDate,
      endDate,
    } = request.query;

    const skip = (page - 1) * limit;
    const where: any = {
      organizationId: request.user!.organizationId,
    };

    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: logs.map((log) => ({
        ...log,
        userName: log.user?.name || log.user?.email || 'System',
      })),
      meta: { page, limit, total },
    });
  });
};
