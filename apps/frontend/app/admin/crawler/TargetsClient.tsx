'use client'

import { useState } from 'react'
import { Plus, Trash2, Play, Pause, RefreshCw, RotateCcw, Zap } from 'lucide-react'

type Target = {
  id: string
  city: string
  state: string
  category: string
  source: string
  status: 'active' | 'paused' | 'saturated'
  priority: number
  businesses_found: number
  runs_count: number
  consecutive_empty_runs: number
  cooldown_days: number
  last_crawled_at: string | null
  next_crawl_at: string | null
}

type SchedulerConfig = {
  enabled: boolean
  interval_days: number
  batch_size: number
  last_run_at: string | null
}

export function TargetsClient({
  initialTargets,
  schedulerConfig,
}: {
  initialTargets: Target[]
  schedulerConfig: SchedulerConfig
}) {
  const [targets, setTargets] = useState<Target[]>(initialTargets)
  const [config, setConfig] = useState(schedulerConfig)
  const [adding, setAdding] = useState(false)
  const [running, setRunning] = useState(false)
  const [form, setForm] = useState({ city: '', state: '', category: '', source: 'serper', priority: '5', cooldown_days: '30' })
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function flash(type: 'ok' | 'err', text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  async function addTarget() {
    if (!form.city || !form.state || !form.category) return flash('err', 'City, state, and category are required')
    setAdding(true)
    try {
      const res = await fetch('/api/admin/crawler/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, priority: parseInt(form.priority), cooldown_days: parseInt(form.cooldown_days) }),
      })
      const data = await res.json()
      if (!res.ok) return flash('err', data.error)
      setTargets(prev => [data, ...prev])
      setForm({ city: '', state: '', category: '', source: 'serper', priority: '5', cooldown_days: '30' })
      flash('ok', `Added: ${data.category} / ${data.city}, ${data.state}`)
    } catch (e: any) {
      flash('err', e.message)
    } finally {
      setAdding(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/crawler/targets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (!res.ok) return flash('err', data.error)
    setTargets(prev => prev.map(t => t.id === id ? data : t))
  }

  async function deleteTarget(id: string, label: string) {
    if (!confirm(`Delete target: ${label}?`)) return
    const res = await fetch(`/api/admin/crawler/targets/${id}`, { method: 'DELETE' })
    if (!res.ok) return flash('err', 'Delete failed')
    setTargets(prev => prev.filter(t => t.id !== id))
    flash('ok', `Deleted: ${label}`)
  }

  async function runNow() {
    setRunning(true)
    try {
      const res = await fetch('/api/admin/crawler/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run' }),
      })
      const data = await res.json()
      if (!res.ok) return flash('err', data.error)
      flash('ok', `Enqueued ${data.enqueued} crawl job(s)`)
    } catch (e: any) {
      flash('err', e.message)
    } finally {
      setRunning(false)
    }
  }

  async function toggleScheduler() {
    const newEnabled = !config.enabled
    const res = await fetch('/api/admin/crawler/run-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', enabled: newEnabled }),
    })
    if (!res.ok) return flash('err', 'Failed to update scheduler')
    setConfig(c => ({ ...c, enabled: newEnabled }))
    flash('ok', `Scheduler ${newEnabled ? 'enabled' : 'paused'}`)
  }

  async function updateInterval(days: number) {
    await fetch('/api/admin/crawler/run-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_interval', interval_days: days }),
    })
    setConfig(c => ({ ...c, interval_days: days }))
  }

  async function updateBatchSize(size: number) {
    await fetch('/api/admin/crawler/run-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_batch', batch_size: size }),
    })
    setConfig(c => ({ ...c, batch_size: size }))
  }

  const statusColor = (s: string) =>
    s === 'active'    ? 'bg-mint/15 text-emerald-700' :
    s === 'saturated' ? 'bg-amber-50 text-amber-600' :
                        'bg-warm-gray-100 text-warm-gray-400'

  const priorityLabel = (p: number) => p <= 2 ? 'High' : p <= 5 ? 'Normal' : 'Low'

  return (
    <div className="space-y-6">
      {/* Flash message */}
      {msg && (
        <div className={`p-3 rounded-lg text-sm ${msg.type === 'ok' ? 'bg-mint/10 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {msg.text}
        </div>
      )}

      {/* Scheduler controls */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink">Auto-Scheduler</h2>
          <div className="flex items-center gap-2">
            <span className={`badge text-[10px] ${config.enabled ? 'bg-mint/15 text-emerald-700' : 'bg-warm-gray-100 text-warm-gray-400'}`}>
              {config.enabled ? 'Running' : 'Paused'}
            </span>
            <button onClick={toggleScheduler} className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1">
              {config.enabled ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Enable</>}
            </button>
            <button onClick={runNow} disabled={running} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
              {running ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Run Now
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-warm-gray-400 block mb-1">Crawl every (days)</label>
            <select
              value={config.interval_days}
              onChange={e => updateInterval(parseInt(e.target.value))}
              className="input w-full text-xs"
            >
              {[7, 14, 21, 30, 60, 90].map(d => <option key={d} value={d}>{d} days</option>)}
            </select>
          </div>
          <div>
            <label className="text-warm-gray-400 block mb-1">Targets per run</label>
            <select
              value={config.batch_size}
              onChange={e => updateBatchSize(parseInt(e.target.value))}
              className="input w-full text-xs"
            >
              {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-warm-gray-400 block mb-1">Last run</label>
            <div className="text-warm-gray-500 pt-1">
              {config.last_run_at ? new Date(config.last_run_at).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* Add target form */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo" /> Add Crawl Target
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input placeholder="City (e.g. Waco)" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="input text-sm" />
          <input placeholder="State (e.g. TX)" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="input text-sm" maxLength={2} />
          <input placeholder="Category (e.g. Plumber)" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input text-sm" />
          <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} className="input text-sm">
            <option value="serper">Serper (Google Maps)</option>
            <option value="yellowpages">YellowPages</option>
            <option value="googleplaces">Google Places</option>
          </select>
          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input text-sm">
            <option value="1">Priority: High (1)</option>
            <option value="5">Priority: Normal (5)</option>
            <option value="10">Priority: Low (10)</option>
          </select>
          <select value={form.cooldown_days} onChange={e => setForm(f => ({ ...f, cooldown_days: e.target.value }))} className="input text-sm">
            <option value="7">Re-crawl: 7 days</option>
            <option value="14">Re-crawl: 14 days</option>
            <option value="30">Re-crawl: 30 days</option>
            <option value="60">Re-crawl: 60 days</option>
            <option value="90">Re-crawl: 90 days</option>
          </select>
        </div>
        <button onClick={addTarget} disabled={adding} className="btn-primary text-sm mt-3 px-5 flex items-center gap-2">
          <Plus className="w-4 h-4" /> {adding ? 'Adding...' : 'Add Target'}
        </button>
      </div>

      {/* Targets table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-warm-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">{targets.length} Crawl Targets</h2>
          <span className="text-xs text-warm-gray-400">
            {targets.filter(t => t.status === 'active').length} active ·{' '}
            {targets.filter(t => t.status === 'saturated').length} saturated ·{' '}
            {targets.filter(t => t.status === 'paused').length} paused
          </span>
        </div>
        {targets.length === 0 ? (
          <div className="px-5 py-10 text-center text-warm-gray-400 text-sm">No targets yet — add one above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-gray-100 bg-warm-gray-50">
                {['City / State', 'Category', 'Status', 'Priority', 'Found', 'Runs', 'Last Crawled', 'Next Due', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-medium text-warm-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-gray-50">
              {targets.map(t => (
                <tr key={t.id} className="hover:bg-warm-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-ink text-xs">{t.city}, {t.state}</td>
                  <td className="px-4 py-3 text-warm-gray-500 text-xs">{t.category}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-[10px] ${statusColor(t.status)}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-warm-gray-500">{priorityLabel(t.priority)}</td>
                  <td className="px-4 py-3 text-xs font-medium text-ink">{t.businesses_found}</td>
                  <td className="px-4 py-3 text-xs text-warm-gray-400">{t.runs_count}</td>
                  <td className="px-4 py-3 text-xs text-warm-gray-400">
                    {t.last_crawled_at ? new Date(t.last_crawled_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-warm-gray-400">
                    {t.next_crawl_at ? new Date(t.next_crawl_at).toLocaleDateString() : 'Now'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {t.status === 'active' && (
                        <button onClick={() => updateStatus(t.id, 'paused')} title="Pause" className="btn-ghost p-1.5">
                          <Pause className="w-3.5 h-3.5 text-warm-gray-400" />
                        </button>
                      )}
                      {(t.status === 'paused' || t.status === 'saturated') && (
                        <button onClick={() => updateStatus(t.id, 'active')} title="Reactivate" className="btn-ghost p-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-indigo" />
                        </button>
                      )}
                      <button onClick={() => deleteTarget(t.id, `${t.category} / ${t.city}`)} title="Delete" className="btn-ghost p-1.5">
                        <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
