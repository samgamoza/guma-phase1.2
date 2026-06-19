# Testing Against Production (Railway)

The Guma services are deployed on Railway and running in production. You can test the full flow against these live services.

## Production Services (Railway)

All services are running and online:

```
Redis              ✅ redis-volume-4wTK
Crawler            ✅ guma-phase1-crawler (guma-phase1-crawler-production)
Generator          ✅ guma-phase1-generator (guma-phase1-generator-production)
Outreach           ✅ guma-phase1-outreach
```

## Get Production URLs

1. Open Railway dashboard: https://railway.app/dashboard
2. Select project: `courteous-alignment`
3. Environment: `production`
4. Each service shows its public URL in the deployment details

Example format:
```
https://guma-phase1-crawler-production.up.railway.app
https://guma-phase1-generator-production.up.railway.app
```

## Test Against Production

### Option A: Via Environment Variables

```bash
export CRAWLER_API_URL=https://[your-crawler-url]
export GENERATOR_API_URL=https://[your-generator-url]
export ADMIN_API_SECRET=your_admin_secret

node test-flow.js
```

### Option B: Edit .env.local

Update your root `.env.local`:

```env
CRAWLER_API_URL=https://guma-phase1-crawler-production.up.railway.app
GENERATOR_API_URL=https://guma-phase1-generator-production.up.railway.app
ADMIN_API_SECRET=your_admin_secret_here
```

Then run:
```bash
node test-flow.js
```

## What Gets Tested

When running against production:

1. **Real crawl** — Scrapes YellowPages for Coffee Shops in Austin, TX
2. **Real database writes** — Adds businesses to production Supabase
3. **Real generation** — Creates websites from crawled data
4. **Real queue processing** — Uses production Redis + workers

⚠️ **Warning:** This will add test data to the production database. Use a distinct test category to avoid mixing with real data.

## Expected Results

```
[2026-06-19T...] [PHASE_1] Verifying prerequisites...
[2026-06-19T...] [SUPABASE] ✅ Connected
[2026-06-19T...] [CRAWLER_API] ✅ Crawler API is healthy
[2026-06-19T...] [GENERATOR_API] ✅ Generator API is healthy
[2026-06-19T...] [VERIFY] ✅ Database schema verified

[2026-06-19T...] [PHASE_2] Triggering crawl...
[2026-06-19T...] [CRAWL] ✅ Crawl job enqueued

[2026-06-19T...] [PHASE_3] Waiting for crawl to complete...
[2026-06-19T...] [CRAWL_MONITOR] ✅ Found 15 businesses

[2026-06-19T...] [PHASE_4] Triggering generation...
[2026-06-19T...] [GENERATION] ✅ Generation jobs enqueued { count: 5 }

[2026-06-19T...] [PHASE_5] Waiting for generation...
[2026-06-19T...] [GENERATION_MONITOR] ✅ Generated 5/15 websites

✅ Flow complete! { businessesCrawled: 15, websitesGenerated: 5, successRate: 33% }
```

## Performance Expectations

| Phase | Time | Notes |
|---|---|---|
| Prerequisites check | ~2s | API health + database connection |
| Crawl trigger | ~1s | Queue job |
| Crawl execution | 30-120s | YellowPages scraping (varies) |
| Generation trigger | ~1s | Queue job |
| Generation execution | 15-30s | Template-based HTML generation |
| **Total E2E time** | **1-3 minutes** | Includes polling delays |

## Monitoring Production

While test is running, monitor the services:

### Railway Dashboard
- Open https://railway.app/dashboard
- Select project → environment
- Watch service logs in real-time

### View Worker Logs
```bash
# From each service's Railway logs tab:
# - Crawler: Look for "[CRAWL]" entries
# - Generator: Look for "[GENERATE]" entries
# - Outreach: Look for "[OUTREACH]" entries
```

### Check Results in Supabase

After test completes, verify in Supabase:

```bash
# Count newly created businesses (filter by recent created_at)
SELECT COUNT(*) FROM businesses 
WHERE created_at > now() - interval '10 minutes'
  AND category = 'Coffee Shops'
  AND city = 'Austin';

# Count newly created websites
SELECT COUNT(*) FROM websites 
WHERE generated_at > now() - interval '10 minutes';
```

## Troubleshooting Production Tests

### API Returns 401 (Unauthorized)
- Check `ADMIN_API_SECRET` matches what's deployed
- Verify header: `x-admin-secret` is being sent

### API Returns 404
- Confirm URL is correct (check Railway dashboard)
- Verify endpoint paths: `/jobs`, `/health`

### Crawl Triggers But No Businesses Appear
- Check crawler logs in Railway dashboard
- YellowPages might be blocking requests
- Try smaller `maxPages` value

### Generation Triggers But No Websites Appear
- Check generator logs in Railway dashboard
- Verify businesses actually exist in database
- Check for schema mismatch errors

### Performance Is Slow
- Production services might be rate-limited
- YellowPages scraping can be 30-120s per request
- Generator depends on template rendering speed

## Clean Up Test Data

After testing, clean up the test data you added:

```sql
-- Delete test businesses
DELETE FROM businesses 
WHERE created_at > now() - interval '1 hour'
  AND category = 'Coffee Shops'
  AND city = 'Austin';

-- Delete corresponding websites
DELETE FROM websites
WHERE generated_at > now() - interval '1 hour';

-- Delete corresponding outreach records
DELETE FROM outreach
WHERE created_at > now() - interval '1 hour';
```

## CI/CD Integration

To add production testing to your CI pipeline:

```yaml
# GitHub Actions example
- name: Test Production Flow
  env:
    CRAWLER_API_URL: ${{ secrets.PROD_CRAWLER_URL }}
    GENERATOR_API_URL: ${{ secrets.PROD_GENERATOR_URL }}
    ADMIN_API_SECRET: ${{ secrets.ADMIN_API_SECRET }}
  run: node test-flow.js
```

---

**Next:** Run the test, verify success, then clean up test data.
