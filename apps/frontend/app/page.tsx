'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, CheckCircle2, Globe, Search,
  Star, Shield, Smartphone, Check, TrendingUp,
  ChevronDown, MapPin, Lock, Sparkles,
  Quote, Gauge, Layers, X,
} from 'lucide-react'
import MobileFab from './MobileFab'
import ClaimedTicker from './ClaimedTicker'
import Reveal from './Reveal'

// ─── Static Data ──────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Search,
    title: 'Search',
    desc: 'Enter your business name to see if a website has already been generated and is waiting for you.',
  },
  {
    step: '02',
    icon: CheckCircle2,
    title: 'Claim',
    desc: 'Verify that you represent the business and activate the site instantly — no technical setup required.',
  },
  {
    step: '03',
    icon: TrendingUp,
    title: 'Grow',
    desc: 'Customize your content, connect a custom domain, and start attracting local customers online.',
  },
]

const WHY_CHOOSE = [
  {
    icon: Layers,
    title: 'Already built for you',
    desc: 'A complete, industry-matched website exists before you sign up. No blank canvas, no templates to wrestle with.',
  },
  {
    icon: Sparkles,
    title: 'Zero technical skills',
    desc: 'If you can type your business name, you can manage your site. Edit content from a simple dashboard.',
  },
  {
    icon: Lock,
    title: 'You own everything',
    desc: 'Your content is yours. Connect your own domain on Pro and build real, lasting brand equity.',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'I searched my bakery’s name out of curiosity and the whole website was already there. I claimed it and we were taking online orders the same afternoon.',
    name: 'Marites R.',
    role: 'Owner, Sweet Crumbs Bakery',
    location: 'Davao City',
    initials: 'MR',
    tint: 'from-rose-500/30 to-orange-500/20',
  },
  {
    quote:
      'As a contractor I never had time to build a site. Guma had one ready that actually looked professional. I connected my own domain in a day.',
    name: 'Jun delos Santos',
    role: 'JDS Construction Services',
    location: 'Cebu City',
    initials: 'JD',
    tint: 'from-indigo/40 to-violet-500/20',
  },
  {
    quote:
      'We’re a small clinic and couldn’t afford an agency. The SEO setup alone would have cost thousands — this was free to claim.',
    name: 'Dr. Ana Villanueva',
    role: 'Villanueva Family Dental',
    location: 'Quezon City',
    initials: 'AV',
    tint: 'from-emerald-500/30 to-teal-500/20',
  },
]

const COMPARISON = {
  columns: ['Agency', 'Freelancer', 'DIY builder', 'Guma AI'],
  rows: [
    { label: 'Time to launch', values: ['4–8 weeks', '1–3 weeks', 'Days of your time', { text: 'Minutes', good: true }] },
    { label: 'Upfront cost', values: ['₱50,000+', '₱15,000+', 'Your weekends', { text: 'Free to claim', good: true }] },
    { label: 'Designed for you', values: [{ ok: true }, { ok: true }, { ok: false }, { ok: true, good: true }] },
    { label: 'Local SEO ready', values: ['Sometimes', 'Sometimes', { ok: false }, { text: 'Built in', good: true }] },
    { label: 'Ongoing maintenance', values: ['Paid retainer', 'Hourly fees', 'All on you', { text: 'Included', good: true }] },
    { label: 'You own the content', values: ['Varies', { ok: true }, { ok: true }, { ok: true, good: true }] },
  ],
}

const STATS = [
  { value: '10,000+', label: 'Businesses available', icon: Globe },
  { value: '500+',    label: 'Websites claimed',     icon: CheckCircle2 },
  { value: '95+',     label: 'Avg. mobile score',    icon: Smartphone },
  { value: '< 1 min', label: 'To find your site',     icon: Gauge },
]

const TRUST = [
  {
    q: 'How does Guma AI create websites?',
    a: 'We generate a complete, industry-matched website from public business information, then keep it ready for the owner to claim and customize.',
  },
  {
    q: 'Where does my business information come from?',
    a: 'From public directories and listings — the same details customers already find when they search for your business online.',
  },
  {
    q: 'How is ownership verified?',
    a: 'A quick verification step confirms you represent the business before the site becomes editable and goes live under your control.',
  },
  {
    q: 'Can I edit everything?',
    a: 'Yes. Your name, description, photos, hours, services and contact details are all editable anytime from your dashboard.',
  },
  {
    q: 'Who owns the website?',
    a: 'You do. Your content belongs to you, and on Pro you can move the entire site to your own domain.',
  },
  {
    q: 'Can I use my own domain?',
    a: 'Yes, on Pro. Connect yourbusiness.com and remove all Guma AI branding for a fully professional presence.',
  },
]

const FAQS = [
  {
    q: 'Is my website really already available?',
    a: 'Many local businesses already have a ready-to-launch website on Guma AI. Search your business name above to find out — it takes less than a minute.',
  },
  {
    q: 'Do I need technical skills?',
    a: 'No. Everything is designed for business owners with zero technical experience. If you can type your name, you can claim and manage your website.',
  },
  {
    q: 'Can I use my own domain name?',
    a: 'Yes. Pro plans support custom domains. You can connect yourbusiness.com and remove all Guma AI branding for a fully professional presence.',
  },
  {
    q: 'Is it free to claim?',
    a: 'Yes. Claiming and activating your website is completely free. No credit card required. Upgrade to Pro when you are ready for more features.',
  },
  {
    q: 'Can I edit the website later?',
    a: 'Absolutely. You can update your business name, phone number, description, photos, and hours anytime from your dashboard.',
  },
]

// ─── Small presentational helpers ──────────────────────────────────────────────

function BrowserChrome({ url, badge }: { url: string; badge: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 bg-zinc-900/80 border-b border-white/5">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
      </div>
      <div className="flex-1 bg-zinc-800 rounded-md px-3 py-1 text-[10px] text-zinc-500 font-mono truncate mx-4">
        {url}
      </div>
      {badge}
    </div>
  )
}

function SectionHeading({
  label,
  title,
  desc,
  align = 'center',
}: {
  label: string
  title: React.ReactNode
  desc?: string
  align?: 'center' | 'left'
}) {
  return (
    <div className={`space-y-4 ${align === 'center' ? 'text-center mx-auto max-w-2xl' : 'max-w-xl'}`}>
      <div className="section-label">{label}</div>
      <h2 className="t-h2 text-[1.75rem] sm:text-[2.25rem] lg:text-[2.5rem] text-heading t-balance">
        {title}
      </h2>
      {desc && <p className="text-zinc-400 text-base sm:text-lg leading-relaxed t-balance">{desc}</p>}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    window.location.href = `/auth/signup?q=${encodeURIComponent(searchQuery)}`
  }

  return (
    <div className="min-h-screen bg-[#0a0b12] text-white selection:bg-indigo/30 overflow-x-hidden font-sans">

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 ambient-mesh" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '36px 36px' }} />
        <div className="absolute top-[-12%] left-[18%] w-[760px] h-[760px] bg-indigo/10 rounded-full blur-[150px]" />
        <div className="absolute top-[38%] right-[8%] w-[560px] h-[560px] bg-violet-600/[0.06] rounded-full blur-[130px]" />
      </div>

      {/* Top Banner */}
      <div className="relative z-20 bg-[#0b0c10] text-zinc-300 text-xs py-2.5 px-6 text-center font-medium border-b border-white/5 tracking-wide">
        <span className="bg-indigo/15 text-indigo-light border border-indigo/25 px-2.5 py-0.5 rounded-full mr-2 text-[10px] font-semibold uppercase tracking-[0.12em]">Beta</span>
        Thousands of Philippine businesses already have a website waiting for them.
      </div>

      {/* Navigation */}
      <header className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/guma-logo.png" alt="Guma AI" width={1054} height={262} priority className="h-9 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
            <Link href="#examples" className="hover:text-white transition-colors">Examples</Link>
            <Link href="#why" className="hover:text-white transition-colors">Why Guma</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="text-sm font-medium text-zinc-400 hover:text-white px-4 py-2 transition-colors">
              Sign in
            </Link>
            <Link href="/auth/signup" className="btn-primary shadow-indigo/20 py-2 px-5 rounded-full flex items-center gap-1.5 text-sm font-semibold hover:shadow-indigo/40 transition-shadow">
              Find my business <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── 1 · HERO ─────────────────────────────────────────────────────── */}
      <section className="relative pt-20 sm:pt-24 pb-10 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-7">
          <Reveal>
            <div className="inline-flex items-center gap-2 bg-zinc-900/70 border border-white/[0.08] shadow-lg text-indigo-light text-xs font-medium px-4 py-1.5 rounded-full tracking-wide backdrop-blur">
              <Sparkles size={12} className="text-indigo" />
              AI-generated business websites, ready to claim
            </div>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="t-display text-[2.5rem] sm:text-6xl lg:text-[4.25rem] text-white t-balance">
              Your business website{' '}
              <span className="bg-gradient-to-r from-indigo-light via-violet-400 to-indigo bg-clip-text text-transparent">
                already exists.
              </span>
              <br className="hidden sm:block" />
              Claim it in minutes.
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed t-balance">
              Search your business name. If Guma AI has already generated a website for you,
              claim it, customize it, and launch instantly.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto pt-1">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Enter your business name…"
                  className="w-full pl-11 pr-5 py-4 rounded-full border border-white/10 bg-zinc-900/70 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo/60 transition text-sm backdrop-blur"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary rounded-full py-4 px-8 text-sm font-semibold shadow-xl shadow-indigo/20 hover:shadow-indigo/40 transition whitespace-nowrap flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Find my business <ArrowRight size={15} />
              </button>
            </form>
          </Reveal>

          <Reveal delay={220}>
            <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2.5 pt-1">
              {['Free to claim', 'No credit card', 'Mobile friendly', 'Live in minutes'].map(item => (
                <span key={item} className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                  <Check size={13} className="text-emerald-400" /> {item}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 2 · PRODUCT PREVIEW (the product is the hero) ────────────────── */}
      <section className="relative px-6 pb-20">
        <Reveal delay={120} className="max-w-5xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-x-10 -top-10 bottom-0 bg-indigo/10 blur-[100px] rounded-full pointer-events-none" aria-hidden />
            <div className="relative rounded-2xl border border-white/10 bg-zinc-900/40 backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">
              <BrowserChrome
                url="freshbrewcoffee.guma.ai"
                badge={<div className="text-[10px] bg-emerald-500/15 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full">✓ Live</div>}
              />
              {/* Realistic light business site */}
              <div className="bg-gradient-to-br from-[#fafaf9] via-white to-[#f5f5f4] text-stone-900">
                <div className="flex items-center justify-between px-6 sm:px-10 py-4 border-b border-stone-200/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">F</div>
                    <span className="font-semibold tracking-tight">Fresh Brew Coffee</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-[12px] font-medium text-stone-500">
                    <span>Menu</span><span>Our Story</span><span>Visit</span>
                    <span className="bg-stone-900 text-white px-3.5 py-1.5 rounded-full text-[11px]">Order online</span>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-6 px-6 sm:px-10 py-9 items-center">
                  <div className="space-y-4">
                    <span className="inline-block text-[11px] font-semibold tracking-[0.16em] uppercase text-amber-600">Open daily · 7am–9pm</span>
                    <h3 className="text-2xl sm:text-[2rem] font-semibold leading-[1.1] tracking-tight">
                      Locally roasted coffee, made with care.
                    </h3>
                    <p className="text-sm text-stone-500 leading-relaxed max-w-sm">
                      A neighborhood café in Makati serving single-origin beans, fresh pastries, and a place to slow down.
                    </p>
                    <div className="flex gap-2.5 pt-1">
                      <span className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-full">View menu</span>
                      <span className="border border-stone-300 text-stone-700 text-xs font-medium px-4 py-2 rounded-full">Get directions</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className="text-amber-500 fill-amber-500" />)}</div>
                      <span className="text-[11px] text-stone-500">4.9 · 320 Google reviews</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="aspect-[4/5] rounded-xl bg-gradient-to-br from-amber-200 to-orange-300" />
                    <div className="space-y-3">
                      <div className="aspect-square rounded-xl bg-gradient-to-br from-stone-200 to-stone-300" />
                      <div className="rounded-xl bg-white border border-stone-200 p-3 shadow-sm">
                        <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide">Today</div>
                        <div className="text-sm font-semibold mt-0.5">Honey Oat Latte</div>
                        <div className="text-xs text-amber-600 font-semibold">₱165</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-zinc-600 mt-5">
              A real example of a Guma AI website — generated, claimed, and live.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Live Ticker */}
      <ClaimedTicker />

      {/* ── 3 · HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 border-y border-white/5 bg-zinc-950/20 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <SectionHeading
              label="How it works"
              title="From search to live in minutes"
              desc="No technical skills. No design experience. No complicated setup."
            />
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 relative mt-16">
            <div className="hidden md:block absolute top-9 left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-px bg-gradient-to-r from-transparent via-indigo/25 to-transparent" aria-hidden />
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc }, i) => (
              <Reveal key={step} delay={i * 90}>
                <div className="relative surface surface-hover p-8 text-center h-full">
                  <div className="w-12 h-12 rounded-xl bg-indigo/10 border border-indigo/20 flex items-center justify-center mb-5 mx-auto">
                    <Icon size={20} className="text-indigo-light" />
                  </div>
                  <div className="text-[10px] font-semibold tracking-[0.18em] text-indigo-light/60 uppercase mb-2">Step {step}</div>
                  <h3 className="t-h3 text-lg text-white mb-2.5">{title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 · SOCIAL PROOF METRICS ─────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STATS.map(({ value, label, icon: Icon }) => (
                <div key={label} className="surface p-6 text-center">
                  <div className="w-9 h-9 rounded-lg bg-indigo/10 border border-indigo/20 flex items-center justify-center mx-auto mb-3">
                    <Icon size={16} className="text-indigo-light" />
                  </div>
                  <div className="text-2xl sm:text-[1.75rem] font-semibold text-white tracking-tight">{value}</div>
                  <div className="text-xs text-zinc-500 font-medium mt-1">{label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 5 · WEBSITE EXAMPLES ─────────────────────────────────────────── */}
      <section id="examples" className="py-24 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <SectionHeading
              label="Website examples"
              title="Real local business websites, already built"
              desc="These businesses found their website ready and claimed it in minutes. Yours could be next."
            />
          </Reveal>

          <div className="grid md:grid-cols-2 gap-7 mt-16">

            {/* ── Card 1: Metro Auto Works ── */}
            <Reveal>
            <div className="group relative surface surface-hover overflow-hidden h-full">
              <div className="card-shimmer absolute inset-0 rounded-2xl pointer-events-none" />
              <BrowserChrome url="metroautoworks.guma.ai" badge={<div className="text-[9px] bg-emerald-500/15 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full">✓ Claimed</div>} />
              <div className="p-1">
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 rounded-b-2xl overflow-hidden">
                  <div className="relative p-6 pb-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs font-bold">M</div>
                        <span className="text-white font-semibold text-sm">Metro Auto Works</span>
                      </div>
                      <div className="flex gap-3 text-[9px] text-slate-400 font-medium">
                        <span>Services</span><span>About</span><span>Contact</span>
                      </div>
                    </div>
                    <h3 className="text-white text-lg font-semibold leading-tight mb-1.5">Expert Auto Repair &<br />Maintenance Services</h3>
                    <p className="text-slate-400 text-[10px] mb-4 max-w-[260px]">Trusted by Makati City drivers since 2015. ASE-certified technicians.</p>
                    <div className="flex gap-2">
                      <div className="bg-blue-500 text-white text-[9px] font-semibold px-3 py-1.5 rounded-md">Book Service</div>
                      <div className="border border-slate-600 text-slate-300 text-[9px] font-medium px-3 py-1.5 rounded-md">Call Now</div>
                    </div>
                  </div>
                  <div className="px-6 pb-5 grid grid-cols-3 gap-2">
                    {[
                      { label: 'Oil Change', price: '₱850', icon: '🛢️' },
                      { label: 'Brake Service', price: '₱2,400', icon: '🔧' },
                      { label: 'AC Repair', price: '₱1,800', icon: '❄️' },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-800/80 border border-slate-700/50 rounded-lg p-2.5 text-center">
                        <div className="text-lg mb-0.5">{s.icon}</div>
                        <div className="text-[9px] font-semibold text-white">{s.label}</div>
                        <div className="text-[8px] text-blue-400 font-semibold mt-0.5">from {s.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Metro Auto Works</span>
                    <span className="text-[9px] bg-blue-500/15 text-blue-300 font-semibold px-2 py-0.5 rounded-full">Auto Repair</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                    <MapPin size={9} /> Makati City
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
                  <span className="text-[10px] text-zinc-500 ml-1">4.9</span>
                </div>
              </div>
            </div>
            </Reveal>

            {/* ── Card 2: BrightSmile Dental ── */}
            <Reveal delay={90}>
            <div className="group relative surface surface-hover overflow-hidden h-full">
              <div className="card-shimmer absolute inset-0 rounded-2xl pointer-events-none" />
              <BrowserChrome url="brightsmiledental.guma.ai" badge={<div className="text-[9px] bg-emerald-500/15 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full">✓ Claimed</div>} />
              <div className="p-1">
                <div className="bg-gradient-to-br from-[#f0fdf4] via-[#ecfdf5] to-[#f8fafc] rounded-b-2xl overflow-hidden">
                  <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm">🦷</div>
                        <span className="text-emerald-900 font-semibold text-sm">BrightSmile</span>
                      </div>
                      <div className="flex gap-3 text-[9px] text-emerald-700/60 font-medium">
                        <span>Services</span><span>Team</span><span>Book</span>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <h3 className="text-emerald-900 text-lg font-semibold leading-tight mb-1.5">Your smile deserves<br />the best care.</h3>
                        <p className="text-emerald-700/60 text-[10px] mb-3">Gentle, modern dentistry in the heart of Cebu City.</p>
                        <div className="bg-emerald-500 text-white text-[9px] font-semibold px-3 py-1.5 rounded-full inline-block">Book Appointment →</div>
                      </div>
                      <div className="w-24 h-24 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-4xl flex-shrink-0">
                        😁
                      </div>
                    </div>
                  </div>
                  <div className="px-6 pb-5 flex gap-2">
                    {[
                      { label: '15+ Years', sub: 'Experience' },
                      { label: '5,000+', sub: 'Happy Patients' },
                      { label: '4.8 ★', sub: 'Google Rating' },
                    ].map(b => (
                      <div key={b.label} className="flex-1 bg-white border border-emerald-100 rounded-lg p-2.5 text-center shadow-sm">
                        <div className="text-[10px] font-bold text-emerald-700">{b.label}</div>
                        <div className="text-[8px] text-emerald-600/50 font-medium">{b.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">BrightSmile Dental</span>
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-300 font-semibold px-2 py-0.5 rounded-full">Dental Clinic</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                    <MapPin size={9} /> Cebu City
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
                  <span className="text-[10px] text-zinc-500 ml-1">4.8</span>
                </div>
              </div>
            </div>
            </Reveal>

            {/* ── Card 3: Lola's Kitchen ── */}
            <Reveal>
            <div className="group relative surface surface-hover overflow-hidden h-full">
              <div className="card-shimmer absolute inset-0 rounded-2xl pointer-events-none" />
              <BrowserChrome url="lolaskitchen.guma.ai" badge={<div className="text-[9px] bg-emerald-500/15 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full">✓ Claimed</div>} />
              <div className="p-1">
                <div className="bg-gradient-to-br from-amber-950 via-orange-950 to-stone-900 rounded-b-2xl overflow-hidden relative">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(251,191,36,0.4) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                  <div className="p-6 pb-4 relative">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🍲</span>
                        <div>
                          <span className="text-amber-100 font-semibold text-sm block leading-none">Lola&apos;s Kitchen</span>
                          <span className="text-amber-400/60 text-[8px] font-medium tracking-widest uppercase">Filipino Home Cooking</span>
                        </div>
                      </div>
                      <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[9px] font-semibold px-2.5 py-1 rounded-full">🕐 Open Now</div>
                    </div>
                    <h3 className="text-amber-50 text-lg font-semibold leading-tight mb-1.5">Taste the warmth of<br />home-cooked Filipino food.</h3>
                    <p className="text-amber-200/40 text-[10px] mb-4">Family recipes passed down for 3 generations. Quezon City.</p>
                    <div className="flex gap-2">
                      <div className="bg-amber-500 text-amber-950 text-[9px] font-bold px-3 py-1.5 rounded-md">View Menu</div>
                      <div className="border border-amber-600/40 text-amber-200 text-[9px] font-medium px-3 py-1.5 rounded-md">Reserve a Table</div>
                    </div>
                  </div>
                  <div className="px-6 pb-5 grid grid-cols-3 gap-2 relative">
                    {[
                      { dish: 'Sinigang na Baboy', price: '₱280', emoji: '🥘' },
                      { dish: 'Kare-Kare', price: '₱350', emoji: '🍛' },
                      { dish: 'Halo-Halo', price: '₱120', emoji: '🍧' },
                    ].map(m => (
                      <div key={m.dish} className="bg-amber-900/40 backdrop-blur-sm border border-amber-700/30 rounded-lg p-2.5 text-center">
                        <div className="text-lg mb-0.5">{m.emoji}</div>
                        <div className="text-[8px] font-semibold text-amber-100 leading-tight">{m.dish}</div>
                        <div className="text-[8px] text-amber-400 font-semibold mt-0.5">{m.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Lola&apos;s Kitchen</span>
                    <span className="text-[9px] bg-orange-500/15 text-orange-300 font-semibold px-2 py-0.5 rounded-full">Restaurant</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                    <MapPin size={9} /> Quezon City
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
                  <span className="text-[10px] text-zinc-500 ml-1">4.7</span>
                </div>
              </div>
            </div>
            </Reveal>

            {/* ── Card 4: Santos & Partners ── */}
            <Reveal delay={90}>
            <div className="group relative surface surface-hover overflow-hidden h-full">
              <div className="card-shimmer absolute inset-0 rounded-2xl pointer-events-none" />
              <BrowserChrome url="santospartners.guma.ai" badge={<div className="text-[9px] bg-amber-500/15 text-amber-300 font-semibold px-2.5 py-0.5 rounded-full">⚡ Available</div>} />
              <div className="p-1">
                <div className="bg-gradient-to-br from-zinc-900 via-neutral-900 to-stone-950 rounded-b-2xl overflow-hidden">
                  <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-amber-950">S&P</div>
                        <div>
                          <span className="text-white font-semibold text-sm block leading-none">Santos & Partners</span>
                          <span className="text-amber-400/50 text-[8px] font-medium tracking-widest uppercase">Law Firm · Est. 2008</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-l-2 border-amber-400/40 pl-4 mb-4">
                      <h3 className="text-white text-lg font-semibold leading-tight mb-1">Justice. Integrity.<br />Unwavering Advocacy.</h3>
                      <p className="text-zinc-500 text-[10px]">Full-service legal counsel for businesses and individuals in BGC, Taguig.</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-amber-400 text-amber-950 text-[9px] font-bold px-3 py-1.5 rounded-md">Free Consultation</div>
                      <div className="border border-zinc-700 text-zinc-300 text-[9px] font-medium px-3 py-1.5 rounded-md">Our Practice Areas</div>
                    </div>
                  </div>
                  <div className="px-6 pb-5 flex gap-2">
                    {[
                      { area: 'Corporate Law', icon: '🏢' },
                      { area: 'Litigation', icon: '⚖️' },
                      { area: 'Real Estate', icon: '🏠' },
                      { area: 'Tax Advisory', icon: '📊' },
                    ].map(a => (
                      <div key={a.area} className="flex-1 bg-zinc-800/60 border border-zinc-700/40 rounded-lg p-2 text-center">
                        <div className="text-sm mb-0.5">{a.icon}</div>
                        <div className="text-[7px] font-semibold text-zinc-300 leading-tight">{a.area}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Santos & Partners</span>
                    <span className="text-[9px] bg-amber-500/15 text-amber-300 font-semibold px-2 py-0.5 rounded-full">Law Firm</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                    <MapPin size={9} /> BGC, Taguig
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
                  <span className="text-[10px] text-zinc-500 ml-1">5.0</span>
                </div>
              </div>
            </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ── 6 · WHY BUSINESSES CHOOSE GUMA ───────────────────────────────── */}
      <section id="why" className="py-24 border-t border-white/5 bg-zinc-950/20 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <SectionHeading
              label="Why Guma"
              title="Built for business owners, not developers"
              desc="The fastest, most affordable way for a local business to get online — without templates, agencies, or guesswork."
            />
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 mt-16">
            {WHY_CHOOSE.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="surface surface-hover p-7 h-full">
                  <div className="w-11 h-11 rounded-xl bg-indigo/10 border border-indigo/20 flex items-center justify-center mb-5">
                    <Icon size={19} className="text-indigo-light" />
                  </div>
                  <h3 className="t-h3 text-lg text-white mb-2.5">{title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7 · SEO & GROWTH FEATURES ────────────────────────────────────── */}
      <section className="py-24 border-t border-white/5 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <SectionHeading
              label="SEO & growth"
              title="Designed to be found and to grow with you"
              desc="Every Guma AI website ships with the technical foundations local businesses need to rank, load fast, and convert."
            />
          </Reveal>

          <div className="space-y-16 mt-16">
            {/* SEO row */}
            <Reveal>
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div className="space-y-5">
                  <span className="section-label">Built to be found</span>
                  <h3 className="t-h3 text-2xl text-white">Local SEO baked into every page</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    Structured metadata, clean URLs, and fast-loading pages so your business shows up
                    when nearby customers search — no plugins or consultants required.
                  </p>
                  <div className="space-y-2.5 pt-2 border-t border-white/5">
                    {['Structured schema & metadata', 'Mobile-first performance', 'Clean, indexable URLs'].map(b => (
                      <div key={b} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                          <Check size={11} className="text-emerald-400" />
                        </div>
                        <span className="text-zinc-300 font-medium">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="surface p-6">
                  <div className="bg-zinc-900/60 rounded-xl p-4 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-md bg-indigo/20 flex items-center justify-center">
                        <Shield size={12} className="text-indigo-light" />
                      </div>
                      <span className="text-xs font-semibold text-white">SEO health check</span>
                      <span className="ml-auto text-[10px] font-semibold text-emerald-400">95/100</span>
                    </div>
                    {['SSL certificate active', 'Structured schema injected', 'Sitemap generated', 'Mobile score: 98'].map(item => (
                      <div key={item} className="flex items-center gap-2 text-xs text-zinc-400">
                        <Check size={12} className="text-emerald-400 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Analytics row */}
            <Reveal>
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div className="space-y-5 md:order-2">
                  <span className="section-label">Grow with confidence</span>
                  <h3 className="t-h3 text-2xl text-white">Track visitors from one simple dashboard</h3>
                  <p className="text-zinc-400 leading-relaxed">
                    See who is finding you, update your business information anytime, and connect a
                    custom domain when you are ready to scale your brand.
                  </p>
                  <div className="space-y-2.5 pt-2 border-t border-white/5">
                    {['Visitor analytics', 'One-click content updates', 'Custom domain on Pro'].map(b => (
                      <div key={b} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                          <Check size={11} className="text-emerald-400" />
                        </div>
                        <span className="text-zinc-300 font-medium">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="surface p-6 md:order-1">
                  <div className="bg-zinc-900/60 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-white">Monthly visitors</span>
                      <span className="text-xs text-emerald-400 font-semibold">↑ 24%</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-16">
                      {[40, 55, 48, 70, 62, 85, 78, 95].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-indigo/30 hover:bg-indigo/60 transition-colors" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] text-zinc-600">
                      <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 8 · FOUNDER STORY ────────────────────────────────────────────── */}
      <section className="py-24 border-t border-white/5 bg-zinc-950/20 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="surface p-9 sm:p-12 relative overflow-hidden">
              <Quote size={120} className="absolute -top-6 -right-4 text-white/[0.03]" />
              <div className="section-label mb-6">Why we built Guma AI</div>
              <div className="space-y-5 text-zinc-300 leading-relaxed relative">
                <p>
                  Millions of small businesses across the Philippines still have no website — not
                  because they don&apos;t want one, but because builders are confusing, agencies are
                  expensive, and there&apos;s never enough time.
                </p>
                <p>
                  So we flipped the model. Instead of asking owners to start from scratch, Guma AI
                  generates a professional, locally-relevant website for them first. All that&apos;s left
                  is to search, claim it, and make it yours.
                </p>
                <p className="text-white font-medium">
                  Our mission is simple: every local business online in minutes, not months.
                </p>
              </div>
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/5">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo to-violet-500 flex items-center justify-center text-white text-sm font-semibold">
                  GA
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">The Guma AI team</div>
                  <div className="text-xs text-zinc-500">Building for Filipino small businesses</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 9 · TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="py-24 border-t border-white/5 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <SectionHeading
              label="Loved by owners"
              title="Businesses are launching every day"
              desc="Real owners who searched, claimed, and went live — often the same afternoon."
            />
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5 mt-16">
            {TESTIMONIALS.map(({ quote, name, role, location, initials, tint }, i) => (
              <Reveal key={name} delay={i * 90}>
                <figure className="surface surface-hover p-7 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, s) => <Star key={s} size={13} className="text-amber-400 fill-amber-400" />)}
                  </div>
                  <blockquote className="text-sm text-zinc-300 leading-relaxed flex-1">“{quote}”</blockquote>
                  <figcaption className="flex items-center gap-3 mt-6 pt-5 border-t border-white/5">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tint} border border-white/10 flex items-center justify-center text-xs font-semibold text-white`}>
                      {initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{name}</div>
                      <div className="text-xs text-zinc-500">{role} · {location}</div>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10 · PRICING ─────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 border-t border-white/5 bg-zinc-950/20 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <SectionHeading
              label="Pricing"
              title="A fraction of the time, a fraction of the cost"
              desc="See how claiming a ready-made website compares to the traditional ways of getting online."
            />
          </Reveal>

          {/* Comparison table */}
          <Reveal>
            <div className="mt-14 surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left font-medium text-zinc-500 px-6 py-4 w-[28%]"></th>
                      {COMPARISON.columns.map((col, i) => (
                        <th
                          key={col}
                          className={`px-4 py-4 text-center font-semibold ${
                            i === COMPARISON.columns.length - 1
                              ? 'text-white bg-indigo/[0.08] border-x border-indigo/20'
                              : 'text-zinc-400'
                          }`}
                        >
                          {i === COMPARISON.columns.length - 1 ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Sparkles size={13} className="text-indigo-light" /> {col}
                            </span>
                          ) : col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.rows.map((row, ri) => (
                      <tr key={row.label} className={ri % 2 ? 'bg-white/[0.015]' : ''}>
                        <td className="px-6 py-4 text-zinc-300 font-medium">{row.label}</td>
                        {row.values.map((v, ci) => {
                          const isGuma = ci === COMPARISON.columns.length - 1
                          const cell = typeof v === 'string'
                            ? <span className="text-zinc-500">{v}</span>
                            : 'ok' in v
                              ? v.ok
                                ? <Check size={16} className={`mx-auto ${v.good ? 'text-emerald-400' : 'text-zinc-400'}`} />
                                : <X size={15} className="mx-auto text-zinc-700" />
                              : <span className={v.good ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>{v.text}</span>
                          return (
                            <td
                              key={ci}
                              className={`px-4 py-4 text-center ${isGuma ? 'bg-indigo/[0.06] border-x border-indigo/20' : ''}`}
                            >
                              {cell}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>

          {/* Plan cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-14">
            <Reveal>
              <div className="surface p-8 sm:p-10 flex flex-col justify-between h-full">
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Free</span>
                    <p className="text-sm text-zinc-500 mt-1">Perfect for getting online.</p>
                    <h3 className="text-4xl font-semibold text-white mt-3 tracking-tight">$0 <span className="text-sm font-normal text-zinc-500">/mo</span></h3>
                  </div>
                  <div className="hairline" />
                  <ul className="space-y-3.5">
                    {['Instant website', 'guma.ai subdomain', 'Basic analytics', 'Mobile-friendly design'].map(item => (
                      <li key={item} className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                        <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/auth/signup" className="w-full text-center py-3.5 rounded-full border border-white/10 text-white bg-zinc-950 font-semibold hover:bg-zinc-900 transition text-sm mt-8 block">
                  Get started free
                </Link>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <div className="bg-zinc-900/25 border border-indigo/60 rounded-2xl p-8 sm:p-10 flex flex-col justify-between hover:shadow-2xl hover:shadow-indigo/10 transition relative h-full">
                <div className="absolute -top-3 left-8 bg-indigo text-white text-[9px] font-semibold tracking-[0.14em] uppercase px-4 py-1.5 rounded-full shadow-lg shadow-indigo/30">
                  Most Popular
                </div>
                <div className="space-y-6">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-light">Pro</span>
                    <p className="text-sm text-zinc-400 mt-1">Perfect for growing your brand.</p>
                    <h3 className="text-4xl font-semibold text-white mt-3 tracking-tight">$29 <span className="text-sm font-normal text-zinc-500">/mo</span></h3>
                  </div>
                  <div className="hairline" />
                  <ul className="space-y-3.5">
                    {['Everything in Free', 'Custom domain', 'Drag-and-drop editor', 'Contact forms', 'Remove Guma AI badge', 'Priority support'].map(item => (
                      <li key={item} className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                        <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/auth/signup" className="btn-primary w-full justify-center rounded-full py-4 mt-8 shadow-lg shadow-indigo/20 font-semibold">
                  Start with Pro <ArrowRight size={15} />
                </Link>
              </div>
            </Reveal>
          </div>
          <p className="text-center text-xs text-zinc-600 mt-8">No contracts. No hidden fees. Upgrade or cancel anytime.</p>
        </div>
      </section>

      {/* ── 11 · TRUST + FAQ ─────────────────────────────────────────────── */}
      <section id="faq" className="py-24 border-t border-white/5 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-14">
          {/* Trust architecture */}
          <Reveal>
            <div className="lg:sticky lg:top-24 space-y-6">
              <SectionHeading
                align="left"
                label="How it works, honestly"
                title="Built on trust and transparency"
                desc="Everything you might wonder about how Guma AI creates, verifies, and hands over your website."
              />
              <div className="space-y-3">
                {TRUST.map(({ q, a }) => (
                  <div key={q} className="surface p-5">
                    <h4 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-2">
                      <Shield size={14} className="text-indigo-light flex-shrink-0" /> {q}
                    </h4>
                    <p className="text-sm text-zinc-400 leading-relaxed pl-6">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* FAQ accordion */}
          <Reveal delay={90}>
            <div>
              <div className="section-label mb-6">Frequently asked</div>
              <div className="space-y-3">
                {FAQS.map((faq, i) => (
                  <div key={i} className="surface overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                      aria-expanded={openFaq === i}
                    >
                      <span className="font-semibold text-white text-sm leading-snug">{faq.q}</span>
                      <div className="flex-shrink-0 w-7 h-7 rounded-full border border-white/10 flex items-center justify-center text-zinc-400">
                        <ChevronDown size={14} className={`transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    <div className={`grid transition-all duration-300 ease-out ${openFaq === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <p className="text-sm text-zinc-400 leading-relaxed px-6 pb-6">{faq.a}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 12 · FINAL CTA ───────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <Reveal className="max-w-4xl mx-auto">
          <div className="rounded-[2rem] bg-gradient-to-br from-indigo/10 via-zinc-900/40 to-zinc-950/60 border border-indigo/20 p-12 sm:p-20 text-center relative overflow-hidden">
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-indigo/10 blur-3xl pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-violet-700/[0.08] blur-3xl pointer-events-none" />

            <div className="relative max-w-2xl mx-auto space-y-7">
              <h2 className="t-display text-3xl sm:text-5xl text-white t-balance">
                Your website might{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-light to-violet-400">
                  already be waiting.
                </span>
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Search your business and find out in less than a minute.
              </p>
              <div className="flex justify-center">
                <Link href="/auth/signup" className="btn-primary py-4 px-12 rounded-full shadow-xl shadow-indigo/25 inline-flex text-base font-semibold hover:shadow-indigo/40 transition items-center gap-2">
                  Find my business <ArrowRight size={17} />
                </Link>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-zinc-500 pt-1">
                <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400" /> Free forever</span>
                <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400" /> No credit card</span>
                <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400" /> Live in minutes</span>
                <span className="flex items-center gap-1.5"><Check size={12} className="text-emerald-400" /> Own your content</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#080910] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <Image src="/guma-logo.png" alt="Guma AI" width={1054} height={262} className="h-6 w-auto" />
            <span className="text-zinc-700">|</span>
            <span>© {new Date().getFullYear()} Guma AI. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-medium text-zinc-400">
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
            <Link href="#examples" className="hover:text-white transition-colors">Examples</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Sign in</Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors text-indigo-light">Get started</Link>
          </div>
        </div>
      </footer>

      <MobileFab />
    </div>
  )
}
