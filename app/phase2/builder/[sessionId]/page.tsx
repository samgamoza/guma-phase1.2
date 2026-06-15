'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Phase2BuilderPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'hero' | 'features' | 'pricing' | 'design' | 'preview'>(
    'hero'
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Hero section state
  const [heroHeadline, setHeroHeadline] = useState('')
  const [heroSubheading, setHeroSubheading] = useState('')
  const [heroCTA, setHeroCTA] = useState('')

  // Features state
  const [features, setFeatures] = useState<Array<{ headline: string; description: string }>>([])

  // Pricing state
  const [pricingTiers, setPricingTiers] = useState<Array<any>>([])

  // Design state
  const [selectedColorSystem, setSelectedColorSystem] = useState('')
  const [selectedTypography, setSelectedTypography] = useState('')

  useEffect(() => {
    fetchSession()
  }, [])

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/phase2/builder?id=${params.sessionId}`)
      const data = await res.json()
      setSession(data)
      setHeroHeadline(data.hero_headline || '')
      setHeroSubheading(data.hero_subheading || '')
      setHeroCTA(data.hero_cta_text || '')
    } catch (error) {
      console.error('Failed to fetch session:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveChanges = async (action: string, payload: any) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/phase2/builder?id=${params.sessionId}&action=${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Save failed')

      alert('✅ Changes saved')
      fetchSession()
    } catch (error) {
      alert(`❌ Error: ${(error as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleRewriteSection = async (section: string, content: string) => {
    try {
      const res = await fetch('/api/phase2/ai-rewrites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: params.sessionId,
          section,
          originalContent: content,
          action: 'rewrite',
          style: 'professional',
          tone: 'friendly',
        }),
      })

      const data = await res.json()
      if (section === 'hero') {
        setHeroHeadline(data.rewrittenContent)
      }
      alert('✅ Copy rewritten by AI')
    } catch (error) {
      alert(`❌ Error: ${(error as Error).message}`)
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading builder...</p>
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advanced Builder</h1>
            <p className="text-sm text-gray-600 mt-1">Premium website customization</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('preview')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50"
            >
              Preview
            </button>
            <button
              onClick={() => {
                alert('✅ Website published!')
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Publish
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="space-y-2">
            {(['hero', 'features', 'pricing', 'design', 'preview'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  activeTab === tab
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab === 'hero' && '🎯 Hero Section'}
                {tab === 'features' && '✨ Features'}
                {tab === 'pricing' && '💰 Pricing'}
                {tab === 'design' && '🎨 Design System'}
                {tab === 'preview' && '👁️ Preview'}
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="col-span-3">
            {/* HERO TAB */}
            {activeTab === 'hero' && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Hero Section</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Headline
                    </label>
                    <input
                      type="text"
                      value={heroHeadline}
                      onChange={(e) => setHeroHeadline(e.target.value)}
                      placeholder="Enter compelling headline..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleRewriteSection('hero', heroHeadline)}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      ✨ Rewrite with AI
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Subheading
                    </label>
                    <textarea
                      value={heroSubheading}
                      onChange={(e) => setHeroSubheading(e.target.value)}
                      placeholder="Supporting text..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={heroCTA}
                      onChange={(e) => setHeroCTA(e.target.value)}
                      placeholder="e.g., Get Started Free"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    onClick={() =>
                      saveChanges('update-hero', {
                        headline: heroHeadline,
                        subheading: heroSubheading,
                        ctaText: heroCTA,
                      })
                    }
                    disabled={saving}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Hero Section'}
                  </button>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-blue-900">
                      💡 <strong>Tip:</strong> Use AI to rewrite your copy in different styles and
                      tones. Your rewrite quota: 10/50 remaining.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* FEATURES TAB */}
            {activeTab === 'features' && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Features Section</h2>
                <p className="text-gray-600 mb-6">Highlight your key features and benefits.</p>

                <div className="space-y-4 mb-6">
                  {[1, 2, 3].map((idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <input
                        type="text"
                        placeholder="Feature name"
                        className="w-full px-3 py-2 border border-gray-300 rounded mb-3 text-sm"
                      />
                      <textarea
                        placeholder="Feature description..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      ></textarea>
                    </div>
                  ))}
                </div>

                <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700">
                  Save Features
                </button>
              </div>
            )}

            {/* PRICING TAB */}
            {activeTab === 'pricing' && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing Tiers</h2>

                <div className="grid grid-cols-3 gap-6 mb-6">
                  {['Starter', 'Professional', 'Enterprise'].map((tier) => (
                    <div key={tier} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900">{tier}</h3>
                      <input
                        type="number"
                        placeholder="Price"
                        className="w-full px-3 py-2 border border-gray-300 rounded mt-2 mb-3 text-sm"
                      />
                      <textarea
                        placeholder="Features (one per line)"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      ></textarea>
                    </div>
                  ))}
                </div>

                <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700">
                  Save Pricing
                </button>
              </div>
            )}

            {/* DESIGN TAB */}
            {activeTab === 'design' && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Design System</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Color System
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {['Modern Blue', 'Luxury Gold', 'Playful Purple'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColorSystem(color)}
                          className={`p-4 rounded-lg border-2 transition ${
                            selectedColorSystem === color
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex gap-2 mb-2">
                            <div className="w-6 h-6 rounded bg-blue-500"></div>
                            <div className="w-6 h-6 rounded bg-gray-500"></div>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{color}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Typography
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Modern SaaS', 'Corporate Classic'].map((typo) => (
                        <button
                          key={typo}
                          onClick={() => setSelectedTypography(typo)}
                          className={`p-4 rounded-lg border-2 transition text-left ${
                            selectedTypography === typo
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-bold text-lg">Heading</p>
                          <p className="text-sm text-gray-600">Body text goes here</p>
                          <p className="text-xs text-gray-400 mt-2">{typo}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700">
                    Apply Design System
                  </button>
                </div>
              </div>
            )}

            {/* PREVIEW TAB */}
            {activeTab === 'preview' && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Live Preview</h2>
                <div className="border border-gray-300 rounded-lg h-96 bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">Website preview will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
