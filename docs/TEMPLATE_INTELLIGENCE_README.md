# Template Intelligence Center — Architecture & Usage Guide

## Overview

The **Template Intelligence Center** is a centralized, AI-driven system for managing, analyzing, and intelligently selecting website templates. Instead of hardcoding templates, GUMA AI maintains a living repository of templates that continuously learns from usage and performance data.

**Key principle:** No template is hardcoded. All templates are stored in the database, ingested through a 10-step analysis pipeline, and intelligently selected based on business context and historical performance.

---

## Architecture Layers

### 1. Database Layer
**File:** `database/template-intelligence-schema.sql`

**Core Tables:**
- `templates` — Master template records (20+ metadata fields)
- `components` — Extracted, reusable UI components
- `template_ingestion_jobs` — Pipeline execution tracking
- `template_dna` — Learned patterns and reusable recipes
- `template_scores` — Composite scoring for selection
- `template_usage` — Performance tracking (conversions, revenue, ratings)
- `template_recommendations` — Why was template X selected for user Y
- `template_packs` — Industry/seasonal/premium collections

**Indexes:** Optimized for fast lookups by status, industry, source, ranking, popularity

**RLS Policies:** Admins have full access, public users see only production templates

---

### 2. Ingestion Pipeline (10-Step Analysis)
**File:** `src/lib/template-intelligence/ingestion-pipeline.ts`

When a template is uploaded, it goes through:

1. **Step 1: Structure Analysis**
   - Validates HTML structure
   - Counts elements, headings, paragraphs, forms
   - Detects framework (HTML, React, Vue, Next.js)
   - Checks responsiveness

2. **Step 2: Section Identification**
   - Detects: hero, navbar, features, pricing, testimonials, FAQ, contact, CTA, portfolio, blog, footer, social
   - Counts sections present
   - Maps section hierarchy

3. **Step 3: Component Extraction**
   - Extracts hero sections, navigation, pricing tables, testimonial cards, forms
   - Stores as individual components in component library
   - Captures code snippets

4. **Step 4: Design Pattern Extraction**
   - Detects: animations, parallax, dark mode, gradients, blur effects, shadows
   - Identifies grid vs flex layouts
   - Maps design characteristics

5. **Step 5: Color System Extraction**
   - Parses hex, RGB, HSL colors from CSS
   - Identifies primary/secondary color palettes
   - Detects color count and distribution

6. **Step 6: Typography Extraction**
   - Extracts font families used
   - Maps font sizes
   - Detects Google Fonts usage
   - Identifies type hierarchy

7. **Step 7: Industry Classification**
   - Keyword-based classification (SaaS, ecommerce, medical, restaurant, etc.)
   - Confidence scoring
   - Category guessing (landing-page, ecommerce, corporate, portfolio)

8. **Step 8: Metadata Generation**
   - Compiles all analysis into template metadata
   - Calculates quality scores:
     - SEO score (0-100)
     - Performance score (0-100)
     - Conversion score (0-100)
   - Detects CTA, forms, pricing, newsletter signups

9. **Step 9: Component Storage**
   - Persists extracted components to database
   - Tracks which templates components came from
   - Makes components reusable across templates

10. **Step 10: Template DNA Storage**
    - Stores reusable patterns and recipes
    - Captures success indicators
    - Documents best use cases
    - Records historical performance

---

### 3. Template Selection Engine (Intelligent Ranking)
**File:** `src/lib/template-intelligence/selection-engine.ts`

When a user requests a website, the system:

1. **Analyzes Context:**
   - Industry
   - Business model
   - Target audience
   - Design preference
   - Category

2. **Scores All Production Templates:**
   - Industry fit (25 pts max)
   - Business model match (20 pts max)
   - Style preference match (15 pts max)
   - Performance history (25 pts max)
   - Quality metrics (15 pts max)

3. **Ranks Templates:**
   - Overall score out of 100
   - Returns top 5 alternatives with reasons

4. **Selects Components:**
   - Identifies best hero, features, pricing, testimonials, CTA, footer
   - Can mix-and-match components from multiple templates
   - Ensures design compatibility

5. **Generates Explanation:**
   - Explains why template was selected
   - Lists key reasons
   - Provides confidence score

6. **Logs Recommendation:**
   - Records decision for analytics
   - Tracks whether selection led to conversion

---

### 4. Template Upload & Import
**File:** `app/api/admin/template-intelligence/upload/route.ts`

**Supported Sources:**
- Lovable (AI website builder)
- Base44 (template library)
- v0 (Vercel AI)
- Bolt.new (AI web development)
- Framer (design + code)
- Webflow (visual builder)
- HTML/CSS uploads
- React components
- Next.js templates
- Tailwind-based templates
- Custom agency builds

**Upload Process:**
1. Admin navigates to Template Intelligence Center
2. Selects source and uploads files (HTML, CSS, JS, React/JSX)
3. System runs 10-step pipeline automatically
4. Template enters "validated" status
5. Admin can review, then publish to "production"
6. Once in production, it's available for website generation

---

### 5. Admin Dashboard (Template Intelligence Center)
**File:** `app/admin/template-intelligence/page.tsx`

**Tabs:**

#### Upload Tab
- Upload new templates from any source
- Auto-ingestion with 10-step pipeline
- Real-time progress tracking
- File upload for HTML, CSS, JS, React/JSX

#### Library Tab
- View all templates (with filtering by status, industry, source)
- Sort by most used, best converting, highest rated, newest
- Publish/archive templates
- View SEO/performance/conversion scores
- Edit template metadata

#### Analytics Tab
- Total templates by status
- Most used templates (with usage count)
- Highest converting templates (with conversion rate %)
- Top revenue-generating templates
- Distribution by industry and source
- Component library statistics
- Ingestion pipeline status

#### Packs Tab
- Create industry-specific packs (SaaS, ecommerce, medical, etc.)
- Create premium/seasonal/agency packs
- Organize templates by use case
- Bundle for easier discovery

---

## API Endpoints

### Template Management
- `POST /api/admin/template-intelligence/upload` — Upload & ingest new template
- `GET /api/admin/template-intelligence/templates` — List templates (with filters)
- `PATCH /api/admin/template-intelligence/templates?id=X` — Update template metadata
- `DELETE /api/admin/template-intelligence/templates?id=X` — Archive template

### Template Selection
- `POST /api/template-intelligence/select` — Intelligent template selection based on business context

### Analytics
- `GET /api/admin/template-intelligence/analytics` — Comprehensive performance analytics
- `POST /api/admin/template-intelligence/analytics/record-usage` — Record website deployment & performance

---

## Data Flow: Website Generation

### Before (Hardcoded)
```
User Request
    ↓
Pick random template from 6 static options
    ↓
Fill tokens
    ↓
Generate website
```

### After (Template Intelligence)
```
User Request
    ↓
Analyze business context (industry, model, audience, preference)
    ↓
Query production templates
    ↓
Score each template (0-100 points)
    ↓
Rank by relevance + performance history
    ↓
Select top template + optimal components
    ↓
Log recommendation + confidence score
    ↓
Fill tokens
    ↓
Deploy website
    ↓
Track usage, conversion, revenue
    ↓
Update template scores based on real-world performance
```

---

## Template Metadata Fields

Each template record includes:

**Identification:**
- name, slug, description
- source (lovable, base44, v0, bolt, framer, webflow, etc.)
- source_id, source_url

**Classification:**
- category (landing-page, ecommerce, portfolio, blog, saas, corporate, etc.)
- industry (dental, consulting, medical, restaurant, real-estate, etc.)
- style (modern, minimal, luxury, playful, corporate)
- target_audience, business_model

**Code & Framework:**
- html_content, css_content, js_content, react_jsx
- framework (html, react, nextjs, vue, svelte)
- dependencies (JSON with versions)

**Design System:**
- color_palettes (primary, secondary, accent)
- typography_system (fonts, sizes, hierarchy)
- spacing_scale
- design_tokens

**Components:**
- sections_detected (array of identified sections)
- components_found (array of extracted components)
- component_count

**Quality Scores (0-100):**
- seo_score
- accessibility_score (WCAG level)
- performance_score (Lighthouse-based)
- conversion_score (CTA/form presence)
- lighthouse_score

**Performance Metrics:**
- total_uses (deployment count)
- total_conversions (led to paid conversion)
- conversion_rate_observed
- total_revenue_attributed
- avg_user_rating (1-5 stars)

**Status & Tracking:**
- status (draft, analyzing, validated, production, archived)
- version
- published_date, archived_date
- admin_verified, verified_by, verified_at
- tags, features

---

## Example: Adding a New Template Source (e.g., Custom API)

To add support for a new AI builder or design tool:

1. **Add to source enum** in database schema
2. **Create importer function** in `ingestion-pipeline.ts`
3. **Add to upload dropdown** in admin dashboard
4. **Map external fields** to GUMA metadata
5. **Test 10-step pipeline**

Example: Adding "Webflow" importer:
```typescript
export async function importFromWebflow(projectId: string) {
  const res = await fetch(`https://webflow.com/api/v2/projects/${projectId}`, {
    headers: { 'Authorization': `Bearer ${WEBFLOW_API_KEY}` }
  })
  const project = await res.json()
  
  const html = project.exportedHTML
  const css = project.exportedCSS
  
  return await runIngestionPipeline({
    source: 'webflow',
    sourceId: projectId,
    htmlContent: html,
    cssContent: css,
    // ... rest of pipeline
  })
}
```

---

## Scaling from 10 → 10,000 Templates

The architecture scales without changes because:

1. **Indexing** — Database indexes on status, industry, source, scores ensure fast lookups
2. **Scoring** — Composite scoring (0-100) remains constant regardless of template count
3. **Component Library** — Reusable components prevent duplication
4. **Pagination** — Admin UI and APIs support pagination
5. **Performance** — Selection engine uses indexed queries, not full scans

At 10,000 templates:
- Scoring algorithm still O(n) but with fast DB queries
- Selection happens in <500ms
- Analytics queries use aggregates, not full table scans
- Component extraction prevents storing duplicate code

---

## Key Competitive Advantages

1. **No Hardcoding** — Templates live in database, continuously updated
2. **AI-Driven Selection** — Templates chosen based on business context + performance data
3. **Component Reusability** — Mix-and-match from multiple templates
4. **Performance Learning** — System learns which templates convert best
5. **Revenue Tracking** — Know which templates generate the most revenue
6. **Scalability** — Architecture supports 10-100x growth without redesign
7. **Provider-Agnostic** — Works with Lovable, Base44, v0, Bolt, Webflow, custom builds, etc.
8. **Explainability** — Can explain why template was selected

---

## Next Steps

1. **Run database migration:**
   ```bash
   psql -h your-host -d your-db -f database/template-intelligence-schema.sql
   ```

2. **Deploy admin dashboard:**
   - Visit `/admin/template-intelligence`
   - Set yourself as admin in database

3. **Upload first templates:**
   - Start with 5-10 high-quality templates from Lovable/Base44
   - Let 10-step pipeline analyze them
   - Publish to production

4. **Integrate with website generation:**
   - When user requests website, call `/api/template-intelligence/select`
   - Use returned template + components
   - Fill tokens and deploy

5. **Track usage:**
   - Call `/api/admin/template-intelligence/analytics/record-usage` after deployment
   - System learns from real-world performance

---

## Monitoring

Key metrics to track:
- Templates uploaded per week
- Templates in production
- Average template score
- Most used templates
- Highest converting templates
- Revenue per template
- Component extraction accuracy
- Selection engine precision (recommended template conversion rate)

---

This system transforms GUMA AI from a static template-picker into a **Living Website Intelligence Network** that continuously learns and improves.
