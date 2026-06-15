'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Globe, CreditCard, Settings } from 'lucide-react'

const NAV = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/sites',    icon: Globe,           label: 'My Sites' },
  { href: '/dashboard/upgrade',  icon: CreditCard,      label: 'Plans' },
  { href: '/dashboard/settings', icon: Settings,        label: 'Settings' },
]

export default function NavLinks() {
  const pathname = usePathname()
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {NAV.map(({ href, icon: Icon, label }) => {
        const isActive = href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                       transition-all duration-150 group
                       ${isActive
                         ? 'bg-white/10 text-white'
                         : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                       }`}
          >
            <Icon
              size={16}
              className={isActive ? 'text-indigo' : 'group-hover:text-indigo/70 transition-colors'}
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
