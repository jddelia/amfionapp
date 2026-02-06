# Security Notes

## Secrets

- Global secrets live in runtime env vars (Coolify or similar).
- Per-tenant secrets are stored in Supabase Vault and referenced by `vault_secret_id`.
- Never expose service role keys to the client.

## Webhooks

- Verify Cal.com `x-cal-signature-256` HMAC SHA256 signature.
- Verify Stripe webhook signatures using `stripe.webhooks.constructEvent`.

## PII Handling

- Redact emails/phones in logs.
- Store PII only in DB; do not log raw webhook bodies.

## RLS Enforcement

- RLS enabled on all tenant-scoped tables.
- Access via tenant membership or platform admin role.
