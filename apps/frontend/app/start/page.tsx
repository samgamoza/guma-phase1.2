import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

const PLATFORMS = [
  { name: 'Facebook', icon: '📘', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { name: 'Instagram', icon: '📸', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
  { name: 'TikTok', icon: '🎵', color: 'text-white', bg: 'bg-zinc-700/40 border-white/10' },
  { name: 'Shopee', icon: '🛍️', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { name: 'Lazada', icon: '📦', color: 'text-blue-300', bg: 'bg-blue-400/10 border-blue-400/20' },
  { name: 'Viber', icon: '💬', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
]

const VALUE_STACK = [
  { item: 'Professional website (custom design)', price: '₱15,000' },
  { item: 'Mobile-optimised layout', price: '₱8,000' },
  { item: 'Google-ready SEO setup', price: '₱5,000' },
  { item: 'Contact & inquiry form', price: '₱3,000' },
  { item: 'Business hours, map & address page', price: '₱2,000' },
  { item: 'Social media link hub', price: '₱4,000' },
  { item: 'Hosting (forever)', price: '₱6,000/yr' },
  { item: 'Free .guma.ai subdomain', price: '₱1,200/yr' },
]

const BUNDLES = [
  {
    icon: '📘',
    name: 'Facebook Business Owner',
    target: 'You run everything from your FB page',
    items: [
      'A real website link in your FB bio',
      'Google shows your biz, not just Facebook',
      'Customers find you even when FB is down',
      'No more "DM for details" — your page has it all',
    ],
    cta: 'Build My Facebook Hub',
    accent: 'border-blue-500/30 hover:border-blue-500/50',
    badge: 'bg-blue-500/10 text-blue-400',
  },
  {
    icon: '🎵🛍️',
    name: 'TikTok & Shopee Seller',
    target: 'You sell via videos and product listings',
    items: [
      'One link in TikTok bio → all your products',
      'Your Shopee store featured on your website',
      'Build brand trust before they click Buy',
      'Repeat buyers remember your site, not Shopee',
    ],
    cta: 'Build My Seller Hub',
    accent: 'border-orange-500/30 hover:border-orange-500/50',
    badge: 'bg-orange-500/10 text-orange-400',
    featured: true,
  },
  {
    icon: '📸',
    name: 'Instagram Boutique / Creator',
    target: 'Your aesthetic is your brand identity',
    items: [
      'Portfolio-style site that matches your IG vibe',
      'Booking or inquiry form replaces DMs',
      'One link in bio — beats Linktree for trust',
      'Collab-ready professional presence',
    ],
    cta: 'Build My Creator Hub',
    accent: 'border-pink-500/30 hover:border-pink-500/50',
    badge: 'bg-pink-500/10 text-pink-400',
  },
  {
    icon: '💬',
    name: 'Viber / Chat-First Service Pro',
    target: 'You take orders & bookings over chat',
    items: [
      'Share a real URL instead of just a number',
      'Viber button built into your website',
      'Referrals can now share your link',
      'Professional — not just a phone number',
    ],
    cta: 'Build My Service Hub',
    accent: 'border-violet-500/30 hover:border-violet-500/50',
    badge: 'bg-violet-500/10 text-violet-400',
  },
]

const STEPS = [
  {
    number: '01',
    icon: '✍️',
    title: 'Tell us your business name',
    desc: 'And what you do. Takes less than a minute.',
  },
  {
    number: '02',
    icon: '⚡',
    title: 'We build your website instantly',
    desc: "No waiting. No back-and-forth. It's ready before you finish your coffee.",
  },
  {
    number: '03',
    icon: '🌐',
    title: 'You go live — for free',
    desc: 'Share the link anywhere. Customers can now find you on Google, 24/7.',
  },
]

const OBJECTIONS = [
  {
    fear: '"Websites are too expensive."',
    truth: 'Guma AI is 100% free to start. No credit card. No monthly fee to get online.',
    icon: '💸',
  },
  {
    fear: '"I don\'t know how to build one."',
    truth: "You don't build anything. We build it for you — you just answer 3 questions.",
    icon: '🛠️',
  },
  {
    fear: '"I\'m too busy to maintain a website."',
    truth: "There's nothing to maintain. Update your phone number? Done in 10 seconds from your phone.",
    icon: '⏱️',
  },
  {
    fear: '"My Facebook / Shopee / TikTok page is enough."',
    truth: "Those platforms decide who sees you — and they can restrict your reach anytime. Your own website is always there, on Google, on maps, 24/7. No algorithm in the way.",
    icon: '📡',
  },
  {
    fear: '"I only sell on Shopee or Lazada."',
    truth: "A website builds trust before customers even open your Shopee store. Buyers who Google you and find nothing often don't buy. A website fixes that.",
    icon: '🏆',
  },
  {
    fear: '"My customers find me on TikTok anyway."',
    truth: "TikTok is great for discovery. But when someone wants to contact you, check your hours, or send a referral — they need a link. Give them one.",
    icon: '🔗',
  },
]

const STATS = [
  { value: '2,400+', label: 'Filipino businesses live' },
  { value: '38', label: 'Cities covered' },
  { value: '6', label: 'Platforms bridged' },
  { value: '60s', label: 'Average time to go live' },
]

export default function StartPage() {
  return (
    <div className="min-h-screen bg-[#0a0b12] text-white overflow-x-hidden font-sans">

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] bg-indigo/8 rounded-full blur-[140px]" />
        <div className="absolute top-[60%] right-[5%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Nav */}
      <header className="border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/"><img src="/guma-logo.png" alt="Guma AI" className="h-8 w-auto" /></Link>
          <Link href="/auth/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-20 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-7">

          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
            🇵🇭 Built for Filipino business owners
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-tight text-white">
            You&apos;re on every platform.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-light via-violet-400 to-indigo">
              But do you own your online presence?
            </span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Facebook, Instagram, TikTok, Shopee, Viber — you&apos;re doing everything right.
            But none of those are yours. One algorithm change and your reach disappears.
            A website is the one thing you actually own.
          </p>

          {/* Platform badges */}
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {PLATFORMS.map(p => (
              <span key={p.name} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${p.bg} ${p.color}`}>
                {p.icon} {p.name}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 text-zinc-500">
              + more
            </span>
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
              Search if my site is already ready
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <Link href="/for" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-2">
              Browse by industry — restaurants, salons, clinics & more
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2">
            {['100% free to start', 'No coding needed', 'Ready in 60 seconds', 'Works on mobile'].map(item => (
              <span key={item} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                <Check size={12} className="text-emerald-400" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUE STACK ── */}
      <section className="py-20 border-t border-white/5 bg-zinc-950/40 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-light/60">What you actually get</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              A web agency charges{' '}
              <span className="line-through text-zinc-600">₱44,200</span>{' '}
              for this.
            </h2>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              We built Guma AI so Filipino business owners never have to pay that. Everything below — yours today, for free.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-10 items-start">
            {/* Stack list */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden">
              {VALUE_STACK.map(({ item, price }, i) => (
                <div
                  key={item}
                  className={`flex items-center justify-between px-5 py-3.5 ${i !== VALUE_STACK.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <span className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <span className="text-emerald-400 text-xs">✦</span>
                    {item}
                  </span>
                  <span className="text-xs text-zinc-600 font-semibold line-through flex-shrink-0 ml-4">{price}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-4 bg-zinc-900/60 border-t border-white/10">
                <span className="text-sm font-black text-white">Total agency value</span>
                <span className="text-sm text-zinc-600 line-through font-bold">₱44,200+</span>
              </div>
            </div>

            {/* Price reveal */}
            <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Your price with Guma AI</p>
                <div className="text-8xl font-black text-white leading-none">₱0</div>
                <p className="text-zinc-500 text-sm">Free to start. Always.</p>
              </div>

              <div className="w-full max-w-xs space-y-2">
                {[
                  'No credit card required',
                  'No hidden setup fees',
                  'No monthly subscription to go live',
                  'No technical skills needed',
                ].map(point => (
                  <div key={point} className="flex items-center gap-2.5 text-sm text-zinc-400">
                    <Check size={14} className="text-emerald-400 flex-shrink-0" />
                    {point}
                  </div>
                ))}
              </div>

              <Link
                href="/auth/signup/manual"
                className="btn-primary rounded-full py-3.5 px-8 text-sm font-black inline-flex items-center gap-2 w-full max-w-xs justify-center"
              >
                Claim My Free Website <ArrowRight size={15} />
              </Link>
              <p className="text-xs text-zinc-700">Ready in 60 seconds · No signup required</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM BUNDLES ── */}
      <section className="py-20 border-t border-white/5 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-light/60">Pick your platform</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Wherever you sell, we&apos;ve got your back.
            </h2>
            <p className="text-zinc-500 text-sm max-w-md mx-auto">
              We built each bundle around how Filipino business owners actually use social media.
              Choose yours — or start with the general builder.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BUNDLES.map(({ icon, name, target, items, cta, accent, badge, featured }) => (
              <div
                key={name}
                className={`relative bg-zinc-900/40 border rounded-2xl p-5 flex flex-col transition-all duration-200 ${accent} ${featured ? 'ring-1 ring-orange-500/20' : ''}`}
              >
                {featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-3xl mb-3 leading-none">{icon}</div>
                <div className={`inline-block text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 self-start ${badge}`}>
                  {target}
                </div>
                <h3 className="text-sm font-black text-white mb-4 leading-snug">{name}</h3>
                <ul className="space-y-2 flex-1 mb-5">
                  {items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-xs text-zinc-400 leading-snug">
                      <span className="text-emerald-400 mt-0.5 flex-shrink-0 text-[10px]">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup/manual"
                  className="text-xs font-black text-white border border-white/10 hover:border-white/20 rounded-xl py-2.5 px-4 inline-flex items-center justify-center gap-1.5 transition-colors hover:bg-white/5"
                >
                  {cta} <ArrowRight size={11} />
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-zinc-600 mt-6">
            Not sure which fits? Use our{' '}
            <Link href="/auth/signup/manual" className="text-zinc-400 underline underline-offset-2 hover:text-white transition-colors">
              general builder
            </Link>{' '}
            — it works for any business.
          </p>
        </div>
      </section>

      {/* ── WITHOUT / WITH ── */}
      <section className="py-16 border-y border-white/5 bg-zinc-950/30 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-red-500/5 border border-red-500/15 rounded-2xl p-6 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-red-400">Without a website</p>
              {[
                'Facebook limits who sees your posts',
                'TikTok can restrict your account anytime',
                'Shopee controls your store visibility',
                'No Google presence — invisible to searchers',
                'Referrals have no link to share',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span> {item}
                </div>
              ))}
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-6 space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-400">With a Guma AI website</p>
              {[
                'Always findable on Google — no algorithm',
                'One link to share on all your platforms',
                'Customers see your hours, location, contact',
                'Looks professional — builds instant trust',
                'Free forever — no tech skills needed',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW SIMPLE ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">3 questions. That&apos;s it.</h2>
            <p className="text-zinc-500 text-sm">We do the rest. No setup. No waiting. No confusion.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ number, icon, title, desc }) => (
              <div key={number} className="relative bg-zinc-900/40 border border-white/5 rounded-3xl p-7 text-center hover:border-indigo/20 transition">
                <div className="text-4xl mb-4">{icon}</div>
                <div className="text-[10px] font-black tracking-widest text-indigo-light/50 uppercase mb-2">Step {number}</div>
                <h3 className="text-base font-bold text-white mb-2 leading-snug">{title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/auth/signup/manual"
              className="btn-primary rounded-full py-3.5 px-8 text-sm font-black inline-flex items-center gap-2"
            >
              Start Now — It&apos;s Free <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIVE STATS ── */}
      <section className="py-16 border-t border-white/5 bg-zinc-950/40 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-500/70">Growing every day</p>
            <h2 className="text-2xl font-black text-white">
              Filipino businesses are already live.
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 text-center hover:border-emerald-500/20 transition">
                <div className="text-3xl font-black text-white mb-1">{value}</div>
                <div className="text-xs text-zinc-500 font-semibold leading-snug">{label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-zinc-700 mt-6">
            Numbers updated daily from live Guma AI sites
          </p>
        </div>
      </section>

      {/* ── OBJECTION HANDLING ── */}
      <section className="py-20 border-t border-white/5 bg-zinc-950/20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              We&apos;ve heard every reason not to.
            </h2>
            <p className="text-zinc-500 text-sm">Here&apos;s why none of them apply to Guma AI.</p>
          </div>

          <div className="space-y-4">
            {OBJECTIONS.map(({ fear, truth, icon }) => (
              <div key={fear} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 hover:border-white/8 transition">
                <div className="flex gap-4">
                  <div className="text-2xl flex-shrink-0 mt-0.5">{icon}</div>
                  <div>
                    <p className="text-sm font-bold text-zinc-400 mb-1.5 italic">{fear}</p>
                    <p className="text-sm text-white leading-relaxed font-medium">{truth}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── URGENCY CLOSER ── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-gradient-to-br from-zinc-900/80 via-zinc-950/60 to-[#0a0b12] border border-white/8 rounded-[2rem] p-10 sm:p-16 text-center space-y-6 overflow-hidden">

            {/* Glow accents */}
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo/8 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-emerald-500/6 blur-3xl pointer-events-none" />

            <div className="relative space-y-5">
              <p className="text-4xl">⏰</p>
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
                Every day without a website costs you customers
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                While you&apos;re deciding,<br />
                <span className="text-zinc-400 font-medium text-2xl">your competitor just went live.</span>
              </h2>
              <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
                Every day without a website is a customer who Googled you, found nothing, and bought from someone else.
                It takes 60 seconds to fix that. Right now.
              </p>
            </div>

            <div className="relative space-y-4">
              <Link
                href="/auth/signup/manual"
                className="btn-primary py-4 px-12 rounded-full shadow-xl shadow-indigo/25 inline-flex text-base font-black items-center gap-2"
              >
                Claim My Free Website Now <ArrowRight size={17} />
              </Link>
              <p className="text-xs text-zinc-600">
                No credit card · No technical skills · Keep your Facebook & Shopee · Ready in 60 seconds
              </p>
            </div>

            <div className="relative pt-4 border-t border-white/5 grid grid-cols-3 gap-4">
              {[
                { icon: '🔒', label: '100% Free' },
                { icon: '⚡', label: '60 Seconds' },
                { icon: '🇵🇭', label: 'Made for PH' },
              ].map(({ icon, label }) => (
                <div key={label} className="text-center">
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-xs font-bold text-zinc-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#080910] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <span>© {new Date().getFullYear()} Guma AI. All rights reserved.</span>
          <div className="flex gap-6 text-zinc-500">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/for" className="hover:text-white transition-colors">Browse industries</Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors">Search my business</Link>
            <Link href="/auth/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
