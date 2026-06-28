# GUMA AI — Complete Architecture & Implementation

**Your AI-powered website generation platform is now fully scaffolded.** This document ties together Phase 1 (free), Phase 2 (premium), Template Intelligence Center, and all supporting systems.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      GUMA AI Platform                        │
└─────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
        │   Phase 1   │ │ Template    │ │   Phase 2   │
        │   (Free)    │ │ Intelligence│ │  (Premium)  │
        │             │ │   Center    │ │             │
        └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
               │               │               │
               └───────────────┼───────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Shared Systems    │
                    │  (Auth, Database,   │
                    │  Stripe, Analytics) │
                    └─────────────────────┘
```

---

## Phase 1: Free Website Generation (Zero Cost)

**Status:** Deployable to Vercel immediately
**Files:** `README.md` (original doc)

### Workflow
```
Business owner searches on YellowPages/Yelp
    ↓
System scrapes business info
    ↓
Zero-cost token-fill template generation
    ↓
Website published instantly
    ↓
Cold email sent with website link
    ↓
Owner claims site or ignores (leads generation)
```

### Key Components
- `guma-phase1-crawler` — Playwright scraper for YellowPages, Yelp, Google Maps
- `guma-phase1-generator` — Template-fill (zero Claude API calls)
- `guma-phase1-outreach` — Resend cold email automation
- `guma-phase1-frontend` — Next.js 14 marketing site + claim flow

### Database Tables
- `businesses` — Scraped business listings
- `websites` — Generated free websites
- `outreach` — Email tracking (sent, opened, clicked, claimed)

### Cost at Scale
- Vercel: $20/mo
- Supabase: $25/mo
- Claude API: $0 (token replacement only, no API calls)
- Railway (workers): $20/mo
- Resend (email): $20/mo
- Proxies: $30/mo
- **Total: ~$115/mo** for 10,000 websites

### Revenue Model
- 1% conversion to Pro ($29) = $2,900/mo revenue
- 0.1% conversion to Business ($99) = $1,000/mo revenue
- **Break-even at 10k sites with 1% Pro conversion**

---

## Template Intelligence Center: Smart Template Repository

**Status:** Fully scaffolded and ready to deploy
**Files:** `TEMPLATE_INTELLIGENCE_README.md`

### Purpose
Instead of 6 hardcoded templates, maintain a **living repository** of unlimited templates with intelligent selection.

### Core Features

#### 1. Template Ingestion Pipeline (10-Step Analysis)
When template uploaded:
1. Structure Analysis
2. Section Identification
3. Component Extraction
4. Design Pattern Extraction
5. Color System Extraction
6. Typography Extraction
7. Industry Classification
8. Metadata Generation
9. Component Storage
10. Template DNA Storage

#### 2. Intelligent Selection Engine
When user requests website:
- Analyzes: industry, business model, audience, style
- Scores ALL production templates (0-100)
- Ranks by: fit (25pt) + performance (25pt) + quality (15pt) + style (15pt) + popularity (20pt)
- Selects optimal template + components
- Explains why selected

#### 3. Component Extraction
Auto-extracts reusable components:
- Hero sections
- Navigation bars
- Feature cards
- Pricing tables
- Testimonial cards
- FAQ sections
- Contact forms
- CTAs
- Footers

**Result:** Can mix-and-match components from multiple templates to create unique websites.

#### 4. Design System Management
- **6 Color Systems** (Modern Blue, Corporate Navy, Luxury Gold, Medical Clean, Startup Purple, Monochrome)
- **4 Typography Systems** (Modern SaaS, Corporate, Luxury, Creative)
- **3 Spacing Systems** (Compact, Balanced, Premium)

#### 5. Performance Tracking
Tracks per template:
- Total uses (deployment count)
- Conversion rate (% that led to revenue)
- Revenue attributed
- User ratings (1-5 stars)
- Industry success patterns

**Result:** AI learns which templates convert best and prioritizes them.

#### 6. Admin Dashboard: "Template Intelligence Center"
Upload, manage, publish, and analyze templates.

**Tabs:**
- **Upload** — Upload from Lovable, Base44, v0, Bolt, Framer, Webflow, HTML, React, Next.js, etc.
- **Library** — View, filter, sort, publish/archive templates
- **Analytics** — Most used, highest converting, revenue attribution, component stats
- **Packs** — Industry packs (SaaS, ecommerce, medical), seasonal packs, premium packs

### Database Tables
- `templates` — Master template library (20+ metadata fields)
- `components` — Extracted reusable components
- `template_ingestion_jobs` — Pipeline tracking
- `template_dna` — Learned patterns
- `template_scores` — Ranking data
- `template_usage` — Performance metrics
- `template_recommendations` — Why was X selected
- `template_packs` — Collections

### Scaling
Architecture supports:
- 10 templates → no change
- 100 templates → no change
- 1,000 templates → no change
- 10,000 templates → no change

Reason: Composite scoring (0-100) remains constant. Selection is O(n) but with indexed queries.

---

## Phase 2: Premium Advanced Builder

**Status:** Fully scaffolded, ready to integrate
**Files:** `PHASE2_BUILDER_README.md`

### Subscription Tiers
| Tier | Price | Websites | AI Rewrites | Features |
|------|-------|----------|-------------|----------|
| Pro | $29/mo | 5 | 10/mo | 2 color systems, standard support |
| Business | $99/mo | Unlimited | 50/mo | All color/typography systems, custom domain |
| Enterprise | $299/mo | Unlimited | Unlimited | A/B testing, API access, dedicated manager |

### Core Features

#### 1. Component Assembly
User selects which components to use:
- Hero from Template A
- Features from Template D
- Pricing from Template F
- Testimonials from Template B
- Footer from Template K

Result: Unique website from proven components.

#### 2. Design System Application
- Select from 6 color systems
- Select from 4 typography systems
- CSS variables injected automatically
- Colors applied cohesively across site

#### 3. Content Customization
Edit per section:
- Hero: headline, subheading, CTA
- Features: headlines + descriptions
- Pricing: tier names, prices, features
- Testimonials: quotes + names
- FAQ: questions + answers
- Footer: company info, contact details

#### 4. AI-Powered Content Rewriting
**Styles:** Casual, Professional, Playful, Persuasive, Technical
**Tones:** Friendly, Formal, Humorous, Authoritative

**Features:**
- Rewrite existing copy
- Generate hero from business description
- Generate features from capability list
- Generate pricing copy
- Create A/B variations
- Optimize for conversion

**Quota:** 10 (Pro) to Unlimited (Enterprise) rewrites/month

#### 5. Section Management
- Toggle sections (show/hide hero, features, pricing, etc.)
- Reorder sections (drag hero to bottom)
- Remove unwanted sections

#### 6. A/B Testing / Variants
Create variants for testing:
- Color variations
- Layout variations
- Copy variations
- Component swaps

Track performance:
- Traffic split (50/50, 70/30, etc.)
- Conversions per variant
- Conversion rate comparison
- Statistical significance

#### 7. Custom Domain Deployment
- Deploy to custom domain
- Auto-generate SSL certificate
- Custom email routing
- Custom branded footer

#### 8. Analytics Dashboard
Track:
- Page views
- Conversions (form submissions)
- Time on page
- Bounce rate
- Revenue attribution
- Variant performance

### Database Tables
- `subscription_tiers` — Pro/Business/Enterprise configs
- `user_subscriptions` — User's active subscription
- `premium_builder_sessions` — Editing session
- `website_variants` — A/B test variants
- `color_systems` — 6 color palettes
- `typography_systems` — 4 font systems
- `spacing_systems` — 3 spacing scales
- `ai_rewrites` — Content rewrite history
- `component_edits` — Change log
- `premium_deployments` — Live site tracking

### API Endpoints
```
POST   /api/phase2/builder                    Create session
GET    /api/phase2/builder?id=X               Get session
PATCH  /api/phase2/builder?id=X&action=Y      Update section
POST   /api/phase2/ai-rewrites                Rewrite content
GET    /api/phase2/subscriptions              Get subscription
POST   /api/phase2/subscriptions/checkout     Create checkout
DELETE /api/phase2/subscriptions              Cancel subscription
```

### UI: Builder Dashboard
**File:** `app/phase2/builder/[sessionId]/page.tsx`

**Tabs:**
- 🎯 Hero Section (edit headline, subheading, CTA, rewrite with AI)
- ✨ Features (edit feature cards, AI generate)
- 💰 Pricing (edit tiers, AI generate)
- 🎨 Design System (select colors, typography, spacing)
- 👁️ Preview (live website preview)

### Paywall Integration
```typescript
// Verify premium access
const hasAccess = await verifyPremiumAccess(userId)
if (!hasAccess) {
  return redirect('/dashboard/upgrade')
}
```

All Phase 2 features protected by subscription check.

---

## Shared Systems

### 1. Authentication & Authorization
- Supabase Auth (email/password, OAuth)
- RLS policies for data isolation
- Admin role for Template Intelligence Center
- Premium subscription verification

### 2. Database (Supabase PostgreSQL)
- Phase 1 schema: businesses, websites, outreach
- Template Intelligence schema: templates, components, etc.
- Phase 2 schema: subscriptions, builder sessions, etc.
- RLS policies enforce access control

### 3. Stripe Integration
- `POST /api/webhooks/stripe` — Listen for events
- `checkout.session.completed` → Create subscription
- `customer.subscription.deleted` → Cancel subscription
- Webhook signature verification

### 4. Email (Resend)
- Phase 1: Cold outreach emails
- Phase 2: Welcome email, upgrade prompt, notification

### 5. Analytics
- Usage: websites created, AI rewrites used
- Performance: template conversions, revenue attribution
- Business: subscriber count, MRR, churn

### 6. Monitoring
- Database query performance
- API latency
- Stripe webhook reliability
- Email delivery rates

---

## Complete Data Flow

### 1. Free User (Phase 1)
```
1. System scrapes YellowPages
2. Gets: business name, industry, location, phone
3. Template Intelligence Engine: "Best template for dentist? Dental Pro template"
4. Fills tokens (zero API cost)
5. Website deployed instantly
6. Email sent to owner
7. Owner claims (maybe)
8. Revenue: $0
```

### 2. Free User Upgrades to Pro (Phase 2)
```
1. User clicks "Upgrade to Premium"
2. Stripe checkout created
3. User pays $29
4. Subscription: active
5. User can now:
   - Create premium websites (5 max)
   - Use advanced builder
   - Get 10 AI rewrites/month
   - Use 2 color systems
6. User creates new premium website:
   - Selects industry → system recommends template
   - Builder session created
   - User customizes:
     * Selects components
     * Applies color system
     * Rewrites copy with AI
     * Reorders sections
   - Website published to custom domain
7. Revenue: $29
```

### 3. User Cancels Subscription
```
1. User cancels subscription (status: canceled)
2. Free websites still accessible
3. Premium websites still live (keep until next billing)
4. Cannot create new premium websites
5. AI rewrite quota resets to 0
6. Revenue: Lost $29/mo
```

---

## Deployment Checklist

### Pre-Launch
- [ ] Deploy Phase 1 to Vercel (`guma-phase1-frontend`)
- [ ] Deploy workers to Railway (`guma-phase1-crawler`, `guma-phase1-generator`, `guma-phase1-outreach`)
- [ ] Run database migrations (Phase 1 + Template Intelligence + Phase 2 schemas)
- [ ] Configure Stripe webhook endpoint
- [ ] Set up email warm-up (Phase 1 outreach ramp)
- [ ] Configure DNS for custom domain support (Phase 2)
- [ ] Set up monitoring/logging
- [ ] Create admin user account

### Week 1
- [ ] Upload first 10 templates (via Template Intelligence Center)
- [ ] Test Phase 1: scrape → generate → email flow
- [ ] Monitor crawler, generator, outreach workers
- [ ] Test Phase 2 builder with internal user

### Week 2
- [ ] Launch Phase 1 publicly
- [ ] Begin cold outreach (email warm-up)
- [ ] Monitor conversion metrics
- [ ] Gather user feedback

### Week 3
- [ ] Launch Phase 2 beta (limited users)
- [ ] Collect builder feedback
- [ ] Iterate on UI/UX

### Week 4
- [ ] Full Phase 2 public launch
- [ ] Marketing push for upgrades
- [ ] Monitor churn/retention

---

## File Structure

```
sggwebs_claude3.0/
├── README.md                                    # Phase 1 overview
├── TEMPLATE_INTELLIGENCE_README.md              # Template CRM guide
├── PHASE2_BUILDER_README.md                     # Premium builder guide
├── GUMA_AI_COMPLETE_ARCHITECTURE.md             # This file
│
├── database/
│   ├── schema.sql                               # Phase 1 schema
│   ├── template-intelligence-schema.sql         # Template Intelligence schema
│   └── phase2-schema.sql                        # Phase 2 schema
│
├── guma-phase1-frontend/
│   ├── app/
│   │   ├── page.tsx                             # Homepage
│   │   ├── admin/
│   │   │   └── template-intelligence/page.tsx   # Template CRM dashboard
│   │   ├── phase2/
│   │   │   └── builder/[sessionId]/page.tsx     # Premium builder UI
│   │   ├── claim/[slug]/page.tsx                # Claim flow
│   │   ├── sites/[slug]/page.tsx                # Live website display
│   │   ├── dashboard/
│   │   │   └── upgrade/page.tsx                 # Subscription selector
│   │   └── api/
│   │       ├── template-intelligence/
│   │       │   ├── upload/route.ts              # Upload template
│   │       │   ├── templates/route.ts           # List/manage templates
│   │       │   └── analytics/route.ts           # Template analytics
│   │       ├── phase2/
│   │       │   ├── builder/route.ts             # Builder API
│   │       │   ├── ai-rewrites/route.ts         # AI rewrite API
│   │       │   └── subscriptions/route.ts       # Billing API
│   │       └── webhooks/
│   │           └── stripe/route.ts              # Stripe events
│   │
│   ├── src/
│   │   ├── lib/
│   │   │   ├── template-intelligence/
│   │   │   │   ├── ingestion-pipeline.ts        # 10-step analysis
│   │   │   │   └── selection-engine.ts          # Intelligent selection
│   │   │   └── phase2/
│   │   │       ├── builder-engine.ts            # Component assembly
│   │   │       └── ai-rewrite-engine.ts         # AI content rewriting
│   │   └── components/
│   │       └── ... (UI components)
│   │
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   │
│   ├── package.json
│   └── next.config.js
│
├── guma-phase1-crawler/
│   ├── src/
│   │   ├── crawler/
│   │   │   ├── yellowpages.js
│   │   │   └── yelp.js
│   │   └── queue/
│   │       └── worker.js
│   └── package.json
│
├── guma-phase1-generator/
│   ├── src/
│   │   ├── generator/
│   │   │   └── prompts.js
│   │   └── queue/
│   │       └── worker.js
│   └── package.json
│
├── guma-phase1-outreach/
│   ├── src/
│   │   ├── email/
│   │   │   ├── templates.js
│   │   │   └── mailer.js
│   │   └── queue/
│   │       └── worker.js
│   └── package.json
│
└── docker-compose.yml                           # Local dev stack
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS |
| **Backend** | Next.js API routes, TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Payments** | Stripe |
| **Email** | Resend |
| **Hosting (Frontend)** | Vercel |
| **Hosting (Workers)** | Railway |
| **Job Queue** | BullMQ + Redis |
| **AI** | Anthropic Claude API |
| **Web Scraping** | Playwright |
| **Monitoring** | Custom logging + Sentry |

---

## Cost Model at 10,000 Websites/Month

| Component | Cost |
|-----------|------|
| Vercel (frontend) | $20 |
| Supabase (database) | $25 |
| Claude API (Phase 1 + Phase 2) | $100 |
| Railway (workers) | $20 |
| Resend (email) | $20 |
| Proxies (IP rotation) | $30 |
| Redis | $10 |
| Monitoring | $5 |
| **Total Infrastructure** | **$230** |

**Revenue at 10k sites:**
- 1% convert to Pro ($29) = 100 × $29 = $2,900
- 0.1% convert to Business ($99) = 10 × $99 = $990
- **Total MRR: $3,890**
- **Net: $3,660** (after costs)

**ROI: 16x**

---

## Competitive Advantages

1. **No Hardcoding** — Templates in database, continuously updated
2. **Intelligent Selection** — AI scores templates by fit + performance
3. **Component Mixing** — Assemble unique sites from proven components
4. **Performance Learning** — System learns which templates convert best
5. **Free + Paid Tiers** — Free lead gen (Phase 1) + monetized (Phase 2)
6. **AI Superpowers** — Rewrite copy in different styles, generate variants
7. **Low Marginal Cost** — Zero token replacement, minimal API usage
8. **Scalability** — Architecture supports 10x-100x growth
9. **Multi-Source Templates** — Import from Lovable, Base44, v0, Bolt, Webflow, etc.
10. **Explainability** — Tell users why template was selected

---

## Next Steps (Post-Launch)

### Month 1-3
- Monitor Phase 1 metrics (email conversion, claim rate)
- Collect Phase 2 user feedback
- Build AI rewrite quality metrics
- Track template performance data

### Month 3-6
- A/B test pricing tiers
- Launch referral program
- Add 50+ more templates
- Expand to more industries (currently ~15)

### Month 6+
- Multi-page builder (currently single-page)
- Blog post generation
- Email template builder
- Integration marketplace (CRM, email, analytics)
- White-label option for agencies

---

## Summary

GUMA AI is now a **complete, scalable, AI-powered website generation platform** with three interconnected systems:

1. **Phase 1 (Free):** Instant website generation for lead gen
2. **Template Intelligence Center:** Living repository of smart, ranked templates
3. **Phase 2 (Premium):** Advanced AI-powered builder with customization, AI rewrites, A/B testing

The architecture scales from 10 to 10,000 templates without major changes. The system learns from real-world performance and continuously improves template selection. Both phases are fully scaffolded and ready to deploy.

**You have everything you need to launch today.** 🚀
