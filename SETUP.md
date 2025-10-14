# License Manager - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 16
- Docker & Docker Compose (optional)

### Installation

1. **Clone and install dependencies**
```bash
git clone <repo-url>
cd license-manager
pnpm install
```

2. **Generate encryption keys**
```bash
# Run the key generator
node -e "
const sodium = require('libsodium-wrappers');
(async () => {
  await sodium.ready;
  const keys = sodium.crypto_sign_keypair();
  console.log('PUBLIC_KEY=' + sodium.to_base64(keys.publicKey));
  console.log('PRIVATE_KEY=' + sodium.to_base64(keys.privateKey));
})();
"
```

3. **Setup environment variables**
```bash
# API (.env)
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env and add your keys

# Web (.env)
cp apps/web/.env.example apps/web/.env
```

4. **Database setup**
```bash
# Run migrations
pnpm db:migrate

# Seed demo data
pnpm --filter @license-manager/database db:seed
```

5. **Start development servers**
```bash
# Start all services
pnpm dev

# API: http://localhost:3000
# Web: http://localhost:5173
```

6. **Login**
```
Email: admin@acme.com
Password: admin123
```

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Database Management

### Migrations
```bash
# Create migration
pnpm db:migrate

# Reset database
pnpm --filter @license-manager/database prisma migrate reset

# Open Prisma Studio
pnpm db:studio
```

### Backup
```bash
pg_dump -U postgres license_manager > backup.sql
```

## 🔐 Security Setup

### 1. Generate License Keys
```bash
cd packages/crypto
npm run keygen
```

### 2. Environment Variables (Production)
```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<strong-secret-key>
LICENSE_PRIVATE_KEY=<base64-encoded>
LICENSE_PUBLIC_KEY=<base64-encoded>

# Optional
REDIS_URL=redis://localhost:6379
```

### 3. SSL/TLS
- Use reverse proxy (Nginx/Caddy)
- Configure HTTPS certificates
- Update CORS_ORIGIN

## 📝 API Documentation

### Authentication
```bash
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

### Create License
```bash
POST /api/v1/licenses
Authorization: Bearer <token>
{
  "productId": "uuid",
  "licenseType": "subscription",
  "maxActivations": 5,
  "expiresAt": "2025-12-31"
}
```

### Verify License (Public)
```bash
POST /api/v1/verify
{
  "licenseKey": "XXXX-XXXX-XXXX",
  "deviceFingerprint": "abc123"
}
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Crypto package tests
pnpm --filter @license-manager/crypto test

# API tests
pnpm --filter @license-manager/api test
```

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
```bash
# Docker logs
docker-compose logs -f api

# PM2 logs
pm2 logs license-api
```

## 🔧 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify connection string
psql "postgresql://user:pass@localhost:5432/license_manager"
```

### Prisma Issues
```bash
# Regenerate client
pnpm --filter @license-manager/database db:generate

# Reset and migrate
pnpm --filter @license-manager/database prisma migrate reset
```

### Port Conflicts
```bash
# Check ports
lsof -i :3000  # API
lsof -i :5173  # Web
lsof -i :5432  # PostgreSQL
```

## 📚 Resources

- [API Documentation](./docs/API.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Contributing](./CONTRIBUTING.md)
- [License](./LICENSE)

## 🆘 Support

- GitHub Issues: <repo-url>/issues
- Email: support@example.com
- Docs: https://docs.example.com
