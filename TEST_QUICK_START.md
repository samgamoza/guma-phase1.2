# Quick Start: Testing Guma Search/Crawl → Generation Flow

## 30-Second Setup

### 1. Fix Environment Config

The root `.env.local` has wrong port for crawler. Update it:

```bash
# Edit .env.local
CRAWLER_API_URL=http://localhost:3001  # NOT 4000
```

### 2. Install Root Dependencies (for test script)

```bash
cd D:\All\ Apps\guma-phase1.0
pnpm install -w @supabase/supabase-js ws
```

### 3. Start Services

You need **3 things running**:

#### A. Redis
```bash
# Option 1: Docker
docker run -d -p 6379:6379 redis:7-alpine

# Option 2: If Redis installed locally
redis-server
```

#### B. Crawler API + Worker
```bash
cd apps/crawler
pnpm install
# Terminal opens, press Ctrl+C to stop
pnpm dev
```

#### C. Generator API + Worker (in another terminal)
```bash
cd apps/generator
pnpm install
pnpm dev
```

### 4. Run the Test

```bash
# From repo root, in a third terminal
node test-flow.js
```

## What the Test Does

1. **Checks prerequisites:**
   - Supabase connection ✅
   - Crawler API running ✅
   - Generator API running ✅
   - Database schema exists ✅

2. **Triggers crawl:** Scrapes "Coffee Shops" from Austin, TX (5 pages max)

3. **Waits for businesses:** Polls database for up to 2 minutes

4. **Triggers generation:** Generates websites for crawled businesses

5. **Waits for websites:** Polls database for up to 2 minutes

6. **Reports results:** Shows success rate

## Success Looks Like

```
[...] [CRAWL] ✅ Crawl job enqueued { jobId: '...', dbJobId: '...' }
[...] [CRAWL_MONITOR] ✅ Found 12 businesses { businesses: [ 'Coffee Shop 1', 'Coffee Shop 2', ... ] }
[...] [GENERATION] ✅ Generation jobs enqueued { count: 5 }
[...] [GENERATION_MONITOR] ✅ Generated 5/12 websites { slugs: [ '...', '...', ... ] }
[...] [PHASE_5] ✅ Flow complete! { businessesCrawled: 12, websitesGenerated: 5, successRate: 42% }
```

## Failure Troubleshooting

### "Crawler API not reachable"
- Make sure `cd apps/crawler && pnpm dev` is running
- Check that CRAWLER_API_URL in .env.local is `http://localhost:3001`

### "Generator API not reachable"
- Make sure `cd apps/generator && pnpm dev` is running
- Verify GENERATOR_API_URL defaults to `http://localhost:3002`

### "No businesses found after 120s"
- Check crawler logs: `tail -f apps/crawler/logs/*.log`
- Redis might not be running: `redis-cli ping` should return PONG
- YellowPages might be blocking: try lower maxPages in test-flow.js

### "No websites generated"
- Check generator logs: `tail -f apps/generator/logs/*.log`
- Verify businesses are in DB: `curl -X POST http://localhost:3002/jobs -H "Content-Type: application/json" -d '{"limit": 5}'`

## Database Verification

Check the live database directly:

```bash
# Count businesses
curl "https://qsxypplcrbmjiipcbiaw.supabase.co/rest/v1/businesses?select=count()&is=null" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Count websites  
curl "https://qsxypplcrbmjiipcbiaw.supabase.co/rest/v1/websites?select=count()&is=null" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

Or via Supabase dashboard: https://app.supabase.com → Tables → businesses / websites

## Next Steps

Once testing passes, you can:

1. **Test via UI** — Start frontend and use admin panel:
   ```bash
   cd apps/frontend && pnpm dev
   # http://localhost:3000/admin/crawler
   # http://localhost:3000/admin/generator
   ```

2. **Deploy** — See `PHASE1_DEPLOYMENT.md` for Railway/Vercel setup

3. **Monitor** — Add Bull Board dashboard for queue visualization:
   ```bash
   docker run -d -p 3001:3000 deadly0/bull-board
   # http://localhost:3001
   ```
