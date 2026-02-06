# User Setup Steps (Accounts, API Keys, Env Values)

This guide lists everything you need to set up on your end before we wire the full production integrations. It is intentionally granular and step-by-step.

## 0) Quick Checklist (What You’ll Collect)

| Provider | Values to Collect | Where You’ll Use It |
| --- | --- | --- |
| Supabase | Project URL, `anon` key (or publishable key), `service_role` key, DB password | `apps/api/.env` and database setup |
| Cal.com | API key, Event Type IDs, Webhook secret | Supabase Vault + future API env |
| Anthropic | API key | `apps/api/.env` |
| Stripe | Secret key, publishable key, webhook signing secret | `apps/api/.env` (and future web env) |
| Twilio | Account SID, Auth Token, Messaging Service SID, A2P 10DLC registration | Supabase Vault + future API env |
| Cloudflare | Account ID, Zone ID, API token, Custom Hostname IDs | Ops + future API env |
| Redis | Connection URL | `apps/api/.env`, `apps/worker/.env` |

## 1) Supabase (Database, Auth, Vault)

### 1.1 Create a Supabase project

1. Sign in to the Supabase dashboard and select `New project`.
2. Select (or create) your organization.
3. Enter a project name.
4. Set a strong database password.
5. Choose a region.
6. Click `Create new project` and wait for provisioning to complete.

### 1.2 Get your project URL + API keys

1. In the project dashboard, open `Project settings`.
2. Go to `API` and find the `API Keys` section.
3. Copy the Project URL.
4. Copy the `anon` key (Legacy API Keys tab) for client-side usage.
5. Copy the `service_role` key (Legacy API Keys tab) for server-only usage.

Important: the service role key bypasses RLS. Never expose it in client-side code.

### 1.3 Create the database schema (RLS + tables)

1. In the Supabase dashboard, open `SQL Editor`.
2. Create a new query.
3. Paste the contents of `packages/db/migrations/001_init.sql`.
4. Click `Run`.

### 1.4 Set up Vault secrets (per-tenant keys)

You can store per-tenant keys in Vault and reference them by UUID.

Option A: Dashboard UI
1. Open `Vault` in the Supabase dashboard.
2. Click `Create secret`, paste the value, and save.

Option B: SQL (recommended for automation)
1. In SQL Editor, run:

```sql
select vault.create_secret('my_secret_value');
```

2. Capture the returned UUID.

To view decrypted values in SQL (for server-side workflows), use `vault.decrypted_secrets`.

### 1.5 Supabase env values to set now

In `apps/api/.env`:

```
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 2) Cal.com (Scheduling)

### 2.1 Create API key

1. Log in to Cal.com.
2. Go to `Settings` → `Security`.
3. Generate an API key.
4. Copy the key (test keys start with `cal_`, live keys with `cal_live_`).

### 2.2 Find Event Type IDs

Option A: UI (fastest)
1. Open your Event Type settings in Cal.com.
2. Look at the URL in the browser. The number between the slashes is the Event Type ID.

Option B: API
1. Call `GET /v2/event-types` with your API key and `cal-api-version` header to list Event Types.

### 2.3 Create a webhook subscription

1. Visit `/settings/developer/webhooks` in Cal.com.
2. Set `Subscriber URL` to your API endpoint (example: `https://api.yourdomain.com/v1/webhooks/calcom`).
3. Select event triggers (at minimum: Booking Created, Booking Cancelled, Booking Rescheduled).
4. Add a `Secret` for signing.
5. Save the webhook.

Cal.com signs payloads with `x-cal-signature-256`. You’ll verify this signature server-side.

### 2.4 Cal.com values to capture

- API key (store in Supabase Vault for each tenant)
- Event Type IDs
- Webhook signing secret

## 3) Anthropic (Claude)

### 3.1 Create an API key

1. Sign in to the Anthropic Console.
2. Open your Workspace.
3. Go to the `API Keys` tab.
4. Click `Create Key`, name it, and copy the key.

### 3.2 Anthropic env value to set

In `apps/api/.env`:

```
ANTHROPIC_API_KEY=your_anthropic_key
```

## 4) Stripe (SaaS Billing + Payments)

### 4.1 Create an account + get API keys

1. Sign in to the Stripe Dashboard.
2. Go to `Developers` → `API keys`.
3. Copy your test secret and publishable keys (you can switch to live later).

### 4.2 Create a webhook endpoint

1. Open Workbench in the Stripe Dashboard.
2. Go to the `Webhooks` tab.
3. Click `Create an event destination`.
4. Choose `Account` events (unless you’re using Connect).
5. Select the events you need and the API version.
6. Choose `Webhook endpoint` and enter your URL (example: `https://api.yourdomain.com/v1/webhooks/stripe`).
7. Create the destination and copy the signing secret from the endpoint details.

### 4.3 Stripe env values (future wiring)

```
STRIPE_SECRET_KEY=sk_test_or_live
STRIPE_PUBLISHABLE_KEY=pk_test_or_live
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 5) Twilio (SMS)

### 5.1 Create or upgrade your Twilio account

A2P 10DLC registration requires a paid account.

1. Sign in or create a Twilio account.
2. Upgrade from trial if you plan to send US SMS using 10DLC.

### 5.2 Buy a US 10DLC phone number

1. In the Twilio Console sidebar, go to `Phone Numbers` → `Manage` → `Buy a number`.
2. Search for a number with SMS capability.
3. Click `Buy` to add it to your account.

### 5.3 Create a Messaging Service

1. In the Twilio Console, go to `Messaging` → `Services`.
2. Click `Create Messaging Service`.
3. Follow the console steps to configure the service.

### 5.4 Add the phone number to the Sender Pool

1. Open your Messaging Service.
2. Go to `Sender Pool`.
3. Click `Add Senders` and select the phone number you purchased.

### 5.5 A2P 10DLC registration (US)

1. Start the A2P 10DLC registration flow in the Twilio Console.
2. Register a Brand (business information).
3. Register a Campaign (use case description, opt-in flow, sample messages).
4. Associate the Campaign with your Messaging Service.

### 5.6 Twilio values to capture

- Account SID and Auth Token (found on the Twilio Console dashboard).
- Messaging Service SID (starts with `MG`, shown on the Messaging Services page).

Env values (future wiring):

```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=MG...
```

## 6) Cloudflare (Domains + Custom Hostnames)

### 6.1 Add your root domain to Cloudflare

1. Log in to the Cloudflare dashboard.
2. Select `Onboard a domain` / `Add a domain`.
3. Enter your apex domain (example: `yourdomain.com`) and continue.
4. Review DNS records, then proceed.
5. Update your nameservers at your registrar to Cloudflare’s assigned nameservers.

### 6.2 Find your Account ID and Zone ID

1. In the Cloudflare dashboard, go to the Account home page.
2. Use the menu next to your account to copy the Account ID.
3. On the Overview page for your account, copy the Zone ID in the API section.

### 6.3 Create an API token

1. In Cloudflare, go to `My Profile` → `API Tokens` for a user token, or `Manage Account` → `API Tokens` for an account token.
2. Click `Create Token`.
3. Choose a template or create a custom token with the permissions you need (for SaaS hostnames, you’ll typically need Zone and Custom Hostname edit permissions).
4. Create the token and copy it (the secret is shown once).

### 6.4 Create custom hostnames (Cloudflare for SaaS)

1. In the Cloudflare dashboard, go to `Custom Hostnames`.
2. Click `Add Custom Hostname`.
3. Enter the customer hostname (example: `book.customer.com`).
4. Choose TLS settings, certificate authority, and validation method.
5. Add the hostname and complete validation.

### 6.5 Cloudflare values to capture

```
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_ZONE_ID=...
CLOUDFLARE_API_TOKEN=...
```

## 7) Local env file setup (commands)

Run these commands from the repo root:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/worker/.env.example apps/worker/.env
```

Then open each `.env` file and fill in the values collected above.

## 8) Summary: Where each value goes

`apps/api/.env`

```
NODE_ENV=development
PORT=4000
HOST=0.0.0.0
TENANT_HOST_SUFFIX=yourdomain.com
TENANT_DEFAULT_SLUG=demo
TENANT_DEFAULT_ID=00000000-0000-0000-0000-000000000000
REDIS_URL=redis://localhost:6379
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
# Future integration values
CAL_API_KEY=
CAL_WEBHOOK_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_API_TOKEN=
```

`apps/web/.env`

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

`apps/worker/.env`

```
NODE_ENV=development
LOG_LEVEL=info
REDIS_URL=redis://localhost:6379
QUEUE_PREFIX=amfion
```
