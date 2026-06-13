'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminLogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center gap-2 text-xs text-warm-gray-400 hover:text-red-600 px-3 py-2 block transition-colors"
    >
      <LogOut size={14} />
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  )
}
