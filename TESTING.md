# Guma Phase 1 — Testing the Search/Crawl → Generation Flow

This guide walks you through testing the complete workflow: search → crawl → generation.

## What Gets Tested

The test suite verifies the **end-to-end flow**:

```
┌─────────────────┐
│ Crawler API     │  (scraped businesses → businesses table)
└────────┬────────┘
         │ (enqueue crawl job)
         ▼
┌─────────────────┐
│ Crawler Worker  │  (processes queue, scrapes YellowPages)
└────────┬────────┘
         │ (save businesses)
         ▼
┌─────────────────┐
│ businesses table│  (Supabase)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generator API   │  (find businesses without sites)
└────────┬────────┘
         │ (enqueue generation job)
         ▼
┌─────────────────┐
│ Generator Worker│  (template-based or Claude AI generation)
└────────┬────────┘
         │ (save websites)
         ▼
┌─────────────────┐
│ websites table  │  (Supabase)
└─────────────────┘
```

## Prerequisites

### 1. Environment Setup

Copy `.env.example` files and fill in credentials:

```bash
# Root
cp .env.example .env.local

# Each service
cd apps/crawler && cp .env.example .env
cd apps/generator && cp .env.example .env
cd apps/outreach && cp .env.example .env
```

**Critical variables:**

| Variable | Service | Where to get |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase dashboard |
| `SUPABASE_SERVICE_KEY` | All workers | Supabase → Settings → API → Service role key |
| `REDIS_URL` | Crawler, Generator, Outreach | Local: `redis://localhost:6379` |
| `ADMIN_API_SECRET` | Frontend API routes | Set to any secret value (e.g., `test_secret_123`) |
| `ANTHROPIC_API_KEY` | Generator (AI mode only) | https://console.anthropic.com |
| `CRAWLER_API_URL` | Frontend | `http://localhost:3001` (default) |
| `GENERATOR_API_URL` | Frontend API routes | `http://localhost:3002` (default) |

### 2. Start Services

#### Option A: Docker Compose (Recommended)

```bash
# Starts: Redis + all workers
docker-compose up -d
```

Check status:
```bash
docker-compose ps
docker logs -f guma-phase1.0-crawler-worker-1
docker logs -f guma-phase1.0-generator-worker-1
```

#### Option B: Local with Redis Running

Ensure Redis is running:
```bash
redis-server  # or use Docker: docker run -d -p 6379:6379 redis:7-alpine
```

Then in separate terminals:
```bash
# Terminal 1: Crawler API + Worker
cd apps/crawler
pnpm install
node src/api.js &  # starts on :3001
pnpm dev           # worker with file-watch

# Terminal 2: Generator API + Worker
cd apps/generator
pnpm install
node src/api.js &  # starts on :3002
pnpm dev           # worker with file-watch

# Terminal 3: Frontend (optional for UI testing)
cd apps/frontend
pnpm install
pnpm dev           # http://localhost:3000
```

### 3. Verify Services are Running

```bash
curl http://localhost:3001/health  # Should return { ok: true, service: 'guma-crawler' }
curl http://localhost:3002/health  # Should return { ok: true, service: 'guma-generator' }
```

## Running the Test

### Automated Test Script

```bash
# From repo root
node test-flow.js
```

**What it does:**
1. ✅ Verifies Supabase connection
2. ✅ Checks Crawler API is healthy
3. ✅ Checks Generator API is healthy
4. ✅ Verifies database schema
5. 🔄 **Triggers a crawl** for "Coffee Shops" in "Austin, TX"
6. ⏳ Polls until businesses appear in DB (up to 2min)
7. 🔄 **Triggers generation** for crawled businesses
8. ⏳ Polls until websites are generated (up to 2min)
9. 📊 Reports success rate

**Output example:**
```
[2026-06-19T...] [CRAWL] ✅ Crawl job enqueued { jobId: 'job_abc123', dbJobId: 'db_xyz789' }
[2026-06-19T...] [CRAWL_MONITOR] ✅ Found 15 businesses
[2026-06-19T...] [GENERATION] ✅ Generation jobs enqueued { count: 5 }
[2026-06-19T...] [GENERATION_MONITOR] ✅ Generated 5/15 websites
[2026-06-19T...] [PHASE_5] ✅ Flow complete! { businessesCrawled: 15, websitesGenerated: 5, successRate: 33% }
```

### Manual Testing (Via Admin UI)

1. **Start frontend:**
   ```bash
   cd apps/frontend && pnpm dev
   ```

2. **Login to admin:**
   - Navigate to `http://localhost:3000/admin-login`
   - Default password: (check `ADMIN_PASSWORD` in .env or ask team)

3. **Test Crawler:**
   - Go to `/admin/crawler`
   - Fill form: Austin, TX, Coffee Shops, 50 results
   - Click "Start Crawl"
   - Watch logs: `tail -f apps/crawler/logs/*.log`

4. **Test Generator:**
   - Go to `/admin/generator`
   - Click "Generate Batch" (defaults to 25 sites)
   - Watch logs: `tail -f apps/generator/logs/*.log`
   - Check `/admin/sites` for generated websites

## Troubleshooting

### Crawl Not Starting

**Symptom:** No businesses appear in database

**Check:**
```bash
# 1. API reachable?
curl http://localhost:3001/health

# 2. Worker running?
docker logs guma-phase1.0-crawler-worker-1 | tail -20

# 3. Redis working?
redis-cli PING  # Should output: PONG

# 4. Queue has jobs?
redis-cli LRANGE bull:guma-crawl:* 0 -1
```

**Common causes:**
- Worker crashed at startup → check logs for WebSocket error (needs `ws` module + Node 20)
- YellowPages blocking requests → try with smaller maxPages
- Redis not running → start Redis first

### Generation Not Starting

**Symptom:** Businesses in DB, but no websites generated

**Check:**
```bash
# 1. Generator API working?
curl http://localhost:3002/health

# 2. Worker running?
docker logs guma-phase1.0-generator-worker-1 | tail -20

# 3. Businesses actually in DB?
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... \
  psql "postgresql://..." -c "SELECT count(*) FROM businesses;"
```

**Common causes:**
- No businesses in DB yet → run crawler first
- All businesses already have sites → the dedup check skips them
- Generator crashed with schema mismatch → check memory issues in schema drift docs

### "Node.js 20 detected without native WebSocket" Error

**Cause:** Supabase JS client needs explicit WebSocket transport on Node 20

**Fix:** Already applied in `db/client.js` — both crawler and generator import `ws` and pass it:
```javascript
realtime: { transport: ws }
```

If still failing, verify:
```bash
npm ls ws  # Should show ws@8.x.x
```

### "Column does not exist" Errors

**Cause:** Database schema mismatch between migration file and live database

**Check live schema:**
```bash
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... \
  psql "postgresql://..." -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'websites' ORDER BY ordinal_position;"
```

**Fix:** Use live column names (see `memory/guma-db-schema-drift.md`):
- websites: `slug`, `generated_at`, `updated_at` (NOT `created_at`, `generation_time_ms`)
- businesses: NO `crawled_at` or `state` (use `city` instead)
- outreach: `to_email` (NOT `email`)

## Performance Benchmarks

On a fresh database (test data):

| Phase | Metric | Expected |
|---|---|---|
| Crawl (YellowPages, 50 results) | Time | 30–120s |
| Crawl | Businesses crawled | 30–50 (varies by captcha/blocks) |
| Generation (template-based, 25 sites) | Time | 15–30s |
| Generation | Success rate | 95%+ (failures = missing data) |
| E2E (crawl + gen) | Total time | 1–3 minutes |

## CI/CD Integration

To add this test to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Test Guma flow
  run: |
    pnpm install
    docker-compose up -d
    sleep 10  # wait for services
    node test-flow.js
```

## Related Docs

- [`PHASE1_DEPLOYMENT.md`](./PHASE1_DEPLOYMENT.md) — Deployment to Railway/Supabase
- [`memory/guma-db-schema-drift.md`](./memory/guma-db-schema-drift.md) — Database schema issues
- [`memory/guma-node20-ws-transport.md`](./memory/guma-node20-ws-transport.md) — WebSocket transport config
