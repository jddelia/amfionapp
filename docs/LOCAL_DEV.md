# Local Development

## Prerequisites

- Node.js 20.9+
- pnpm 9.x
- Redis (local or via Docker)

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Create env files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/worker/.env.example apps/worker/.env
```

3. Start services (in separate terminals):

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:worker
```

## Hostnames

For local multi-tenant testing, add a hosts entry:

```
127.0.0.1  demo.yourdomain.com
```

Then access `http://demo.yourdomain.com:3000`.
