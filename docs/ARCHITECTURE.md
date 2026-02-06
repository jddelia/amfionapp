# Architecture Overview

## Services

- `apps/web`: Next.js 16 SSR + static assets.
- `apps/api`: Fastify API handling business logic, chat, and webhooks.
- `apps/worker`: BullMQ worker processing webhooks, notifications, and retries.
- Redis: caching, rate limiting, queues.
- Supabase Postgres: multi-tenant data + RLS enforcement.

## Request Flow

1. User hits `{tenant}.yourdomain.com` or a verified custom domain.
2. Web app renders tenant-branded UI and embeds chat experience.
3. API resolves tenant via `Host` header and enforces tenant context.
4. Chat API streams responses via SSE.
5. Provider webhooks (Cal.com, Stripe) enter `/v1/webhooks/*` and queue jobs for processing.

## Multi-Tenant Enforcement

- Every tenant-scoped table includes `tenant_id`.
- RLS policies restrict access to tenant members or platform admins.
- Service role key is **server only** and bypasses RLS; never expose to client code.
