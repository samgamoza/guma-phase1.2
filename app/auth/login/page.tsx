'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Mail, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="card p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-muted flex items-center justify-center mx-auto mb-5">
          <Mail size={24} className="text-indigo" />
        </div>
        <h2 className="text-xl font-semibold text-ink mb-2">Check your inbox</h2>
        <p className="text-warm-gray-500 text-sm mb-6">
          We sent a magic link to <span className="font-medium text-ink">{email}</span>.
          Click it to sign in — no password needed.
        </p>
        <button
          onClick={() => setSent(false)}
          className="btn-ghost text-sm"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="card p-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Sign in</h1>
      <p className="text-warm-gray-500 text-sm mb-8">
        No account yet?{' '}
        <Link href="/auth/signup" className="text-indigo hover:underline">
          Claim your free site →
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourbusiness.com"
            required
            className="input"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="btn-primary w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>Send magic link <ArrowRight size={16} /></>
          )}
        </button>
      </form>
    </div>
  )
}
