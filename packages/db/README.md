# Database Package

This package contains SQL migrations and RLS policies for the multi-tenant Supabase/Postgres schema.

## Migrations

- `migrations/001_init.sql` bootstraps core tables, indexes, and RLS policies.

## Notes

- Functions `is_platform_admin` and `is_tenant_member` are `SECURITY DEFINER` for RLS checks.
- Service role bypasses RLS. Only use it in trusted backend services.
