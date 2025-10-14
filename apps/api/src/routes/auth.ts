import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '@license-manager/database';
import * as crypto from 'crypto';
import type { LoginRequest, ApiResponse, LoginResponse } from '@license-manager/types';
import { authenticate } from '../middleware/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  organizationName: z.string().min(2),
});

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const authRoutes: FastifyPluginAsync = async (server) => {
  // Register
  server.post('/register', async (request, reply) => {
    const { email, password, name, organizationName } = registerSchema.parse(request.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists',
        },
      });
    }

    // Create organization and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: organizationName.toLowerCase().replace(/\s+/g, '-'),
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashPassword(password),
          name,
          role: 'customer',
          organizationId: organization.id,
          isActive: true,
        },
        include: { organization: true },
      });

      return { user, organization };
    });

    // Generate JWT token
    const token = server.jwt.sign(
      {
        sub: result.user.id,
        email: result.user.email,
        role: result.user.role,
        organizationId: result.user.organizationId,
      },
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        token,
        refreshToken: token,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name || '',
          role: result.user.role,
          organizationId: result.user.organizationId,
          organizationName: result.organization.name,
        },
      },
    };

    return reply.status(201).send(response);
  });

  // Login
  server.post<{ Body: LoginRequest }>('/login', async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user || user.passwordHash !== hashPassword(password)) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    if (!user.isActive) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Account is inactive',
        },
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = server.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        token,
        refreshToken: token, // Simplified - should use refresh token logic
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
        },
      },
    };

    return reply.send(response);
  });

  // Get current user
  server.get('/me', {
    onRequest: [authenticate],
  }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      include: { organization: true },
    });

    return reply.send({
      success: true,
      data: {
        id: user!.id,
        email: user!.email,
        name: user!.name,
        role: user!.role,
        organizationId: user!.organizationId,
        organizationName: user!.organization.name,
      },
    });
  });
};
