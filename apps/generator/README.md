# Guma AI — AI Site Generator

Generates complete, mobile-responsive HTML websites for local businesses using
the Claude claude-sonnet-4-6 API. Runs as a BullMQ worker consuming from the
`guma:generate` queue populated by the crawler.

## How it works

```
businesses table
      │
      ▼
guma:generate queue (BullMQ / Redis)
      │
      ▼
SiteGenerator
  1. resolveCategory()     — match business to category config (6 categories)
  2. buildSystemPrompt()   — Claude's standing instructions
  3. buildUserPrompt()     — business data + theme + sections
  4. Claude claude-sonnet-4-6 API   — generates full HTML (~5–6k tokens)
  5. cleanHtml()           — strip fences, inject canonical, fix claim link
  6. validateHtml()        — structural checks, min length
      │
      ▼
websites table  +  outreach queue
```

## Setup

```bash
cp .env.example .env
# fill in ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, REDIS_URL

npm install
```

## Test a single site (no queue needed)

```bash
# Demo business (no DB required)
node src/generate-single.js --demo

# Real business by ID
node src/generate-single.js --id <uuid>
```

Output is written to `output/<slug>.html` — open in a browser to inspect.

## Run the worker

```bash
# Start consuming from the generate queue
npm run worker
```

## Category templates

| Key        | Matches                                 | Primary CTA        |
|------------|-----------------------------------------|--------------------|
| restaurant | pizza, cafe, bakery, bar, grill…        | Order Now          |
| trades     | plumber, electrician, hvac, roofing…    | Get a Free Quote   |
| salon      | salon, hair, spa, nail, barber…         | Book Appointment   |
| medical    | dentist, doctor, clinic, pharmacy…      | Book Appointment   |
| legal      | lawyer, attorney, accountant, cpa…      | Free Consultation  |
| retail     | shop, boutique, florist, jewelry…       | Shop Now           |
| generic    | everything else                         | Get in Touch       |

## Cost

- Model: `claude-sonnet-4-6`
- Typical tokens per site: ~6,000 input + ~2,000 output
- Estimated cost: **~$0.01–0.02 per site** at current Sonnet pricing

## Files

```
src/
├── generator/
│   ├── siteGenerator.js   ← core Claude API handler
│   └── prompts.js         ← system prompt + user prompt builders
├── templates/
│   └── categories.js      ← 6 category configs (themes, sections, CTAs)
├── queue/
│   └── worker.js          ← BullMQ worker
├── db/
│   └── client.js          ← Supabase helpers
├── utils/
│   └── logger.js
└── generate-single.js     ← CLI for manual/test generation
```
