# Webcove

AI website builder SaaS. A customer describes their business, Claude generates a full
website (copy + structure + theme), they preview it, refine it via an AI edit chat, and —
on a paid plan with quota remaining — publish it live at a public URL.

**Stack:** Next.js 16 (App Router) · Supabase (Postgres + Auth) · Stripe (Checkout / Portal /
Webhooks) · Anthropic (Claude) · Resend (Agency cold-email) · Vercel.

---

## 1. Prerequisites

- Node.js 20.9+ (built with Node 26)
- A Supabase project
- A Stripe account (test mode is fine)
- An Anthropic API key
- A Resend account (for the Agency email tool)

## 2. Environment

Copy the example and fill in real values:

```bash
cp .env.local.example .env.local
```

| Var | Where to get it |
| --- | --- |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `ANTHROPIC_MODEL` | optional; defaults to `claude-sonnet-5` |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (server-only, never exposed) |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | from `stripe listen` or the dashboard webhook |
| `STRIPE_PRICE_BASIC` / `_PRO` / `_AGENCY` | Stripe → Products (create 3 recurring prices: $15/$25/$80) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | resend.com (verify a sending domain) |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` in dev |

## 3. Database

Run the migration in the Supabase SQL editor (or `supabase db push`):

```
supabase/migrations/0001_init.sql
```

This creates `profiles`, `sites`, `pages`, `email_campaigns`, enables **Row-Level Security**
on all tables (owner-only writes; public read of published sites only), adds a trigger that
creates a `profiles` row on first sign-in, a guard trigger that makes billing/quota columns
service-role-only, and an atomic `increment_publish_quota` function used by the publish route.

### Google OAuth

In Supabase → Authentication → Providers → Google, enable Google and set the OAuth client.
Add `http://localhost:3000/auth/callback` (and your production equivalent) to the allowed
redirect URLs.

## 4. Stripe

1. Create three recurring Products/Prices ($15, $25, $80 / month) and put their price IDs in `.env.local`.
2. Point a webhook at `/api/webhooks/stripe` for events:
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.paid`.
3. Locally, forward events:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`.

## 5. Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

---

## Architecture notes

- **Plan limits** live in one place: `lib/plans.ts` (`PLAN_LIMITS`). Nothing else hard-codes limits.
- **Server is the only real gate.** `app/api/sites/[siteId]/publish/route.ts` re-verifies
  subscription + quota + ownership on every publish; the client button is only a hint. RLS is
  the backstop even if a route has a bug.
- **AI prompts** live in `lib/prompts.ts` (one constant per use); `lib/anthropic.ts` validates
  Claude's JSON output with zod before it touches the DB.
- **Service-role key** is confined to `lib/supabase/admin.ts` (marked `server-only`) and used
  only by the Stripe webhook + trusted server routes.
- **Public sites** render through the shared `components/SiteTemplate.tsx` — the same component
  the workspace preview uses, so previews match what gets published.

## Publish quota model

- **Basic / Pro** cap the number of *currently published* sites at 1 (`maxPublishedSites`).
  Publishing a second requires unpublishing or upgrading. Unpublishing frees the slot.
- **Agency** caps *new publishes per billing period* at 10 (`monthlyPublishQuota`), tracked by
  `profiles.publishes_this_period`, incremented atomically on publish and reset to 0 when Stripe
  sends `invoice.paid` for a new period.

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Public marketing homepage |
| `/login` | Supabase Auth (Google primary + email/password) |
| `/pricing` | Plans → Stripe Checkout |
| `/dashboard` | Project list + usage (auth-gated) |
| `/dashboard/new` | Business form → AI generation |
| `/dashboard/[siteId]` | Workspace: preview + edit chat + publish |
| `/dashboard/email` | Agency cold-email tool (plan-gated) |
| `/[slug]`, `/[slug]/[page]` | Public published sites |
| `/api/sites/generate` | Generate a site |
| `/api/sites/[siteId]/publish` \| `/unpublish` | Publish gate |
| `/api/sites/[siteId]/chat` | AI edit chat |
| `/api/stripe/checkout` \| `/portal` \| `/api/webhooks/stripe` | Billing |
| `/api/email/draft` \| `/send` | Agency email tool |

## Out of scope (future work)

Custom domains, image/asset uploads, team seats, analytics.

## Note on Next.js 16

This project targets Next.js 16: the request APIs (`cookies()`, `params`, `searchParams`) are
async, and the old `middleware.ts` convention is replaced by **`proxy.ts`** (session refresh +
route protection live there).
