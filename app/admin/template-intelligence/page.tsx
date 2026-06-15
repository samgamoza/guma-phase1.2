'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function TemplateIntelligenceCenterPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'analytics' | 'packs'>(
    'upload'
  )
  const [templates, setTemplates] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)

  useEffect(() => {
    fetchTemplates()
    fetchAnalytics()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/template-intelligence/templates?limit=100')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/template-intelligence/analytics')
      const data = await res.json()
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)

      const res = await fetch('/api/admin/template-intelligence/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      alert(`✅ Template uploaded! ID: ${data.templateId}`)

      // Reset form & reload
      e.currentTarget.reset()
      setUploadingFile(null)
      fetchTemplates()
    } catch (error) {
      alert(`❌ Upload error: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePublishTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/admin/template-intelligence/templates?id=${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'production' }),
      })

      if (!res.ok) throw new Error('Publish failed')

      alert('✅ Template published!')
      fetchTemplates()
    } catch (error) {
      alert(`❌ Error: ${(error as Error).message}`)
    }
  }

  const handleArchiveTemplate = async (templateId: string) => {
    if (!confirm('Archive this template?')) return

    try {
      const res = await fetch(`/api/admin/template-intelligence/templates?id=${templateId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Archive failed')

      alert('✅ Template archived!')
      fetchTemplates()
    } catch (error) {
      alert(`❌ Error: ${(error as Error).message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Template Intelligence Center</h1>
          <p className="text-gray-600 mt-2">
            Centralized repository for website templates, components, and design patterns
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
          {(['upload', 'library', 'analytics', 'packs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 border-b-2 font-medium transition ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload New Template</h2>

            <form onSubmit={handleUpload} className="space-y-6">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g., Luxury SaaS Landing Page"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Describe the template, target audience, and key features..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Template Source
                </label>
                <select
                  name="source"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select source...</option>
                  <option value="lovable">Lovable</option>
                  <option value="base44">Base44</option>
                  <option value="v0">v0 (Vercel AI)</option>
                  <option value="bolt">Bolt.new</option>
                  <option value="framer">Framer</option>
                  <option value="webflow">Webflow</option>
                  <option value="html">HTML/CSS Upload</option>
                  <option value="react">React Component</option>
                  <option value="nextjs">Next.js Template</option>
                  <option value="agency-custom">Agency Custom Build</option>
                </select>
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    HTML File <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="file"
                    name="html"
                    accept=".html"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    CSS File (optional)
                  </label>
                  <input
                    type="file"
                    name="css"
                    accept=".css"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    JavaScript (optional)
                  </label>
                  <input
                    type="file"
                    name="js"
                    accept=".js"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    React/JSX (optional)
                  </label>
                  <input
                    type="file"
                    name="react"
                    accept=".jsx,.tsx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? 'Uploading & Analyzing...' : 'Upload & Run 10-Step Pipeline'}
              </button>

              <p className="text-sm text-gray-600 mt-4">
                📊 The system will automatically analyze: structure → sections → components →
                design patterns → colors → typography → industry → metadata → components →
                template DNA
              </p>
            </form>
          </div>
        )}

        {/* LIBRARY TAB */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Template Library</h2>

              {templates.length === 0 ? (
                <p className="text-gray-500">No templates yet. Upload one to get started.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          Industry
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Source</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Uses</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Rating</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {templates.map((template) => (
                        <tr key={template.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{template.name}</td>
                          <td className="px-6 py-4 text-gray-600">{template.industry || '-'}</td>
                          <td className="px-6 py-4 text-gray-600">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                              {template.source}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                template.status === 'production'
                                  ? 'bg-green-100 text-green-800'
                                  : template.status === 'validated'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {template.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{template.total_uses || 0}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {template.avg_user_rating
                              ? `${template.avg_user_rating.toFixed(1)}⭐`
                              : '-'}
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            {template.status !== 'production' && (
                              <button
                                onClick={() => handlePublishTemplate(template.id)}
                                className="text-indigo-600 hover:text-indigo-900 text-xs font-semibold"
                              >
                                Publish
                              </button>
                            )}
                            <button
                              onClick={() => handleArchiveTemplate(template.id)}
                              className="text-red-600 hover:text-red-900 text-xs font-semibold"
                            >
                              Archive
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-6">
              {[
                {
                  label: 'Total Templates',
                  value: analytics.summary.total_templates,
                  color: 'indigo',
                },
                {
                  label: 'Total Uses',
                  value: analytics.performance.most_used_templates?.reduce(
                    (sum: number, t: any) => sum + (t.total_uses || 0),
                    0
                  ),
                  color: 'blue',
                },
                {
                  label: 'Total Conversions',
                  value: analytics.performance.total_conversions,
                  color: 'green',
                },
                {
                  label: 'Total Revenue',
                  value: `$${analytics.performance.total_revenue?.toFixed(0)}`,
                  color: 'purple',
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  className={`bg-gradient-to-br from-${card.color}-500 to-${card.color}-600 text-white rounded-lg shadow-md p-6`}
                >
                  <div className="text-sm font-medium opacity-90">{card.label}</div>
                  <div className="text-3xl font-bold mt-2">{card.value}</div>
                </div>
              ))}
            </div>

            {/* Top Performing Templates */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Top Converting Templates</h3>
                <div className="space-y-2">
                  {(analytics.performance.highest_converting_templates || []).slice(0, 5).map(
                    (t: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-900">{t.name}</span>
                        <span className="text-green-600 font-semibold">
                          {(t.conversion_rate_observed * 100).toFixed(1)}%
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Most Used Templates</h3>
                <div className="space-y-2">
                  {(analytics.performance.most_used_templates || []).slice(0, 5).map(
                    (t: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-900">{t.name}</span>
                        <span className="text-blue-600 font-semibold">{t.total_uses} uses</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PACKS TAB */}
        {activeTab === 'packs' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Template Packs</h2>
            <p className="text-gray-600 mb-6">
              Organize templates into curated packs for different industries, use cases, or
              audiences.
            </p>
            <p className="text-gray-500">Pack management coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}
