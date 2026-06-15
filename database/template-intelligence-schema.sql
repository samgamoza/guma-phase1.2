-- TEMPLATE INTELLIGENCE CENTER — Master template & component library
-- Centralized repository powering all website generation without hardcoding

-- Core template records
create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,

  -- Source tracking
  source varchar(50) not null check (source in ('base44', 'lovable', 'bolt', 'v0', 'framer', 'webflow', 'html', 'react', 'nextjs', 'tailwind', 'agency-custom', 'other')),
  source_id text,  -- external ID from source
  source_url text,

  -- Classification
  category text not null,  -- 'landing-page', 'ecommerce', 'portfolio', 'blog', 'saas', 'corporate', etc.
  industry text,  -- 'dental', 'consulting', 'medical', 'restaurant', etc.
  style varchar(50),  -- 'modern', 'minimal', 'luxury', 'playful', 'corporate', etc.
  target_audience text,  -- 'startups', 'enterprises', 'freelancers', etc.
  business_model varchar(50),  -- 'service', 'product', 'marketplace', 'saas', 'subscription', etc.

  -- Framework & tech
  framework varchar(50),  -- 'html', 'react', 'nextjs', 'svelte', etc.
  includes_tailwind boolean default false,
  includes_typescript boolean default false,
  dependencies jsonb,  -- {nextjs: "14.0", tailwind: "3.4"}

  -- Content storage
  html_content text,
  css_content text,
  js_content text,
  react_jsx text,  -- if React template
  metadata_json jsonb,  -- original template metadata

  -- Responsive & performance
  is_responsive boolean default true,
  breakpoints text[],  -- ['320px', '768px', '1440px']
  tested_browsers text[],  -- ['chrome', 'safari', 'firefox', 'edge']

  -- SEO & accessibility
  seo_optimized boolean default false,
  seo_score int,  -- 0-100
  accessibility_score int,  -- 0-100, wcag compliance
  accessibility_level varchar(10),  -- 'A', 'AA', 'AAA'

  -- Performance
  performance_score int,  -- 0-100, based on lighthouse
  lighthouse_score int,
  page_speed_score int,
  core_web_vitals jsonb,  -- {fcp: 1.2, lcp: 2.3, cls: 0.1}

  -- Conversion & quality
  conversion_score int,  -- 0-100, based on CTA/form presence
  has_cta boolean,
  has_contact_form boolean,
  has_newsletter_signup boolean,
  has_pricing boolean,
  estimated_conversion_rate float,

  -- Component inventory (auto-extracted)
  sections_detected jsonb,  -- {hero: true, features: true, pricing: false, ...}
  components_found text[],  -- ['hero-section', 'navbar', 'pricing-table', ...]
  component_count int,

  -- Design system info
  color_palettes jsonb[],  -- [{primary: '#xxx', secondary: '#yyy'}, ...]
  typography_system jsonb,  -- {headings: 'Inter', body: 'Poppins', sizes: [...]}
  spacing_scale jsonb,  -- {xs: '4px', sm: '8px', md: '16px', ...}
  design_tokens jsonb,

  -- Image placeholders & recommendations
  has_images boolean,
  image_count int,
  image_requirements jsonb,  -- {hero: '1920x1080', feature: '400x300'}
  recommended_image_sources text[],  -- ['unsplash', 'pexels', 'your-own']

  -- Status & versioning
  status varchar(50) default 'draft' check (status in ('draft', 'analyzing', 'validated', 'production', 'archived')),
  version text default '1.0',
  published_date timestamp,
  archived_date timestamp,

  -- Metadata & tagging
  tags text[],  -- ['modern', 'minimal', 'dark-mode', 'animations', ...]
  features text[],  -- ['dark-mode', 'animations', 'parallax', 'video-bg', ...]

  -- Tracking & analytics
  created_by uuid references auth.users(id),
  created_at timestamp default now(),
  updated_at timestamp default now(),
  last_ingestion_at timestamp,

  -- Performance metrics
  total_uses bigint default 0,
  total_conversions bigint default 0,
  conversion_rate_observed float,
  total_revenue_attributed numeric(10, 2),
  avg_user_rating float,
  total_ratings int default 0,

  -- Admin notes
  notes text,
  admin_verified boolean default false,
  verified_by uuid references auth.users(id),
  verified_at timestamp
);

-- Component library (auto-extracted from templates)
create table components (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,

  type varchar(50) not null,  -- 'hero', 'navbar', 'cta', 'testimonial', 'pricing', 'faq', 'footer', etc.
  category varchar(50),  -- 'navigation', 'section', 'form', 'social', 'media', etc.

  -- Origin
  extracted_from_templates uuid[],  -- which templates this came from
  is_original boolean default false,  -- vs extracted from another template
  source_template_id uuid references templates(id),

  -- Content & code
  html_snippet text,
  css_snippet text,
  js_snippet text,

  -- Design
  color_compatible jsonb,  -- can work with these color systems
  responsive_compatible boolean,
  supports_dark_mode boolean,
  height_pixels int,
  width_percentage int default 100,

  -- Compatibility
  frameworks text[],  -- 'html', 'react', 'vue', etc.
  requires_libraries text[],

  -- Metadata
  copy_variations int,  -- how many text variations we have
  image_placeholders int,
  animation_complexity varchar(50),  -- 'none', 'simple', 'complex'

  -- Usage
  used_in_websites bigint default 0,
  avg_rating float,
  is_popular boolean generated always as (used_in_websites > 50) stored,

  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Template ingestion pipeline tracking
create table template_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),

  -- Source
  source varchar(50) not null,
  source_id text,
  source_url text,

  -- Pipeline steps
  step_1_structure_analysis boolean default false,
  step_2_section_identification boolean default false,
  step_3_component_extraction boolean default false,
  step_4_design_pattern_extraction boolean default false,
  step_5_color_system_extraction boolean default false,
  step_6_typography_extraction boolean default false,
  step_7_industry_classification boolean default false,
  step_8_metadata_generation boolean default false,
  step_9_component_storage boolean default false,
  step_10_template_dna_storage boolean default false,

  -- Results
  status varchar(50) default 'queued' check (status in ('queued', 'in_progress', 'completed', 'failed')),
  resulting_template_id uuid references templates(id),
  error_message text,

  raw_content text,  -- original upload
  analysis_results jsonb,  -- full analysis output

  started_at timestamp,
  completed_at timestamp,
  created_at timestamp default now()
);

-- Template DNA (learned patterns & reusable recipes)
create table template_dna (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,

  -- Pattern information
  pattern_name text,  -- 'ecommerce-conversion-flow', 'saas-landing-hero', etc.
  pattern_description text,
  pattern_type varchar(50),  -- 'section-sequence', 'component-combo', 'color-scheme', etc.

  -- Reusable parts
  hero_section jsonb,
  features_section jsonb,
  pricing_section jsonb,
  testimonials_section jsonb,
  faq_section jsonb,
  cta_section jsonb,
  footer_section jsonb,

  -- Success indicators
  historical_conversion_rate float,
  performance_characteristics jsonb,
  best_suited_for jsonb,  -- {industries: ['saas', 'consulting'], audiences: ['B2B'], etc.}

  created_at timestamp default now()
);

-- Template scoring & ranking
create table template_scores (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,

  -- User intent matching (0-100)
  intent_match_score int,
  industry_fit_score int,
  audience_match_score int,
  style_preference_match int,

  -- Quality metrics (0-100)
  overall_quality_score int,
  design_quality_score int,
  code_quality_score int,
  content_quality_score int,

  -- Performance metrics (0-100)
  speed_score int,
  seo_score int,
  accessibility_score int,
  mobile_score int,

  -- Business metrics (0-100)
  conversion_potential_score int,
  revenue_potential_score int,
  user_satisfaction_score int,

  -- Composite scores
  overall_ranking_score int generated always as (
    (intent_match_score * 0.2 +
     overall_quality_score * 0.2 +
     speed_score * 0.15 +
     conversion_potential_score * 0.25 +
     user_satisfaction_score * 0.2)::int
  ) stored,

  calculated_at timestamp default now(),
  updated_at timestamp default now()
);

-- Component-to-component relationships (for mix-and-match)
create table component_combinations (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references templates(id) on delete cascade,

  hero_component_id uuid references components(id),
  features_component_id uuid references components(id),
  pricing_component_id uuid references components(id),
  testimonials_component_id uuid references components(id),
  faq_component_id uuid references components(id),
  cta_component_id uuid references components(id),
  footer_component_id uuid references components(id),

  -- How well they work together
  compatibility_score int,  -- 0-100
  has_been_tested boolean,
  works_well_together boolean,

  created_at timestamp default now()
);

-- Template usage & performance tracking
create table template_usage (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,

  -- Website generated
  website_id uuid,
  business_industry text,
  business_type varchar(50),

  -- Performance
  deployed_at timestamp,
  page_speed_score int,
  user_bounce_rate float,
  avg_session_duration int,
  conversion_achieved boolean,
  revenue_generated numeric(10, 2),

  -- User feedback
  user_rating int check (user_rating >= 1 and user_rating <= 5),
  user_feedback text,
  would_recommend boolean,

  -- Customizations
  sections_modified boolean,
  colors_changed boolean,
  fonts_changed boolean,
  images_replaced boolean,
  content_rewritten boolean,
  components_swapped boolean,

  created_at timestamp default now()
);

-- Template marketplace (approved templates & packs)
create table template_packs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  pack_type varchar(50),  -- 'industry', 'premium', 'seasonal', 'agency'

  template_ids uuid[] not null,  -- templates in this pack
  category text,
  target_audience text,

  is_published boolean default false,
  published_at timestamp,

  created_by uuid references auth.users(id),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Template recommendations (why was this template selected)
create table template_recommendations (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,
  website_id uuid,

  -- Decision factors
  matched_industry boolean,
  matched_business_model boolean,
  matched_audience boolean,
  matched_style_preference boolean,
  high_performance_history boolean,
  high_conversion_history boolean,

  -- Explanation
  recommendation_reason text,
  confidence_score float,  -- 0-1

  created_at timestamp default now()
);

-- Indexes
create index idx_templates_status on templates(status);
create index idx_templates_source on templates(source);
create index idx_templates_category on templates(category);
create index idx_templates_industry on templates(industry);
create index idx_templates_ranking on templates(admin_verified desc, total_uses desc);
create index idx_components_type on components(type);
create index idx_component_popularity on components(used_in_websites desc);
create index idx_ingestion_status on template_ingestion_jobs(status);
create index idx_scores_overall on template_scores(overall_ranking_score desc);
create index idx_usage_revenue on template_usage(revenue_generated desc);

-- Row-level security
alter table templates enable row level security;
alter table components enable row level security;
alter table template_ingestion_jobs enable row level security;

-- Public: view production templates only
create policy "public_view_production" on templates for select using (status = 'production');

-- Admin: full access
create policy "admin_all_access" on templates for all using (
  exists (select 1 from auth.users where auth.users.id = auth.uid() and auth.users.raw_user_meta_data->>'is_admin' = 'true')
);

-- Components public
create policy "public_view_components" on components for select using (true);
