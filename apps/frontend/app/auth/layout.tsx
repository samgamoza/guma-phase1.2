import Link from 'next/link'
import { Globe, CheckCircle2 } from 'lucide-react'

const PROOF_POINTS = [
  'Pre-generated site — live in minutes',
  'Free forever on the basic plan',
  'No credit card required',
  'Custom domain on Pro',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[42%] bg-ink flex-col justify-between p-10 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }}
        />
        {/* Glow */}
        <div className="absolute top-1/3 -left-20 w-64 h-64 rounded-full bg-indigo/20 blur-3xl pointer-events-none" />

        <Link href="/" className="relative z-10">
          <img src="/guma-logo.png" alt="Guma AI" className="h-8 w-auto" />
        </Link>

        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-5">
            <Globe size={14} className="text-indigo" />
            <span className="text-xs font-semibold tracking-widest uppercase text-indigo">Free websites for local businesses</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-6">
            Your site is already<br />built. Claim it now.
          </h2>
          <ul className="space-y-3">
            {PROOF_POINTS.map(p => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-white/70">
                <CheckCircle2 size={14} className="text-mint flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          © {new Date().getFullYear()} Guma AI
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 bg-cream flex flex-col">
        {/* Mobile logo */}
        <div className="lg:hidden p-6 border-b border-warm-gray-100">
          <Link href="/">
            <img src="/guma-logo.png" alt="Guma AI" className="h-7 w-auto" />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  )
}
