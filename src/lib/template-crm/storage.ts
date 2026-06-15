import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export interface Template {
  id: string
  name: string
  slug: string
  external_id?: string
  external_source: 'lovable' | 'base44' | 'v0' | 'bolt' | 'custom-agent'
  primary_category: string
  secondary_categories?: string[]
  industry_tags?: string[]
  use_case_tags?: string[]
  status: 'draft' | 'testing' | 'validated' | 'production' | 'archived'
  html_content: string
  css_content?: string
  components_used?: string[]
  lighthouse_score?: number
  accessibility_score?: number
  seo_score?: number
  created_at: string
  updated_at: string
}

export async function createTemplate(template: Omit<Template, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('template_library')
    .insert([template])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTemplate(id: string, updates: Partial<Template>) {
  const { data, error } = await supabase
    .from('template_library')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTemplate(id: string) {
  const { data, error } = await supabase
    .from('template_library')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getTemplatesBySource(source: string) {
  const { data, error } = await supabase
    .from('template_library')
    .select('*')
    .eq('external_source', source)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getTemplatesByCategory(category: string) {
  const { data, error } = await supabase
    .from('template_library')
    .select('*')
    .eq('primary_category', category)
    .eq('status', 'production')
    .order('is_featured', { ascending: false })
    .order('downloads', { ascending: false })

  if (error) throw error
  return data
}

export async function searchTemplates(query: string) {
  const { data, error } = await supabase
    .from('template_library')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('status', 'production')

  if (error) throw error
  return data
}

export async function tagTemplate(templateId: string, tags: string[], type: 'industry' | 'use_case') {
  const fieldName = type === 'industry' ? 'industry_tags' : 'use_case_tags'
  const { data, error } = await supabase
    .from('template_library')
    .update({ [fieldName]: tags })
    .eq('id', templateId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function organizeInCollection(collectionId: string, templateIds: string[]) {
  const { data, error } = await supabase
    .from('template_collections')
    .update({ template_ids: templateIds })
    .eq('id', collectionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function recordUsage(templateId: string, websiteId: string, industry: string) {
  const { error } = await supabase
    .from('template_usage_analytics')
    .insert([
      {
        template_id: templateId,
        used_in_website_id: websiteId,
        industry,
      },
    ])

  if (error) throw error
}

export async function updateTemplateStatus(templateId: string, status: string) {
  const { data, error } = await supabase
    .from('template_library')
    .update({
      status,
      published_at: status === 'production' ? new Date().toISOString() : null,
    })
    .eq('id', templateId)
    .select()
    .single()

  if (error) throw error
  return data
}
