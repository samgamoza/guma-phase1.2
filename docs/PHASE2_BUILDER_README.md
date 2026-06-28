# Phase 2: Advanced Premium Builder — Complete Implementation

## Overview

**Phase 2** is the premium, subscription-based ($29-$299/month) tier of GUMA AI. While Phase 1 generates basic websites instantly and for free, Phase 2 unlocks an **advanced AI-powered builder** where users deeply customize every aspect:

- 🎨 **Design systems** (6 color systems, 4 typography, 3 spacing)
- 🧩 **Component customization** (swap components across templates)
- ✨ **AI rewrites** (rewrite copy in different styles/tones)
- 📐 **Section reordering** (drag-and-drop section order)
- 🔀 **A/B variants** (generate copies for testing)
- 🚀 **Custom domain deployment**
- 📊 **Analytics** (track visitors, conversions, revenue)

**Gated behind paywall:** Only active Premium/Business/Enterprise subscribers can access Phase 2 features.

---

## Architecture

### 1. Database Schema (`database/phase2-schema.sql`)

**Subscription Layer:**
- `subscription_tiers` — Pro ($29), Business ($99), Enterprise ($299)
  - Features: max websites, AI rewrites per month, design systems available
- `user_subscriptions` — User's active subscription
  - Status: active, paused, canceled, past_due
  - Tracks: rewrite quota used, websites created

**Builder Sessions:**
- `premium_builder_sessions` — User's editing session
  - Tracks: selected components, colors, typography, content, sections
  - Status: draft, editing, previewing, published, archived

**Design Systems:**
- `color_systems` — 6 pre-built color palettes
  - Primary, secondary, accent, success, warning, error colors
  - Compatible with which templates
- `typography_systems` — 4 font systems
  - Heading, body, mono fonts with sizes and weights
- `spacing_systems` — 3 spacing scales
  - xs, sm, md, lg, xl, xxl units

**Website Variants:**
- `website_variants` — A/B testing copies
  - Variant types: original, color_swap, layout_variation, copy_variation, component_swap
  - Tracks: traffic %, conversions, views, conversion rate

**AI Rewriting:**
- `ai_rewrites` — Content rewrite history
  - Tracks: original, rewritten, style, tone, model used, user feedback
- `ai_rewrites_approved` — User-approved rewrites

**Customizations:**
- `component_edits` — Log of changes made
  - Edit type: color_swap, text_edit, layout_change, remove_section, reorder_section

**Deployments:**
- `premium_deployments` — Live website tracking
  - Custom domain, SSL status, performance scores
  - Analytics: views, conversions, bounce rate

---

## Core Features

### 1. Component Assembly
**File:** `src/lib/phase2/builder-engine.ts`

Users start with a template and assemble optimal components:

```typescript
interface ComponentAssembly {
  heroComponentId: string
  featuresComponentId: string
  pricingComponentId: string
  testimonialsComponentId: string
  faqComponentId: string
  ctaComponentId: string
  footerComponentId: string
}
```

Each component can come from any template in the library. Mix-and-match creates unique websites.

### 2. Color System Application
Six pre-built color systems:
1. **Modern Blue** — Tech/SaaS (primary: #0066FF, secondary: #00AA44)
2. **Corporate Navy** — Business (primary: #1F3A93, secondary: #004C97)
3. **Luxury Gold** — Premium/Finance (primary: #8B7500, secondary: #FFD700)
4. **Medical Clean** — Healthcare (primary: #0099CC, secondary: #FFFFFF)
5. **Startup Purple** — Creative (primary: #7928CA, secondary: #FF0080)
6. **Modern Monochrome** — Minimalist (primary: #000000, secondary: #CCCCCC)

When applied:
- CSS variables injected: `--color-primary`, `--color-secondary`, `--color-accent`
- Hardcoded colors replaced with variables
- Design coherence maintained across all components

### 3. Typography System Application
Four typography systems:
1. **Modern SaaS** — Inter (headings), Poppins (body)
2. **Corporate** — Roboto (headings), Open Sans (body)
3. **Luxury** — Playfair Display (headings), Lato (body)
4. **Creative** — Montserrat (headings), Ubuntu (body)

### 4. Section Management
Users can:
- **Show/hide sections** (toggle hero, features, pricing, testimonials, FAQ)
- **Reorder sections** (drag hero after features, etc.)
- **Edit content** per section (headlines, descriptions, pricing tiers)

### 5. AI-Powered Content Rewriting
**File:** `src/lib/phase2/ai-rewrite-engine.ts`

**Styles:**
- Casual
- Professional
- Playful
- Persuasive
- Technical

**Tones:**
- Friendly
- Formal
- Humorous
- Authoritative

**Examples:**
```typescript
// Rewrite hero section
const result = await rewriteSection({
  sessionId: 'abc-123',
  section: 'hero',
  originalContent: 'We build software',
  style: 'persuasive',
  tone: 'friendly'
})
// → "Join 10,000+ companies trusting us with their software needs"
```

**Features:**
- `rewriteSection()` — Improve existing copy
- `generateHeroCopy()` — Generate hero from business description
- `generateFeaturesCopy()` — Generate features from capabilities list
- `generatePricingCopy()` — Generate pricing page copy
- `generateCopyVariations()` — Create 3+ variations for A/B testing
- `optimizeForConversion()` — Enhance copy for higher conversion

**Quota Management:**
- Pro tier: 10 rewrites/month
- Business tier: 50 rewrites/month
- Enterprise tier: unlimited

### 6. Website Assembly & Generation
**Function:** `generateWebsiteHTML(sessionId)`

Combines:
1. Base template HTML + CSS
2. Inject color variables into CSS
3. Replace hero section content
4. Replace features section content
5. Replace pricing section content
6. Replace footer content
7. Reorder sections per user preference
8. Output complete HTML document

Result: Fully customized website ready to deploy.

### 7. A/B Testing / Variants
Create multiple versions for testing:

```typescript
// Create color variant
await createWebsiteVariant(
  sessionId,
  'variant_1_luxury_gold',
  'color_swap'
)

// Create copy variant
await createWebsiteVariant(
  sessionId,
  'variant_2_casual_tone',
  'copy_variation'
)
```

Track performance:
- Traffic split
- Conversions per variant
- Conversion rate comparison

### 8. Custom Domain Deployment
Users can:
- Deploy to custom domain (mycompany.com)
- Auto-generate SSL certificate
- Enable custom email routing
- Custom branded footer

---

## API Endpoints

### Builder Session Management
```
POST   /api/phase2/builder                    Create new session
GET    /api/phase2/builder?id=X               Get session details
PATCH  /api/phase2/builder?id=X&action=Y      Update section (hero, features, pricing, etc.)
```

### Actions:
- `update-hero` — Save headline, subheading, CTA
- `update-features` — Save features list
- `update-pricing` — Save pricing tiers
- `reorder-sections` — Reorder visible sections
- `toggle-section` — Show/hide section

### AI Rewrites
```
POST /api/phase2/ai-rewrites                  Rewrite section copy
```

**Actions:**
- `rewrite` — Rewrite existing copy
- `generate-hero` — Generate hero from business info
- `generate-features` — Generate features
- `generate-pricing` — Generate pricing copy
- `variations` — Generate A/B copy variants
- `optimize` — Optimize for conversion

### Subscription Management
```
GET    /api/phase2/subscriptions              Get user's subscription
POST   /api/phase2/subscriptions/checkout     Create Stripe checkout
DELETE /api/phase2/subscriptions              Cancel subscription
```

---

## UI: Advanced Builder

**File:** `app/phase2/builder/[sessionId]/page.tsx`

**Layout:**
- Left sidebar: Navigation (Hero, Features, Pricing, Design, Preview)
- Main content area: Section editor

**Tabs:**

### Hero Section
- Headline input (text edit + AI rewrite button)
- Subheading textarea
- CTA button text
- Save button

### Features Section
- Dynamic feature cards
- Headline + description per feature
- Add/remove features
- AI rewrite button

### Pricing Section
- 3 pricing tier cards
- Name, price, features per tier
- AI-generate pricing copy

### Design System
- 6 color system selector (visual previews)
- 4 typography system selector
- 3 spacing system selector
- Apply button

### Preview Tab
- Live preview of customized website
- Mobile/desktop responsive views

---

## Subscription Tiers

### Pro ($29/month)
- Up to 5 premium websites
- 10 AI rewrites/month
- 2 color systems
- 2 typography systems
- Standard support

### Business ($99/month)
- Unlimited premium websites
- 50 AI rewrites/month
- All 6 color systems
- All 4 typography systems
- Custom domain support
- Email support + Slack

### Enterprise ($299/month)
- Everything in Business
- Unlimited AI rewrites
- 3 spacing systems
- A/B testing with traffic splits
- Analytics dashboard
- API access
- Dedicated account manager

---

## Data Flow: Premium Website Generation

### 1. User Creates Premium Website
```
1. User selects industry, business type
2. System recommends template via intelligence engine
3. User creates premium builder session
   → POST /api/phase2/builder
   → Creates session (draft status)
```

### 2. User Customizes Website
```
1. User navigates to /phase2/builder/[sessionId]
2. Selects sections to show
3. Edits hero headline/subheading/CTA
4. Optionally AI-rewrites content
5. Selects color system (e.g., Luxury Gold)
6. Selects typography system
7. Reorders sections (drag hero to bottom)
8. Saves changes → PATCH /api/phase2/builder
```

### 3. User Generates & Deploys
```
1. System assembles complete HTML from components
2. Injects color variables into CSS
3. Replaces content sections
4. Reorders sections per user preference
5. Returns complete website HTML
6. User publishes
7. Website deployed to:
   - Default: custom.guma.ai
   - Or: user's custom domain
```

### 4. Analytics Tracking
```
1. Website tracks:
   - Page views
   - Conversions (form submissions)
   - Time on page
   - Bounce rate
2. System attributes revenue to template
3. Variant A/B test results collected
4. User sees dashboard with metrics
```

---

## AI Integration

### Content Generation (Claude API)
- Model: `claude-sonnet-4-6` (fast, quality)
- Max tokens: 1000 per request
- Use cases: hero copy, features, pricing copy, variants

**Prompt Engineering:**
- Context-aware (SaaS vs. medical vs. ecommerce)
- Style/tone specification
- Benefit-focused language
- Conversion optimization focus

### Rewrite Quota Management
```typescript
// Check quota
const remaining = user_subscription.ai_rewrites_per_month - user_subscription.ai_rewrites_used

// Decrement after use
user_subscription.ai_rewrites_used += 1
```

---

## Component Assembly Algorithm

When user selects components for a website:

1. **Fetch all components** from component library
2. **Filter by compatibility:**
   - Color system compatible? ✓
   - Responsive? ✓
   - Accessibility score > 70? ✓
3. **Rank by popularity** (most used in successful websites)
4. **Assemble in order:**
   - Hero (attention-grabbing)
   - Features (value proposition)
   - Pricing (revenue driver)
   - Testimonials (social proof)
   - FAQ (objection handling)
   - CTA (conversion)
   - Footer (trust/legal)

---

## Color System Implementation

**Example: Apply Luxury Gold to website**

1. Extract color system variables:
   ```
   primary: #8B7500
   secondary: #FFD700
   accent: #D4AF37
   ```

2. Inject into CSS:
   ```css
   :root {
     --color-primary: #8B7500;
     --color-secondary: #FFD700;
     --color-accent: #D4AF37;
   }
   ```

3. Replace hardcoded colors:
   ```css
   /* Before */
   .hero { background: #0066FF; }

   /* After */
   .hero { background: var(--color-primary); }
   ```

4. Result: Entire website recolored cohesively

---

## Publishing & Deployment

### Publish Flow
```typescript
1. generateWebsiteHTML(sessionId)
   → Assemble components + content + design
2. Save to websites table
3. Update builder session status → 'published'
4. Create premium_deployment record
5. Assign URL:
   - Default: {slug}.guma.ai
   - Or: user's custom domain
6. Generate SSL certificate
7. Deploy to Vercel
```

### Custom Domain Setup
```
1. User adds domain in settings
2. System validates domain ownership (DNS)
3. Generates SSL cert (Let's Encrypt)
4. Routes traffic to deployment
5. Custom email routing optional
```

---

## A/B Testing Setup

**Create Variant:**
```typescript
await createWebsiteVariant(
  sessionId,
  'variant_1_minimalist',
  'color_swap'  // changed color system
)
```

**Configure Split:**
```
Original: 50% traffic
Variant 1: 50% traffic
```

**Track Results:**
```
Original:  120 visitors → 8 conversions (6.7%)
Variant 1: 118 visitors → 12 conversions (10.2%)

Winner: Variant 1 ✓ (3.5% better conversion)
```

---

## Security & Access Control

**RLS Policies:**
- Users can only view/edit their own sessions
- Subscriptions verified before builder access
- AI rewrite quota enforced per user
- Admin APIs require admin role

**Subscription Verification:**
```typescript
const hasAccess = await verifyPremiumAccess(userId)
if (!hasAccess) throw new Error('Premium subscription required')
```

---

## Monitoring & Analytics

**Key Metrics:**
- Active premium subscribers
- Avg. websites per subscriber
- AI rewrites used/available
- Most popular color systems
- Most popular typography systems
- Avg. time in builder
- Variant A/B test results
- Revenue per template

---

## Roadmap (Post-Launch)

- [ ] Multi-page site builder (currently single-page)
- [ ] Email template customization
- [ ] Blog post generation
- [ ] SEO optimization tools
- [ ] Email marketing integration (ConvertKit, Mailchimp)
- [ ] CRM integration (Stripe, Shopify)
- [ ] Advanced analytics (GA4 integration)
- [ ] Slack bot for updates
- [ ] API webhooks for automation

---

## Integration with Phase 1

**Phase 1 → Phase 2 Upgrade Flow:**

```
1. User has free Phase 1 website (generated instantly)
2. User wants to upgrade
   → Clicks "Upgrade to Premium"
   → Redirected to /dashboard/upgrade
   → Shows subscription tiers
   → Stripe checkout created
3. User completes payment
   → Subscription created (active status)
   → User redirected to builder
   → Can now edit Phase 1 site with Phase 2 features OR
   → Create new premium website from scratch
4. Phase 1 website remains accessible
   → Old design + Phase 2 customizations layer on top
```

---

## Files Summary

| File | Purpose |
|------|---------|
| `database/phase2-schema.sql` | Database tables for Phase 2 |
| `src/lib/phase2/builder-engine.ts` | Component assembly, HTML generation, section management |
| `src/lib/phase2/ai-rewrite-engine.ts` | AI-powered content rewriting and generation |
| `app/api/phase2/builder/route.ts` | Builder API endpoints |
| `app/api/phase2/ai-rewrites/route.ts` | AI rewrite API |
| `app/api/phase2/subscriptions/route.ts` | Subscription management & Stripe integration |
| `app/phase2/builder/[sessionId]/page.tsx` | Builder UI dashboard |

---

**Phase 2 transforms GUMA AI from a template-filler into a professional-grade website builder with AI superpowers.**
