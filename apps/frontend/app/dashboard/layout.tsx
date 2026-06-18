import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { LogOut } from 'lucide-react'
import NavLinks from './NavLinks'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-warm-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-ink flex flex-col fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.07]">
          <Link href="/dashboard">
            <img src="/guma-logo.png" alt="Guma AI" className="h-7 w-auto" />
          </Link>
        </div>

        {/* Nav — client component for active state */}
        <NavLinks />

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/[0.07] space-y-0.5">
          <div className="px-3 py-2 text-xs text-white/35 truncate">
            {user.email}
          </div>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                         text-white/50 hover:text-white hover:bg-white/[0.06]
                         transition-all w-full text-left"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  )
}
