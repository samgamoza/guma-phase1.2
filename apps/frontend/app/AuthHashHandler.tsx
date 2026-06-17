'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthHashHandler() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.location.hash.includes('access_token')) return

    const next = new URLSearchParams(window.location.search).get('next') || '/dashboard'
    router.replace(`/auth/confirm?next=${encodeURIComponent(next)}${window.location.hash}`)
  }, [router])

  return null
}
