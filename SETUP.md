# QraftPaper — Setup & Deploy

Next.js (App Router) + Drizzle/Postgres (Neon) + NextAuth + OpenRouter, billing
via LemonSqueezy. Hosted on Vercel (deploys from `master`).

## 1. Prerequisites

- Node 20+
- A Postgres database (Neon recommended)
- An OpenRouter account + API key
- (For payments) a LemonSqueezy store
- (Optional) a Cloudflare Turnstile site for the signup captcha

## 2. Environment variables

Copy `.env.example` → `.env.local` and fill these in.

### Required
| Variable | What it is |
|---|---|
| `DATABASE_URL` | Postgres connection string (Neon: include `?sslmode=require`). |
| `AUTH_SECRET` | Random 32+ char string for NextAuth. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `OPENROUTER_API_KEY` | OpenRouter key used for generation + extraction. |

### Billing (required for paid plans / checkout)
| Variable | Where to get it |
|---|---|
| `LEMONSQUEEZY_API_KEY` | LemonSqueezy → Settings → API |
| `LEMONSQUEEZY_STORE_ID` | Your store id (Settings → Stores) |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | The signing secret from the webhook you create (step 5) |
| `LEMONSQUEEZY_VARIANT_EDUCATOR` | Variant id of the **$7/mo** Educator product |
| `LEMONSQUEEZY_VARIANT_DEPARTMENT` | Variant id of the **$24/mo** Department product |

### Email (required for password reset)
| Variable | Where to get it |
|---|---|
| `RESEND_API_KEY` | Vercel Marketplace Resend integration, or Resend API keys |
| `EMAIL_FROM` | Verified Resend sender, e.g. `QraftPaper <support@yourdomain.com>` |

### Optional
| Variable | Default / effect |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public origin for canonical/OG/sitemap. Defaults to `https://qraftpaper.vercel.app`. |
| `OPENROUTER_GENERATION_MODEL` | Defaults to `anthropic/claude-haiku-4.5`. Any tool-calling model works. |
| `OPENROUTER_EXTRACTION_MODEL` | Defaults to `anthropic/claude-haiku-4.5`. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Enable the signup captcha. Leave blank to disable it. |

## 3. Local development

```bash
npm install
npm run db:generate   # generate migrations from the schema (if changed)
npm run db:migrate    # apply migrations to DATABASE_URL
npm run dev           # http://localhost:3000
```

Checks: `npm run test` (Vitest), `npm run lint` (ESLint), `npx tsc --noEmit` (types).

## 4. Plans & pricing

Plans are defined in **one place — `lib/plans.ts`** — which feeds both the
pricing page and the usage limiter, so they can never drift:

| Plan | Price | Generations/mo | Subjects | Papers/subject |
|---|---|---|---|---|
| Educator | $7 | 20 | 5 | 6 |
| Department | $24 | 90 | 25 | 12 |
| Institution | Custom | unlimited | unlimited | unlimited |

Change a number there and both the marketing copy and enforcement update.
**The price you set in LemonSqueezy must match the price shown here.**

## 5. LemonSqueezy setup

1. Create two **subscription** products: Educator **$7/mo** and Department
   **$24/mo**. Copy each variant id into the env vars above.
2. **Settings → Webhooks → +** : URL `https://<your-domain>/api/billing/webhook`,
   subscribe to the **`subscription_*`** events, and copy the signing secret
   into `LEMONSQUEEZY_WEBHOOK_SECRET`.
3. Activate the store (identity + payout bank) before taking real payments.
   Until then, test with LemonSqueezy **Test mode**.

The checkout (`/billing`) tags each purchase with the user + tier; the webhook
verifies the signature and flips the user's plan. No code changes needed.

## 6. Deploy (Vercel)

- Vercel builds the **`master`** branch (production).
- Set all env vars in **Project → Settings → Environment Variables**, then
  redeploy (env changes don't apply to a running build).
- `robots.txt`, `sitemap.xml`, and the OG image are generated automatically.

## 7. AI cost control

- Generation runs on the model in `OPENROUTER_GENERATION_MODEL`. The monthly
  allowance per plan (in `lib/plans.ts`) is your hard cost ceiling; a per-minute
  rate limit + per-subject caps stop bursts/loops.
- **Set a prepaid credit balance or hard spend cap on OpenRouter** (and billing
  alerts on Vercel/Neon) — that's the absolute ceiling no bug can exceed.
- Actual cost per generation is logged in the `ai_usage_events` table
  (`estimated_cost_cents`); sum it per user to validate your margins.
