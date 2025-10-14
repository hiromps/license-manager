import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { prisma } from '@license-manager/database';

// Middleware
import { authenticate } from './middleware/auth';

// Routes
import { authRoutes } from './routes/auth';
import { licenseRoutes } from './routes/licenses';
import { verificationRoutes } from './routes/verification';
import { productRoutes } from './routes/products';
import { auditRoutes } from './routes/audit';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // CORS
  await server.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // JWT
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  });

  // Register authenticate decorator
  server.decorate('authenticate', authenticate);

  // Rate Limiting
  await server.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '15 minutes',
  });

  // Health check
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Routes
  await server.register(authRoutes, { prefix: '/api/v1/auth' });
  await server.register(licenseRoutes, { prefix: '/api/v1/licenses' });
  await server.register(verificationRoutes, { prefix: '/api/v1' });
  await server.register(productRoutes, { prefix: '/api/v1/products' });
  await server.register(auditRoutes, { prefix: '/api/v1/audit' });

  // Error handler
  server.setErrorHandler((error, request, reply) => {
    server.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.validation,
        },
      });
    }

    return reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
    });
  });

  return server;
}

async function start() {
  try {
    const server = await buildServer();

    await server.listen({ port: PORT, host: HOST });

    console.log(`🚀 License Manager API running on http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);
        await server.close();
        await prisma.$disconnect();
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
}

start();
