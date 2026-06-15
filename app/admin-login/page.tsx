'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin')
    } else {
      const data = await res.json()
      setError(data.error || 'Invalid password')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full shadow-lg">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <Lock className="text-indigo-600" size={24} />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-ink mb-2">
          Admin Access
        </h1>
        <p className="text-center text-warm-gray-500 text-sm mb-6">
          Enter password to access the control panel
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn-primary w-full"
          >
            {loading ? 'Verifying...' : 'Enter'}
          </button>
        </form>

        <p className="text-xs text-warm-gray-400 text-center mt-6">
          Guma AI Admin Panel
        </p>
      </div>
    </div>
  )
}
