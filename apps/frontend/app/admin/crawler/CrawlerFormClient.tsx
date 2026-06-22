'use client'

import { useState } from 'react'
import { Play, Clock } from 'lucide-react'

export function CrawlerFormClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setResult(null)

    const formData = new FormData(event.currentTarget)
    const body = {
      category: (formData.get('industry') as string) || 'Handyman',
      city:     (formData.get('city')     as string) || 'Austin',
      state:    (formData.get('state')    as string) || 'TX',
      source:   (formData.get('source')   as string) || 'serper',
      maxPages: parseInt((formData.get('maxPages') as string) || '2'),
    }

    try {
      const res = await fetch('/api/admin/crawler/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_one', ...body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      setResult({ ok: true, message: data.message || `Job enqueued: ${data.jobId || ''}` })
    } catch (err: any) {
      setResult({ ok: false, message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-warm-gray-500 mb-1">Source</label>
        <select name="source" className="input w-full text-sm" defaultValue="serper">
          <option value="serper">Serper.dev (Google Maps) — recommended</option>
          <option value="yellowpages">YellowPages (Playwright)</option>
          <option value="googleplaces">Google Places API</option>
          <option value="apify">Apify (Cloud Actor)</option>
          <option value="brightdata">Bright Data (Dataset API)</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-warm-gray-500 mb-1">City</label>
          <input name="city" placeholder="e.g. Waco" className="input w-full text-sm" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-warm-gray-500 mb-1">State</label>
          <input name="state" placeholder="e.g. TX" className="input w-full text-sm" maxLength={2} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-warm-gray-500 mb-1">Industry / Category</label>
        <input name="industry" placeholder="e.g. Plumber, Handyman, Salon" className="input w-full text-sm" />
      </div>
      <div>
        <label className="block text-xs font-medium text-warm-gray-500 mb-1">Sub-area queries (depth)</label>
        <select name="maxPages" className="input w-full text-sm" defaultValue="2">
          <option value="1">1 — fastest, ~10 results</option>
          <option value="2">2 — default, ~20 results</option>
          <option value="5">5 — deeper, ~50 results</option>
          <option value="9">9 — max, ~90 results</option>
        </select>
      </div>

      {result && (
        <div className={`p-3 rounded-lg text-xs ${result.ok ? 'bg-mint/10 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {result.message}
        </div>
      )}

      <button type="submit" className="btn-primary w-full text-sm flex items-center justify-center gap-2" disabled={isLoading}>
        {isLoading ? <><Clock className="w-4 h-4 animate-spin" /> Triggering...</> : <><Play className="w-4 h-4" /> Start Crawl</>}
      </button>
    </form>
  )
}
