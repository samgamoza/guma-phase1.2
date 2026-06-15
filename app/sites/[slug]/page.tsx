import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function SitePage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient()

  const { data: site } = await supabase
    .from('websites')
    .select('html_content, status, views')
    .eq('slug', params.slug)
    .in('status', ['generated', 'published'])
    .single()

  if (!site?.html_content) notFound()

  // Increment view counter (fire and forget)
  supabase.rpc('increment_site_views', { site_slug: params.slug }).then(() => {}).catch(() => {})

  // Serve raw HTML directly
  return (
    <div
      dangerouslySetInnerHTML={{ __html: site.html_content }}
      style={{ margin: 0, padding: 0 }}
    />
  )
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('websites')
    .select('businesses(name, category, city)')
    .eq('slug', params.slug)
    .single()

  const biz = (data as any)?.businesses
  return {
    title: biz?.name ? `${biz.name} — Guma AI` : 'Guma AI',
    description: biz
      ? `${biz.name} in ${biz.city || 'your area'} — ${biz.category || 'local business'}`
      : 'Local business website powered by Guma AI',
  }
}
