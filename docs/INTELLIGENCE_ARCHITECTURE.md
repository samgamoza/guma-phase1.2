# GUMA AI Intelligence Layer Architecture

## Strategic Overview

The intelligence layer transforms GUMA AI from a **template picker** into a **website generation platform** with defensible moat through:

1. **Autonomous Generation** — Single prompt → complete website
2. **Intelligent Selection** — ML-driven template/component/theme selection
3. **Performance Learning** — System continuously improves from deployment data
4. **Multi-source Ingestion** — Import templates from all major platforms
5. **Orchestrated Composition** — Automatic component mixing for uniqueness

---

## System Architecture (High Level)

```
┌──────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION LAYER                         │
│  (Phase 1 free / Phase 2 premium - existing)                     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│              PROMPT-TO-SITE ENGINE (Entry Point)                  │
│  • Parse user intent                                              │
│  • Route to appropriate flow                                      │
│  • Coordinate orchestration                                       │
└──────────────────────────────────────────────────────────────────┘
                              ↓
    ┌─────────────────────────┬──────────────────────────┐
    ↓                         ↓                          ↓
┌──────────────────┐  ┌───────────────────┐  ┌──────────────────┐
│ INTELLIGENCE     │  │ ASSET INTELLIGENCE│  │ MARKETPLACE      │
│ ORCHESTRATOR    │  │ LAYER             │  │ IMPORT ENGINE    │
│                 │  │                   │  │                  │
│ • Industry      │  │ • Asset Library   │  │ • Base44         │
│   Detection     │  │ • Ranking System  │  │ • Lovable        │
│ • Template      │  │ • Metadata        │  │ • v0             │
│   Scoring       │  │ • Uniqueness      │  │ • TRAE           │
│ • Component     │  │                   │  │ • Framer         │
│   Scoring       │  │                   │  │ • Webflow        │
│ • Theme         │  │                   │  │ • Generic ZIP    │
│   Recommendation│  │                   │  │                  │
└──────────────────┘  └───────────────────┘  └──────────────────┘
    ↓                         ↓                          ↓
    └─────────────────────────┬──────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│          GENERATION & COMPOSITION ENGINE                          │
│  • Template assembly                                              │
│  • Component selection                                            │
│  • Content generation (Claude)                                    │
│  • SEO generation                                                 │
│  • HTML/CSS output                                                │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│          DEPLOYMENT & INTELLIGENCE FEEDBACK LOOP                  │
│  • Track conversions                                              │
│  • Track user edits                                               │
│  • Rank templates/components                                      │
│  • Update recommendations                                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 1. Website Intelligence Orchestrator

### Purpose
Given user context (industry, business model, audience, preference), select optimal:
- Template
- Component combination
- Color system
- Typography system
- Content strategy

### Service Contract

```
INPUT:
  {
    industry: "dental"                      // from context
    businessModel: "service"
    targetAudience: "families"
    designPreference: "modern"
    description: "Family dental practice"
    businessName: "Bright Smiles Dental"
    tone: "friendly"
    complexity: "simple|standard|advanced"
  }

OUTPUT:
  {
    recommendedTemplate: {
      id: "template-xyz",
      name: "Dental Pro",
      score: 0.92,
      reasons: ["High dental conversions", "Mobile-optimized", ...]
    },
    components: {
      hero: { id: "...", score: 0.88 },
      features: { id: "...", score: 0.85 },
      pricing: { id: "...", score: 0.80 },
      testimonials: { id: "...", score: 0.87 },
      cta: { id: "...", score: 0.89 }
    },
    colorSystem: {
      id: "medical-clean",
      score: 0.90
    },
    typographySystem: {
      id: "corporate",
      score: 0.85
    },
    theme: {
      tone: "friendly",
      complexity: "simple"
    },
    confidence: 0.88,
    alternatives: [
      { template: "...", score: 0.85 },
      { template: "...", score: 0.82 }
    ]
  }
```

### Sub-Components

#### 1.1 Industry Detection Engine
```
Input: description (text)
Process: 
  - Keyword matching (dental, doctor, clinic, teeth, etc.)
  - NLP classification (Claude)
  - Confidence scoring
Output: 
  {
    industry: "dental",
    confidence: 0.95,
    alternatives: [
      { industry: "medical", confidence: 0.30 }
    ]
  }
```

#### 1.2 Template Scoring Engine
```
Scoring Dimensions (each 0-100):
  - Industry fit (25%)
  - Design quality (20%)
  - Performance (lighthouse) (20%)
  - Conversion potential (20%)
  - User satisfaction (rating) (15%)

Formula:
  score = (
    industry_fit * 0.25 +
    design_quality * 0.20 +
    performance * 0.20 +
    conversion * 0.20 +
    satisfaction * 0.15
  ) / 100

Additional factors:
  - Recent uses (popularity trend)
  - Conversion rate history
  - User edit patterns
  - Deployment success rate
```

#### 1.3 Component Scoring Engine
```
Scoring Dimensions:
  - Template compatibility (30%)
  - Design quality (25%)
  - Performance (20%)
  - Conversion metrics (15%)
  - User satisfaction (10%)

Uniqueness Bonus:
  - If component rarely used together → +5 points
  - Prevents duplicate website generation
```

#### 1.4 Theme Recommendation Engine
```
Input:
  - Industry
  - Business description
  - Target audience
  - Design preference

Output:
  {
    tone: "friendly|professional|playful|authoritative|technical",
    complexity: "simple|standard|advanced",
    confidence: 0.85
  }

Used by Prompt-to-Site for:
  - Content generation tone
  - Section prominence
  - Feature detail level
```

### Database Schema Updates

```sql
-- Add scoring tables
create table template_scores_v2 (
  id uuid primary key,
  template_id uuid references templates(id),
  
  -- Scoring dimensions
  industry_fit_score int,
  design_quality_score int,
  performance_score int,
  conversion_score int,
  satisfaction_score int,
  
  -- Composite
  overall_score float,
  
  -- Metadata
  calculated_at timestamp,
  data_points jsonb,  -- what was used to calculate
  updated_at timestamp
);

-- Component compatibility matrix
create table component_compatibility (
  id uuid primary key,
  component_1_id uuid references components(id),
  component_2_id uuid references components(id),
  
  compatibility_score float,  -- 0-1, how well they work together
  design_coherence float,
  performance_impact float,
  
  tested boolean,
  test_count int,
  
  created_at timestamp
);

-- Industry templates mapping
create table industry_template_stats (
  id uuid primary key,
  template_id uuid references templates(id),
  industry text,
  
  total_uses int,
  total_conversions int,
  conversion_rate float,
  avg_rating float,
  
  success_score float,
  
  updated_at timestamp
);
```

### API Contract

```
POST /api/intelligence/orchestrator/select
{
  industry: "dental",
  businessModel: "service",
  targetAudience: "families",
  designPreference: "modern",
  description: "Family dental practice in San Diego",
  businessName: "Bright Smiles Dental",
  tone: "friendly",
  complexity: "simple"
}

Response:
{
  status: "success",
  recommendation: {
    template: {...},
    components: {...},
    colorSystem: {...},
    typographySystem: {...},
    theme: {...},
    confidence: 0.88,
    alternatives: [...]
  },
  reasoning: {
    templateChoice: "Dental Pro selected because...",
    componentChoices: {...},
    themeChoice: "Friendly tone recommended for..."
  }
}
```

---

## 2. Prompt-to-Site Engine

### Purpose
Single prompt → fully generated website (templates, components, content, SEO)

### Workflow

```
User Input: "Create a website for a small dental practice in San Diego called Bright Smiles. We want something modern and friendly that will attract families."

Step 1: Parse & Enrich
  ├─ Industry Detection → "dental" (0.95)
  ├─ Business Model Detection → "service" (0.92)
  ├─ Audience Detection → "families" (0.88)
  ├─ Location → "San Diego"
  └─ Tone → "friendly" (0.85)

Step 2: Select Architecture
  ├─ Intelligence Orchestrator
  │  └─ Returns: template, components, colors, typography, theme
  └─ Score: 0.88 confidence

Step 3: Generate Content
  ├─ Claude API (hero headline)
  ├─ Claude API (features)
  ├─ Claude API (services/pricing)
  ├─ Claude API (testimonials placeholder)
  └─ Claude API (CTA copy)

Step 4: Generate SEO
  ├─ Meta tags
  ├─ Schema.org markup
  ├─ H1/H2 hierarchy
  └─ Keyword optimization

Step 5: Assemble Website
  ├─ Template HTML
  ├─ Replace content tokens
  ├─ Apply color system
  ├─ Apply typography
  └─ Minify & optimize

Step 6: Deploy
  ├─ Store in websites table
  ├─ Generate preview URL
  ├─ Set up tracking
  └─ Return to user

Result: Complete, deployment-ready website in <30 seconds
```

### Service Contract

```
POST /api/generation/prompt-to-site
{
  prompt: "Create a website for a small dental practice...",
  businessName: "Bright Smiles Dental",
  businessPhone: "+1-555-0123",
  businessEmail: "hello@brightsmiles.com",
  businessAddress: "123 Main St, San Diego, CA",
  
  // Optional overrides
  templateId: null,  // let AI choose
  industry: null,    // let AI detect
  
  // Options
  includeContact: true,
  includePricing: true,
  includeCTA: true,
  tone: "friendly",  // or null to auto-detect
  complexity: "simple"  // or "standard", "advanced"
}

Response:
{
  status: "success",
  website: {
    id: "site-abc123",
    slug: "bright-smiles-dental",
    htmlContent: "<!DOCTYPE html>...",
    cssContent: "body { ... }",
    previewUrl: "http://guma.ai/sites/bright-smiles-dental",
    
    // Metadata
    template: { id: "...", name: "Dental Pro" },
    components: { hero: {...}, features: {...}, ... },
    colorSystem: { id: "medical-clean" },
    typographySystem: { id: "corporate" },
    
    // Content
    content: {
      headline: "Professional Dental Care for Your Family",
      subheading: "Gentle, modern dentistry for all ages",
      features: [...],
      cta: "Schedule Your Appointment"
    },
    
    // SEO
    seo: {
      title: "Bright Smiles Dental - Family Dentist in San Diego",
      description: "Professional dental care...",
      ogImage: "...",
      schema: {...}
    },
    
    // Scores
    scores: {
      templateConfidence: 0.88,
      contentQuality: 0.85,
      seoOptimization: 0.82,
      overallScore: 0.85
    }
  },
  reasoning: {
    templateChoice: "Dental Pro selected because...",
    contentGeneration: "Tone: friendly, focused on family comfort",
    seoApproach: "Local keywords: San Diego dentist, family dental care"
  },
  generationTime: 18.5,  // seconds
  costEstimate: {
    claudeTokens: 4250,
    estimatedCost: 0.04
  }
}
```

### Content Generation Strategy

```
Per Section:

HERO:
  Input: industry, business_name, audience, tone
  Prompt: Generate attention-grabbing headline for {industry} targeting {audience}
  Output: headline + subheading
  
FEATURES:
  Input: industry_common_features, business_model
  Prompt: Generate 5 key service features for {industry}
  Output: features with descriptions
  
PRICING:
  Input: industry, business_model, competitor_context
  Prompt: Suggest 2-3 pricing tiers for {industry} service business
  Output: tier names, prices (suggestions), descriptions
  
TESTIMONIALS:
  Input: industry, business_type
  Output: Placeholder testimonials (user will replace)
  
CTA:
  Input: industry, conversion_goal
  Prompt: Generate compelling call-to-action for {industry}
  Output: button text + section header
```

### API Contract Detail

```
POST /api/generation/content-generator
{
  section: "hero" | "features" | "pricing" | "testimonials" | "cta",
  industry: "dental",
  businessContext: {
    name: "Bright Smiles Dental",
    description: "Family dental practice",
    audience: "families",
    tone: "friendly"
  },
  tone: "friendly" | "professional" | "playful" | "authoritative" | "technical",
  complexity: "simple" | "standard" | "advanced"
}

Response:
{
  section: "hero",
  content: {
    headline: "Professional Dental Care for Your Family",
    subheading: "Gentle, modern dentistry for all ages",
    ctaText: "Schedule Your Appointment"
  },
  alternatives: [
    {
      headline: "Smile with Confidence",
      subheading: "State-of-the-art dental care in San Diego",
      ctaText: "Book Now"
    }
  ],
  qualityScore: 0.85,
  relevance: 0.92
}
```

---

## 3. Asset Intelligence Layer

### Purpose
Understand, rank, and recommend components & templates based on:
- Composition
- Design metrics
- Performance metrics
- Conversion potential
- Uniqueness

### Components

#### 3.1 Asset Library
```sql
-- Expanded component table
create table assets (
  id uuid primary key,
  asset_type varchar(50),  -- 'component', 'template', 'section', 'element'
  name text,
  slug text unique,
  
  -- Content
  html_content text,
  css_content text,
  js_content text,
  
  -- Metadata
  category text,  -- 'hero', 'features', 'pricing', etc.
  framework text,
  tags text[],
  
  -- Extraction
  extracted_from_template_id uuid,
  extracted_from_source varchar(50),  -- 'base44', 'lovable', etc.
  
  -- Technical
  components_used text[],
  design_tokens jsonb,
  breakpoints_tested text[],
  
  created_at timestamp,
  extracted_at timestamp
);

-- Asset relationships (which assets work together)
create table asset_combinations (
  id uuid primary key,
  asset_1_id uuid references assets(id),
  asset_2_id uuid references assets(id),
  asset_3_id uuid references assets(id),
  
  compatibility_score float,
  design_coherence float,
  performance_impact float,
  
  tested boolean,
  test_count int,
  successful_websites_count int
);
```

#### 3.2 Asset Metadata
```
Per Asset:
  - Design metrics (colors used, typography, spacing)
  - Performance metrics (size, render time)
  - Conversion indicators (CTA presence, form types)
  - Accessibility metrics (WCAG level, contrast scores)
  - Responsiveness (breakpoints tested)
  - Browser compatibility
  - Mobile-first score
  - Estimated conversion impact
  - Industry suitability
  - User satisfaction rating
  - Usage frequency
  - Trending status
```

#### 3.3 Asset Ranking System
```
Ranking Formula:

composite_score = (
  (usage_count / max_usage) * 0.20 +           // popularity
  (conversion_rate / max_conversion) * 0.25 +  // performance
  (quality_score / 100) * 0.20 +               // design/code
  (user_rating / 5) * 0.15 +                   // satisfaction
  (trending_factor) * 0.10 +                   // momentum
  (uniqueness_bonus) * 0.10                    // differentiation
) * 100

Where:
  - uniqueness_bonus = how rarely used in recent sites (prevents boring)
  - trending_factor = recent usage growth
  - quality_score = lighthouse + accessibility + performance combined

Result: 0-100 asset score
```

### API Contract

```
POST /api/intelligence/asset-rank
{
  assets: ["asset-1", "asset-2", "asset-3"],
  context: {
    industry: "dental",
    targetAudience: "families",
    designPreference: "modern"
  }
}

Response:
{
  rankings: [
    {
      assetId: "asset-1",
      name: "Hero with CTA",
      score: 0.92,
      breakdown: {
        popularity: 0.85,
        conversion: 0.95,
        quality: 0.88,
        satisfaction: 4.2,
        trending: 0.80,
        uniqueness: 0.75
      },
      reasoning: "High conversion for dental, families like this layout"
    }
  ],
  alternatives: [...]
}

POST /api/intelligence/asset-combine
{
  assets: [
    { type: "hero", assetId: "asset-1" },
    { type: "features", assetId: "asset-2" },
    { type: "pricing", assetId: "asset-3" }
  ],
  context: { industry: "dental" }
}

Response:
{
  combination: {
    compatibility: 0.91,
    designCoherence: 0.88,
    performanceImpact: 0.85,
    estimatedConversionLift: 0.12,  // 12% better than average
    warnings: []
  }
}
```

---

## 4. Marketplace Import Engine

### Purpose
Ingest templates from multiple sources continuously

### Supported Platforms

| Platform | Status | Auth Method | Rate Limit | Full Ingestion |
|----------|--------|-------------|-----------|---|
| Base44 | Active | API Key | 100/hr | ✅ Paginated |
| Lovable | Active | OAuth | 50/hr | ✅ Paginated |
| v0 (Vercel) | Active | API Key | 30/hr | ✅ Via GitHub |
| TRAE | Design | OAuth | TBD | 🔄 Planning |
| Framer | Design | API Key | 20/hr | ✅ Planned |
| Webflow | Design | OAuth | 10/hr | ✅ Planned |
| Generic ZIP | Manual | Upload | N/A | ✅ Done |

### Import Workflow

```
For each marketplace:

Step 1: Authenticate
  ├─ Retrieve API key / OAuth token from .env
  └─ Test connection

Step 2: Fetch Template List
  ├─ Paginate through all templates
  ├─ Filter by: category, language, popularity
  └─ Store metadata (id, name, url, updated_at)

Step 3: For Each Template
  ├─ Check if already imported (by external_id)
  ├─ If not:
  │  ├─ Download HTML/CSS/JS
  │  ├─ Download preview images
  │  ├─ Queue for analysis (10-step pipeline)
  │  └─ Store raw content
  └─ If exists & updated:
     ├─ Check if newer
     └─ Re-analyze if changed

Step 4: Analysis (Async)
  ├─ 10-step ingestion pipeline (existing)
  ├─ Extract components
  ├─ Calculate metrics
  ├─ Classify industry
  └─ Generate recommendations

Step 5: Storage
  ├─ Store in templates table
  ├─ Link components
  ├─ Index for search
  └─ Mark as production-ready
```

### Database Schema

```sql
create table marketplace_imports (
  id uuid primary key,
  marketplace varchar(50),  -- 'base44', 'lovable', 'v0', etc.
  external_id text,
  external_url text,
  
  -- Import tracking
  imported_at timestamp,
  last_checked_at timestamp,
  
  -- Status
  status varchar(50),  -- 'pending', 'downloading', 'analyzing', 'complete', 'failed'
  error_message text,
  
  -- Metrics
  file_size_bytes int,
  download_time_ms int,
  analysis_time_ms int,
  
  -- Resulting template
  template_id uuid references templates(id),
  
  created_at timestamp
);

create table marketplace_api_usage (
  id uuid primary key,
  marketplace varchar(50),
  
  -- Rate limiting
  requests_made_this_hour int,
  requests_limit int,
  reset_at timestamp,
  
  -- Historical
  total_requests_month int,
  total_templates_imported int,
  
  updated_at timestamp
);
```

### Service: Marketplace Importer

```
Service: /services/marketplace-importer.ts

Functions:

1. importFromBase44()
   - Fetch all templates from Base44 API
   - For each: download → analyze → store

2. importFromLovable()
   - Fetch all projects from Lovable
   - For each: download → analyze → store

3. importFromV0()
   - Query v0 templates from public registry
   - For each: fetch → analyze → store

4. importFromTRAE()
   - Connect to TRAE API (upcoming)
   - For each: fetch → analyze → store

5. importFromFramer()
   - Query Framer templates
   - For each: fetch → analyze → store

6. importFromWebflow()
   - Query Webflow templates
   - For each: fetch → analyze → store

7. importGenericZIP()
   - Accept ZIP upload
   - Extract → analyze → store

Scheduler:
  - Run daily: importFromBase44(), importFromLovable(), importFromV0()
  - Run weekly: importFromFramer(), importFromWebflow()
  - On-demand: importGenericZIP()
```

### API Contract

```
POST /api/import/marketplace
{
  marketplace: "base44" | "lovable" | "v0" | "trae" | "framer" | "webflow",
  action: "start-sync" | "fetch-one" | "status"
}

Response (start-sync):
{
  status: "started",
  jobId: "job-xyz",
  marketplace: "base44",
  estimatedDuration: 300,  // seconds
  estimatedTemplates: 45
}

GET /api/import/marketplace/status?jobId=job-xyz

Response:
{
  jobId: "job-xyz",
  status: "in-progress",
  progress: {
    templatesProcessed: 12,
    totalTemplates: 45,
    percentComplete: 26.7
  },
  metrics: {
    successful: 12,
    failed: 0,
    duration: 45  // seconds elapsed
  },
  nextUpdate: 5  // seconds
}
```

---

## 5. Template Performance Intelligence

### Purpose
Track which templates & components perform best, drive recommendations

### Tracking Pipeline

```
When website deployed:

Step 1: Record Deployment
  ├─ website_id
  ├─ template_id
  ├─ components used
  ├─ colors/typography
  └─ deployment_time

Step 2: Track User Behavior
  ├─ Page views (Google Analytics)
  ├─ Time on page
  ├─ Bounce rate
  ├─ Form submissions
  ├─ Link clicks
  └─ Conversion events

Step 3: Track User Edits
  ├─ What was changed
  ├─ Content vs. design edits
  ├─ How many changes (satisfaction proxy)
  └─ Before/after metrics

Step 4: Calculate Performance
  ├─ Conversion rate
  ├─ Revenue (if known)
  ├─ Engagement metrics
  ├─ Bounce rate
  └─ User satisfaction estimate

Step 5: Update Rankings
  ├─ Template score ↑/↓
  ├─ Component score ↑/↓
  ├─ Color system score ↑/↓
  ├─ Typography score ↑/↓
  └─ Industry-specific scores

Step 6: Feedback Loop
  └─ Next users get better recommendations
```

### Database Schema

```sql
-- Deployment performance tracking
create table deployment_performance (
  id uuid primary key,
  website_id uuid references websites(id),
  template_id uuid references templates(id),
  components_used uuid[],
  color_system_used text,
  typography_used text,
  
  -- User events
  total_views bigint default 0,
  total_unique_visitors int default 0,
  avg_session_duration int,  -- seconds
  bounce_rate float,
  conversions int default 0,
  conversion_rate float,
  
  -- Revenue tracking
  revenue_attributed numeric(10, 2),
  roi_estimated float,
  
  -- User satisfaction
  user_edits_count int,
  content_edits int,
  design_edits int,
  satisfaction_score float,  -- inferred from edits (fewer = happier)
  
  -- Metadata
  deployed_at timestamp,
  tracked_until timestamp,
  industry text,
  business_model text,
  
  updated_at timestamp
);

-- Component performance
create table component_performance (
  id uuid primary key,
  component_id uuid references components(id),
  
  -- Aggregated metrics
  total_deployments bigint,
  avg_conversion_rate float,
  avg_user_rating float,
  avg_edits int,
  
  -- By industry
  performance_by_industry jsonb,  -- {dental: {deployments: 10, conversion: 0.05}, ...}
  
  -- Trending
  uses_last_30_days int,
  conversion_rate_trend float,  -- trending up/down
  
  updated_at timestamp
);

-- Template performance history
create table template_performance_history (
  id uuid primary key,
  template_id uuid references templates(id),
  
  metric_date date,
  deployments_count int,
  avg_conversion_rate float,
  avg_user_rating float,
  total_revenue_attributed numeric(10, 2),
  
  created_at timestamp
);
```

### Ranking Update Algorithm

```
Every 24 hours:

For each template:
  1. Fetch all deployments in last 30 days
  2. Calculate aggregates:
     - conversion_rate = total_conversions / total_views
     - user_satisfaction = 5 - avg_edits (fewer edits = happier)
     - roi = total_revenue / total_template_uses
  3. Update template_scores:
     - conversion_score = conversion_rate * 100
     - satisfaction_score = user_satisfaction * 20
     - performance_score = (roi * deployment_count) / max_roi
  4. Calculate industry-specific scores
  5. Update template.avg_user_rating
  6. Mark as trending if: uses_last_7_days > 2 * uses_7_days_ago

For each component:
  1. Fetch all websites using this component
  2. Get their performance metrics
  3. Calculate average conversion_rate
  4. Update component_performance
  5. Track trending (up/down)
```

### API Contract

```
GET /api/intelligence/performance/template/:templateId

Response:
{
  template: {
    id: "template-xyz",
    name: "Dental Pro",
    performanceMetrics: {
      totalDeployments: 145,
      avgConversionRate: 0.052,  // 5.2%
      avgUserRating: 4.3,
      totalRevenueAttributed: 12500,
      
      byIndustry: {
        dental: {
          deployments: 120,
          conversionRate: 0.062,
          userRating: 4.4,
          revenueAttributed: 11500
        },
        medical: {
          deployments: 25,
          conversionRate: 0.038,
          userRating: 4.1,
          revenueAttributed: 1000
        }
      },
      
      trending: {
        direction: "up",
        percentChange: 12.5,
        usesLastWeek: 18,
        usesWeekBefore: 16
      }
    },
    competitors: [
      {
        templateId: "template-abc",
        name: "Medical Clean",
        conversionRate: 0.045,
        difference: "-13.6%"
      }
    ]
  }
}

POST /api/intelligence/performance/feedback
{
  websiteId: "site-123",
  event: "conversion",
  context: {
    industry: "dental",
    template: "dental-pro",
    components: ["hero-1", "features-2", "cta-5"],
    colorSystem: "medical-clean",
    timeSinceDeployment: 7,  // days
    userEdits: 3
  }
}
```

---

## 6. Learning Engine

### Purpose
Continuous improvement: learn from generation, deployment, and user edits

### Analytics Collected

```
GENERATION ANALYTICS:
  - Which prompts lead to conversions
  - Which industries, business models convert best
  - Prompt patterns that trigger high-scoring templates
  - Content generation quality per section
  - Time-to-generation metrics

DEPLOYMENT ANALYTICS:
  - Template × Industry × Audience combinations
  - Component combinations that perform well
  - Color system effectiveness by industry
  - Typography impact on engagement
  - Mobile vs. desktop performance

USER EDIT ANALYTICS:
  - Which sections are edited most
  - Content edits vs. design edits
  - What content was replaced (quality indicator)
  - Edit patterns per industry
  - Time to first edit (satisfaction proxy)

ENGAGEMENT ANALYTICS:
  - Form submission patterns
  - CTA effectiveness
  - Section visibility (scroll depth)
  - Page load impact on conversions
  - Device-specific behavior
```

### Learning Loop

```
Daily Process:

1. Extract Data
   ├─ 24h of deployment metrics
   ├─ User edits
   ├─ Analytics events
   └─ Conversion events

2. Aggregate
   ├─ By template → performance trends
   ├─ By component → effectiveness patterns
   ├─ By industry → what works best
   ├─ By prompt pattern → success rate
   └─ By user demographic → preferences

3. Identify Patterns
   ├─ High-converting template + component combos
   ├─ Industry-specific preferences
   ├─ Tone + complexity impact
   ├─ Content sections that drive conversion
   └─ Design system effectiveness

4. Update Models
   ├─ Adjust template scores
   ├─ Adjust component scores
   ├─ Adjust industry mappings
   ├─ Adjust theme recommendations
   └─ Adjust content generation prompts

5. A/B Test Hypotheses (Optional)
   ├─ For next 100 generations:
   │  ├─ Test: ranking formula change A vs B
   │  └─ Track: conversion difference
   └─ If B > A: adopt B, deprecate A

6. Report
   └─ Log: what changed, why, expected impact
```

### Feedback Loop Integration

```
For Prompt-to-Site:
  ├─ High conversion rate for "dental + friendly tone"
  │  └─ → Increase weight in theme recommendation
  ├─ Component X converts 15% better than Component Y
  │  └─ → Prioritize Component X in selections
  ├─ Prompt pattern "family + modern" → Dental Pro template
  │  └─ → Strengthen this association
  └─ Content section "Services" edited 40% of time
     └─ → Pre-generate better Services content

For Intelligence Orchestrator:
  ├─ Template score recalculated daily
  ├─ Component compatibility updated
  ├─ Industry-specific recommendations improved
  └─ Theme recommendations refined
```

### Database Schema

```sql
create table learning_metrics (
  id uuid primary key,
  metric_date date,
  
  -- Generation stats
  total_websites_generated int,
  avg_generation_time_ms int,
  generation_success_rate float,
  
  -- Quality stats
  avg_content_quality_score float,
  avg_seo_score float,
  avg_conversion_score float,
  
  -- Deployment stats
  deployment_success_rate float,
  avg_deployment_bounce_rate float,
  avg_deployment_conversion_rate float,
  
  -- User edit stats
  websites_with_edits int,
  avg_edits_per_website int,
  content_edit_ratio float,  -- vs. design edits
  
  -- Most popular
  top_template_id uuid,
  top_template_uses int,
  top_component_id uuid,
  top_component_uses int,
  
  created_at timestamp
);

create table learning_insights (
  id uuid primary key,
  insight_type varchar(50),  -- 'template_ranking', 'component_combo', 'industry_mapping', etc.
  
  -- Insight
  description text,
  recommendation text,
  
  -- Evidence
  data_points int,  -- how many samples this is based on
  confidence_score float,
  
  -- Action
  auto_applied boolean,
  applied_at timestamp,
  
  -- Impact
  expected_conversion_lift float,  -- estimated improvement
  actual_lift float,  -- measured after 1 week
  
  created_at timestamp
);

create table model_versions (
  id uuid primary key,
  model_type varchar(50),  -- 'template_scorer', 'component_ranker', 'theme_recommender', etc.
  version int,
  
  -- Model definition
  formula text,  -- JSON representation of scoring logic
  weights jsonb,  -- all weights used
  
  -- Performance
  accuracy float,
  precision float,
  recall float,
  
  -- Deployment
  deployed_at timestamp,
  active boolean,
  
  created_at timestamp
);
```

### API Contract

```
GET /api/learning/insights

Response:
{
  insights: [
    {
      id: "insight-1",
      type: "template_ranking",
      description: "Dental Pro template converting 15% better than Medical Clean",
      recommendation: "Increase Dental Pro weight by 10%",
      dataPoints: 120,
      confidence: 0.92,
      expectedLift: 0.08,  // 8% better conversions expected
      autoApplied: true,
      appliedAt: "2024-01-15"
    }
  ]
}

POST /api/learning/feedback
{
  feedbackType: "positive|negative",
  context: {
    generation: {
      industry: "dental",
      prompt: "...",
      selectedTemplate: "template-xyz"
    },
    deployment: {
      conversionRate: 0.062,
      userEdits: 3
    }
  },
  notes: "Client loved the design"
}

GET /api/learning/model-performance
{
  modelType: "template_scorer",
  period: "last_30_days"
}

Response:
{
  modelType: "template_scorer",
  version: 3,
  performance: {
    accuracy: 0.87,
    precision: 0.91,
    recall: 0.82,
    f1Score: 0.86
  },
  compared_to_previous: {
    accuracy_improvement: 0.04,  // 4% better
    precision_improvement: 0.03
  }
}
```

---

## Service Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│ INTELLIGENCE LAYER (New Services)                           │
│                                                              │
│ ┌──────────────────────────┐  ┌──────────────────────────┐ │
│ │ Orchestration Service    │  │ Generation Service       │ │
│ │ - Select templates       │  │ - Generate content       │ │
│ │ - Select components      │  │ - Generate SEO           │ │
│ │ - Select themes          │  │ - Assemble HTML          │ │
│ │ - Score recommendations  │  │ - Deploy website         │ │
│ └──────────────────────────┘  └──────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────┐  ┌──────────────────────────┐ │
│ │ Asset Service            │  │ Marketplace Service      │ │
│ │ - Rank components        │  │ - Import Base44          │ │
│ │ - Rank templates         │  │ - Import Lovable         │ │
│ │ - Find combinations      │  │ - Import v0              │ │
│ │ - Calculate uniqueness   │  │ - Import other platforms │ │
│ └──────────────────────────┘  └──────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────┐  ┌──────────────────────────┐ │
│ │ Performance Service      │  │ Learning Service         │ │
│ │ - Track deployments      │  │ - Analyze patterns       │ │
│ │ - Calculate metrics      │  │ - Update models          │ │
│ │ - Update scores          │  │ - Recommend improvements │ │
│ │ - Ranking system         │  │ - A/B test hypotheses    │ │
│ └──────────────────────────┘  └──────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
              ↓ Shared Database ↓
        (Supabase PostgreSQL)
```

---

## Data Flows

### Flow 1: Prompt-to-Site Generation

```
User Prompt
    ↓
Intelligence Orchestrator
├─ Industry Detection
├─ Template Selection
├─ Component Selection
├─ Theme Recommendation
└─ Score: 0.88
    ↓
Generation Service
├─ Claude: Hero Content
├─ Claude: Features Content
├─ Claude: Pricing Content
├─ Claude: SEO Metadata
└─ Assemble HTML
    ↓
Deploy Service
├─ Store in DB
├─ Generate URL
├─ Setup tracking
└─ Return to user
    ↓
Learning Service (Async)
├─ Log generation data
├─ Schedule performance tracking
└─ Update future recommendations
```

### Flow 2: Marketplace Import

```
Daily Scheduler
    ↓
Marketplace Service
├─ Import Base44 (paginated)
├─ Import Lovable (paginated)
└─ Import v0 (paginated)
    ↓
For Each Template:
├─ Download content
├─ Extract metadata
└─ Queue for analysis
    ↓
Analysis Pipeline (Async)
├─ 10-step ingestion
├─ Extract components
├─ Calculate metrics
└─ Store in DB
    ↓
Asset Service
├─ Index components
├─ Calculate rankings
└─ Ready for recommendations
```

### Flow 3: Performance Feedback Loop

```
Website Deployed
    ↓
Tracking Service
├─ User views
├─ User clicks
├─ Form submissions
└─ Conversions
    ↓
Every 24 Hours:
    ↓
Performance Service
├─ Aggregate metrics
├─ Calculate conversion rates
├─ Calculate satisfaction
└─ Update scores
    ↓
Learning Service
├─ Identify patterns
├─ Update rankings
├─ Update recommendations
└─ Log insights
    ↓
Next User Gets Better Recommendation
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Database schema updates
- [ ] Intelligence Orchestrator service
- [ ] Industry Detection engine
- [ ] Template/Component scoring

### Phase 2: Generation (Weeks 3-4)
- [ ] Prompt-to-Site Engine
- [ ] Content generation (Claude integration)
- [ ] SEO generation
- [ ] Website assembly & deployment

### Phase 3: Assets (Weeks 5-6)
- [ ] Asset Library structure
- [ ] Component extraction improvements
- [ ] Asset ranking system
- [ ] Asset combination calculator

### Phase 4: Import (Weeks 7-8)
- [ ] Base44 importer
- [ ] Lovable importer
- [ ] v0 importer
- [ ] Marketplace scheduler

### Phase 5: Intelligence (Weeks 9-10)
- [ ] Performance tracking
- [ ] Ranking updates
- [ ] Learning loop implementation
- [ ] Feedback collection

### Phase 6: Optimization (Weeks 11-12)
- [ ] A/B testing framework
- [ ] Insight generation
- [ ] Model evaluation
- [ ] Continuous improvement

---

## Risk Analysis

### Technical Risks

**Risk 1: Claude API Cost Explosion**
- Symptom: Per-website generation costs exceed $0.10
- Impact: $10+ per 100 websites, unviable at scale
- Mitigation:
  - Cache common prompts (Redis)
  - Batch processing for low-volume generations
  - Model selection: use Haiku for routine tasks, Sonnet for complex
  - Token budget: 5,000 tokens max per site
  - Monitoring: track spend per generation, alert if >$0.05

**Risk 2: Marketplace Import Rate Limiting**
- Symptom: Base44/Lovable API blocks requests due to high volume
- Impact: Can't ingest new templates, competitive disadvantage
- Mitigation:
  - Implement exponential backoff
  - Stagger requests across hours
  - Cache responses for 24h
  - Use multiple API keys (if available)
  - Monitor rate limit headers

**Risk 3: Component Compatibility Explosions**
- Symptom: Too many component combinations to track (factorial growth)
- Impact: Can't test all combinations, miss optimal pairings
- Mitigation:
  - Only test most-popular combinations
  - Use sampling (test 10% of new combinations)
  - Pre-filter by design system compatibility
  - Trust ML scoring over exhaustive testing

**Risk 4: Learning Loop Negative Feedback**
- Symptom: Biased data (only successful websites tracked) skews recommendations
- Impact: Recommendations become increasingly narrow, less diverse
- Mitigation:
  - Track ALL websites (success and failure)
  - Separate: "what performed" from "what should be recommended"
  - Regular novelty injection (recommend underperforming but unique combos)
  - Manual curation override for emerging industries

### Data Risks

**Risk 5: User Privacy in Analytics**
- Symptom: Tracking user behavior, conversions may violate GDPR/CCPA
- Impact: Legal liability, data breach risk
- Mitigation:
  - Anonymize all tracking data
  - Use aggregate metrics only (no PII)
  - Comply with GDPR/CCPA consent requirements
  - Allow users to opt-out of tracking

**Risk 6: Data Quality Issues**
- Symptom: Corrupted import, bad component extraction, missing metadata
- Impact: Bad recommendations, system trained on noise
- Mitigation:
  - Validation on import (HTML parsing, CSS validation)
  - Automated quality checks (> 80% content confidence)
  - Manual review for new sources
  - Quarantine low-quality templates (mark draft)

### Operational Risks

**Risk 7: Model Drift Over Time**
- Symptom: Recommendations become stale as user preferences change
- Impact: Declining recommendation accuracy, user dissatisfaction
- Mitigation:
  - Monthly model retraining (full dataset re-analysis)
  - Seasonal adjustments (holidays, trends)
  - User feedback loop (thumb up/down on recommendations)
  - Explainability: show users why a template was selected

**Risk 8: Competitive Erosion**
- Symptom: Competitors copy our intelligence layer
- Impact: Moat disappears, commoditization
- Mitigation:
  - **Continuous data advantage**: learning loop means we improve daily
  - **Proprietary insights**: templates/components we've tested extensively
  - **Network effects**: more users → more data → better recommendations
  - **Speed**: first-mover advantage in prompt-to-site space

---

## Success Metrics

### Generation Metrics
- Average generation time: < 30 seconds
- Generation success rate: > 95%
- User satisfaction (immediate): 4.0+ / 5.0 stars
- Content quality score: > 80 (Claude-evaluated)

### Deployment Metrics
- Website conversion rate (aggregated): 3-5%
- Average bounce rate: < 45%
- Time on page: > 45 seconds
- User satisfaction (after edits): 4.0+ / 5.0 stars

### Learning Metrics
- Model accuracy improving: +5% per month
- Insight application: 70%+ auto-applied insights prove correct
- Recommendation precision: > 85% (top recommendation is selected)
- A/B test success rate: > 60% of hypotheses validated

### Business Metrics
- Cost per website: < $0.05 (generation + storage)
- Revenue per website (if converted): $29+ (Pro tier)
- Payback period: < 2 months (at 1% conversion)
- NPS for Phase 2: > 50 (detractor-free)

---

## Next: Detailed Service Architecture

Once you approve this high-level architecture, I'll provide:

1. **Service API Specs** (OpenAPI contracts for each service)
2. **Database Schema** (complete SQL migrations)
3. **Integration Points** (how services call each other)
4. **Error Handling** (failure modes & recovery)
5. **Monitoring Plan** (metrics, alerts, dashboards)
6. **Implementation Sequence** (which files to build in order)

Proceed to detailed architecture? Y/N
