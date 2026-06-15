-- Template CRM Storage — comprehensive template management
-- Supports: Lovable, Base44, v0, Bolt, custom AI agents

-- Master template library
create table template_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,

  -- External source tracking
  external_id text,  -- ID from lovable/base44/v0/bolt/etc
  external_source varchar(50) check (external_source in ('lovable', 'base44', 'v0', 'bolt', 'custom-agent')),
  external_url text,

  -- Organization & tagging
  primary_category text not null,  -- 'corporate', 'ecommerce', 'medical', etc.
  secondary_categories text[],
  industry_tags text[],  -- ['dental', 'consulting', 'saas']
  use_case_tags text[],  -- ['landing-page', 'portfolio', 'directory']

  feature_highlights text,
  target_audience text,

  -- Content storage
  html_content text not null,
  css_content text,
  js_behavior text,

  -- Component tracking
  components_used text[],
  design_system_compatible boolean default true,

  -- Status workflow
  status varchar(50) default 'draft' check (status in ('draft', 'testing', 'validated', 'production', 'archived')),

  -- Quality metrics
  lighthouse_score int,
  mobile_optimized boolean default false,
  accessibility_score int,
  seo_score int,
  breakpoints_tested text[],  -- ['320px', '768px', '1440px']

  -- Variant support
  supports_color_variation boolean default true,
  supports_layout_variation boolean default false,
  supports_section_reordering boolean default false,
  built_in_variants text[],

  -- Tracking
  created_by_agent boolean default false,
  created_by_user uuid references auth.users(id),
  current_version text default '1.0',
  latest_production_version text,

  downloads bigint default 0,
  usage_count bigint default 0,
  used_in_websites uuid[],

  is_premium boolean default false,
  is_featured boolean default false,
  is_trending boolean default false,
  deprecation_notice text,

  created_at timestamp default now(),
  updated_at timestamp default now(),
  published_at timestamp,
  archived_at timestamp,

  metadata jsonb default '{}'
);

-- Template versions & history
create table template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references template_library(id) on delete cascade,

  version_number int not null,
  version_tag text,
  change_summary text,
  changes jsonb,  -- {html_changed: true, css_changed: false, ...}

  html_content text,
  css_content text,
  js_behavior text,

  performance_metrics jsonb,  -- {lighthouse: 85, fcp: 1.2, lcp: 2.1}

  created_by_user uuid references auth.users(id),
  created_at timestamp default now(),

  is_current boolean default false,
  is_production boolean default false,

  unique(template_id, version_number)
);

-- Validation results
create table template_validation (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references template_library(id) on delete cascade,

  validation_status varchar(50) check (validation_status in ('pending', 'pass', 'pass_with_warnings', 'fail')),
  tested_at timestamp,
  validated_by uuid references auth.users(id),

  tests_passed int default 0,
  tests_failed int default 0,
  tests_total int default 0,

  -- Scores
  lighthouse_score int,
  performance_score int,
  accessibility_score int,
  best_practices_score int,
  seo_score int,

  -- Details
  components_valid boolean,
  missing_components text[],
  responsiveness_checks jsonb,
  wcag_level varchar(10),  -- 'A', 'AA', 'AAA'

  a11y_issues jsonb[],
  seo_issues jsonb[],
  critical_issues jsonb[],
  warnings jsonb[],

  recommendation varchar(50) check (recommendation in ('approve', 'approve_with_changes', 'reject')),
  notes text,

  created_at timestamp default now()
);

-- Usage analytics
create table template_usage_analytics (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references template_library(id) on delete cascade,

  used_in_website_id uuid,
  industry text,
  color_system_used text,
  typography_system_used text,

  deployed_lighthouse_score int,
  user_rating int check (user_rating >= 1 and user_rating <= 5),
  user_comments text,

  sections_modified boolean,
  colors_customized boolean,
  fonts_customized boolean,

  created_at timestamp default now()
);

-- Import queue
create table template_import_queue (
  id uuid primary key default gen_random_uuid(),

  external_source varchar(50) not null check (external_source in ('lovable', 'base44', 'v0', 'bolt', 'custom-agent')),
  external_id text not null,
  external_url text,

  status varchar(50) default 'pending' check (status in ('pending', 'downloading', 'parsing', 'storing', 'validating', 'completed', 'failed')),

  raw_html text,
  raw_css text,
  raw_js text,

  extracted_metadata jsonb,

  import_started_at timestamp,
  import_completed_at timestamp,
  error_message text,

  created_at timestamp default now(),

  unique(external_source, external_id)
);

-- Template dependencies
create table template_dependencies (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references template_library(id) on delete cascade,

  component_id uuid,
  component_name text,
  color_system_id text,
  typography_system_id text,
  spacing_system_id text,

  created_at timestamp default now()
);

-- Template collections (organize by topic)
create table template_collections (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,
  description text,

  template_ids uuid[] default '{}',

  created_by uuid references auth.users(id),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Audit log
create table template_audit_log (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references template_library(id) on delete cascade,

  action varchar(50) not null check (action in ('created', 'updated', 'validated', 'published', 'archived', 'imported', 'version_created')),
  user_id uuid references auth.users(id),

  changes jsonb,
  previous_values jsonb,
  new_values jsonb,

  ip_address inet,
  user_agent text,

  created_at timestamp default now()
);

-- Indexes
create index idx_template_status on template_library(status);
create index idx_template_category on template_library(primary_category);
create index idx_template_source on template_library(external_source);
create index idx_template_created on template_library(created_at desc);
create index idx_import_status on template_import_queue(status);
create index idx_import_source on template_import_queue(external_source);

-- Row-level security
alter table template_library enable row level security;
alter table template_import_queue enable row level security;
alter table template_validation enable row level security;

-- Admin-only access to template management
create policy "Admin view all templates" on template_library for select using (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and auth.users.raw_user_meta_data->>'is_admin' = 'true')
);

create policy "Admin manage templates" on template_library for all using (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and auth.users.raw_user_meta_data->>'is_admin' = 'true')
);

-- Users see only production templates
create policy "Users view production templates" on template_library for select using (
  status = 'production' or
  exists (select 1 from auth.users where auth.users.id = auth.uid() and auth.users.raw_user_meta_data->>'is_admin' = 'true')
);
