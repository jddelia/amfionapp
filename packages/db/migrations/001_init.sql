-- Core extensions
create extension if not exists "pgcrypto";

-- Helper functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_platform_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from platform_admins where user_id = uid);
$$;

create or replace function public.is_tenant_member(tid uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from tenant_memberships
    where tenant_id = tid and user_id = uid and status = 'active'
  );
$$;

-- Tenants
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tenants_set_updated_at
before update on tenants
for each row execute function public.set_updated_at();

-- Tenant profile
create table if not exists tenant_profiles (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  business_name text not null,
  timezone text not null default 'America/New_York',
  phone text,
  email text,
  website_url text,
  address_line1 text,
  address_line2 text,
  city text,
  region text,
  postal_code text,
  country text default 'US',
  business_hours jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tenant_profiles_set_updated_at
before update on tenant_profiles
for each row execute function public.set_updated_at();

-- Branding
create table if not exists tenant_branding (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  logo_url text,
  primary_color text not null default '#2563eb',
  accent_color text not null default '#1e40af',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tenant_branding_set_updated_at
before update on tenant_branding
for each row execute function public.set_updated_at();

-- Domains
create table if not exists tenant_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  hostname text not null unique,
  domain_type text not null,
  verified_at timestamptz,
  tls_status text,
  cf_custom_hostname_id text,
  created_at timestamptz not null default now()
);

create index if not exists tenant_domains_tenant_id_idx on tenant_domains (tenant_id);

-- Memberships
create table if not exists tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table if not exists platform_admins (
  user_id uuid primary key,
  created_at timestamptz not null default now()
);

-- Services
create table if not exists tenant_services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes int not null,
  price_cents int,
  currency text default 'USD',
  active boolean not null default true,
  sort_order int not null default 0,
  cal_event_type_id int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenant_services_tenant_id_active_idx on tenant_services (tenant_id, active);
create index if not exists tenant_services_tenant_id_sort_idx on tenant_services (tenant_id, sort_order);

create trigger tenant_services_set_updated_at
before update on tenant_services
for each row execute function public.set_updated_at();

-- FAQs
create table if not exists tenant_faqs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  question text not null,
  answer text not null,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenant_faqs_tenant_id_active_idx on tenant_faqs (tenant_id, active);

create trigger tenant_faqs_set_updated_at
before update on tenant_faqs
for each row execute function public.set_updated_at();

-- Policies
create table if not exists tenant_policies (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  cancellation_policy text,
  late_policy text,
  no_show_policy text,
  payment_policy text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tenant_policies_set_updated_at
before update on tenant_policies
for each row execute function public.set_updated_at();

-- Integrations
create table if not exists tenant_integrations (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  cal_api_key_secret_id uuid,
  cal_api_version text default '2024-08-13',
  cal_default_event_type_id int,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_status text,
  twilio_account_sid_secret_id uuid,
  twilio_auth_token_secret_id uuid,
  twilio_messaging_service_sid text,
  updated_at timestamptz not null default now()
);

create trigger tenant_integrations_set_updated_at
before update on tenant_integrations
for each row execute function public.set_updated_at();

-- Customers
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  email text,
  phone text,
  name text,
  created_at timestamptz not null default now(),
  unique (tenant_id, email)
);

-- Bookings
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  cal_booking_uid text not null unique,
  cal_event_type_id int,
  service_id uuid references tenant_services(id),
  customer_id uuid references customers(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'confirmed',
  source text not null default 'ai',
  raw_cal_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_tenant_id_start_idx on bookings (tenant_id, start_time);
create index if not exists bookings_tenant_id_status_idx on bookings (tenant_id, status);

create trigger bookings_set_updated_at
before update on bookings
for each row execute function public.set_updated_at();

-- Booking events (append-only)
create table if not exists booking_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null,
  event_type text not null,
  provider_event_id text,
  body_hash text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status text not null default 'pending',
  error text,
  raw_payload jsonb not null,
  unique (provider, body_hash)
);

create index if not exists booking_events_tenant_id_received_idx on booking_events (tenant_id, received_at);
create index if not exists booking_events_status_idx on booking_events (processing_status);

-- Chat
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  converted_booking_id uuid references bookings(id),
  summary text
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  role text not null,
  content jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_id_created_idx on chat_messages (session_id, created_at);

-- Audit log
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  actor_user_id uuid,
  actor_type text not null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_tenant_id_created_idx on audit_log (tenant_id, created_at);

-- Request idempotency
create table if not exists request_idempotency (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  key text not null,
  request_hash text not null,
  response jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, key)
);

-- Job failures (DLQ)
create table if not exists job_failures (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  job_name text not null,
  payload jsonb,
  error text,
  failed_at timestamptz not null default now()
);

-- RLS enablement
alter table tenants enable row level security;
alter table tenant_profiles enable row level security;
alter table tenant_branding enable row level security;
alter table tenant_domains enable row level security;
alter table tenant_memberships enable row level security;
alter table tenant_services enable row level security;
alter table tenant_faqs enable row level security;
alter table tenant_policies enable row level security;
alter table tenant_integrations enable row level security;
alter table customers enable row level security;
alter table bookings enable row level security;
alter table booking_events enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table audit_log enable row level security;
alter table request_idempotency enable row level security;
alter table job_failures enable row level security;

-- RLS policies: base tenant isolation
create policy tenants_select on tenants
for select using (is_platform_admin(auth.uid()) or is_tenant_member(id, auth.uid()));

create policy tenants_modify on tenants
for all using (is_platform_admin(auth.uid())) with check (is_platform_admin(auth.uid()));

create policy tenant_profiles_access on tenant_profiles
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

create policy tenant_branding_access on tenant_branding
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

create policy tenant_domains_access on tenant_domains
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

create policy tenant_services_access on tenant_services
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

create policy tenant_faqs_access on tenant_faqs
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

create policy tenant_policies_access on tenant_policies
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

create policy tenant_integrations_access on tenant_integrations
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

create policy customers_access on customers
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

create policy bookings_access on bookings
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

create policy booking_events_access on booking_events
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

create policy chat_sessions_access on chat_sessions
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

create policy chat_messages_access on chat_messages
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

create policy audit_log_access on audit_log
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

create policy request_idempotency_access on request_idempotency
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

create policy job_failures_access on job_failures
for all using (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()))
with check (is_platform_admin(auth.uid()) or is_tenant_member(tenant_id, auth.uid()));

-- Memberships: platform admins can manage, users can read their own membership
create policy tenant_memberships_select on tenant_memberships
for select using (is_platform_admin(auth.uid()) or user_id = auth.uid());

create policy tenant_memberships_modify on tenant_memberships
for all using (is_platform_admin(auth.uid())) with check (is_platform_admin(auth.uid()));

create policy platform_admins_access on platform_admins
for all using (is_platform_admin(auth.uid())) with check (is_platform_admin(auth.uid()));
