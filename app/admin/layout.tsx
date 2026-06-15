import Link from 'next/link'
import { Zap, LayoutDashboard, Building2, Globe, Globe2, Mail, TrendingUp, LogOut, Database } from 'lucide-react'
import { requireAdminSession } from '@/lib/admin-auth'
import AdminLogoutButton from '@/components/admin-logout-button'

const NAV = [
  { href: '/admin',            icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/pipeline',   icon: TrendingUp,      label: 'Pipeline' },
  { href: '/admin/crawler',    icon: Globe2,          label: 'Crawler' },
  { href: '/admin/generator',  icon: Zap,             label: 'Generator' },
  { href: '/admin/businesses', icon: Building2,       label: 'Businesses' },
  { href: '/admin/sites',      icon: Globe,           label: 'Sites' },
  { href: '/admin/outreach',   icon: Mail,            label: 'Outreach' },
  { href: '/admin/data',       icon: Database,        label: 'Data Import' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  requireAdminSession()

  return (
    <div className="min-h-screen bg-warm-gray-50 flex">
      <aside className="w-52 bg-white border-r border-warm-gray-100 flex flex-col fixed inset-y-0">
        <div className="px-5 py-4 border-b border-warm-gray-100">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="font-semibold text-ink text-sm">Guma AI</span>
            <span className="badge bg-red-100 text-red-600 text-[9px]">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                         text-warm-gray-500 hover:text-ink hover:bg-warm-gray-50 transition-all"
            >
              <Icon size={15} />{label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-warm-gray-100 space-y-2">
          <Link href="/dashboard" className="text-xs text-warm-gray-400 hover:text-ink px-3 py-2 block">
            ← User dashboard
          </Link>
          <AdminLogoutButton />
        </div>
      </aside>
      <main className="flex-1 ml-52">{children}</main>
    </div>
  )
}
