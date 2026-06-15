'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Save, Eye, ExternalLink, Globe, Palette, Type,
  Phone, MapPin, Clock, Mail, ChevronLeft,
  Loader2, CheckCircle2, Settings, Zap, AlertCircle
} from 'lucide-react'

interface SiteData {
  id: string
  slug: string
  plan: string
  status: string
  html_content: string
  custom_domain: string | null
  business: {
    name: string
    category: string
    city: string
    phone: string
    email: string
    address: string
    raw_data: Record<string, any>
  }
}

type Tab = 'editor' | 'domain' | 'settings'

export default function SiteEditorPage() {
  const { slug }   = useParams<{ slug: string }>()
  const router     = useRouter()
  const iframeRef  = useRef<HTMLIFrameElement>(null)

  const [site, setSite]         = useState<SiteData | null>(null)
  const [tab, setTab]           = useState<Tab>('editor')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [loading, setLoading]   = useState(true)
  const [domain, setDomain]     = useState('')
  const [domainSaving, setDomainSaving] = useState(false)

  // Editable fields
  const [fields, setFields] = useState({
    name: '', tagline: '', phone: '', email: '',
    address: '', hours: '', description: '',
  })

  const [rewriting, setRewriting] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/sites/${slug}`)
      .then(r => r.json())
      .then(data => {
        setSite(data)
        setDomain(data.custom_domain || '')
        setFields({
          name:        data.businessName || '',
          tagline:     data.businessCity ? `Serving ${data.businessCity}` : '',
          phone:       data.businessPhone || '',
          email:       data.businessEmail || '',
          address:     data.businessAddress || '',
          hours:       '',
          description: data.businessCategory ? `Professional ${data.businessCategory} services` : '',
        })
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load site:', err)
        setLoading(false)
      })
  }, [slug])

  async function handleSave() {
    setSaving(true)
    const htmlContent = site?.htmlContent || ''
    const updatedHtml = htmlContent
      .replace(/{{BUSINESS_NAME}}/g, fields.name)
      .replace(/{{TAGLINE}}/g, fields.tagline)
      .replace(/{{DESCRIPTION}}/g, fields.description)
      .replace(/{{PHONE}}/g, fields.phone)
      .replace(/{{EMAIL}}/g, fields.email)
      .replace(/{{ADDRESS}}/g, fields.address)
      .replace(/{{HOURS}}/g, fields.hours)

    await fetch(`/api/sites/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ htmlContent: updatedHtml }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    // Refresh iframe
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  async function handleRewrite(fieldKey: string) {
    const text = fields[fieldKey as keyof typeof fields]
    if (!text) return

    setRewriting(fieldKey)
    try {
      const res = await fetch(`/api/sites/${slug}/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          context: `${site?.businessCategory || 'business'} in ${site?.businessCity || 'local area'}`,
          tone: 'professional and compelling',
        }),
      })
      const data = await res.json()
      if (data.rewritten) {
        setFields(f => ({ ...f, [fieldKey]: data.rewritten }))
      }
    } catch (err) {
      console.error('Rewrite failed:', err)
    }
    setRewriting(null)
  }

  async function handleDomainSave() {
    setDomainSaving(true)
    await fetch(`/api/sites/${slug}/domain`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    })
    setDomainSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-warm-gray-400" />
      </div>
    )
  }

  const isPro = site?.plan === 'pro' || site?.plan === 'business'

  return (
    <div className="flex flex-col h-screen bg-warm-gray-50 overflow-hidden">
      {/* Topbar */}
      <div className="h-14 bg-ink flex items-center justify-between px-4 flex-shrink-0 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="text-white/40 hover:text-white/70 transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <span className="text-white/80 text-sm font-medium truncate">
            {fields.name || slug}
          </span>
          <span className={`badge text-[10px] ${
            isPro ? 'bg-indigo/30 text-indigo-light' : 'bg-white/10 text-white/40'
          }`}>
            {site?.plan}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/sites/${slug}`}
            target="_blank"
            className="btn-ghost text-xs py-1.5 px-3 text-white/60 hover:text-white hover:bg-white/10"
          >
            <ExternalLink size={13} /> Preview
          </a>
          <button
            onClick={handleSave}
            disabled={saving || !isPro}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo text-white text-xs font-medium
                       hover:bg-indigo-light disabled:opacity-40 transition-all"
          >
            {saving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : saved ? (
              <><CheckCircle2 size={13} className="text-mint" /> Saved</>
            ) : (
              <><Save size={13} /> Save changes</>
            )}
          </button>
        </div>
      </div>

      {!isPro && (
        <div className="bg-amber-50 border-b border-amber-100 px-5 py-2.5 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 text-amber-800 text-xs">
            <AlertCircle size={14} />
            You're on the free plan — upgrade to Pro to save edits and connect a custom domain
          </div>
          <Link href="/dashboard/upgrade" className="btn-primary text-xs py-1.5 px-3">
            <Zap size={12} /> Upgrade $29/mo
          </Link>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r border-warm-gray-100 flex flex-col overflow-hidden flex-shrink-0">
          {/* Tab nav */}
          <div className="flex border-b border-warm-gray-100">
            {([
              ['editor',   'Content', Type],
              ['domain',   'Domain',  Globe],
              ['settings', 'Settings',Settings],
            ] as [Tab, string, any][]).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors
                  ${tab === id
                    ? 'text-indigo border-b-2 border-indigo'
                    : 'text-warm-gray-400 hover:text-ink'
                  }`}
              >
                <Icon size={13} />{label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* ── Content tab ── */}
            {tab === 'editor' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-warm-gray-500 mb-1.5">Business name</label>
                  <input
                    value={fields.name}
                    onChange={e => setFields(f => ({ ...f, name: e.target.value }))}
                    className="input text-xs py-2"
                    disabled={!isPro}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-warm-gray-500">Tagline</label>
                    {isPro && fields.tagline && (
                      <button
                        onClick={() => handleRewrite('tagline')}
                        disabled={rewriting === 'tagline'}
                        className="text-[10px] text-indigo hover:text-indigo-light disabled:text-warm-gray-300 transition-colors"
                      >
                        {rewriting === 'tagline' ? <Loader2 size={10} className="inline animate-spin" /> : '✨ Improve'}
                      </button>
                    )}
                  </div>
                  <input
                    value={fields.tagline}
                    onChange={e => setFields(f => ({ ...f, tagline: e.target.value }))}
                    placeholder="e.g. Serving Chicago since 1998"
                    className="input text-xs py-2"
                    disabled={!isPro}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-warm-gray-500">Description</label>
                    {isPro && fields.description && (
                      <button
                        onClick={() => handleRewrite('description')}
                        disabled={rewriting === 'description'}
                        className="text-[10px] text-indigo hover:text-indigo-light disabled:text-warm-gray-300 transition-colors"
                      >
                        {rewriting === 'description' ? <Loader2 size={10} className="inline animate-spin" /> : '✨ Improve'}
                      </button>
                    )}
                  </div>
                  <textarea
                    value={fields.description}
                    onChange={e => setFields(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="input text-xs py-2 resize-none"
                    disabled={!isPro}
                  />
                </div>
                <div className="h-px bg-warm-gray-100" />
                {[
                  { key: 'phone',   label: 'Phone',   icon: Phone,   placeholder: '(555) 000-0000' },
                  { key: 'email',   label: 'Email',   icon: Mail,    placeholder: 'you@biz.com' },
                  { key: 'address', label: 'Address', icon: MapPin,  placeholder: '123 Main St' },
                  { key: 'hours',   label: 'Hours',   icon: Clock,   placeholder: 'Mon–Fri 9–5' },
                ].map(({ key, label, icon: Icon, placeholder }) => (
                  <div key={key}>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-warm-gray-500 mb-1.5">
                      <Icon size={11} /> {label}
                    </label>
                    <input
                      value={fields[key as keyof typeof fields]}
                      onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="input text-xs py-2"
                      disabled={!isPro}
                    />
                  </div>
                ))}
              </>
            )}

            {/* ── Domain tab ── */}
            {tab === 'domain' && (
              <div className="space-y-4">
                <div>
                  <div className="section-label mb-3">Free subdomain</div>
                  <div className="bg-warm-gray-50 rounded-xl px-3 py-2.5 text-xs text-warm-gray-500 font-mono border border-warm-gray-100">
                    guma.ai/sites/{slug}
                  </div>
                  <p className="text-xs text-warm-gray-400 mt-1.5">Always active · no action needed</p>
                </div>

                {isPro ? (
                  <div>
                    <div className="section-label mb-3">Custom domain (Pro)</div>
                    <input
                      value={domain}
                      onChange={e => setDomain(e.target.value)}
                      placeholder="yourbusiness.com"
                      className="input text-xs py-2 mb-2"
                    />
                    <button
                      onClick={handleDomainSave}
                      disabled={domainSaving || !domain}
                      className="btn-primary text-xs py-2 w-full justify-center disabled:opacity-50"
                    >
                      {domainSaving ? <Loader2 size={13} className="animate-spin" /> : 'Save domain'}
                    </button>
                    {domain && (
                      <div className="mt-4 p-3 bg-warm-gray-50 rounded-xl border border-warm-gray-100 text-xs space-y-2">
                        <div className="font-medium text-ink">DNS setup required</div>
                        <div className="text-warm-gray-500">Add this CNAME record at your domain registrar:</div>
                        <div className="font-mono bg-white rounded-lg p-2 border border-warm-gray-100">
                          <div className="text-warm-gray-400">Type: <span className="text-ink">CNAME</span></div>
                          <div className="text-warm-gray-400">Name: <span className="text-ink">@</span></div>
                          <div className="text-warm-gray-400">Value: <span className="text-indigo">cname.guma.ai</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-warm-gray-50 border border-warm-gray-100 p-4 text-center">
                    <Globe size={20} className="text-warm-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-warm-gray-500 mb-3">Custom domains are a Pro feature</p>
                    <Link href="/dashboard/upgrade" className="btn-primary text-xs py-2 px-4">
                      Upgrade to Pro
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ── Settings tab ── */}
            {tab === 'settings' && (
              <div className="space-y-4">
                <div className="section-label">Danger zone</div>
                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                  <p className="text-xs text-red-700 font-medium mb-2">Delete site</p>
                  <p className="text-xs text-red-600 mb-3">
                    This will permanently remove your website. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${fields.name}? This cannot be undone.`)) {
                        fetch(`/api/sites/${slug}`, { method: 'DELETE' })
                          .then(() => router.push('/dashboard'))
                      }
                    }}
                    className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-lg
                               hover:bg-red-100 transition-colors"
                  >
                    Delete site
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview pane */}
        <div className="flex-1 flex flex-col overflow-hidden bg-warm-gray-100">
          <div className="h-9 bg-warm-gray-200 flex items-center px-4 gap-2 border-b border-warm-gray-200 flex-shrink-0">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-warm-gray-300" />
              <div className="w-3 h-3 rounded-full bg-warm-gray-300" />
              <div className="w-3 h-3 rounded-full bg-warm-gray-300" />
            </div>
            <div className="flex-1 bg-white rounded-md px-3 py-0.5 text-xs text-warm-gray-400 ml-2 flex items-center gap-1.5">
              <Globe size={10} />
              guma.ai/sites/{slug}
            </div>
          </div>
          <iframe
            ref={iframeRef}
            src={`/sites/${slug}`}
            className="flex-1 w-full border-0 bg-white"
            title="Site preview"
          />
        </div>
      </div>
    </div>
  )
}
