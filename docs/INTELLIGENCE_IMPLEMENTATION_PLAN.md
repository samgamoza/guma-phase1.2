# Intelligence Layer Implementation Plan

## 🎯 Combined Phased Approach (8 Weeks)

**Decision Locked In:**
- Combined phases for faster delivery
- Claude Sonnet (best quality)
- Weekly learning updates
- All marketplaces synced weekly
- Both GA + custom tracking

---

## Sprint Structure

```
Week 1-2: Foundation (Database + Core Services)
Week 3-4: Generation Engine
Week 5-6: Asset & Marketplace Import
Week 7-8: Performance Tracking & Learning Loop
```

---

## Week 1-2: Foundation Phase

### Tasks

#### Task 1.1: Database Migrations
**Effort:** 2 hours
**Owner:** DevOps
**Status:** Ready to execute

```bash
# In Supabase Dashboard SQL Editor
psql -h your-db -U postgres -f DATABASE_INTELLIGENCE_SCHEMA.sql

# Verify all tables created
select count(*) from information_schema.tables 
where table_schema = 'public' 
  and table_name like any(array['%deployment_%', '%component_%', '%template_score%', '%learning_%', '%marketplace_%', '%generation_%']);

# Expected: 24 tables
```

**Validation:**
- [ ] All 24 tables created
- [ ] Indexes created
- [ ] RLS policies enabled
- [ ] Materialized views created
- [ ] No errors in migration log

---

#### Task 1.2: Set Up Service Infrastructure
**Effort:** 4 hours
**Owner:** Backend Lead

Create directory structure:

```bash
mkdir -p services/{orchestration,generation,asset,marketplace,performance,learning}

# Each service gets:
#   - src/
#   - package.json
#   - tsconfig.json
#   - .env.example
#   - docker-compose.yml (for local dev)
#   - tests/
```

**Services to Create:**

1. **Orchestration Service** (Port 5001)
   - Entry point for intelligent selection
   - Calls Asset Service for ranking
   - Returns best template + components

2. **Generation Service** (Port 5002)
   - Content generation (Claude)
   - SEO generation
   - HTML assembly
   - Calls Claude API

3. **Asset Service** (Port 5003)
   - Component ranking
   - Compatibility checking
   - Asset library queries
   - Read-heavy, mostly caching

4. **Marketplace Service** (Port 5004)
   - Scheduled import jobs
   - Calls external APIs (Base44, Lovable, v0, etc.)
   - Queues for analysis

5. **Performance Service** (Port 5005)
   - Tracks website deployments
   - Records user events
   - Calculates metrics

6. **Learning Service** (Port 5006)
   - Weekly job: analyze data
   - Update scores
   - Generate insights
   - Most expensive (runs weekly)

---

#### Task 1.3: Create Shared Infrastructure
**Effort:** 3 hours
**Owner:** Backend Lead

**Files:**

```
/shared/
├── types.ts                # TypeScript interfaces
├── errors.ts              # Error definitions
├── database.ts            # Supabase client
├── redis.ts               # Cache client
├── bull-queue.ts          # Job queue setup
├── logger.ts              # Logging utilities
├── tracer.ts              # Request tracing
└── metrics.ts             # Prometheus metrics
```

**Each service imports these:**

```typescript
import { Database } from '@shared/database'
import { Queue, Worker } from '@shared/bull-queue'
import { Logger } from '@shared/logger'
import { MetricsCollector } from '@shared/metrics'
```

---

#### Task 1.4: Redis Setup (Caching + Job Queue)
**Effort:** 1 hour
**Owner:** DevOps

```bash
# Local: Docker Compose
docker-compose up -d redis

# Production: Redis Cloud or AWS ElastiCache
# Add to .env:
REDIS_URL=redis://localhost:6379
```

**Bull Queues needed:**

```typescript
// In generation service
const contentGenerationQueue = new Queue('content-generation', REDIS_URL)

// In marketplace service
const templateImportQueue = new Queue('template-import', REDIS_URL)

// In performance service
const performanceUpdateQueue = new Queue('performance-update', REDIS_URL)

// In learning service
const scoreUpdateQueue = new Queue('score-update', REDIS_URL)
```

---

#### Task 1.5: Environment Configuration
**Effort:** 1 hour
**Owner:** DevOps

**Create `.env` files in each service:**

```env
# Common
NODE_ENV=production
LOG_LEVEL=info
PORT=5001  # varies per service

# Database
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...

# Cache
REDIS_URL=redis://...

# APIs
ANTHROPIC_API_KEY=sk-ant-...
BASE44_API_KEY=...
LOVABLE_API_KEY=...
V0_API_KEY=...

# Tracking
GOOGLE_ANALYTICS_KEY=...
GOOGLE_ANALYTICS_PROPERTY_ID=...

# Monitoring
SENTRY_DSN=https://...
DATADOG_API_KEY=...

# Admin
ADMIN_SECRET=...
```

---

## Week 3-4: Generation Engine Phase

### Task 2.1: Orchestration Service Core
**Effort:** 8 hours
**Owner:** Senior Backend Engineer
**Depends On:** 1.1-1.5

**File structure:**

```
services/orchestration/src/
├── index.ts                      # Express app setup
├── routes.ts                      # POST /api/select, GET /api/scores/:id
├── orchestrator.ts               # Main selection logic
├── detectors/
│   ├── industry-detector.ts      # Keyword + Claude detection
│   └── business-model-detector.ts
├── scorers/
│   ├── template-scorer.ts        # 5-dimension scoring
│   ├── component-scorer.ts
│   └── design-system-scorer.ts
├── cache.ts                       # Redis caching
└── tests/
    ├── orchestrator.test.ts
    └── scorers.test.ts
```

**Algorithm (Industry Detection):**

```typescript
export async function detectIndustry(description: string): Promise<{
  industry: string
  confidence: number
  alternatives: {industry: string, confidence: number}[]
}> {
  // Step 1: Keyword matching (fast)
  const keywords = {
    dental: ['dentist', 'dental', 'teeth', 'orthodont', 'cavity', 'smile'],
    medical: ['doctor', 'medical', 'clinic', 'hospital', 'patient'],
    // ... more industries
  }

  let scores: {[key: string]: number} = {}
  const descLower = description.toLowerCase()
  
  for (const [industry, keywords] of Object.entries(keywords)) {
    scores[industry] = keywords.filter(kw => descLower.includes(kw)).length
  }

  const topIndustry = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)[0]

  // Step 2: If confidence low, use Claude for verification
  if (topIndustry[1] < 2) {
    const claude = await callClaude({
      prompt: `Classify this business as one of: dental, medical, restaurant, saas, ecommerce, agency, consulting, real-estate, automotive, fitness\n\nBusiness: ${description}\n\nRespond with JSON: {industry: "...", confidence: 0-1}`,
      maxTokens: 100
    })
    return JSON.parse(claude)
  }

  // Step 3: Return with alternatives
  return {
    industry: topIndustry[0],
    confidence: Math.min(topIndustry[1] / 3, 1.0),
    alternatives: Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(1, 3)
      .map(([ind, score]) => ({industry: ind, confidence: score / 3}))
  }
}
```

**Scoring Formula:**

```typescript
interface TemplateScore {
  industryFit: number
  designQuality: number
  performance: number
  conversionPotential: number
  userSatisfaction: number
  overallScore: number
}

export function scoreTemplate(template: Template, context: Context): TemplateScore {
  const industry_fit = (
    (context.industry === template.industry ? 1 : 0.3) * 100
  )

  const design_quality = template.lighthouse_score || 0

  const performance = (
    (template.page_speed_score || 70) + 
    (template.mobile_score || 70)
  ) / 2

  const conversion = (
    (template.has_cta ? 20 : 0) +
    (template.has_form ? 15 : 0) +
    (template.has_pricing ? 10 : 0) +
    ((template.estimated_conversion_rate || 0.03) * 1000)
  )

  const satisfaction = (
    (template.avg_user_rating || 0) * 20 +
    Math.min(template.total_uses || 0, 50)  // popularity
  )

  const overall = (
    industry_fit * 0.25 +
    design_quality * 0.20 +
    performance * 0.20 +
    conversion * 0.20 +
    satisfaction * 0.15
  ) / 100

  return {
    industryFit: Math.round(industry_fit),
    designQuality: Math.round(design_quality),
    performance: Math.round(performance),
    conversionPotential: Math.round(conversion),
    userSatisfaction: Math.round(satisfaction),
    overallScore: Math.round(overall * 100) / 100
  }
}
```

**API Implementation:**

```typescript
// POST /api/select
app.post('/api/select', async (req, res) => {
  const { industry, businessModel, targetAudience, designPreference, businessDescription, tone, complexity } = req.body

  // Check cache first
  const cacheKey = hashContext({industry, businessModel, targetAudience, designPreference})
  const cached = await redis.get(cacheKey)
  if (cached) {
    res.json(JSON.parse(cached))
    return
  }

  // Industry detection if not provided
  const detectedIndustry = industry || (await detectIndustry(businessDescription)).industry

  // Fetch all production templates
  const templates = await db.query(
    'select * from templates where status = $1 order by created_at desc limit 1000',
    ['production']
  )

  // Score each template
  const scores = templates.map(t => scoreTemplate(t, {
    industry: detectedIndustry,
    businessModel,
    targetAudience,
    designPreference
  }))

  // Get top template
  const topTemplate = templates[scores.indexOf(Math.max(...scores.map(s => s.overallScore)))]

  // Select components (call Asset Service)
  const componentRanking = await fetch('http://localhost:5003/api/rank-assets', {
    method: 'POST',
    body: JSON.stringify({
      assetType: 'component',
      context: {industry: detectedIndustry, businessModel, targetAudience}
    })
  }).then(r => r.json())

  // Response
  const response = {
    recommendation: {
      template: {id: topTemplate.id, name: topTemplate.name, score: scores[...].overallScore},
      components: componentRanking.rankings.slice(0, 5),
      confidence: 0.88
    }
  }

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(response))

  res.json(response)
})
```

---

### Task 2.2: Generation Service Core
**Effort:** 12 hours
**Owner:** Senior Backend Engineer
**Depends On:** 1.1-1.5, 2.1

**File structure:**

```
services/generation/src/
├── index.ts                      # Express app setup
├── routes.ts                      # POST /api/generate, /api/generate/section
├── generators/
│   ├── hero-generator.ts         # Claude prompts for each section
│   ├── features-generator.ts
│   ├── pricing-generator.ts
│   ├── testimonials-generator.ts
│   └── cta-generator.ts
├── seo-generator.ts              # SEO metadata + schema.org
├── assembler.ts                  # Assemble components into HTML
├── validator.ts                  # Validate generated content
├── claude-client.ts              # Claude API wrapper
└── tests/
    ├── generators.test.ts
    ├── assembler.test.ts
    └── validator.test.ts
```

**Claude Integration:**

```typescript
// src/claude-client.ts
export async function generateHeroSection(context: {
  businessName: string
  businessDescription: string
  targetAudience: string
  tone: string
  complexity: string
}): Promise<{headline: string, subheading: string, ctaText: string}> {

  const prompt = `You are an expert copywriter. Create compelling website copy.

Business: ${context.businessName}
Description: ${context.businessDescription}
Audience: ${context.targetAudience}
Tone: ${context.tone}
Complexity: ${context.complexity}

Generate JSON (only, no explanation):
{
  "headline": "Main heading (5-10 words, max 60 chars)",
  "subheading": "Supporting text (15-20 words, max 120 chars)",
  "ctaText": "Button text (2-3 words, max 20 chars)"
}

Ensure:
- Headline focuses on visitor benefit, not features
- Subheading adds credibility and urgency
- CTA is action-oriented
- All text appropriate for ${context.tone} tone
`

  const response = await callClaude({
    model: 'claude-sonnet-4-6',
    maxTokens: 300,
    prompt,
    temperature: 0.7  // Some creativity but mostly deterministic
  })

  const parsed = JSON.parse(response)
  
  // Validate
  if (!parsed.headline || parsed.headline.length > 60) {
    throw new Error('Invalid headline')
  }

  return parsed
}
```

**HTML Assembly:**

```typescript
// src/assembler.ts
export function assembleWebsite(params: {
  template: Template
  components: {[key: string]: Component}
  content: {[key: string]: string}
  colorSystem: ColorSystem
  typographySystem: TypographySystem
}): string {

  let html = params.template.html_content
  let css = params.template.css_content

  // Replace content tokens
  html = html.replace('{{hero_headline}}', escapeHtml(params.content.hero_headline))
  html = html.replace('{{hero_subheading}}', escapeHtml(params.content.hero_subheading))
  // ... more replacements

  // Inject design tokens
  css = injectDesignTokens(css, params.colorSystem, params.typographySystem)

  // Minify
  const minified = minifyHTML(html) + minifyCSS(css)

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${minified}</style>
</head>
<body>
${html}
</body>
</html>`
}
```

---

## Week 5-6: Asset & Marketplace Phase

### Task 3.1: Asset Service Core
**Effort:** 8 hours
**Depends On:** 1.1-1.5, 2.1

**Key algorithms:**

```typescript
export function rankComponentByContext(component: Component, context: {
  industry: string
  businessModel: string
  targetAudience: string
}): {overallScore: number, breakdown: ScoreBreakdown} {

  // Fetch component scores from DB
  const scores = db.query(
    'select * from component_scores where component_id = $1 and industry = $2',
    [component.id, context.industry]
  )

  // Calculate popularity (uses in last 7 days)
  const popularity = scores.uses_last_7_days / 100  // normalized

  // Get conversion data
  const conversionData = db.query(
    'select avg(conversion_rate) as avg_conv from deployment_performance where $1 = any(components_used) and deployed_at > now() - interval 7 days',
    [component.id]
  )
  const conversion = conversionData.avg_conv / 0.10  // normalized to 10%

  // Quality metrics
  const quality = component.lighthouse_score / 100

  // Uniqueness (invert popularity to avoid overuse)
  const uniqueness = 1 - (popularity / 10)

  const overall = (
    popularity * 0.20 +
    conversion * 0.25 +
    quality * 0.20 +
    component.avg_rating / 5 * 0.15 +
    uniqueness * 0.20
  )

  return {
    overallScore: Math.round(overall * 100),
    breakdown: {popularity, conversion, quality}
  }
}
```

---

### Task 3.2: Marketplace Import Service Core
**Effort:** 10 hours
**Depends On:** 1.1-1.5

**Marketplace integrations:**

```typescript
// services/marketplace/src/importers/index.ts

export async function importBase44(): Promise<void> {
  const apiKey = process.env.BASE44_API_KEY
  const templates = await fetchPaginated(`https://api.base44.com/templates`, {
    headers: {Authorization: `Bearer ${apiKey}`},
    pageSize: 100
  })

  for (const template of templates) {
    // Check if exists
    const existing = await db.query(
      'select id from marketplace_imports where marketplace = $1 and external_id = $2',
      ['base44', template.id]
    )

    if (existing.length > 0) {
      // Already imported, check if updated
      const lastImport = await db.query(
        'select imported_at from marketplace_imports where external_id = $1',
        [template.id]
      )
      if (new Date(template.updated_at) < lastImport[0].imported_at) {
        continue  // Not updated, skip
      }
    }

    // Queue for analysis
    await templateImportQueue.add({
      marketplace: 'base44',
      externalId: template.id,
      externalUrl: template.url,
      htmlContent: template.html,
      cssContent: template.css
    })
  }
}

// Similar for Lovable, v0, etc.
```

**Weekly scheduler:**

```typescript
// In a separate scheduler service or as a Vercel cron
export async function weeklyMarketplaceSync() {
  console.log('[Marketplace Sync] Starting weekly sync...')

  const syncs = [
    importBase44(),
    importLovable(),
    importV0(),
    importTRAE(),
    importFramer(),
    importWebflow()
  ]

  const results = await Promise.allSettled(syncs)

  results.forEach((result, idx) => {
    if (result.status === 'rejected') {
      console.error(`[Marketplace Sync] ${['Base44', 'Lovable', 'v0'][idx]} failed:`, result.reason)
    }
  })

  console.log('[Marketplace Sync] Completed')
}

// Schedule: Every Monday at 2:00 AM UTC
// Option 1: Vercel cron in vercel.json
// Option 2: GitHub Actions workflow
// Option 3: External service like EasyCron
```

---

## Week 7-8: Performance Tracking & Learning Loop

### Task 4.1: Performance Service Core
**Effort:** 8 hours
**Depends On:** 1.1-1.5, 2.2

```typescript
// services/performance/src/tracking.ts

export async function trackWebsiteDeployment(params: {
  websiteId: string
  templateId: string
  componentsUsed: string[]
  industry: string
  businessModel: string
}): Promise<{trackingId: string, gaTag: string, customPixel: string}> {

  // Create deployment record
  const trackingId = generateUUID()
  
  const deployment = await db.query(
    `insert into deployment_performance (
      website_id, template_id, components_used, industry, business_model,
      tracking_id, deployed_at
    ) values ($1, $2, $3, $4, $5, $6, now())
    returning id`,
    [params.websiteId, params.templateId, params.componentsUsed, params.industry, params.businessModel, trackingId]
  )

  // Generate GA tag
  const gaTag = `
<script async src="https://www.googletagmanager.com/gtag/js?id=${process.env.GA_PROPERTY_ID}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${process.env.GA_PROPERTY_ID}');

// Custom tracking
gtag('event', 'website_deployed', {
  website_id: '${params.websiteId}',
  template_id: '${params.templateId}',
  industry: '${params.industry}',
  tracking_id: '${trackingId}'
});
</script>`

  // Custom pixel for form submissions, clicks
  const customPixel = `
<script>
window.GUMA_TRACKING_ID = '${trackingId}';
document.addEventListener('submit', function(e) {
  if (e.target.tagName === 'FORM') {
    fetch('https://api.guma.ai/api/performance/event', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        trackingId: '${trackingId}',
        eventType: 'form_submit',
        formName: e.target.name || 'unknown'
      })
    });
  }
});
</script>`

  return {
    trackingId,
    gaTag,
    customPixel
  }
}
```

---

### Task 4.2: Learning Service Core
**Effort:** 12 hours
**Depends On:** 1.1-1.5, 3.1, 4.1

**Weekly learning job:**

```typescript
// services/learning/src/weekly-job.ts

export async function weeklyLearningUpdate(): Promise<void> {
  console.log('[Learning] Starting weekly update...')

  // Step 1: Collect deployment data from last 7 days
  const deployments = await db.query(
    `select * from deployment_performance
    where deployed_at > now() - interval 7 days`
  )

  // Step 2: Calculate template metrics
  const templateMetrics = groupBy(deployments, 'template_id')
    .map(([templateId, deployments]) => ({
      templateId,
      uses: deployments.length,
      avgConversion: deployments.map(d => d.conversion_rate).reduce((a,b) => a+b, 0) / deployments.length,
      avgRating: deployments.map(d => d.satisfaction_inferred).reduce((a,b) => a+b, 0) / deployments.length
    }))

  // Step 3: Update template scores
  for (const metric of templateMetrics) {
    const newScore = await calculateTemplateScore(metric.templateId, {
      conversion_rate: metric.avgConversion,
      user_satisfaction: metric.avgRating,
      uses_last_7_days: metric.uses
    })

    await db.query(
      `update template_scores_v2 
      set overall_score = $1, updated_at = now()
      where template_id = $2`,
      [newScore, metric.templateId]
    )
  }

  // Step 4: Calculate component metrics
  const componentMetrics = groupBy(deployments, 'components_used')
    .map(([componentIds, deployments]) => ({
      componentIds: componentIds || [],
      avgConversion: deployments.map(d => d.conversion_rate).reduce((a,b) => a+b, 0) / deployments.length
    }))

  // Step 5: Identify insights
  const insights = await generateInsights({
    templateMetrics,
    componentMetrics,
    deployments
  })

  // Step 6: Auto-apply high-confidence insights
  for (const insight of insights.filter(i => i.confidence > 0.85)) {
    await db.query(
      `insert into learning_insights (insight_type, description, recommendation, confidence_score, auto_applied, applied_at)
      values ($1, $2, $3, $4, true, now())`,
      [insight.type, insight.description, insight.recommendation, insight.confidence]
    )

    console.log(`[Learning] Applied insight: ${insight.description}`)
  }

  // Step 7: Refresh materialized views
  await db.query('refresh materialized view template_rankings')
  await db.query('refresh materialized view component_rankings')

  console.log('[Learning] Weekly update complete')
}

async function generateInsights(data: any): Promise<Insight[]> {
  const insights: Insight[] = []

  // Insight 1: Top performing templates
  const topTemplates = data.templateMetrics
    .sort((a, b) => b.avgConversion - a.avgConversion)
    .slice(0, 3)

  insights.push({
    type: 'template_ranking',
    description: `Top 3 templates: ${topTemplates.map(t => t.templateId).join(', ')} converting ${topTemplates[0].avgConversion * 100}%`,
    recommendation: `Increase weight of top-performing templates in selection`,
    confidence: 0.92
  })

  // Insight 2: Component combinations
  const bestCombos = await findBestComponentCombinations(data.deployments)
  insights.push({
    type: 'component_combo',
    description: `Best component combo: hero-${bestCombos[0].hero} + features-${bestCombos[0].features}`,
    recommendation: `Prioritize this combination in recommendations`,
    confidence: 0.85
  })

  return insights
}
```

---

## Dependency Graph

```
Week 1-2:
  └─ Database + Shared Infrastructure
     ├─ Redis Setup
     └─ Env Configuration

Week 3-4:
  ├─ Orchestration Service (depends on foundation)
  │  └─ Generation Service (depends on orchestration + foundation)
  │
Week 5-6:
  ├─ Asset Service (depends on foundation)
  │
  └─ Marketplace Service (depends on foundation)

Week 7-8:
  ├─ Performance Service (depends on generation)
  │
  └─ Learning Service (depends on performance + asset)
```

---

## Testing Matrix

### Unit Tests (Per Service)

```
Orchestration:
  ✓ Industry detection (keyword matching)
  ✓ Industry detection (Claude fallback)
  ✓ Template scoring algorithm
  ✓ Component ranking
  ✓ Caching logic

Generation:
  ✓ Hero section generation
  ✓ Features generation
  ✓ SEO generation
  ✓ HTML assembly
  ✓ Content validation

Asset:
  ✓ Component ranking by context
  ✓ Compatibility checking
  ✓ Popularity calculation

Marketplace:
  ✓ Base44 pagination
  ✓ Lovable auth
  ✓ Import deduplication
  ✓ Error handling

Performance:
  ✓ Deployment tracking
  ✓ Event recording
  ✓ Metric aggregation

Learning:
  ✓ Insight generation
  ✓ Score calculation
  ✓ Materialized view refresh
```

### Integration Tests

```
Orchestration + Generation:
  ✓ End-to-end: select template → generate content → assemble HTML

Orchestration + Asset:
  ✓ Template + component ranking consistency

Generation + Performance:
  ✓ Deployment tracking after generation

Performance + Learning:
  ✓ Weekly learning update with real deployment data

All Services:
  ✓ Complete flow: prompt → select → generate → deploy → track → learn
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All databases migrated
- [ ] All services pass unit tests
- [ ] All integration tests pass
- [ ] Load tests: each service handles 100 req/sec
- [ ] Security: no hardcoded credentials
- [ ] Monitoring: Datadog/Sentry configured
- [ ] Logging: CloudWatch/ELK configured
- [ ] Alerting: PagerDuty setup

### Deployment Steps
1. Deploy shared libraries to npm (or local monorepo)
2. Deploy services in order: orchestration → generation → asset → marketplace → performance → learning
3. Run smoke tests after each deployment
4. Monitor error rates for 24h
5. Gradually increase traffic (canary 5% → 10% → 50% → 100%)

### Post-Deployment
- [ ] Monitor Claude API costs
- [ ] Monitor database query performance
- [ ] Monitor service latencies
- [ ] Verify learning job runs weekly
- [ ] Verify marketplace sync runs weekly

---

## Success Criteria

**By end of Week 8:**

✅ Website Intelligence Orchestrator: <500ms response, >85% recommendation confidence
✅ Prompt-to-Site Engine: <30sec generation, <0.05 cost per site
✅ Asset Intelligence: Daily rankings updated, component compatibility matrix <1% error
✅ Marketplace Import: 500+ templates imported, zero failed imports
✅ Performance Tracking: 100% deployment tracking, real-time event recording
✅ Learning Engine: Weekly updates running, 5+ automated insights per week

---

## Risk Mitigation

**Risk: Claude API cost explosion**
- Mitigation: Token budget per generation (max 5000 tokens)
- Mitigation: Cache common prompts
- Mitigation: Monitor spending daily, alert at $1k/day

**Risk: Database query performance**
- Mitigation: Proper indexes on all scoring tables
- Mitigation: Materialized views for heavy aggregations
- Mitigation: Read replicas for analytics queries

**Risk: Marketplace API rate limiting**
- Mitigation: Staggered sync schedule
- Mitigation: Respect rate limit headers
- Mitigation: Queue retries with exponential backoff

**Risk: Learning loop negative feedback**
- Mitigation: Track ALL websites (success and failure)
- Mitigation: Manual curation override for new patterns
- Mitigation: Novelty bonus to prevent over-optimization

---

## Success Metrics Dashboard

Track in Datadog:

```
Generation:
  - avg_generation_time_ms
  - generation_success_rate
  - claude_tokens_per_site
  - generation_cost_per_site

Selection:
  - orchestrator_response_time_ms
  - recommendation_confidence_score
  - top_recommendation_selected_rate

Performance:
  - avg_conversion_rate_by_template
  - avg_bounce_rate_by_industry
  - deployment_tracking_coverage

Learning:
  - insights_generated_per_week
  - auto_applied_insights_success_rate
  - model_accuracy_score
```

---

Done. Ready to code?
