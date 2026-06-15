# Guma AI — Next.js 14 Frontend

Full-stack Next.js App Router frontend covering the entire Guma AI user journey:
marketing → search → claim → dashboard → upgrade.

## Pages & routes

| Route | Description |
|---|---|
| `/` | Marketing homepage — hero, how it works, pricing |
| `/auth/signup` | Business search + claim entry point |
| `/auth/login` | Magic link sign-in |
| `/auth/callback` | Supabase OAuth callback handler |
| `/claim/[slug]` | Site preview + claim form |
| `/sites/[slug]` | Public site viewer (serves generated HTML) |
| `/dashboard` | User overview — sites, views, plan |
| `/dashboard/upgrade` | Pricing + Stripe checkout |

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/sites/search` | GET | Search crawled businesses by name+city |
| `/api/sites/[slug]` | GET | Get site metadata for claim page |
| `/api/claim` | POST | Mark a site as claimed by authed user |
| `/api/billing/checkout` | POST | Create Stripe checkout session |
| `/api/webhooks/stripe` | POST | Handle Stripe subscription events |

## Setup

```bash
cp .env.example .env.local
# fill in Supabase + Stripe keys
npm install
npm run dev
```

## Key design decisions

- **Magic link auth only** — no passwords. Business owners are non-technical;
  email OTP is the lowest-friction auth flow.
- **Claim banner on every generated site** — every free site has a dismissible
  banner with a claim CTA; the iframe on `/claim/[slug]` shows the real site.
- **Stripe checkout (hosted)** — no custom payment UI needed; Stripe handles
  PCI compliance, 3DS, card vaulting. Webhook updates the DB plan on success.
- **dangerouslySetInnerHTML for site viewer** — generated HTML is Claude output
  stored in DB; it's served directly so business owners see an accurate preview.
  Sanitise if adding user-editable HTML in future.

## Deploy to Vercel

```bash
vercel
# Set all env vars in Vercel dashboard
# Add STRIPE_WEBHOOK_SECRET after creating webhook endpoint in Stripe dashboard:
# Endpoint URL: https://your-domain.vercel.app/api/webhooks/stripe
# Events: checkout.session.completed, customer.subscription.deleted
```
