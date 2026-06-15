import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// ==================== LOVABLE IMPORTER ====================
export async function importFromLovable(projectId: string) {
  const importId = await queueImport('lovable', projectId)

  try {
    // Fetch from Lovable API
    const res = await fetch(`https://lovable.dev/api/projects/${projectId}`, {
      headers: { authorization: `Bearer ${process.env.LOVABLE_API_KEY}` },
    })

    if (!res.ok) throw new Error(`Lovable API: ${res.statusText}`)

    const project = await res.json()
    const html = project.html || ''
    const css = project.css || ''
    const js = project.javascript || ''

    // Extract metadata
    const name = project.name || `Lovable-${projectId.slice(0, 8)}`
    const metadata = {
      lovable_url: `https://lovable.dev/projects/${projectId}`,
      original_description: project.description,
      component_count: (html.match(/<div class="component"/g) || []).length,
    }

    // Store raw content
    await updateImportQueue(importId, {
      status: 'parsing',
      raw_html: html,
      raw_css: css,
      raw_js: js,
      extracted_metadata: metadata,
    })

    // Parse and categorize
    const { template, category } = await parseHTMLTemplate(html, css, metadata)

    // Create in draft
    const createdTemplate = await createTemplateFromImport(
      {
        name,
        slug: `lovable-${projectId}`,
        external_id: projectId,
        external_source: 'lovable',
        external_url: `https://lovable.dev/projects/${projectId}`,
        primary_category: category,
        html_content: template.html,
        css_content: template.css,
        js_behavior: template.js,
        status: 'testing',
        created_by_agent: false,
        metadata,
      },
      importId
    )

    // Mark complete
    await updateImportQueue(importId, {
      status: 'completed',
      import_completed_at: new Date().toISOString(),
    })

    return createdTemplate
  } catch (error) {
    await updateImportQueue(importId, {
      status: 'failed',
      error_message: (error as Error).message,
    })
    throw error
  }
}

// ==================== BASE44 IMPORTER ====================
export async function importFromBase44(templateId: string) {
  const importId = await queueImport('base44', templateId)

  try {
    // Fetch from Base44 API
    const res = await fetch(`https://api.base44.com/templates/${templateId}`, {
      headers: { 'x-api-key': process.env.BASE44_API_KEY! },
    })

    if (!res.ok) throw new Error(`Base44 API: ${res.statusText}`)

    const template = await res.json()
    const html = template.html_template || ''
    const css = template.css_template || ''

    const metadata = {
      base44_url: `https://base44.com/templates/${templateId}`,
      category: template.category,
      tags: template.tags || [],
      responsive: template.responsive || false,
      component_library: template.uses_components || [],
    }

    // Store raw
    await updateImportQueue(importId, {
      status: 'parsing',
      raw_html: html,
      raw_css: css,
      extracted_metadata: metadata,
    })

    // Parse
    const { template: parsed, category } = await parseHTMLTemplate(html, css, metadata)

    // Create template
    const createdTemplate = await createTemplateFromImport(
      {
        name: template.name || `Base44-${templateId}`,
        slug: `base44-${templateId}`,
        external_id: templateId,
        external_source: 'base44',
        external_url: `https://base44.com/templates/${templateId}`,
        primary_category: category,
        secondary_categories: metadata.tags,
        html_content: parsed.html,
        css_content: parsed.css,
        status: 'testing',
        created_by_agent: false,
        metadata,
      },
      importId
    )

    await updateImportQueue(importId, {
      status: 'completed',
      import_completed_at: new Date().toISOString(),
    })

    return createdTemplate
  } catch (error) {
    await updateImportQueue(importId, {
      status: 'failed',
      error_message: (error as Error).message,
    })
    throw error
  }
}

// ==================== V0 IMPORTER ====================
export async function importFromV0(projectId: string) {
  const importId = await queueImport('v0', projectId)

  try {
    // Fetch from v0 (Vercel AI) — uses Github gist or direct API
    const res = await fetch(`https://v0.dev/api/projects/${projectId}`, {
      headers: { 'x-api-key': process.env.V0_API_KEY! },
    })

    if (!res.ok) throw new Error(`v0 API: ${res.statusText}`)

    const project = await res.json()
    const html = project.code?.html || project.html || ''
    const css = project.code?.css || project.css || ''
    const jsx = project.code?.jsx || ''

    const metadata = {
      v0_url: `https://v0.dev/t/${projectId}`,
      framework: project.framework || 'html',
      model: project.model || 'gpt-4-vision',
      theme: project.theme,
      components_count: (jsx.match(/export\s+function/g) || []).length,
    }

    await updateImportQueue(importId, {
      status: 'parsing',
      raw_html: html,
      raw_css: css,
      raw_js: jsx,
      extracted_metadata: metadata,
    })

    const { template, category } = await parseHTMLTemplate(html, css, metadata)

    const createdTemplate = await createTemplateFromImport(
      {
        name: project.name || `v0-${projectId.slice(0, 8)}`,
        slug: `v0-${projectId}`,
        external_id: projectId,
        external_source: 'v0',
        external_url: `https://v0.dev/t/${projectId}`,
        primary_category: category,
        html_content: template.html,
        css_content: template.css,
        js_behavior: template.js || jsx,
        status: 'testing',
        created_by_agent: true,
        metadata,
      },
      importId
    )

    await updateImportQueue(importId, {
      status: 'completed',
      import_completed_at: new Date().toISOString(),
    })

    return createdTemplate
  } catch (error) {
    await updateImportQueue(importId, {
      status: 'failed',
      error_message: (error as Error).message,
    })
    throw error
  }
}

// ==================== BOLT IMPORTER ====================
export async function importFromBolt(shareId: string) {
  const importId = await queueImport('bolt', shareId)

  try {
    // Fetch from Bolt.new share link or API
    const res = await fetch(`https://bolt.new/api/share/${shareId}`, {
      headers: { authorization: `Bearer ${process.env.BOLT_API_KEY}` },
    })

    if (!res.ok) throw new Error(`Bolt API: ${res.statusText}`)

    const project = await res.json()
    const html = project.files?.find((f: any) => f.name.endsWith('.html'))?.content || ''
    const css = project.files?.find((f: any) => f.name.endsWith('.css'))?.content || ''
    const js = project.files?.find((f: any) => f.name.endsWith('.js'))?.content || ''

    const metadata = {
      bolt_url: `https://bolt.new/share/${shareId}`,
      files_count: project.files?.length || 0,
      dependencies: project.dependencies || [],
      tech_stack: project.tech_stack || [],
    }

    await updateImportQueue(importId, {
      status: 'parsing',
      raw_html: html,
      raw_css: css,
      raw_js: js,
      extracted_metadata: metadata,
    })

    const { template, category } = await parseHTMLTemplate(html, css, metadata)

    const createdTemplate = await createTemplateFromImport(
      {
        name: project.name || `Bolt-${shareId.slice(0, 8)}`,
        slug: `bolt-${shareId}`,
        external_id: shareId,
        external_source: 'bolt',
        external_url: `https://bolt.new/share/${shareId}`,
        primary_category: category,
        html_content: template.html,
        css_content: template.css,
        js_behavior: template.js || js,
        status: 'testing',
        created_by_agent: true,
        metadata,
      },
      importId
    )

    await updateImportQueue(importId, {
      status: 'completed',
      import_completed_at: new Date().toISOString(),
    })

    return createdTemplate
  } catch (error) {
    await updateImportQueue(importId, {
      status: 'failed',
      error_message: (error as Error).message,
    })
    throw error
  }
}

// ==================== HELPERS ====================

async function queueImport(source: string, externalId: string) {
  const { data, error } = await supabase
    .from('template_import_queue')
    .insert([
      {
        external_source: source,
        external_id: externalId,
        status: 'downloading',
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data.id
}

async function updateImportQueue(id: string, updates: any) {
  const { error } = await supabase
    .from('template_import_queue')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

async function parseHTMLTemplate(html: string, css: string, metadata: any) {
  // Simple heuristic categorization based on content
  let category = 'corporate'

  if (html.includes('product') || html.includes('shop') || html.includes('cart')) {
    category = 'ecommerce'
  } else if (html.includes('doctor') || html.includes('medical') || html.includes('health')) {
    category = 'medical'
  } else if (html.includes('restaurant') || html.includes('menu') || html.includes('food')) {
    category = 'restaurant'
  } else if (html.includes('portfolio') || html.includes('project') || html.includes('work')) {
    category = 'portfolio'
  }

  return {
    template: {
      html: html.trim(),
      css: css.trim(),
      js: '',
    },
    category,
  }
}

async function createTemplateFromImport(templateData: any, importId: string) {
  const { data, error } = await supabase
    .from('template_library')
    .insert([templateData])
    .select()
    .single()

  if (error) throw error

  // Log audit
  await supabase.from('template_audit_log').insert([
    {
      template_id: data.id,
      action: 'imported',
      changes: { source: templateData.external_source },
    },
  ])

  return data
}
