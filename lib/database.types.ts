export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

type BusinessRow = {
  id: string
  name: string
  slug: string
  category: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  country: string
  source_url: string | null
  source_dir: string | null
  has_website: boolean
  raw_data: Json | null
  crawled_at: string
  created_at: string
}

type WebsiteRow = {
  id: string
  business_id: string
  slug: string
  html_content: string | null
  template: string | null
  theme: Json | null
  status: 'generated' | 'claimed' | 'published' | 'deleted'
  claimed_by: string | null
  custom_domain: string | null
  plan: 'free' | 'pro' | 'business'
  views: number
  generated_at: string
  published_at: string | null
}

type OutreachRow = {
  id: string
  business_id: string
  website_id: string
  to_email: string | null
  subject: string | null
  body: string | null
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'claimed'
  opened_at: string | null
  clicked_at: string | null
  sent_at: string | null
  provider_id: string | null
}

type SubscriptionRow = {
  id: string
  user_id: string
  website_id: string
  plan: string
  stripe_sub_id: string | null
  status: string
  current_period_end: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: BusinessRow
        Insert: Partial<BusinessRow>
        Update: Partial<BusinessRow>
        Relationships: []
      }
      websites: {
        Row: WebsiteRow
        Insert: Partial<WebsiteRow>
        Update: Partial<WebsiteRow>
        Relationships: []
      }
      outreach: {
        Row: OutreachRow
        Insert: Partial<OutreachRow>
        Update: Partial<OutreachRow>
        Relationships: []
      }
      subscriptions: {
        Row: SubscriptionRow
        Insert: Partial<SubscriptionRow>
        Update: Partial<SubscriptionRow>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// Convenience aliases
export type Business = BusinessRow
export type Website  = WebsiteRow
export type Outreach = OutreachRow
export type Subscription = SubscriptionRow

export type Plan = 'free' | 'pro' | 'business'

export const PLANS: Record<Plan, { name: string; price: number; features: string[] }> = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Auto-generated website',
      'Guma AI.io/sites/your-biz subdomain',
      'Mobile responsive',
      'Contact button',
      '"Powered by Guma AI" badge',
    ],
  },
  pro: {
    name: 'Pro',
    price: 29,
    features: [
      'Custom domain connection',
      'Full drag-and-drop editor',
      'Remove Guma AI badge',
      'Booking & contact forms',
      'Google Analytics integration',
      'Up to 5 pages',
    ],
  },
  business: {
    name: 'Business',
    price: 79,
    features: [
      'Everything in Pro',
      'Online store (up to 50 products)',
      'Blog CMS',
      'Priority support',
      'Custom email address',
      'Unlimited pages',
    ],
  },
}
