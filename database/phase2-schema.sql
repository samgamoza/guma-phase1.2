-- PHASE 2: Premium Advanced Builder
-- Subscription-gated features for paid users ($29-$299/mo)

-- Premium subscription tiers
create table subscription_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,  -- 'pro', 'business', 'enterprise'
  slug text not null unique,
  price_monthly numeric(10, 2),
  price_yearly numeric(10, 2),

  -- Features
  max_websites int,  -- how many premium sites they can create
  max_components_per_site int,
  ai_rewrites_per_month int,  -- how many AI rewrites included
  color_systems_available int,  -- how many color systems
  typography_systems_available int,

  features text[],  -- ['advanced-builder', 'ai-rewrites', 'custom-domain', 'seo-tools', 'analytics', 'a-b-testing']

  created_at timestamp default now()
);

-- User subscriptions
create table user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier_id uuid not null references subscription_tiers(id),

  status varchar(50) check (status in ('active', 'paused', 'canceled', 'past_due')),
  stripe_subscription_id text,
  stripe_customer_id text,

  current_period_start timestamp,
  current_period_end timestamp,

  ai_rewrites_used int default 0,
  premium_websites_created int default 0,

  created_at timestamp default now(),
  updated_at timestamp default now(),

  unique(user_id, tier_id)
);

-- Premium website builder sessions
create table premium_builder_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  website_id uuid not null references websites(id) on delete cascade,

  -- Template & base
  base_template_id uuid references templates(id),

  -- Component assembly
  hero_component_id uuid references components(id),
  features_component_id uuid references components(id),
  pricing_component_id uuid references components(id),
  testimonials_component_id uuid references components(id),
  faq_component_id uuid references components(id),
  cta_component_id uuid references components(id),
  footer_component_id uuid references components(id),

  -- Design customization
  selected_color_system text,  -- primary color system applied
  selected_typography_system text,
  custom_primary_color text,
  custom_secondary_color text,
  custom_accent_color text,

  -- Content customization
  hero_headline text,
  hero_subheading text,
  hero_cta_text text,

  feature_headlines text[],
  feature_descriptions text[],

  pricing_tiers jsonb[],  -- [{name: 'Starter', price: 29, features: [...]}, ...]

  testimonial_names text[],
  testimonial_quotes text[],
  testimonial_roles text[],

  faq_questions text[],
  faq_answers text[],

  footer_company_name text,
  footer_email text,
  footer_phone text,

  -- Sections & reordering
  visible_sections text[],  -- ['hero', 'features', 'pricing', 'testimonials', 'faq', 'cta', 'footer']
  section_order text[],  -- reordered section sequence

  -- AI customizations
  ai_rewrites_used int default 0,
  ai_rewrite_history jsonb[],  -- [{section: 'hero', original: '...', rewritten: '...', timestamp}]

  -- Variants generated
  variant_count int default 0,
  active_variant varchar(50) default 'original',  -- 'original', 'variant_1', 'variant_2', etc.

  -- Status
  status varchar(50) default 'draft' check (status in ('draft', 'editing', 'previewing', 'published', 'archived')),

  created_at timestamp default now(),
  updated_at timestamp default now(),
  published_at timestamp
);

-- Website variants (A/B testing & alternatives)
create table website_variants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references premium_builder_sessions(id) on delete cascade,

  variant_name text,  -- 'original', 'variant_1_minimal', 'variant_2_bold', etc.
  variant_type varchar(50),  -- 'original', 'color_swap', 'layout_variation', 'copy_variation', 'component_swap'

  -- Content
  html_content text not null,

  -- Customizations applied
  color_system_applied text,
  typography_applied text,
  section_reorder_applied text[],
  components_used uuid[],

  -- Performance metrics
  page_speed_score int,
  lighthouse_score int,
  seo_score int,

  -- A/B test data
  ab_test_enabled boolean default false,
  traffic_percentage float,
  conversions int default 0,
  views int default 0,
  conversion_rate float,

  created_at timestamp default now(),
  updated_at timestamp default now(),

  unique(session_id, variant_name)
);

-- Design systems (6 color, 4 typography, 3 spacing)
create table color_systems (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,

  primary_color text,
  secondary_color text,
  accent_color text,
  success_color text,
  warning_color text,
  error_color text,
  background_color text,
  text_color text,

  preview_image_url text,

  compatible_with text[],  -- template IDs

  created_at timestamp default now()
);

create table typography_systems (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,

  heading_font text,
  body_font text,
  mono_font text,

  h1_size int,  -- pixels
  h2_size int,
  h3_size int,
  body_size int,
  small_size int,

  heading_weight int,  -- font weight
  body_weight int,

  line_height_heading float,
  line_height_body float,

  preview_image_url text,
  compatible_with text[],

  created_at timestamp default now()
);

create table spacing_systems (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,

  xs_spacing int,  -- pixels
  sm_spacing int,
  md_spacing int,
  lg_spacing int,
  xl_spacing int,
  xxl_spacing int,

  compatible_with text[],

  created_at timestamp default now()
);

-- AI-powered content generation
create table ai_rewrites (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references premium_builder_sessions(id) on delete cascade,

  section text,  -- 'hero', 'features', 'pricing', 'testimonials', etc.

  original_content text,
  rewritten_content text,

  rewrite_style varchar(50),  -- 'casual', 'professional', 'playful', 'persuasive', 'technical'
  tone varchar(50),  -- 'friendly', 'formal', 'humorous', 'authoritative'

  prompt_used text,
  model_used text,  -- 'claude-sonnet-4-6', 'claude-opus-4-8'

  user_feedback text,  -- 'good', 'revise', 'regenerate'
  approved boolean default false,

  created_at timestamp default now()
);

-- Component customization log
create table component_edits (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references premium_builder_sessions(id) on delete cascade,
  component_id uuid references components(id),

  edit_type varchar(50),  -- 'color_swap', 'text_edit', 'layout_change', 'remove_section', 'reorder_section'

  original_value text,
  new_value text,

  section_name text,

  created_at timestamp default now()
);

-- Premium site deployments
create table premium_deployments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references premium_builder_sessions(id) on delete cascade,

  deployed_url text,
  custom_domain text,
  ssl_certificate_status varchar(50),  -- 'pending', 'issued', 'expired'

  deployed_at timestamp,
  last_updated_at timestamp,

  -- Performance after deployment
  actual_lighthouse_score int,
  actual_page_speed int,
  actual_seo_score int,
  actual_mobile_score int,

  -- Analytics
  total_views bigint default 0,
  total_conversions bigint default 0,
  avg_time_on_page int,  -- seconds
  bounce_rate float,

  created_at timestamp default now()
);

-- Indexes
create index idx_subscriptions_user on user_subscriptions(user_id);
create index idx_subscriptions_status on user_subscriptions(status);
create index idx_builder_sessions_user on premium_builder_sessions(user_id);
create index idx_builder_sessions_status on premium_builder_sessions(status);
create index idx_variants_session on website_variants(session_id);
create index idx_rewrites_session on ai_rewrites(session_id);
create index idx_deployments_session on premium_deployments(session_id);

-- RLS Policies
alter table user_subscriptions enable row level security;
alter table premium_builder_sessions enable row level security;
alter table website_variants enable row level security;
alter table ai_rewrites enable row level security;
alter table premium_deployments enable row level security;

-- Users can see their own subscription
create policy "users_own_subscription" on user_subscriptions for select using (auth.uid() = user_id);

-- Users can see their own builder sessions
create policy "users_own_builder_sessions" on premium_builder_sessions for select using (auth.uid() = user_id);
create policy "users_edit_own_builder_sessions" on premium_builder_sessions for update using (auth.uid() = user_id);

-- Users can see their own variants
create policy "users_own_variants" on website_variants for select using (
  exists (select 1 from premium_builder_sessions where premium_builder_sessions.id = session_id and premium_builder_sessions.user_id = auth.uid())
);

-- Design systems are public
create policy "public_view_design_systems" on color_systems for select using (true);
create policy "public_view_typography" on typography_systems for select using (true);
create policy "public_view_spacing" on spacing_systems for select using (true);
