import Link from 'next/link'
import {
  Zap, ArrowRight, CheckCircle2, Globe, Search,
  Star, TrendingUp, Shield, Smartphone
} from 'lucide-react'

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Search your business',
    desc: 'Type your business name — we\'ve already crawled thousands of local businesses and pre-built their sites.',
  },
  {
    step: '02',
    title: 'Claim it free',
    desc: 'Verify ownership and your site goes live instantly at guma.ai/sites/your-business.',
  },
  {
    step: '03',
    title: 'Customize & grow',
    desc: 'Edit content, add photos, connect a custom domain, and watch your local customers find you.',
  },
]

const FEATURES = [
  { icon: Globe,       title: 'Instant website',      desc: 'Pre-generated and live in seconds — no builder required.' },
  { icon: Search,      title: 'SEO optimised',         desc: 'Structured data, fast loading, and search-friendly URLs out of the box.' },
  { icon: Smartphone,  title: 'Mobile first',          desc: 'Looks great on every device without any extra work.' },
  { icon: Shield,      title: 'Always online',         desc: 'We handle hosting, SSL, and uptime so you never have to.' },
  { icon: TrendingUp,  title: 'View analytics',        desc: 'See how many people visit your site each month.' },
  { icon: Star,        title: 'Custom domain',         desc: 'Connect yourbusiness.com on Pro — full DNS management included.' },
]

const TESTIMONIALS = [
  {
    quote: 'My site was already built when I searched. I claimed it in two minutes and had customers calling the same day.',
    name: 'Maria T.',
    biz: 'Mario\'s Auto Repair, Chicago',
  },
  {
    quote: 'I\'d been putting off getting a website for years. Guma AI made it embarrassingly easy.',
    name: 'James K.',
    biz: 'Lakeside Plumbing, Austin',
  },
  {
    quote: 'The SEO is actually working — I\'m showing up on Google Maps now for the first time ever.',
    name: 'Sandra R.',
    biz: 'Bloom Florals, Denver',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <header className="border-b border-warm-gray-100 bg-cream/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-semibold text-ink">Guma AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm py-1.5 px-4">
              Sign in
            </Link>
            <Link href="/auth/signup" className="btn-primary text-sm py-2 px-4">
              Get your free site
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-muted text-indigo text-xs font-semibold px-3 py-1.5 rounded-full mb-6 animate-fade-in">
          <Zap size={11} />
          Free websites for local businesses
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-ink leading-[1.1] tracking-tight mb-6 animate-fade-up">
          Your business website,<br />
          <span className="text-indigo">already built.</span>
        </h1>
        <p className="text-lg text-warm-gray-500 max-w-xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '60ms' }}>
          We pre-generate professional websites for local businesses. Search for yours,
          claim it free, and go live in minutes — no design skills needed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up" style={{ animationDelay: '120ms' }}>
          <Link href="/auth/signup" className="btn-primary text-base py-3 px-7">
            Find my business <ArrowRight size={17} />
          </Link>
          <Link href="/auth/login" className="btn-secondary text-base py-3 px-7">
            Sign in
          </Link>
        </div>
        <p className="text-xs text-warm-gray-400 mt-4">No credit card required · Free forever on the basic plan</p>

        {/* Hero visual */}
        <div className="mt-16 relative mx-auto max-w-3xl animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="rounded-2xl border border-warm-gray-200 bg-white shadow-card overflow-hidden">
            {/* Browser chrome */}
            <div className="bg-warm-gray-50 border-b border-warm-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-300" />
                <div className="w-3 h-3 rounded-full bg-amber-300" />
                <div className="w-3 h-3 rounded-full bg-green-300" />
              </div>
              <div className="flex-1 bg-white border border-warm-gray-200 rounded-lg px-3 py-1 text-xs text-warm-gray-400 text-center max-w-xs mx-auto">
                guma.ai/sites/marios-auto-repair
              </div>
            </div>
            {/* Mock site */}
            <div className="bg-ink p-8 text-left">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo flex items-center justify-center">
                  <Zap size={14} className="text-white" />
                </div>
                <span className="text-white font-semibold">Mario's Auto Repair</span>
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">Trusted Auto Repair in Chicago</h2>
              <p className="text-white/60 text-sm mb-5">Serving Chicago's North Side since 1998. Oil changes, brakes, engine diagnostics, and more.</p>
              <div className="flex gap-3">
                <div className="bg-indigo text-white text-xs font-medium px-4 py-2 rounded-xl">Book appointment</div>
                <div className="border border-white/20 text-white/70 text-xs font-medium px-4 py-2 rounded-xl">(773) 555-0192</div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {['Oil Change', 'Brake Repair', 'Engine Diagnostics'].map(s => (
                  <div key={s} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="w-5 h-5 bg-indigo/20 rounded-lg mb-2" />
                    <div className="text-white text-xs font-medium">{s}</div>
                    <div className="text-white/40 text-[10px] mt-0.5">From $29</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Floating badge */}
          <div className="absolute -bottom-4 -right-4 bg-white border border-warm-gray-100 shadow-card rounded-2xl px-4 py-3 flex items-center gap-2 text-sm font-medium text-ink">
            <CheckCircle2 size={16} className="text-mint" />
            Site claimed & live
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-warm-gray-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="section-label mb-3">How it works</div>
            <h2 className="text-3xl font-bold text-ink">From search to live in minutes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-muted flex items-center justify-center mx-auto mb-5">
                  <span className="text-indigo font-bold text-sm">{step}</span>
                </div>
                <h3 className="font-semibold text-ink mb-2">{title}</h3>
                <p className="text-sm text-warm-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="section-label mb-3">Everything included</div>
          <h2 className="text-3xl font-bold text-ink">Built for busy business owners</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-muted flex items-center justify-center mb-4">
                <Icon size={18} className="text-indigo" />
              </div>
              <h3 className="font-semibold text-ink mb-1">{title}</h3>
              <p className="text-sm text-warm-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white border-y border-warm-gray-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="section-label mb-3">Testimonials</div>
            <h2 className="text-3xl font-bold text-ink">Local businesses love Guma AI</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, biz }) => (
              <div key={name} className="card p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-warm-gray-600 leading-relaxed mb-5">"{quote}"</p>
                <div>
                  <div className="font-medium text-ink text-sm">{name}</div>
                  <div className="text-xs text-warm-gray-400">{biz}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="section-label mb-3">Pricing</div>
          <h2 className="text-3xl font-bold text-ink mb-3">Start free, scale when ready</h2>
          <p className="text-warm-gray-500">No contracts, no hidden fees. Upgrade or cancel any time.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card p-7 flex flex-col">
            <div className="text-sm font-medium text-warm-gray-500 mb-2">Free</div>
            <div className="text-4xl font-bold text-ink mb-1">$0 <span className="text-sm font-normal text-warm-gray-400">/mo</span></div>
            <div className="h-px bg-warm-gray-100 my-5" />
            <ul className="space-y-2.5 mb-8 flex-1">
              {['Instant website', 'guma.ai subdomain', 'Basic analytics', 'Mobile-friendly design'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-warm-gray-600">
                  <CheckCircle2 size={14} className="text-mint flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/signup" className="btn-secondary w-full justify-center">
              Get started free
            </Link>
          </div>
          <div className="card p-7 ring-2 ring-indigo flex flex-col relative">
            <div className="absolute -top-3 left-6 bg-indigo text-white text-[10px] font-semibold tracking-widest uppercase px-3 py-1 rounded-full">
              Most popular
            </div>
            <div className="text-sm font-medium text-warm-gray-500 mb-2">Pro</div>
            <div className="text-4xl font-bold text-ink mb-1">$29 <span className="text-sm font-normal text-warm-gray-400">/mo</span></div>
            <div className="h-px bg-warm-gray-100 my-5" />
            <ul className="space-y-2.5 mb-8 flex-1">
              {['Everything in Free', 'Custom domain', 'Drag-and-drop editor', 'Contact forms', 'Remove Guma AI badge', 'Priority support'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-warm-gray-600">
                  <CheckCircle2 size={14} className="text-mint flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/signup" className="btn-primary w-full justify-center">
              Start with Pro <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6">
        <div className="max-w-2xl mx-auto rounded-3xl bg-ink p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo flex items-center justify-center mx-auto mb-5">
            <Zap size={22} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Your site is waiting</h2>
          <p className="text-white/60 mb-8">
            Search for your business now. It might already be built and ready to claim — for free.
          </p>
          <Link href="/auth/signup" className="btn-primary text-base py-3 px-8">
            Find my business <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-warm-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-warm-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo flex items-center justify-center">
              <Zap size={10} className="text-white" />
            </div>
            <span className="font-medium text-warm-gray-500">Guma AI</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-5">
            <Link href="/auth/login" className="hover:text-ink transition-colors">Sign in</Link>
            <Link href="/auth/signup" className="hover:text-ink transition-colors">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
