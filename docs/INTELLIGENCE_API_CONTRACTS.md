# Intelligence Layer API Contracts (OpenAPI 3.0)

## Service Topology

```
┌─ Orchestration Service (port 5001)
├─ Generation Service (port 5002)
├─ Asset Service (port 5003)
├─ Marketplace Service (port 5004)
├─ Performance Service (port 5005)
└─ Learning Service (port 5006)

All communicate via:
  - Synchronous: HTTP/REST (within platform)
  - Asynchronous: Bull queues + Redis (for long-running tasks)
  - Shared: Supabase PostgreSQL
```

---

## 1. Orchestration Service

**Purpose:** Select optimal template, components, theme based on business context

**Base URL:** `http://localhost:5001`

### POST /api/select

Select best website architecture for given context.

```yaml
Request:
  content:
    application/json:
      schema:
        type: object
        required: [industry, businessModel, targetAudience]
        properties:
          industry:
            type: string
            enum: [dental, medical, restaurant, saas, ecommerce, agency, consulting, real-estate, automotive, fitness]
            example: "dental"
          businessModel:
            type: string
            enum: [service, product, subscription, marketplace, b2b]
            example: "service"
          targetAudience:
            type: string
            example: "families"
          designPreference:
            type: string
            enum: [modern, minimal, luxury, playful, corporate, creative]
            nullable: true
          businessDescription:
            type: string
            example: "Family dental practice in San Diego"
          businessName:
            type: string
            example: "Bright Smiles Dental"
          tone:
            type: string
            enum: [friendly, professional, playful, authoritative, technical]
            nullable: true
          complexity:
            type: string
            enum: [simple, standard, advanced]
            default: "simple"

Response (200):
  content:
    application/json:
      schema:
        type: object
        properties:
          recommendation:
            type: object
            properties:
              template:
                type: object
                properties:
                  id: { type: string, format: uuid }
                  name: { type: string }
                  score: { type: number, minimum: 0, maximum: 1 }
                  reasons:
                    type: array
                    items: { type: string }
                  preview_url: { type: string }
              components:
                type: object
                properties:
                  hero:
                    type: object
                    properties:
                      id: { type: string, format: uuid }
                      name: { type: string }
                      score: { type: number }
                  features:
                    type: object
                    properties:
                      id: { type: string, format: uuid }
                      name: { type: string }
                      score: { type: number }
                  pricing:
                    type: object
                    properties:
                      id: { type: string, format: uuid }
                      name: { type: string }
                      score: { type: number }
                  testimonials:
                    type: object
                    properties:
                      id: { type: string, format: uuid }
                      name: { type: string }
                      score: { type: number }
                  cta:
                    type: object
                    properties:
                      id: { type: string, format: uuid }
                      name: { type: string }
                      score: { type: number }
              colorSystem:
                type: object
                properties:
                  id: { type: string, format: uuid }
                  name: { type: string }
                  score: { type: number }
              typographySystem:
                type: object
                properties:
                  id: { type: string, format: uuid }
                  name: { type: string }
                  score: { type: number }
              theme:
                type: object
                properties:
                  tone: { type: string }
                  complexity: { type: string }
              confidence:
                type: number
                minimum: 0
                maximum: 1
              alternatives:
                type: array
                maxItems: 3
                items:
                  type: object
                  properties:
                    template:
                      type: object
                      properties:
                        id: { type: string }
                        name: { type: string }
                        score: { type: number }
                    score: { type: number }
          reasoning:
            type: object
            properties:
              templateChoice: { type: string }
              componentChoices: { type: object }
              themeChoice: { type: string }
              industryMatch: { type: string }

Errors:
  400:
    description: "Invalid input (missing required fields)"
  500:
    description: "Service error"
```

### GET /api/select/scores/template/:templateId

Get scoring breakdown for a template.

```yaml
Response (200):
  content:
    application/json:
      schema:
        type: object
        properties:
          templateId: { type: string, format: uuid }
          scores:
            type: object
            properties:
              industryFit:
                type: object
                properties:
                  score: { type: number }
                  breakdown:
                    type: object
                    properties:
                      [industry]:
                        type: object
                        properties:
                          deployments: { type: integer }
                          conversionRate: { type: number }
                          rating: { type: number }
              designQuality:
                type: object
                properties:
                  score: { type: number }
                  lighthouse: { type: integer }
                  accessibility: { type: integer }
              performance:
                type: object
                properties:
                  score: { type: number }
                  pageSpeed: { type: integer }
                  mobileScore: { type: integer }
              conversionPotential:
                type: object
                properties:
                  score: { type: number }
                  hasCTA: { type: boolean }
                  hasForm: { type: boolean }
                  estimatedLift: { type: number }
              userSatisfaction:
                type: object
                properties:
                  score: { type: number }
                  avgRating: { type: number }
                  totalRatings: { type: integer }
          overallScore: { type: number }
          lastUpdated: { type: string, format: date-time }
```

---

## 2. Generation Service

**Purpose:** Generate content and assemble websites

**Base URL:** `http://localhost:5002`

### POST /api/generate

Generate complete website from context.

```yaml
Request:
  content:
    application/json:
      schema:
        type: object
        required: [businessContext]
        properties:
          businessContext:
            type: object
            required: [industry, businessName, businessDescription]
            properties:
              industry: { type: string }
              businessName: { type: string }
              businessDescription: { type: string }
              businessPhone: { type: string, nullable: true }
              businessEmail: { type: string, nullable: true }
              businessAddress: { type: string, nullable: true }
              businessWebsite: { type: string, nullable: true }
              targetAudience: { type: string, nullable: true }
              targetLocation: { type: string, nullable: true }
          templateId:
            type: string
            format: uuid
            description: "If provided, use this template. Otherwise, orchestrator selects."
            nullable: true
          componentIds:
            type: object
            description: "If provided, use these components. Otherwise, orchestrator selects."
            nullable: true
            properties:
              hero: { type: string, format: uuid }
              features: { type: string, format: uuid }
              pricing: { type: string, format: uuid }
              testimonials: { type: string, format: uuid }
              cta: { type: string, format: uuid }
          options:
            type: object
            properties:
              includePricing: { type: boolean, default: true }
              includeTestimonials: { type: boolean, default: true }
              includeContact: { type: boolean, default: true }
              tone: { type: string, enum: [friendly, professional, playful, authoritative, technical] }
              complexity: { type: string, enum: [simple, standard, advanced] }
              locale: { type: string, default: "en-US" }

Response (200):
  content:
    application/json:
      schema:
        type: object
        properties:
          website:
            type: object
            properties:
              id: { type: string, format: uuid }
              slug: { type: string }
              htmlContent: { type: string }
              cssContent: { type: string }
              metadata:
                type: object
                properties:
                  templateId: { type: string }
                  components:
                    type: object
                    properties:
                      hero: { type: string }
                      features: { type: string }
                      pricing: { type: string }
                      testimonials: { type: string }
                      cta: { type: string }
                  colorSystem: { type: string }
                  typographySystem: { type: string }
              content:
                type: object
                properties:
                  headline: { type: string }
                  subheading: { type: string }
                  features:
                    type: array
                    items:
                      type: object
                      properties:
                        title: { type: string }
                        description: { type: string }
                  pricing:
                    type: array
                    items:
                      type: object
                      properties:
                        tierName: { type: string }
                        price: { type: number, nullable: true }
                        features:
                          type: array
                          items: { type: string }
                  testimonials:
                    type: array
                    items:
                      type: object
                      properties:
                        quote: { type: string }
                        author: { type: string }
                        role: { type: string }
                  cta:
                    type: object
                    properties:
                      buttonText: { type: string }
                      heading: { type: string }
              seo:
                type: object
                properties:
                  title: { type: string }
                  description: { type: string }
                  keywords:
                    type: array
                    items: { type: string }
                  ogImage: { type: string }
                  schema:
                    type: object
                    description: "JSON-LD schema.org markup"
              scores:
                type: object
                properties:
                  contentQuality: { type: number }
                  seoOptimization: { type: number }
                  conversionPotential: { type: number }
                  estimatedLighthouse: { type: integer }
          generationMetrics:
            type: object
            properties:
              durationMs: { type: integer }
              claudeTokensUsed: { type: integer }
              estimatedCost: { type: number }
          previewUrl: { type: string, format: uri }

Errors:
  400: { description: "Invalid input" }
  503: { description: "Claude API unavailable" }
```

### POST /api/generate/section

Generate single section content.

```yaml
Request:
  content:
    application/json:
      schema:
        type: object
        required: [section, businessContext]
        properties:
          section:
            type: string
            enum: [hero, features, pricing, testimonials, faq, contact, cta]
          businessContext:
            type: object
            properties:
              industry: { type: string }
              businessName: { type: string }
              businessDescription: { type: string }
              targetAudience: { type: string, nullable: true }
          tone: { type: string }
          complexity: { type: string }
          includeVariations: { type: boolean, default: false }

Response (200):
  content:
    application/json:
      schema:
        type: object
        properties:
          section: { type: string }
          content:
            type: object
            description: "Content varies by section type"
          alternatives:
            type: array
            maxItems: 2
            items:
              type: object
              description: "Alternative versions if includeVariations=true"
          qualityScore: { type: number }
          relevanceScore: { type: number }
          generationTime: { type: integer }
```

### POST /api/generate/seo

Generate SEO metadata.

```yaml
Request:
  content:
    application/json:
      schema:
        type: object
        required: [businessContext, htmlContent]
        properties:
          businessContext:
            type: object
            properties:
              industry: { type: string }
              businessName: { type: string }
              targetLocation: { type: string, nullable: true }
              targetAudience: { type: string, nullable: true }
          htmlContent: { type: string }
          keywords:
            type: array
            items: { type: string }
            description: "If provided, optimize for these. Otherwise auto-detect."
            nullable: true

Response (200):
  content:
    application/json:
      schema:
        type: object
        properties:
          seo:
            type: object
            properties:
              title: { type: string, maxLength: 60 }
              description: { type: string, maxLength: 160 }
              keywords:
                type: array
                items: { type: string }
              ogTitle: { type: string }
              ogDescription: { type: string }
              ogImage: { type: string }
              canonicalUrl: { type: string, nullable: true }
              schema:
                type: object
                description: "JSON-LD markup"
              structuredData:
                type: object
                properties:
                  business:
                    type: object
                    properties:
                      "@type": { type: string }
                      name: { type: string }
                      address: { type: object }
                      telephone: { type: string, nullable: true }
                      url: { type: string, nullable: true }
          optimizations:
            type: array
            items:
              type: object
              properties:
                recommendation: { type: string }
                priority: { enum: [critical, high, medium, low] }
          seoScore: { type: integer, minimum: 0, maximum: 100 }
```

---

## 3. Asset Service

**Purpose:** Rank and recommend components

**Base URL:** `http://localhost:5003`

### POST /api/rank-assets

Rank assets for given context.

```yaml
Request:
  content:
    application/json:
      schema:
        type: object
        required: [assetType, context]
        properties:
          assetType:
            type: string
            enum: [component, template, colorSystem, typographySystem]
          context:
            type: object
            properties:
              industry: { type: string, nullable: true }
              businessModel: { type: string, nullable: true }
              targetAudience: { type: string, nullable: true }
              designPreference: { type: string, nullable: true }
          candidates:
            type: array
            items: { type: string, format: uuid }
            description: "If provided, rank only these. Otherwise rank all production assets."
            nullable: true

Response (200):
  content:
    application/json:
      schema:
        type: object
        properties:
          assetType: { type: string }
          rankings:
            type: array
            items:
              type: object
              properties:
                rank: { type: integer }
                assetId: { type: string, format: uuid }
                assetName: { type: string }
                overallScore: { type: number, minimum: 0, maximum: 100 }
                scoreBreakdown:
                  type: object
                  properties:
                    popularity: { type: number }
                    conversionRate: { type: number }
                    designQuality: { type: number }
                    userSatisfaction: { type: number }
                    trendingFactor: { type: number }
                    uniquenessBonus: { type: number }
                reasoning:
                  type: array
                  items: { type: string }
                    example:
                      - "High conversion rate (8.2%)"
                      - "Trending: +40% usage last 30 days"
                      - "Rarely used together (uniqueness)"
          generationTime: { type: integer }

Errors:
  400: { description: "Invalid asset type or context" }
  404: { description: "No assets found" }
```

### POST /api/validate-combination

Check if asset combination works well together.

```yaml
Request:
  content:
    application/json:
      schema:
        type: object
        required: [assets]
        properties:
          assets:
            type: object
            properties:
              hero: { type: string, format: uuid }
              features: { type: string, format: uuid }
              pricing: { type: string, format: uuid }
              testimonials: { type: string, format: uuid }
              cta: { type: string, format: uuid }
          industry: { type: string, nullable: true }

Response (200):
  content:
    application/json:
      schema:
        type: object
        properties:
          combination:
            type: object
            properties:
              compatibilityScore: { type: number, minimum: 0, maximum: 1 }
              designCoherence: { type: number }
              performanceImpact: { type: number }
              estimatedConversionLift: { type: number }
              warnings:
                type: array
                items:
                  type: object
                  properties:
                    severity: { enum: [critical, warning, info] }
                    message: { type: string }
          alternativeCombinations:
            type: array
            maxItems: 3
            items:
              type: object
              properties:
                components:
                  type: object
                  properties:
                    [key]: { type: string, format: uuid }
                compatibilityScore: { type: number }
```

### GET /api/assets/:assetId/performance

Get performance history for an asset.

```yaml
Response (200):
  content:
    application/json:
      schema:
        type: object
        properties:
          assetId: { type: string, format: uuid }
          assetName: { type: string }
          performance:
            type: object
            properties:
              totalDeployments: { type: integer }
              avgConversionRate: { type: number }
              avgUserRating: { type: number }
              totalRevenuAttributed: { type: number }
              byIndustry:
                type: object
                additionalProperties:
                  type: object
                  properties:
                    deployments: { type: integer }
                    conversionRate: { type: number }
                    userRating: { type: number }
                    revenueAttributed: { type: number }
              trending:
                type: object
                properties:
                  direction: { enum: [up, down, stable] }
                  percentChange: { type: number }
                  usesLastWeek: { type: integer }
                  usesWeekBefore: { type: integer }
          competitors:
            type: array
            maxItems: 5
            items:
              type: object
              properties:
                assetId: { type: string, format: uuid }
                assetName: { type: string }
                conversionRate: { type: number }
                difference: { type: number }
          lastUpdated: { type: string, format: date-time }
```

---

## 4. Marketplace Service

**Purpose:** Import templates from external sources

**Base URL:** `http://localhost:5004`

### POST /api/import/start

Start importing from marketplace.

```yaml
Request:
  content:
    application/json:
      schema:
        type: object
        required: [marketplace]
        properties:
          marketplace:
            type: string
            enum: [base44, lovable, v0, trae, framer, webflow]
          action:
            type: string
            enum: [start-sync, fetch-one, sync-updates]
            default: "start-sync"
          externalId:
            type: string
            description: "Required if action=fetch-one"
            nullable: true
          filters:
            type: object
            description: "Optional filters for sync"
            nullable: true
            properties:
              category: { type: string }
              minPopularity: { type: integer }
              sinceDate: { type: string, format: date }

Response (202 Accepted):
  content:
    application/json:
      schema:
        type: object
        properties:
          status: { type: string, enum: [started, queued] }
          jobId: { type: string, format: uuid }
          marketplace: { type: string }
          estimatedDuration: { type: integer, description: "seconds" }
          estimatedTemplates: { type: integer }
          queuePosition: { type: integer, nullable: true }

Errors:
  400: { description: "Invalid marketplace or parameters" }
  429: { description: "Rate limit exceeded" }
```

### GET /api/import/status/:jobId

Get import job status.

```yaml
Response (200):
  content:
    application/json:
      schema:
        type: object
        properties:
          jobId: { type: string, format: uuid }
          marketplace: { type: string }
          status:
            type: string
            enum: [queued, in_progress, completed, failed]
          progress:
            type: object
            properties:
              templatesProcessed: { type: integer }
              totalTemplates: { type: integer }
              percentComplete: { type: number }
          metrics:
            type: object
            properties:
              successful: { type: integer }
              failed: { type: integer }
              skipped: { type: integer }
              durationSeconds: { type: integer }
          errorSummary:
            type: array
            items:
              type: object
              properties:
                externalId: { type: string }
                error: { type: string }
          nextUpdate:
            type: integer
            description: "seconds until next status"
            nullable: true

Errors:
  404: { description: "Job not found" }
```

### GET /api/import/history

Get import history.

```yaml
Request:
  parameters:
    - name: marketplace
      in: query
      required: false
      schema: { type: string }
    - name: limit
      in: query
      schema: { type: integer, default: 20 }
    - name: offset
      in: query
      schema: { type: integer, default: 0 }

Response (200):
  content:
    application/json:
      schema:
        type: object
        properties:
          imports:
            type: array
            items:
              type: object
              properties:
                jobId: { type: string, format: uuid }
                marketplace: { type: string }
                status: { type: string }
                completedAt: { type: string, format: date-time, nullable: true }
                metrics:
                  type: object
                  properties:
                    successful: { type: integer }
                    failed: { type: integer }
                    skipped: { type: integer }
          totalCount: { type: integer }
          pageInfo:
            type: object
            properties:
              limit: { type: integer }
              offset: { type: integer }
              hasMore: { type: boolean }
```

---

## 5. Performance Service

**Purpose:** Track and update template/component scores

**Base URL:** `http://localhost:5005`

### POST /api/performance/track-deployment

Record website deployment.

```yaml
Request:
  content:
    application/json:
      schema:
        type: object
        required: [websiteId, templateId]
        properties:
          websiteId: { type: string, format: uuid }
          templateId: { type: string, format: uuid }
          componentsUsed:
            type: array
            items: { type: string, format: uuid }
          colorSystemId: { type: string, format: uuid, nullable: true }
          typographyId: { type: string, format: uuid, nullable: true }
          context:
            type: object
            properties:
              industry: { type: string }
              businessModel: { type: string }
              targetAudience: { type: string, nullable: true }
          businessInfo:
            type: object
            properties:
              businessName: { type: string }
              businessPhone: { type: string, nullable: true }
              businessEmail: { type: string, nullable: true }
              businessAddress: { type: string, nullable: true }

Response (201):
  content:
    application/json:
      schema:
        type: object
        properties:
          deploymentId: { type: string, format: uuid }
          trackingId: { type: string }
          trackingPixelUrl: { type: string }
          analyticsTag: { type: string, description: "JS snippet for GA" }
          customTrackingCode: { type: string, description: "Custom event tracking JS" }
```

### POST /api/performance/record-event

Record user event on website.

```yaml
Request:
  content:
    application/json:
      schema:
        type: object
        required: [trackingId, eventType]
        properties:
          trackingId: { type: string }
          eventType:
            type: string
            enum: [pageview, click, form_submit, conversion, custom]
          context:
            type: object
            properties:
              url: { type: string }
              referrer: { type: string, nullable: true }
              deviceType: { enum: [mobile, tablet, desktop] }
              sessionDuration: { type: integer, nullable: true }
              customData:
                type: object
                description: "Any custom data"
                nullable: true

Response (202):
  content:
    application/json:
      schema:
        type: object
        properties:
          status: { type: string }
          eventId: { type: string, format: uuid }
```

### GET /api/performance/template/:templateId

Get template performance metrics.

```yaml
Response (200):
  content:
    application/json:
      schema:
        type: object
        properties:
          templateId: { type: string, format: uuid }
          templateName: { type: string }
          metrics:
            type: object
            properties:
              totalDeployments: { type: integer }
              avgConversionRate: { type: number }
              avgUserRating: { type: number }
              totalRevenueAttributed: { type: number }
              byIndustry:
                type: object
                additionalProperties:
                  type: object
                  properties:
                    deployments: { type: integer }
                    conversionRate: { type: number }
                    userRating: { type: number }
              trending:
                type: object
                properties:
                  direction: { enum: [up, down, stable] }
                  percentChange: { type: number }
          competitors:
            type: array
            items:
              type: object
              properties:
                templateId: { type: string }
                conversionRate: { type: number }
                difference: { type: number }
          lastUpdated: { type: string, format: date-time }
```

### POST /api/performance/update-scores

Trigger score recalculation (admin only).

```yaml
Request:
  content:
    application/json:
      schema:
        type: object
        properties:
          scope:
            type: string
            enum: [all, templates, components, color_systems, typography_systems]
            default: "all"
          sinceDate:
            type: string
            format: date
            description: "Only update metrics since this date"
            nullable: true

Response (202):
  content:
    application/json:
      schema:
        type: object
        properties:
          status: { type: string }
          jobId: { type: string, format: uuid }
          scope: { type: string }
          estimatedDuration: { type: integer, description: "seconds" }
```

---

## 6. Learning Service

**Purpose:** Learn from data and improve recommendations

**Base URL:** `http://localhost:5006`

### GET /api/learning/insights

Get current insights and recommendations.

```yaml
Request:
  parameters:
    - name: limit
      in: query
      schema: { type: integer, default: 10 }
    - name: insightType
      in: query
      schema:
        type: string
        enum: [template_ranking, component_combo, industry_mapping, theme_recommendation]
        nullable: true

Response (200):
  content:
    application/json:
      schema:
        type: object
        properties:
          insights:
            type: array
            items:
              type: object
              properties:
                id: { type: string, format: uuid }
                type: { type: string }
                description: { type: string }
                recommendation: { type: string }
                dataPoints: { type: integer }
                confidence: { type: number, minimum: 0, maximum: 1 }
                expectedLift: { type: number }
                actualLift: { type: number, nullable: true }
                autoApplied: { type: boolean }
                appliedAt: { type: string, format: date-time, nullable: true }
                createdAt: { type: string, format: date-time }
          summary:
            type: object
            properties:
              totalInsights: { type: integer }
              appliedInsights: { type: integer }
              averageConfidence: { type: number }
              totalExpectedLift: { type: number }
```

### POST /api/learning/feedback

Submit feedback on recommendations.

```yaml
Request:
  content:
    application/json:
      schema:
        type: object
        required: [feedbackType, context]
        properties:
          feedbackType:
            type: string
            enum: [positive, negative, neutral]
          context:
            type: object
            properties:
              generation:
                type: object
                properties:
                  prompt: { type: string }
                  selectedTemplate: { type: string, format: uuid }
                  selectedComponents:
                    type: object
                    additionalProperties: { type: string, format: uuid }
              deployment:
                type: object
                properties:
                  websiteId: { type: string, format: uuid }
                  conversionRate: { type: number, nullable: true }
                  userEdits: { type: integer, nullable: true }
                  userRating: { type: integer, nullable: true }
          notes: { type: string, nullable: true }

Response (201):
  content:
    application/json:
      schema:
        type: object
        properties:
          feedbackId: { type: string, format: uuid }
          status: { type: string }
          message: { type: string }
```

### GET /api/learning/model-performance

Get ML model performance metrics.

```yaml
Request:
  parameters:
    - name: modelType
      in: query
      required: true
      schema:
        type: string
        enum: [template_scorer, component_ranker, theme_recommender]
    - name: period
      in: query
      schema:
        type: string
        enum: [last_7_days, last_30_days, all_time]
        default: "last_30_days"

Response (200):
  content:
    application/json:
      schema:
        type: object
        properties:
          modelType: { type: string }
          version: { type: integer }
          period: { type: string }
          performance:
            type: object
            properties:
              accuracy: { type: number }
              precision: { type: number }
              recall: { type: number }
              f1Score: { type: number }
          comparedToPrevious:
            type: object
            properties:
              accuracyImprovement: { type: number }
              precisionImprovement: { type: number }
          samplesEvaluated: { type: integer }
          lastUpdated: { type: string, format: date-time }
```

### POST /api/learning/trigger-update

Manually trigger weekly learning update (admin only).

```yaml
Request:
  content:
    application/json:
      schema:
        type: object
        properties:
          scope:
            type: string
            enum: [all, insights, models, rankings]
            default: "all"

Response (202):
  content:
    application/json:
      schema:
        type: object
        properties:
          status: { type: string }
          jobId: { type: string, format: uuid }
          estimatedDuration: { type: integer }
```

---

## Service-to-Service Communication

### Synchronous Calls (HTTP)

```
Orchestration → Asset Service
  POST /api/rank-assets
  POST /api/validate-combination
  GET /api/assets/:assetId/performance

Generation → Asset Service
  GET /api/assets/:assetId/performance

Orchestration → Asset Service → Performance Service
  (transitive: check component history)
```

### Asynchronous Calls (Bull Queue)

```
Generation → Performance Service
  Queue: "track-deployment"
  Payload: deployment metadata

Marketplace Service → Asset Service
  Queue: "analyze-imported-template"
  Payload: template data, raw HTML/CSS

Performance Service → Learning Service
  Queue: "update-scores"
  Payload: template/component IDs

Learning Service → Orchestration (via cache update)
  (writes updated weights to Redis cache)
```

### Shared State (Supabase)

```
All services read/write:
  - templates
  - components
  - template_scores
  - component_performance
  - learning_metrics
  - learning_insights
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Field 'industry' is required",
    "details": {
      "field": "industry",
      "reason": "required"
    },
    "requestId": "req-abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_INPUT | 400 | Invalid request parameters |
| UNAUTHORIZED | 401 | Auth required or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMIT_EXCEEDED | 429 | Rate limited |
| SERVICE_ERROR | 500 | Internal server error |
| SERVICE_UNAVAILABLE | 503 | External service down |
| TIMEOUT | 504 | Request timeout |

---

## Authentication

All endpoints require Bearer token:

```
Authorization: Bearer <jwt-token>
```

Tokens obtained from Phase 1 Supabase Auth.

Admin endpoints require:

```
Authorization: Bearer <jwt-token>
X-Admin-Secret: <admin-secret>
```

---

## Rate Limiting

```
Per Service Per IP:
  - Orchestration: 100 req/min
  - Generation: 50 req/min (expensive)
  - Asset: 200 req/min
  - Marketplace: 10 req/min (long-running)
  - Performance: 500 req/min
  - Learning: 50 req/min (admin only)

Retry Strategy:
  - 429: Exponential backoff (1s, 2s, 4s, 8s)
  - 503: Exponential backoff (5s, 10s, 20s)
  - Timeout: Retry once after 5s
```

---

## Monitoring & Logging

All requests logged with:
```
{
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "orchestration",
  "method": "POST",
  "path": "/api/select",
  "userId": "user-abc123",
  "requestId": "req-abc123",
  "statusCode": 200,
  "durationMs": 234,
  "tokensCost": 1250,
  "cache": "miss"
}
```

---

## Next: Database Schema

Ready for detailed SQL migrations file?
