# Amfion AI Booking Portal

White-label, multi-tenant booking portal with AI-assisted scheduling, built for local businesses.

## What’s Included

- Multi-tenant routing via hostname resolution
- Next.js 16 web app (public booking + admin entry)
- Fastify API service with SSE chat stub
- BullMQ worker skeleton for webhooks/notifications
- Supabase Postgres schema + RLS policies

## Repo Structure

- `apps/web` — Next.js UI
- `apps/api` — Fastify API service
- `apps/worker` — BullMQ worker service
- `packages/shared` — Shared types and schemas
- `packages/integrations` — Provider SDK wrappers
- `packages/db` — SQL migrations + RLS
- `docs` — Architecture, security, and API docs

## Local Development

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/worker/.env.example apps/worker/.env

pnpm dev:api
pnpm dev:web
pnpm dev:worker
```

## Scripts

- `pnpm dev:api` — Run API service
- `pnpm dev:web` — Run web app
- `pnpm dev:worker` — Run worker
- `pnpm build` — Build all packages
- `pnpm test` — Run tests

## Docs

- `docs/ARCHITECTURE.md`
- `docs/LOCAL_DEV.md`
- `docs/SECURITY.md`
- `docs/API.md`
