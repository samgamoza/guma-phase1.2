'use client'
import { useState, useRef } from 'react'
import { Database, Upload, CheckCircle2, XCircle, FileJson, FileText, AlertTriangle } from 'lucide-react'

const SOURCES = [
  {
    id:    'brightdata',
    label: 'Bright Data',
    desc:  'Google Maps dataset export (CSV or JSON)',
    cols:  'name, full_address, phone, site, category, city, state, google_id',
  },
  {
    id:    'apify',
    label: 'Apify',
    desc:  'Google Maps Scraper actor output (JSON)',
    cols:  'title, address, phone, website, categoryName, city, state, placeId',
  },
  {
    id:    'generic',
    label: 'Generic CSV / JSON',
    desc:  'Any spreadsheet with name, address, phone, city columns',
    cols:  'name, address, phone, email, city, category, website',
  },
]

type Result = {
  ok: boolean
  total: number
  mapped: number
  imported: number
  skipped: number
  errors: string[]
  error?: string
}

export default function DataImportPage() {
  const [source, setSource]       = useState('brightdata')
  const [file, setFile]           = useState<File | null>(null)
  const [dragging, setDragging]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<Result | null>(null)
  const inputRef                  = useRef<HTMLInputElement>(null)

  const selectedSource = SOURCES.find((s) => s.id === source)!

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); setResult(null) }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) { setFile(f); setResult(null) }
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setResult(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('source', source)

    try {
      const res  = await fetch('/api/admin/data/import', { method: 'POST', body: fd })
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setResult({ ok: false, total: 0, mapped: 0, imported: 0, skipped: 0, errors: [err.message], error: err.message })
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const isJson = file?.name.endsWith('.json')

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <Database className="w-6 h-6 text-indigo" />
          Data Import
        </h1>
        <p className="text-warm-gray-500 text-sm mt-1">
          Upload business data purchased from Bright Data, Apify, or any CSV export
        </p>
      </div>

      {/* Source selector */}
      <div className="card p-6 mb-4">
        <h2 className="text-sm font-semibold text-ink mb-3">1. Select data source format</h2>
        <div className="grid grid-cols-3 gap-3">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSource(s.id); setResult(null) }}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                source === s.id
                  ? 'border-indigo bg-indigo-muted'
                  : 'border-warm-gray-100 hover:border-warm-gray-200'
              }`}
            >
              <div className="font-semibold text-sm text-ink mb-1">{s.label}</div>
              <div className="text-xs text-warm-gray-400">{s.desc}</div>
            </button>
          ))}
        </div>

        {/* Expected columns */}
        <div className="mt-4 bg-warm-gray-50 rounded-lg px-4 py-3">
          <span className="text-xs font-medium text-warm-gray-500">Expected columns: </span>
          <span className="text-xs text-warm-gray-400 font-mono">{selectedSource.cols}</span>
        </div>
      </div>

      {/* File upload */}
      <div className="card p-6 mb-4">
        <h2 className="text-sm font-semibold text-ink mb-3">2. Upload file</h2>

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              dragging ? 'border-indigo bg-indigo-muted' : 'border-warm-gray-200 hover:border-indigo hover:bg-warm-gray-50'
            }`}
          >
            <Upload className="w-8 h-8 text-warm-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-ink">Drop your file here or click to browse</p>
            <p className="text-xs text-warm-gray-400 mt-1">Supports CSV and JSON · No size limit</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 bg-warm-gray-50 rounded-xl">
            {isJson
              ? <FileJson className="w-8 h-8 text-indigo flex-shrink-0" />
              : <FileText className="w-8 h-8 text-indigo flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink truncate">{file.name}</div>
              <div className="text-xs text-warm-gray-400">
                {(file.size / 1024).toFixed(1)} KB · {file.type || (isJson ? 'application/json' : 'text/csv')}
              </div>
            </div>
            <button onClick={reset} className="text-xs text-warm-gray-400 hover:text-red-500 transition-colors">
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Import button */}
      <div className="card p-6 mb-4">
        <h2 className="text-sm font-semibold text-ink mb-3">3. Import to database</h2>
        <p className="text-xs text-warm-gray-400 mb-4">
          Rows are upserted by slug (name + city). Duplicates are updated, not doubled.
          Businesses <strong>with an existing website</strong> are still imported — the generator will skip them via the dedup check.
        </p>
        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Importing…
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              Import {file ? `"${file.name}"` : 'file'} as {selectedSource.label}
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`card p-6 ${result.ok ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-red-400'}`}>
          {result.ok ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-ink">Import complete</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Rows in file', value: result.total, color: 'text-ink' },
                  { label: 'Valid rows',   value: result.mapped, color: 'text-indigo' },
                  { label: 'Imported',     value: result.imported, color: 'text-emerald-600' },
                  { label: 'Skipped',      value: result.skipped, color: 'text-warm-gray-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-warm-gray-50 rounded-lg p-3 text-center">
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="text-xs text-warm-gray-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
              {result.errors.length > 0 && (
                <div className="mt-4 bg-amber-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Partial errors
                  </div>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-amber-600 font-mono">{e}</p>
                  ))}
                </div>
              )}
              <p className="text-xs text-warm-gray-400 mt-4">
                Go to <a href="/admin/businesses" className="text-indigo hover:underline">Businesses</a> to verify,
                then <a href="/admin/generator" className="text-indigo hover:underline">Generator</a> to build sites.
              </p>
            </>
          ) : (
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-ink mb-1">Import failed</div>
                <p className="text-sm text-red-600">{result.error || result.errors?.[0]}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
