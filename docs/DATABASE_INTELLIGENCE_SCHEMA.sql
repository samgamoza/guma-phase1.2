-- GUMA AI Intelligence Layer Database Schema
-- Run this migration AFTER Phase 1 & Phase 2 schemas
-- Compatible with Supabase PostgreSQL

-- ============================================================
-- PART 1: SCORING & RANKING TABLES
-- ============================================================

-- Template scoring dimensions (updated weekly)
create table if not exists template_scores_v2 (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade unique,

  -- Individual dimension scores (0-100)
  industry_fit_score int,
  design_quality_score int,
  performance_score int,
  conversion_potential_score int,
  user_satisfaction_score int,

  -- Composite score
  overall_score float not null,

  -- Trending data
  uses_last_7_days int default 0,
  uses_7_days_ago int default 0,
  conversion_rate_trend float,  -- percentage change

  -- Calculation metadata
  calculated_at timestamp default now(),
  data_points jsonb,  -- {industry_fit: {deployments: 120, samples: 500}, ...}

  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index idx_template_scores_overall on template_scores_v2(overall_score desc);
create index idx_template_scores_updated on template_scores_v2(updated_at desc);

-- Component scoring (by component + context)
create table if not exists component_scores (
  id uuid primary key default gen_random_uuid(),
  component_id uuid not null references components(id) on delete cascade,

  -- Context
  industry text,  -- null = general score
  context jsonb,  -- {businessModel: "service", ...}

  -- Scores
  design_quality_score int,
  performance_score int,
  conversion_impact_score int,
  compatibility_score int,  -- how well it works with other components

  overall_score float not null,

  -- Trending
  uses_last_7_days int,
  conversion_rate_last_7_days float,

  calculated_at timestamp default now(),
  updated_at timestamp default now(),

  unique(component_id, industry)
);

create index idx_component_scores_overall on component_scores(overall_score desc);
create index idx_component_scores_industry on component_scores(industry);

-- Component compatibility matrix (which components work well together)
create table if not exists component_compatibility (
  id uuid primary key default gen_random_uuid(),
  component_1_id uuid not null references components(id) on delete cascade,
  component_2_id uuid not null references components(id) on delete cascade,

  compatibility_score float not null,  -- 0-1
  design_coherence float,  -- visual consistency
  performance_impact float,  -- speed impact (0-1)

  tested_count int default 0,
  successful_websites int default 0,

  created_at timestamp default now(),
  updated_at timestamp default now(),

  unique(component_1_id, component_2_id),
  check (component_1_id < component_2_id)
);

create index idx_component_compat_score on component_compatibility(compatibility_score desc);

-- Design system scores
create table if not exists design_system_scores (
  id uuid primary key default gen_random_uuid(),
  color_system_id uuid references color_systems(id) on delete cascade,
  typography_system_id uuid references typography_systems(id) on delete cascade,
  spacing_system_id uuid references spacing_systems(id) on delete cascade,

  -- Context
  industry text,
  business_model text,

  -- Score
  overall_score float not null,
  visual_appeal_score float,
  readability_score float,
  brand_fit_score float,

  uses int default 0,
  avg_user_rating float,

  calculated_at timestamp default now(),

  unique(
    coalesce(color_system_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(typography_system_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(spacing_system_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(industry, ''),
    coalesce(business_model, '')
  )
);

create index idx_design_scores_industry on design_system_scores(industry);
create index idx_design_scores_overall on design_system_scores(overall_score desc);

-- ============================================================
-- PART 2: PERFORMANCE TRACKING TABLES
-- ============================================================

-- Deployment performance (track every website deployed)
create table if not exists deployment_performance (
  id uuid primary key default gen_random_uuid(),
  website_id uuid references websites(id) on delete set null,

  -- Generation info
  template_id uuid references templates(id) on delete set null,
  components_used uuid[],
  color_system_id uuid references color_systems(id) on delete set null,
  typography_id uuid references typography_systems(id) on delete set null,

  -- Business context
  industry text,
  business_model text,
  target_audience text,

  -- Deployment info
  deployed_at timestamp default now(),
  deployment_duration_ms int,

  -- Tracking
  tracking_id text unique not null,
  ga_session_id text,
  custom_pixel_installed boolean default false,

  -- User events (updated in real-time)
  total_pageviews bigint default 0,
  total_unique_visitors int default 0,
  avg_session_duration_seconds int,
  bounce_rate float,
  conversions int default 0,
  conversion_rate float,

  -- Revenue
  revenue_attributed numeric(10, 2),
  revenue_confirmed boolean default false,

  -- User satisfaction (inferred from edits)
  user_edits_total int default 0,
  content_edits int default 0,
  design_edits int default 0,
  satisfaction_inferred float,  -- 5.0 - (total_edits * 0.1), capped 1-5

  -- Last updated
  tracked_until timestamp,
  updated_at timestamp default now(),

  created_at timestamp default now()
);

create index idx_deployment_perf_template on deployment_performance(template_id);
create index idx_deployment_perf_industry on deployment_performance(industry);
create index idx_deployment_perf_conversion on deployment_performance(conversion_rate desc);
create index idx_deployment_perf_deployed on deployment_performance(deployed_at desc);

-- Component performance aggregates (updated weekly)
create table if not exists component_performance (
  id uuid primary key default gen_random_uuid(),
  component_id uuid not null references components(id) on delete cascade unique,

  -- Aggregated metrics
  total_deployments bigint default 0,
  avg_conversion_rate float,
  avg_user_rating float,
  avg_edits int,

  -- By industry breakdown
  performance_by_industry jsonb,  -- {dental: {deployments: 10, conversion_rate: 0.05}, ...}

  -- Trending
  uses_last_7_days int,
  conversion_rate_trend float,  -- % change vs. previous 7 days
  trending_direction varchar(50),  -- 'up', 'down', 'stable'

  calculated_at timestamp default now(),
  updated_at timestamp default now(),

  created_at timestamp default now()
);

create index idx_component_perf_deployments on component_performance(total_deployments desc);
create index idx_component_perf_conversion on component_performance(avg_conversion_rate desc);

-- Template performance history (daily snapshots)
create table if not exists template_performance_history (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,

  metric_date date not null,

  deployments_count int,
  conversions_count int,
  avg_conversion_rate float,
  avg_user_rating float,
  total_revenue_attributed numeric(10, 2),

  created_at timestamp default now(),

  unique(template_id, metric_date)
);

create index idx_template_perf_history_date on template_performance_history(metric_date desc);
create index idx_template_perf_history_template on template_performance_history(template_id);

-- ============================================================
-- PART 3: MARKETPLACE IMPORT TABLES
-- ============================================================

-- Marketplace import jobs
create table if not exists marketplace_imports (
  id uuid primary key default gen_random_uuid(),
  marketplace varchar(50) not null,  -- 'base44', 'lovable', 'v0', 'trae', 'framer', 'webflow'
  external_id text,
  external_url text,

  -- Import tracking
  imported_at timestamp default now(),
  last_checked_at timestamp,
  last_updated_at timestamp,

  -- Status
  status varchar(50) default 'pending',  -- 'pending', 'downloading', 'analyzing', 'complete', 'failed'
  error_message text,

  -- Metrics
  file_size_bytes int,
  download_time_ms int,
  analysis_time_ms int,

  -- Result
  template_id uuid references templates(id) on delete set null,

  -- Metadata
  raw_metadata jsonb,  -- original data from marketplace

  created_at timestamp default now(),
  updated_at timestamp default now(),

  unique(marketplace, external_id)
);

create index idx_marketplace_imports_status on marketplace_imports(status);
create index idx_marketplace_imports_marketplace on marketplace_imports(marketplace);
create index idx_marketplace_imports_template on marketplace_imports(template_id);

-- Marketplace API usage tracking
create table if not exists marketplace_api_usage (
  id uuid primary key default gen_random_uuid(),
  marketplace varchar(50) not null,

  -- Rate limiting
  requests_this_hour int default 0,
  requests_limit int,
  reset_at timestamp,

  -- Historical
  total_requests_month int default 0,
  total_templates_imported int default 0,

  last_sync_at timestamp,
  last_sync_status varchar(50),

  updated_at timestamp default now(),

  unique(marketplace)
);

create index idx_marketplace_api_usage_reset on marketplace_api_usage(reset_at);

-- ============================================================
-- PART 4: LEARNING & INSIGHTS TABLES
-- ============================================================

-- Daily learning metrics
create table if not exists learning_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null unique,

  -- Generation stats
  total_websites_generated int,
  avg_generation_time_ms int,
  generation_success_rate float,
  avg_content_quality_score float,

  -- Deployment stats
  total_websites_deployed int,
  deployment_success_rate float,
  avg_deployment_bounce_rate float,
  avg_deployment_conversion_rate float,

  -- User edit stats
  websites_with_edits int,
  avg_edits_per_website float,
  content_edit_ratio float,  -- content edits / total edits

  -- Top performers
  top_template_id uuid references templates(id) on delete set null,
  top_template_uses int,
  top_component_id uuid references components(id) on delete set null,
  top_component_uses int,

  -- AI costs
  total_claude_tokens_used bigint,
  total_generation_cost numeric(10, 2),

  created_at timestamp default now()
);

create index idx_learning_metrics_date on learning_metrics(metric_date desc);

-- Insights generated by learning engine
create table if not exists learning_insights (
  id uuid primary key default gen_random_uuid(),
  insight_type varchar(50) not null,  -- 'template_ranking', 'component_combo', 'industry_mapping', 'theme_recommendation'

  -- Insight
  description text not null,
  recommendation text,

  -- Evidence
  data_points int,  -- how many samples this is based on
  confidence_score float,

  -- Action
  auto_applied boolean default false,
  applied_at timestamp,

  -- Impact
  expected_conversion_lift float,  -- estimated improvement
  actual_lift float,

  -- Tracking
  model_version int,

  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index idx_learning_insights_type on learning_insights(insight_type);
create index idx_learning_insights_applied on learning_insights(auto_applied);
create index idx_learning_insights_confidence on learning_insights(confidence_score desc);

-- ML model versions & performance
create table if not exists model_versions (
  id uuid primary key default gen_random_uuid(),
  model_type varchar(50) not null,  -- 'template_scorer', 'component_ranker', 'theme_recommender'
  version int not null,

  -- Model definition
  formula text,  -- JSON representation of scoring logic
  weights jsonb not null,  -- all weights used
  parameters jsonb,  -- hyperparameters

  -- Performance metrics
  accuracy float,
  precision float,
  recall float,
  f1_score float,

  -- Evaluation
  samples_evaluated int,
  last_evaluated_at timestamp,

  -- Deployment
  deployed_at timestamp,
  active boolean default false,
  previous_version int references model_versions(version) on delete set null,

  created_at timestamp default now(),

  unique(model_type, version)
);

create index idx_model_versions_active on model_versions(active) where active = true;
create index idx_model_versions_deployed on model_versions(deployed_at desc);

-- User feedback on recommendations
create table if not exists recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,

  -- What was recommended
  generation_context jsonb,  -- {industry: "dental", prompt: "...", ...}
  selected_template_id uuid references templates(id) on delete set null,

  -- Feedback
  feedback_type varchar(50),  -- 'positive', 'negative', 'neutral'
  rating int,  -- 1-5 stars
  comment text,

  -- Outcome
  deployment_success boolean,
  conversion_achieved boolean,

  created_at timestamp default now()
);

create index idx_recommendation_feedback_user on recommendation_feedback(user_id);
create index idx_recommendation_feedback_type on recommendation_feedback(feedback_type);

-- ============================================================
-- PART 5: GENERATION ANALYTICS TABLES
-- ============================================================

-- Track every generation for learning
create table if not exists generation_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,

  -- Input
  prompt text,
  business_context jsonb,
  generation_options jsonb,  -- {tone: "friendly", complexity: "simple", ...}

  -- Selection
  orchestrator_scores jsonb,  -- {template: {score: 0.92, ...}, components: {...}, ...}
  selected_template_id uuid references templates(id) on delete set null,
  selected_components jsonb,  -- {hero: uuid, features: uuid, ...}

  -- Generation
  claude_tokens_used int,
  generation_time_ms int,
  generation_cost numeric(10, 2),

  -- Output
  website_id uuid references websites(id) on delete set null,
  content_quality_score float,
  seo_score float,

  -- Outcome
  user_accepted boolean,
  user_rating int,

  created_at timestamp default now()
);

create index idx_generation_log_user on generation_log(user_id);
create index idx_generation_log_template on generation_log(selected_template_id);
create index idx_generation_log_accepted on generation_log(user_accepted);
create index idx_generation_log_created on generation_log(created_at desc);

-- ============================================================
-- PART 6: CACHE TABLES (for quick access)
-- ============================================================

-- Cache of orchestrator recommendations (TTL: 1 hour)
create table if not exists orchestrator_cache (
  id uuid primary key default gen_random_uuid(),
  context_hash varchar(64) unique not null,  -- SHA256 of context JSON
  context jsonb not null,

  recommendation jsonb not null,
  confidence float,

  hits int default 0,

  created_at timestamp default now(),
  expires_at timestamp not null
);

create index idx_orchestrator_cache_hash on orchestrator_cache(context_hash);
create index idx_orchestrator_cache_expires on orchestrator_cache(expires_at);

-- ============================================================
-- PART 7: INDEXES FOR PERFORMANCE
-- ============================================================

-- Composite indexes for common queries
create index idx_deployment_perf_conversion_industry on deployment_performance(industry, conversion_rate desc);
create index idx_component_compat_pair on component_compatibility(component_1_id, component_2_id);
create index idx_template_scores_trending on template_scores_v2(uses_7_days_ago, uses_last_7_days);

-- ============================================================
-- PART 8: ROW-LEVEL SECURITY (RLS)
-- ============================================================

-- Deployment performance is private to admin + business owner
alter table deployment_performance enable row level security;

create policy "admin_view_all_deployments" on deployment_performance
for select using (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and auth.users.raw_user_meta_data->>'is_admin' = 'true')
);

create policy "user_view_own_deployments" on deployment_performance
for select using (
  website_id in (select id from websites where created_by = auth.uid())
);

-- Insights are public (read-only)
alter table learning_insights enable row level security;
create policy "public_view_insights" on learning_insights for select using (true);

-- Feedback is private
alter table recommendation_feedback enable row level security;
create policy "user_view_own_feedback" on recommendation_feedback for select using (user_id = auth.uid());

-- Generation logs are private
alter table generation_log enable row level security;
create policy "user_view_own_generations" on generation_log for select using (user_id = auth.uid());

-- ============================================================
-- PART 9: MATERIALIZED VIEWS (for aggregations)
-- ============================================================

-- Template ranking view (refreshed daily)
create materialized view if not exists template_rankings as
select
  t.id,
  t.name,
  t.industry,
  ts.overall_score,
  ts.industry_fit_score,
  ts.design_quality_score,
  ts.performance_score,
  ts.conversion_potential_score,
  ts.user_satisfaction_score,
  ts.uses_last_7_days,
  ts.conversion_rate_trend,
  dp.avg_conversion_rate,
  dp.avg_user_rating,
  rank() over (order by ts.overall_score desc) as rank_overall,
  rank() over (partition by t.industry order by ts.overall_score desc) as rank_by_industry
from templates t
left join template_scores_v2 ts on t.id = ts.template_id
left join (
  select template_id, avg(conversion_rate) as avg_conversion_rate, avg(satisfaction_inferred) as avg_user_rating
  from deployment_performance
  where deployed_at > now() - interval '30 days'
  group by template_id
) dp on t.id = dp.template_id
where t.status = 'production';

create unique index idx_template_rankings_id on template_rankings(id);

-- Component rankings by industry
create materialized view if not exists component_rankings as
select
  c.id,
  c.name,
  c.type,
  cs.industry,
  cs.overall_score,
  cs.design_quality_score,
  cs.performance_score,
  cs.conversion_impact_score,
  cs.uses_last_7_days,
  rank() over (partition by c.type, cs.industry order by cs.overall_score desc) as rank_by_type_industry
from components c
left join component_scores cs on c.id = cs.component_id
where c.status = 'production';

create unique index idx_component_rankings_id on component_rankings(id, industry);

-- ============================================================
-- PART 10: TRIGGERS (for automatic updates)
-- ============================================================

-- Automatically update deployment_performance.tracked_until
create or replace function update_deployment_tracked_until()
returns trigger as $$
begin
  update deployment_performance
  set tracked_until = now()
  where tracking_id = new.tracking_id;
  return new;
end;
$$ language plpgsql;

-- Trigger on GA event table (if we store events directly)
-- create trigger update_deployment_tracked on ga_events after insert
-- for each row execute function update_deployment_tracked_until();

-- ============================================================
-- PART 11: GRANTS (permissions)
-- ============================================================

-- Service accounts can read/write intelligence tables
-- (Grant these to your service user once accounts are created)
-- grant select, insert, update on all tables in schema public to intelligence_service;
-- grant select on all tables in schema public to analytics_service;

-- ============================================================
-- PART 12: BACKUP & MAINTENANCE
-- ============================================================

-- Enable change data capture for tables used in analytics
-- alter table deployment_performance enable replica identity full;
-- alter table generation_log enable replica identity full;

-- ============================================================
-- Migration Complete
-- ============================================================

-- Verify all tables created
select
  table_name,
  (select count(*) from information_schema.columns where table_name = t.table_name) as column_count
from information_schema.tables t
where table_schema = 'public'
  and table_name like '%deployment_%'
  or table_name like '%component_%'
  or table_name like '%template_score%'
  or table_name like '%learning_%'
  or table_name like '%marketplace_%'
  or table_name like '%generation_%'
order by table_name;
