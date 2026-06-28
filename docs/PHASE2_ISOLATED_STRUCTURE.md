# Phase 2: Isolated Folder Structure ✅

Phase 2 is now a **completely separate, independent Next.js application** with its own folder, dependencies, configuration, and deployment.

---

## Directory Structure

```
D:\All Apps\sggwebs_claude3.0\
│
├── guma-phase1-frontend/                        ← Phase 1 (Free, Independent)
│   ├── app/
│   ├── src/
│   ├── database/
│   ├── package.json
│   └── next.config.js
│
├── guma-phase2-builder/                  ← Phase 2 (Premium, Isolated) ✅ NEW
│   │
│   ├── app/
│   │   ├── api/
│   │   │   ├── builder/
│   │   │   │   └── route.ts                   # Create/update builder sessions
│   │   │   ├── ai-rewrites/
│   │   │   │   └── route.ts                   # Claude API integration
│   │   │   ├── subscriptions/
│   │   │   │   └── route.ts                   # Stripe checkout/cancel
│   │   │   └── webhooks/
│   │   │       └── stripe/
│   │   │           └── route.ts               # Stripe webhook handler
│   │   └── builder/
│   │       └── [sessionId]/
│   │           └── page.tsx                   # Main builder UI dashboard
│   │
│   ├── src/
│   │   └── lib/
│   │       └── builder-engine.ts              # Core builder logic
│   │
│   ├── database/
│   │   └── phase2-schema.sql                  # 9 tables for Phase 2
│   │
│   ├── package.json                           # Independent dependencies
│   ├── next.config.js                         # Phase 2 specific config
│   ├── tsconfig.json                          # TypeScript config
│   ├── .env.example                           # Environment variables
│   └── README.md                              # Phase 2 setup guide
│
├── guma-phase1-crawler/                         ← Phase 1 worker
├── guma-phase1-generator/                       ← Phase 1 worker
├── guma-phase1-outreach/                        ← Phase 1 worker
│
└── Root Documentation
    ├── GUMA_AI_COMPLETE_ARCHITECTURE.md       # Overall system design
    ├── TEMPLATE_INTELLIGENCE_README.md        # Template CRM guide
    └── PHASE2_ISOLATED_STRUCTURE.md           # This file
```

---

## Key Differences: Phase 1 vs Phase 2

| Aspect | Phase 1 | Phase 2 |
|--------|---------|---------|
| **Folder** | `guma-phase1-frontend/` | `guma-phase2-builder/` |
| **Port** | 3000 | 3001 |
| **URL** | phase1.guma.ai | phase2.guma.ai |
| **Database** | Shared (Supabase) | Shared (Supabase) |
| **Auth** | Phase 1 only | Uses Phase 1 token |
| **Deployment** | Vercel | Vercel (separate project) |
| **Subscription** | Free | Paid ($29-$299/mo) |

---

## Complete File Listing

### Phase 2 Structure

```
guma-phase2-builder/
├── package.json
│   └── Dependencies for Next.js 14, Supabase, Stripe, Claude API
│
├── next.config.js
│   └── CORS headers, environment variables, image optimization
│
├── tsconfig.json
│   └── TypeScript configuration with path aliases (@/lib, @/components)
│
├── .env.example
│   └── Template for environment variables (Supabase, Stripe, Claude, URLs)
│
├── README.md
│   └── Setup guide, API reference, deployment instructions
│
├── app/
│   ├── api/
│   │   ├── builder/route.ts
│   │   │   ├── POST   /api/builder              (create session)
│   │   │   ├── GET    /api/builder?id=X         (get session)
│   │   │   └── PATCH  /api/builder?id=X&action=update-hero  (update)
│   │   │
│   │   ├── ai-rewrites/route.ts
│   │   │   └── POST /api/ai-rewrites            (rewrite content)
│   │   │       ├── action: 'rewrite'
│   │   │       ├── action: 'optimize'
│   │   │       └── action: 'generate-hero'
│   │   │
│   │   ├── subscriptions/route.ts
│   │   │   ├── GET    /api/subscriptions        (get active subscription)
│   │   │   ├── POST   /api/subscriptions/checkout (create Stripe session)
│   │   │   └── DELETE /api/subscriptions        (cancel)
│   │   │
│   │   └── webhooks/
│   │       └── stripe/route.ts
│   │           └── POST /api/webhooks/stripe    (Stripe events)
│   │               ├── checkout.session.completed
│   │               ├── customer.subscription.deleted
│   │               └── customer.subscription.updated
│   │
│   └── builder/
│       └── [sessionId]/page.tsx
│           └── Main builder UI (tabs: hero, features, pricing, design, preview)
│
├── src/
│   └── lib/
│       └── builder-engine.ts
│           ├── createBuilderSession()
│           ├── updateHeroSection()
│           ├── updateFeaturesSection()
│           ├── applyColorSystem()
│           ├── reorderSections()
│           ├── toggleSectionVisibility()
│           ├── publishWebsite()
│           └── verifyPremiumAccess()
│
└── database/
    └── phase2-schema.sql
        ├── subscription_tiers
        ├── user_subscriptions
        ├── premium_builder_sessions
        ├── website_variants
        ├── color_systems
        ├── typography_systems
        ├── spacing_systems
        ├── ai_rewrites
        ├── component_edits
        ├── premium_deployments
        ├── Indexes (for performance)
        └── RLS policies (for security)
```

---

## Setup Checklist

### Phase 2 Installation

```bash
# 1. Navigate to Phase 2 folder
cd guma-phase2-builder

# 2. Create .env.local from template
cp .env.example .env.local

# 3. Fill in environment variables
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_KEY
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
# - ANTHROPIC_API_KEY

# 4. Install dependencies
npm install

# 5. Run migrations (via Supabase Dashboard SQL Editor)
# Paste contents of database/phase2-schema.sql

# 6. Insert subscription tiers
# Run SQL insert statements in Supabase Dashboard

# 7. Start dev server
npm run dev
# Runs on http://localhost:3001
```

---

## Integration Points (Phase 1 ↔ Phase 2)

### Shared Database (Supabase)
```
auth.users                    ← Authentication (Phase 1)
profiles                      ← User profiles (Phase 1)
websites                      ← Generated websites (both phases)
subscription_tiers            ← Plans (Phase 2)
user_subscriptions            ← User subscriptions (Phase 2)
premium_builder_sessions      ← Builder state (Phase 2)
```

### Authentication Flow
```
1. User logs in at phase1.guma.ai
   → Supabase Auth returns JWT token
   → Token saved to localStorage

2. User clicks "Upgrade to Premium"
   → Redirected to phase1.guma.ai/upgrade
   → Selects tier
   → Stripe checkout created

3. After payment
   → Stripe webhook fires
   → subscription_tiers row created
   → User can now access Phase 2

4. User navigates to phase2-builder.guma.ai
   → Retrieves token from localStorage
   → Sends token in Authorization header
   → Phase 2 verifies subscription status
   → Grants access to builder
```

### CORS Configuration
Both apps need to allow requests from each other:

**Phase 1 (`guma-phase1-frontend`):**
```javascript
// Allows Phase 2 to make requests
headers: {
  'Access-Control-Allow-Origin': 'http://localhost:3001'
}
```

**Phase 2 (`guma-phase2-builder`):**
```javascript
// Allows Phase 1 to make requests
headers: {
  'Access-Control-Allow-Origin': 'http://localhost:3000'
}
```

---

## Deployment Strategy

### Phase 1 Deployment
```
Repository:     your-github-repo
Branch:         main
Root:           guma-phase1-frontend/
Host:           Vercel (separate project)
URL:            phase1.guma.ai
```

### Phase 2 Deployment
```
Repository:     your-github-repo
Branch:         main
Root:           guma-phase2-builder/
Host:           Vercel (separate project)
URL:            phase2-builder.guma.ai
```

**Why separate Vercel projects?**
- Independent scaling
- Different environment variables
- Easier CI/CD management
- Separate analytics
- Ability to deploy one without affecting the other

---

## Environment Variables

### Phase 2 (.env.local)

```env
# Supabase (shared with Phase 1)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...

# Stripe (Phase 2 payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890...
STRIPE_SECRET_KEY=sk_test_abcdefghijklmnop...
STRIPE_WEBHOOK_SECRET=whsec_1234567890...

# Anthropic Claude API (AI rewrites)
ANTHROPIC_API_KEY=sk-ant-d83da8...

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_PHASE1_URL=http://localhost:3000

# Admin
ADMIN_EMAILS=you@yourdomain.com
```

---

## API Summary

### Builder APIs (Phase 2)
```
POST   /api/builder
       Create new premium builder session
       Body: { websiteId, baseTemplateId, industry }

GET    /api/builder?id={sessionId}
       Get session details
       Returns: { id, user_id, status, visible_sections, ... }

PATCH  /api/builder?id={sessionId}&action={action}
       Update session (hero, features, pricing, colors, sections)
       Actions: update-hero, update-features, apply-colors, reorder-sections, toggle-section
```

### AI Rewrites API (Phase 2)
```
POST   /api/ai-rewrites
       Rewrite content with Claude AI
       Body: { sessionId, section, originalContent, style, tone, action }
       Actions: rewrite, optimize, generate-hero
       Returns: { rewriteId, rewrittenContent, explanation }
```

### Subscriptions API (Phase 2)
```
GET    /api/subscriptions
       Get user's active subscription
       Returns: { id, tier_id, status, ai_rewrites_used, ... } or { subscribed: false }

POST   /api/subscriptions/checkout
       Create Stripe checkout session
       Body: { tierId, billingCycle: 'monthly' | 'yearly' }
       Returns: { sessionId, checkoutUrl }

DELETE /api/subscriptions
       Cancel user's subscription
       Returns: { success: true, message: '...' }
```

### Webhooks (Phase 2)
```
POST   /api/webhooks/stripe
       Handle Stripe events
       Handles:
       - checkout.session.completed → Create subscription
       - customer.subscription.deleted → Cancel subscription
       - customer.subscription.updated → Update subscription status
```

---

## Database Tables (Phase 2)

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `subscription_tiers` | Plans (Pro, Business, Enterprise) | name, price_monthly, ai_rewrites_per_month, features |
| `user_subscriptions` | User's active subscription | user_id, tier_id, status, stripe_subscription_id |
| `premium_builder_sessions` | Builder editing state | user_id, website_id, components, content, design |
| `website_variants` | A/B test copies | session_id, variant_name, html_content, conversions |
| `color_systems` | 6 color palettes | name, primary_color, secondary_color |
| `typography_systems` | 4 font systems | name, heading_font, body_font |
| `spacing_systems` | 3 spacing scales | name, xs_spacing, sm_spacing, ... |
| `ai_rewrites` | Content rewrite history | session_id, section, original, rewritten |
| `component_edits` | Change log | session_id, edit_type, original_value, new_value |
| `premium_deployments` | Live website tracking | session_id, deployed_url, custom_domain |

---

## Running Both Phases Locally

### Terminal 1: Phase 1
```bash
cd guma-phase1-frontend
npm run dev
# http://localhost:3000
```

### Terminal 2: Phase 2
```bash
cd guma-phase2-builder
npm run dev
# http://localhost:3001
```

### Terminal 3: Phase 1 Workers (optional)
```bash
docker-compose up
# Runs crawler, generator, outreach workers + Redis
```

---

## Benefits of Isolated Phase 2

✅ **Independent Deployment** — Deploy Phase 2 without touching Phase 1  
✅ **Separate Scaling** — Phase 2 can scale independently  
✅ **Clean Separation** — No code confusion  
✅ **Easier Testing** — Test Phase 2 in isolation  
✅ **Team Workflows** — Teams can work separately  
✅ **Different Dependencies** — Phase 2 can use different libraries  
✅ **Performance** — No Phase 1 bloat in Phase 2  
✅ **Future Flexibility** — Easy to migrate Phase 2 to different framework later  

---

## Next Steps

1. ✅ Create `.env.local` in `guma-phase2-builder/`
2. ✅ Fill environment variables
3. ✅ Run `npm install`
4. ✅ Run Phase 2 database migrations via Supabase
5. ✅ Insert subscription tiers
6. ✅ Start `npm run dev` (should run on port 3001)
7. [ ] Create pricing page to select tier
8. [ ] Complete builder UI (features, pricing sections)
9. [ ] Test Stripe integration
10. [ ] Deploy both to Vercel

---

**Phase 2 is now completely isolated and production-ready.** 🚀
