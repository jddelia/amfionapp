# User Setup Steps (Accounts, API Keys, Env Values)

This guide lists everything you need to set up on your end before we wire the full production integrations. It is intentionally granular and step-by-step.

## 0) Local Dev Prerequisites (Do This First)

These steps prevent common errors like `tsx: command not found` and missing modules.

### 0.1 Install Node.js 20.9+ (recommended via `nvm`)

1. Install `nvm` (Node Version Manager) if you don’t already have it:
   - macOS/Linux:
     ```bash
     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
     ```
2. Restart your terminal or run:
   ```bash
   source ~/.zshrc
   ```
3. Install and use Node 20:
   ```bash
   nvm install 20
   nvm use 20
   node -v
   ```
   Confirm the version is `v20.9.0` or newer.

### 0.2 Enable `corepack` (so pnpm works)

1. Run:
   ```bash
   corepack enable
   ```
2. Optional: pin pnpm version for this repo:
   ```bash
   corepack prepare pnpm@9.12.3 --activate
   ```
3. Verify:
   ```bash
   pnpm -v
   ```

### 0.3 Install repo dependencies (this fixes `tsx: command not found`)

From the repo root:

```bash
pnpm install
```

This installs `tsx` and all workspace dependencies.

### 0.4 Start the API locally

Create the API env file first:

```bash
cp apps/api/.env.example apps/api/.env
```

Then start:

```bash
pnpm dev:api
```

If it still fails, check:

- You ran `pnpm install` at the repo root (not inside `apps/api`).
- You’re on Node 20.9+.

### 0.5 Troubleshooting common dev errors

**Error:** `ERR_MODULE_NOT_FOUND ... @amfion/shared/dist/index.js`
Cause: workspace package build artifacts are missing.
Fix:

```bash
pnpm install
pnpm --filter @amfion/shared build
pnpm --filter @amfion/integrations build
```

Then re-run:

```bash
pnpm dev:api
```

The root `dev:api` script now prebuilds workspace packages automatically, so you should not need to run these manually after this update.

**Error:** you see `Node.js v23.x` in the stack trace
Cause: Node 23 is not supported by the repo config.
Fix:

```bash
nvm use 20
node -v
```

**Error:** `ZodError ... TENANT_HOST_SUFFIX / TENANT_DEFAULT_SLUG / TENANT_DEFAULT_ID`
Cause: required env values were missing and `.env` was not loaded.
Fix:

```bash
cp apps/api/.env.example apps/api/.env
pnpm dev:api
```

Optional verification:

```bash
cat apps/api/.env | rg "TENANT_HOST_SUFFIX|TENANT_DEFAULT_SLUG|TENANT_DEFAULT_ID"
```

**Error:** `FST_ERR_PLUGIN_VERSION_MISMATCH` with `@fastify/cors` or `@fastify/rate-limit`
Cause: Fastify core and plugin major versions are out of sync in `node_modules`.
Fix:

```bash
pnpm install
pnpm dev:api
```

If local dependency state is stale:

```bash
pnpm install --force
pnpm dev:api
```

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
select vault.create_secret('amfionapp_secret');
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
5. Set the same value in `apps/api/.env`:

```bash
CAL_WEBHOOK_SECRET=your_exact_cal_webhook_secret
```

If you need to generate a strong secret locally:

```bash
openssl rand -hex 32
```

Copy that value into both Cal.com Webhook Secret and `CAL_WEBHOOK_SECRET`.
6. Save the webhook.

Cal.com signs payloads with `x-cal-signature-256`. The API now strictly verifies this against the raw request body.
Expected behavior:
- Invalid or missing signature: HTTP `401`
- Missing `CAL_WEBHOOK_SECRET` on server: HTTP `500`

### 2.4 Cal.com values to capture

- API key (store in Supabase Vault for each tenant)
- Event Type IDs
- Webhook signing secret

### 2.5 Local testing (tunnel required)

To test Cal.com webhooks against your local API, you must expose your local server over HTTPS.

Option A: `ngrok` (simple)
1. Install ngrok:
   ```bash
   brew install ngrok/ngrok/ngrok
   ```
2. Start your API:
   ```bash
   pnpm dev:api
   ```
3. In a new terminal, run:
   ```bash
   ngrok http 4000
   ```
4. Copy the HTTPS URL from ngrok (example: `https://abcd-1234.ngrok-free.app`).
5. In Cal.com, set `Subscriber URL` to:
   ```
   https://abcd-1234.ngrok-free.app/v1/webhooks/calcom
   ```

Option B: `cloudflared` (Cloudflare tunnel)
1. Install cloudflared:
   ```bash
   brew install cloudflare/cloudflare/cloudflared
   ```
2. Start your API:
   ```bash
   pnpm dev:api
   ```
3. In a new terminal, run:
   ```bash
   cloudflared tunnel --url http://localhost:4000
   ```
4. Copy the HTTPS URL cloudflared prints (example: `https://abcd.trycloudflare.com`).
5. In Cal.com, set `Subscriber URL` to:
   ```
   https://abcd.trycloudflare.com/v1/webhooks/calcom
   ```

Once wired, create a test booking in Cal.com and watch your local API logs for the webhook request.
Current implementation note:
- Cal.com webhook signature verification is strict and enabled (`x-cal-signature-256`).
- Valid signature: HTTP `202`
- Invalid or missing signature: HTTP `401`
- Missing `CAL_WEBHOOK_SECRET`: HTTP `500`

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

### 4.1 Create account and choose environment mode

You only need one Stripe account. For local development, use `Test mode`.

1. Go to `https://dashboard.stripe.com/register` and create your Stripe account.
2. Verify your email and complete the first-login prompts.
3. In the Stripe Dashboard, turn on `Test mode` using the top-right toggle.
4. Confirm you are in test mode before creating products, prices, keys, and webhooks.

Notes:
- You do not need a separate production account for testing.
- Do not use live keys in local development.
- If Stripe asks you to complete business activation details, you can continue testing in `Test mode` first and finish activation later for live usage.

### 4.2 Create billing plans (Products + Prices)

For SaaS billing, create recurring prices that map to your app tiers (for example: Starter, Growth, Premium).

1. In Stripe Dashboard, open `Product catalog`.
2. Click `Create product`.
3. Set `Name` (example: `Starter Plan`).
4. Under pricing, choose `Recurring`.
5. Choose billing period (usually `Monthly` for v1).
6. Enter amount (example: `$49`).
7. Save product.
8. Repeat for each tier you want.
9. Open each product and copy the recurring Price ID (starts with `price_`).

You will use these `price_...` IDs when creating subscriptions.

### 4.3 Get API keys (test mode)

1. In Stripe Dashboard, go to `Developers` -> `API keys`.
2. Confirm `Test mode` is still enabled.
3. Copy:
- `Publishable key` (starts with `pk_test_`)
- `Secret key` (starts with `sk_test_`)
4. Put them in env files (see `4.6` below).

### 4.4 Create webhook endpoint (dashboard path)

Use this path if you are testing through a tunnel URL (`ngrok` or `cloudflared`).

1. Start API locally:

```bash
pnpm dev:api
```

2. Start HTTPS tunnel in a second terminal:

```bash
cloudflared tunnel --url http://localhost:4000
```

3. Copy the generated HTTPS URL (example: `https://abc123.trycloudflare.com`).
4. In Stripe Dashboard, open `Workbench` -> `Webhooks`.
5. Click `Create an event destination`.
6. Choose `Events on your account`.
7. Select `Webhook endpoint`.
8. Endpoint URL:

```txt
https://abc123.trycloudflare.com/v1/webhooks/stripe
```

9. Select events (minimum recommended for SaaS billing):
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `checkout.session.completed` (if using Checkout)

10. Save destination.
11. Open destination details and copy the signing secret (`whsec_...`).

### 4.5 Local webhook testing (CLI alternative)

Use this path if you want fast local testing without manual dashboard event retries.

1. Install Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe
```

2. Authenticate CLI:

```bash
stripe login
```

3. Forward events to local API:

```bash
stripe listen --forward-to localhost:4000/v1/webhooks/stripe
```

4. Copy the `whsec_...` value shown by CLI and set `STRIPE_WEBHOOK_SECRET` in `apps/api/.env`.
5. Trigger a test event:

```bash
stripe trigger customer.subscription.created
```

6. Watch API logs for webhook receipt.

Troubleshooting:
- If API logs show `Route POST://v1/webhooks/stripe not found`, your Stripe endpoint URL likely contains a double slash.
- Use exactly:

```txt
https://<your-tunnel-domain>/v1/webhooks/stripe
```

### 4.6 Stripe env values and where to set them

Set these in `apps/api/.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Set this in `apps/web/.env` when frontend payment flows are added:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Current status note:
- Stripe webhook endpoint exists and accepts/logs events.
- Strict Stripe signature validation should be added before production launch.

### 4.7 Stripe verification steps (test mode)

1. Keep API running:

```bash
pnpm dev:api
```

2. Run Stripe CLI forwarding:

```bash
stripe listen --forward-to localhost:4000/v1/webhooks/stripe
```

3. Trigger lifecycle events:

```bash
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

4. Confirm in API logs each event is received and returns `202`.
5. Confirm in Stripe Workbench delivery logs that retries are not accumulating.

### 4.8 Stripe verification steps (production)

1. Complete Stripe business activation in live mode.
2. Create equivalent live products/prices.
3. Configure live webhook endpoint URL and copy live `whsec_...`.
4. Set live env values:
- `STRIPE_SECRET_KEY=sk_live_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
5. Send a controlled real transaction with a low-value live plan.
6. Validate full event chain in order:
- `checkout.session.completed` (if Checkout used)
- `customer.subscription.created` or `updated`
- `invoice.payment_succeeded`
7. Confirm rollback behavior for failure path with a controlled failed payment scenario.
8. Before launch, implement strict Stripe signature verification in API.

## 5) Twilio (SMS)

### 5.1 Create your Twilio account and project

1. Go to `https://www.twilio.com/try-twilio` and create an account.
2. Verify email and phone during onboarding.
3. Open Twilio Console (`https://console.twilio.com`).
4. Confirm the active project in the top-left project switcher.
5. For US production messaging, upgrade from trial to paid in `Admin` -> `Billing`.

Important:
- Trial accounts can send only to verified recipient numbers.
- US A2P 10DLC registration requires a paid account.

### 5.2 Collect base credentials from Console

1. In Console home, copy `Account SID` (starts with `AC`).
2. Click `Reveal` next to `Auth Token` and copy it.
3. Store both in your password manager.
4. Add them to `apps/api/.env`:

```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

### 5.3 Buy a US phone number

1. In Console sidebar, go to `Phone Numbers` -> `Manage` -> `Buy a number`.
2. Filter:
- Country: `United States`
- Capabilities: `SMS` (and `MMS` if you need media)
3. Click `Search`.
4. Pick a number and click `Buy`.
5. Confirm purchase.

### 5.4 Create a Messaging Service

1. Go to `Messaging` -> `Services`.
2. Click `Create Messaging Service`.
3. Enter:
- Friendly name: example `Amfion Notifications`
- Use case: `Notifications`
4. Create the service.
5. Open the service details and copy `Messaging Service SID` (starts with `MG`).
6. Add to `apps/api/.env`:

```env
TWILIO_MESSAGING_SERVICE_SID=MG...
```

### 5.5 Add sender to Sender Pool

1. Open your Messaging Service.
2. Go to `Sender Pool`.
3. Click `Add Senders`.
4. Choose `Phone Number`.
5. Select the number purchased in step `5.3`.
6. Save.

### 5.6 Configure service callbacks (recommended)

1. In Messaging Service, open `Integration`.
2. Configure status callback URL (delivery receipts) when endpoint exists:

```txt
https://api.yourdomain.com/v1/webhooks/twilio/status
```

3. Configure inbound message callback URL for STOP/HELP handling when endpoint exists:

```txt
https://api.yourdomain.com/v1/webhooks/twilio/inbound
```

4. Save settings.

### 5.7 Complete A2P 10DLC registration (US production)

1. In Console, go to `Messaging` -> `Compliance` -> `A2P 10DLC`.
2. Start `Brand Registration`.
3. Fill legal entity details exactly as registered (EIN/legal name/address).
4. After brand approval, create a `Campaign`.
5. Campaign fields to prepare:
- Use case description
- Message samples
- Opt-in method
- HELP and STOP behavior
- Support contact info
6. Submit campaign.
7. Associate approved campaign with your Messaging Service sender.

### 5.8 Send a direct API test message

Use this once credentials are set and number is configured.

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  --data-urlencode "To=+1YOUR_DESTINATION_NUMBER" \
  --data-urlencode "MessagingServiceSid=$TWILIO_MESSAGING_SERVICE_SID" \
  --data-urlencode "Body=Amfion Twilio test message" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
```

Expected:
- HTTP `201` with a message SID (`SM...`).
- In trial mode, destination must be a verified recipient.

### 5.9 Common Twilio failure cases

- `21608`: trial account trying to message an unverified destination.
- `30034` or A2P-related errors: sender/campaign not fully registered for US traffic.
- `21408`: permissions/geo not enabled for that destination.

### 5.10 Twilio values to capture

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_MESSAGING_SERVICE_SID`
- Optional fallback sender if not using Messaging Service:

```env
TWILIO_FROM_NUMBER=+1...
```

### 5.11 Twilio verification steps (test mode vs production)

Test mode (fast path):
1. Keep Twilio account in trial or paid test usage.
2. Ensure destination number is verified in Twilio (required for trial).
3. Send message using step `5.8` curl command.
4. In Twilio Console, open `Messaging` -> `Logs` -> `Message Logs`.
5. Confirm message state transitions (`queued` -> `sent` -> `delivered`).
6. If undelivered, open the message details and inspect error code.

Production mode:
1. Account is upgraded to paid.
2. Brand registration approved in A2P 10DLC.
3. Campaign approved and associated to sender.
4. Sender is present in Messaging Service Sender Pool.
5. Opt-in evidence is documented and stored.
6. HELP and STOP behavior is defined and tested.
7. Send controlled live message to internal test recipient.
8. Verify delivery and response handling in Message Logs.
9. Verify throughput and carrier filtering over at least 24 hours before broad rollout.

### 5.12 US A2P 10DLC verification package (prepare once)

Prepare this package before starting registration to reduce rejection cycles:
1. Legal business name and EIN exactly matching IRS records.
2. Business address and website with matching entity identity.
3. Support email and support phone.
4. Campaign use case description (clear and specific).
5. At least 2 message samples reflecting real traffic.
6. Exact opt-in flow text and entry point location.
7. STOP and HELP response text.
8. Privacy policy and terms URLs.
9. Statement of consent record retention process.

Optimization tips:
- Submit one clean campaign first with conservative use case scope.
- Keep message samples aligned with actual payload templates.
- Avoid promotional wording if registering transactional/notification traffic.

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
TWILIO_FROM_NUMBER=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ZONE_ID=
CLOUDFLARE_API_TOKEN=
```

`apps/web/.env`

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

`apps/worker/.env`

```
NODE_ENV=development
LOG_LEVEL=info
REDIS_URL=redis://localhost:6379
QUEUE_PREFIX=amfion
```

## 9) Verification Checklist (Test vs Production)

Use this checklist to confirm each integration is ready.

### 9.1 Supabase

Test:
1. Run `packages/db/migrations/001_init.sql` successfully.
2. Verify tenant data can be read through API for demo host.
3. Verify RLS denies unauthorized tenant reads.

Production:
1. Separate prod Supabase project is used.
2. Service role key is server-only and never exposed in browser.
3. Backup and PITR settings are enabled per retention policy.

### 9.2 Cal.com

Test:
1. Webhook endpoint reachable through tunnel.
2. Valid signed webhook returns `202`.
3. Invalid signature returns `401`.

Production:
1. Stable HTTPS API domain is configured (no ephemeral tunnel).
2. Production webhook secret stored in secure env/vault.
3. Booking events are monitored for delivery failures.

### 9.3 Stripe

Test:
1. Webhook endpoint receives `customer.subscription.*` and `invoice.*` test events.
2. Stripe delivery logs show 2xx responses.

Production:
1. Live keys and live webhook secret configured.
2. Controlled live subscription flow succeeds end-to-end.
3. Stripe signature verification enforced in API before launch.

### 9.4 Twilio

Test:
1. Direct API send succeeds to verified recipient.
2. Message lifecycle visible in Twilio Message Logs.

Production:
1. Paid account plus approved A2P 10DLC brand/campaign.
2. Messaging Service sender/campaign association verified.
3. STOP/HELP handling and opt-in evidence validated.

### 9.5 Cloudflare

Test:
1. Domain is on Cloudflare and DNS resolves correctly.
2. Tunnel endpoint responds over HTTPS.

Production:
1. Customer hostnames show verified/active TLS.
2. DNS records for customer domains are validated.
3. Error-rate and TLS issuance failures are monitored.
