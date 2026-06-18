import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Free Websites for Every Philippine Business | Guma AI',
  description: 'Free professional websites for restaurants, salons, clinics, shops, and every type of Filipino business. Ready in 60 seconds. No coding needed.',
  openGraph: {
    title: 'Free Websites for Every Philippine Business | Guma AI',
    description: 'Free professional websites for every type of Filipino business. Ready in 60 seconds.',
  },
}

const NICHES = [
  { slug: 'restaurants',  emoji: '🍽️', label: 'Restaurants & Food',         sub: 'Karinderya, café, fast food, catering' },
  { slug: 'salons',       emoji: '✂️', label: 'Salons & Beauty',             sub: 'Parlor, barbershop, nail salon, spa' },
  { slug: 'spa',          emoji: '💆', label: 'Spas & Massage',              sub: 'Wellness spa, hilot, massage center' },
  { slug: 'auto',         emoji: '🚗', label: 'Auto Repair',                 sub: 'Mechanic, vulcanizing, car wash' },
  { slug: 'medical',      emoji: '🏥', label: 'Clinics & Medical',           sub: 'General practice, specialist, health center' },
  { slug: 'dental',       emoji: '🦷', label: 'Dental Clinics',              sub: 'Dentist, orthodontics, oral surgery' },
  { slug: 'pharmacy',     emoji: '💊', label: 'Pharmacies & Drugstores',     sub: 'Independent pharmacy, drugstore, generics' },
  { slug: 'trades',       emoji: '🔧', label: 'Trades & Home Services',      sub: 'Plumber, electrician, aircon, cleaning' },
  { slug: 'construction', emoji: '🏗️', label: 'Construction & Renovation',   sub: 'General contractor, interior design, build' },
  { slug: 'retail',       emoji: '🛍️', label: 'Retail & Shops',             sub: 'Boutique, sari-sari, online shop, ukay' },
  { slug: 'bakery',       emoji: '🧁', label: 'Bakery & Pastry',             sub: 'Panaderya, custom cakes, pastry shop' },
  { slug: 'gym',          emoji: '💪', label: 'Gyms & Fitness',              sub: 'Gym, pilates, yoga, fitness studio' },
  { slug: 'laundry',      emoji: '👕', label: 'Laundry Shops',               sub: 'Wash & fold, pickup & delivery, dry clean' },
  { slug: 'photography',  emoji: '📷', label: 'Photography & Video',         sub: 'Wedding, portrait, events, corporate video' },
  { slug: 'printing',     emoji: '🖨️', label: 'Printing & Graphics',        sub: 'Tarpaulin, stickers, ID laces, business cards' },
  { slug: 'childcare',    emoji: '🧒', label: 'Childcare & Daycare',         sub: 'Daycare center, nursery, early education' },
  { slug: 'tutoring',     emoji: '📚', label: 'Tutorial Centers & Tutors',   sub: 'K–12 tutoring, review center, online tutor' },
  { slug: 'school',       emoji: '🏫', label: 'Schools & Learning Centers',  sub: 'Private school, preschool, montessori' },
  { slug: 'petshop',      emoji: '🐾', label: 'Pet Shops & Vets',            sub: 'Pet store, veterinary clinic, grooming' },
  { slug: 'travel',       emoji: '✈️', label: 'Travel & Tours',              sub: 'Travel agency, tour operator, island hopping' },
  { slug: 'events',       emoji: '🎉', label: 'Events & Catering',           sub: 'Wedding, birthday, corporate, styling' },
  { slug: 'realestate',   emoji: '🏠', label: 'Real Estate',                 sub: 'Broker, agent, property developer' },
  { slug: 'insurance',    emoji: '🛡️', label: 'Insurance & Finance',        sub: 'Insurance agent, financial advisor, investment' },
  { slug: 'transport',    emoji: '🚚', label: 'Transport & Logistics',       sub: 'Courier, cargo, delivery, freight' },
]

const STATS = [
  { value: '24', label: 'Business types covered' },
  { value: '60s', label: 'To get your website' },
  { value: '₱0', label: 'To start — forever free' },
  { value: '🇵🇭', label: 'Built for the Philippines' },
]

export default function ForIndexPage() {
  return (
    <div className="min-h-screen bg-[#0a0b12] text-white overflow-x-hidden font-sans">

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] bg-indigo/8 rounded-full blur-[140px]" />
        <div className="absolute top-[50%] right-[5%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Nav */}
      <header className="border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/"><img src="/guma-logo.png" alt="Guma AI" className="h-8 w-auto" /></Link>
          <div className="flex items-center gap-4">
            <Link href="/start" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Build my website
            </Link>
            <Link href="/auth/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">

          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
            🇵🇭 Free for every Filipino business
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-tight text-white">
            Whatever your business,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-light via-violet-400 to-indigo">
              your website is free.
            </span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Restaurant. Salon. Clinic. Auto shop. Pet store. Travel agency.
            No matter what you do — we build your professional website in 60 seconds, for free.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 pt-2 max-w-xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-3 text-center">
                <div className="text-xl font-black text-white mb-0.5">{s.value}</div>
                <div className="text-[9px] text-zinc-500 font-semibold leading-tight">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/auth/signup/manual"
              className="btn-primary rounded-full py-4 px-10 text-base font-black shadow-xl shadow-indigo/25 inline-flex items-center gap-2 justify-center"
            >
              Build My Free Website <ArrowRight size={18} />
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full py-4 px-8 text-sm font-semibold border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 transition inline-flex items-center gap-2 justify-center"
            >
              Search if my site is ready
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {['Free forever', 'No coding', '60 seconds', 'Mobile ready'].map(item => (
              <span key={item} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                <Check size={12} className="text-emerald-400" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* All niches grid */}
      <section className="py-16 border-t border-white/5 bg-zinc-950/20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Choose your industry</p>
            <h2 className="text-3xl font-extrabold text-white">Find your business type</h2>
            <p className="text-zinc-500 text-sm">Each page shows examples and tips specific to your industry.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {NICHES.map(({ slug, emoji, label, sub }) => (
              <Link
                key={slug}
                href={`/for/${slug}`}
                className="group bg-zinc-900/40 border border-white/5 rounded-2xl p-4 hover:border-indigo/30 hover:bg-zinc-900/60 transition-all duration-200 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none">{emoji}</span>
                  <ArrowRight size={12} className="text-zinc-700 group-hover:text-indigo-light transition-colors ml-auto flex-shrink-0" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-snug">{label}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-6 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-red-400">Without a website</p>
              {[
                'Invisible on Google — the #1 discovery channel',
                'Platform algorithms control your reach',
                'No professional link to share or refer',
                'Lost to competitors who have websites',
                'Dependent on platforms that can restrict you',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span> {item}
                </div>
              ))}
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-6 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-400">With a Guma AI website</p>
              {[
                'Show up on Google — where customers search',
                'One link that ties all your platforms together',
                'Professional presence that builds instant trust',
                'Always online — even when you\'re closed',
                'Yours forever — no algorithm, no commission',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 border-t border-white/5 bg-zinc-950/20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-extrabold text-white">Don&apos;t see your industry?</h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
            We cover every local business. If your niche isn&apos;t listed above, use our general builder —
            it works for any type of business in the Philippines.
          </p>
          <Link
            href="/auth/signup/manual"
            className="btn-primary py-4 px-10 rounded-full shadow-xl shadow-indigo/25 inline-flex text-sm font-black items-center gap-2"
          >
            Build My Free Website <ArrowRight size={16} />
          </Link>
          <p className="text-xs text-zinc-600">No credit card · No technical skills · Ready in 60 seconds</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#080910] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <span>© {new Date().getFullYear()} Guma AI. All rights reserved.</span>
          <div className="flex gap-6 text-zinc-500">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/start" className="hover:text-white transition-colors">Build my website</Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors">Search my business</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
