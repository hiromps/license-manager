import { PrismaClient } from '../node_modules/.prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      plan: 'enterprise',
    },
  });

  console.log('✅ Created organization:', org.name);

  // Create demo user (admin)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'admin@acme.com',
      passwordHash: await hashPassword('admin123'), // Change in production!
      name: 'Admin User',
      role: 'admin',
    },
  });

  console.log('✅ Created user:', admin.email);

  // Create demo product
  const product = await prisma.product.upsert({
    where: { id: 'demo-product' },
    update: {},
    create: {
      id: 'demo-product',
      organizationId: org.id,
      name: 'AutoTouch Pro',
      version: '8.0',
      description: 'Professional automation tool',
    },
  });

  console.log('✅ Created product:', product.name);

  // Create demo licenses
  const licenses = [
    {
      licenseKey: 'ATP8-DEMO-0001-FREE',
      licenseType: 'trial',
      maxActivations: 1,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      features: JSON.stringify({ basic: true }),
    },
    {
      licenseKey: 'ATP8-DEMO-0002-PRO',
      licenseType: 'subscription',
      maxActivations: 5,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      features: JSON.stringify({ basic: true, advanced: true }),
    },
    {
      licenseKey: 'ATP8-DEMO-0003-ENT',
      licenseType: 'perpetual',
      maxActivations: 100,
      expiresAt: null,
      features: JSON.stringify({ basic: true, advanced: true, enterprise: true }),
    },
  ];

  for (const licenseData of licenses) {
    const license = await prisma.license.upsert({
      where: { licenseKey: licenseData.licenseKey },
      update: {},
      create: {
        organizationId: org.id,
        productId: product.id,
        ...licenseData,
      },
    });
    console.log('✅ Created license:', license.licenseKey);
  }

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
