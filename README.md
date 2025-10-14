# License Manager

オンラインライセンス管理システム - Enterprise-grade software license management platform

## 🏗️ Architecture

```
license-manager/
├── apps/
│   ├── api/          # Backend API (Node.js + Fastify + Prisma)
│   └── web/          # Frontend Dashboard (React + TypeScript + Vite)
├── packages/
│   ├── crypto/       # Ed25519 License signing/verification
│   ├── database/     # Prisma schema and migrations
│   └── types/        # Shared TypeScript types
└── docker/           # Docker & K8s configurations
```

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Fastify
- **ORM**: Prisma (PostgreSQL)
- **Auth**: JWT + Passport.js
- **Crypto**: libsodium (Ed25519)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod

### Database
- **Primary**: PostgreSQL 16
- **Cache**: Redis 7
- **Multi-tenant**: Shared schema with organization_id

## 📦 Getting Started

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 16
- Redis >= 7 (optional, for caching)

### Installation

```bash
# Install dependencies
pnpm install

# Setup environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Development

```bash
# API: http://localhost:3000
# Web: http://localhost:5173

# Database Studio
pnpm db:studio

# Run tests
pnpm test

# Build for production
pnpm build
```

## 🔐 Security Features

- **Ed25519 Signature**: Cryptographic license signing
- **Hardware Fingerprinting**: Device-based activation
- **Offline Verification**: Certificate-based validation
- **Rate Limiting**: DDoS protection
- **Audit Logging**: GDPR-compliant activity tracking

## 📊 Database Schema

```sql
Core Tables:
- organizations (Multi-tenant isolation)
- users (Authentication & RBAC)
- products (Licensed products)
- licenses (License keys & metadata)
- activations (Device activations)
- audit_logs (Compliance & tracking)
```

## 🔌 API Endpoints

```
Auth:
POST   /api/v1/auth/login
POST   /api/v1/auth/register

Licenses:
GET    /api/v1/licenses
POST   /api/v1/licenses
GET    /api/v1/licenses/:id
PUT    /api/v1/licenses/:id
DELETE /api/v1/licenses/:id

Verification (Public):
POST   /api/v1/verify
POST   /api/v1/activate
```

## 🐳 Docker Deployment

```bash
# Build images
docker-compose build

# Run services
docker-compose up -d

# Scale API
docker-compose up -d --scale api=3
```

## 📈 Roadmap

- [x] Phase 1: MVP (Basic CRUD, Dashboard)
- [ ] Phase 2: Security (Ed25519, Fingerprinting)
- [ ] Phase 3: Enterprise (Multi-tenant, Subscriptions)
- [ ] Phase 4: Scale (Redis, K8s, Multi-region)

## 📝 License

MIT

---

**Generated with SuperClaude Framework** 🤖
