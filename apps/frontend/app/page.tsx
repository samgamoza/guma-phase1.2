'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Search, ArrowRight, CheckCircle, CreditCard, Smartphone, Zap,
  Plus, LayoutGrid, Menu, X, UserCheck, Check, TrendingUp,
  MapPin, BarChart3, RefreshCw, Globe, Target, Heart,
  MessageCircle, Tag, ShieldCheck, Lock, Download, EyeOff,
  HelpCircle, ChevronDown, ChevronRight, Minus, BadgeCheck,
  Star, Wrench, Cog, Disc,
  Thermometer, Smile, Scan, Sparkles, Shield, Scissors, Palette,
  Dumbbell, Users, HeartPulse, Droplets, AlertTriangle, Flame,
  Utensils, Wine, Pizza
} from 'lucide-react'
// These deprecated brand icons trip Next's package-import optimizer when pulled
// from the barrel (resolve to undefined at build → prerender crash). Import them
// from their module paths directly to bypass the optimizer.
import Twitter from 'lucide-react/dist/esm/icons/twitter'
import Linkedin from 'lucide-react/dist/esm/icons/linkedin'
import Github from 'lucide-react/dist/esm/icons/github'

const FAQS = [
  { q: 'How does Guma AI know about my business?', a: 'We use publicly available business data — Google Business Profile, public directories, and other open sources.' },
  { q: 'What if the information is wrong?', a: 'Once you claim your site, you get full editing access. Change hours, services, address — all from your dashboard.' },
  { q: 'Can I use my own domain name?', a: 'Yes! On the Pro plan, connect any domain. We handle DNS and provide free SSL.' },
  { q: 'Is the SEO really that good?', a: 'Yes. Schema markup, meta tags, semantic HTML, fast loading, local keyword optimization — all included.' },
  { q: 'What happens if I cancel Pro?', a: 'Your site stays live on the free plan with a subdomain. All content preserved.' },
  { q: 'Can I delete my site completely?', a: 'Absolutely. One click and everything is permanently deleted. No questions asked.' },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const heroSearchRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }

  const handleSearch = () => {
    const q = searchQuery.trim()
    if (!q) { showToast('Please enter a business name to search.'); return }
    window.location.href = `/auth/signup?q=${encodeURIComponent(q)}`
  }

  useEffect(() => {
    const els = document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const el = entry.target as HTMLElement
        let d = 0
        if (el.classList.contains('delay-100')) d = 100
        if (el.classList.contains('delay-200')) d = 200
        if (el.classList.contains('delay-300')) d = 300
        if (el.classList.contains('delay-400')) d = 400
        if (el.classList.contains('delay-500')) d = 500
        setTimeout(() => el.classList.add('visible'), d)
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })
    els.forEach(el => obs.observe(el))

    const nav = document.getElementById('nav-bar')
    const onScroll = () => {
      if (!nav) return
      if (window.scrollY > 50) {
        nav.style.background = 'rgba(0,0,0,0.85)'
        nav.style.borderColor = 'rgba(255,255,255,0.1)'
      } else {
        nav.style.background = 'rgba(255,255,255,0.03)'
        nav.style.borderColor = 'rgba(255,255,255,0.08)'
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => { obs.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [])

  return (
    <div style={{ fontFamily: 'Inter,system-ui,sans-serif', background: '#000', color: '#fff', overflowX: 'hidden' }}>

      {/* Toast */}
      <div className={`lp-toast glass-strong rounded-xl px-6 py-3 flex items-center gap-3 ${toastVisible ? 'show' : ''}`}>
        <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
        <span className="text-sm text-neutral-200">{toast}</span>
      </div>

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="orb w-[500px] h-[500px] bg-indigo-500/10 top-[-10%] left-[-5%]" style={{ animation: 'pulseGlow 8s ease-in-out infinite' }} />
        <div className="orb w-[400px] h-[400px] bg-purple-500/[0.08] top-[40%] right-[-8%]" style={{ animation: 'pulseGlow 10s ease-in-out infinite 2s' }} />
        <div className="orb w-[350px] h-[350px] bg-indigo-600/[0.06] bottom-[10%] left-[30%]" style={{ animation: 'pulseGlow 9s ease-in-out infinite 4s' }} />
      </div>

      {/* Beta bar */}
      <div className="beta-bar fixed top-0 left-0 right-0 z-[60] py-2.5 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 text-center">
          <span className="text-[10px] font-semibold bg-indigo-500 text-white rounded-full px-2.5 py-0.5 tracking-wider uppercase shrink-0">Beta</span>
          <p className="text-xs sm:text-sm text-neutral-300 font-light">
            Thousands of businesses already built and ready to <span className="text-indigo-400 font-medium">CLAIM!</span>
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-[38px] left-0 right-0 z-50 px-4 sm:px-6 pt-3">
        <div id="nav-bar" className="max-w-6xl mx-auto glass rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between transition-all duration-300">
          <a href="#" className="flex items-center gap-2 group">
            <Image src="/guma-logo.png" alt="Guma AI" width={1054} height={262} className="logo-img-nav group-hover:scale-105 transition-transform duration-300" />
          </a>
          <div className="hidden md:flex items-center gap-8">
            {[['#how-it-works','How It Works'],['#examples','Industries'],['#pricing','Pricing'],['#faq','FAQ']].map(([href, label]) => (
              <a key={href} href={href} className="nav-link text-sm text-neutral-400 hover:text-white transition-colors">{label}</a>
            ))}
            <button onClick={() => showToast('Build from scratch coming soon!')} className="nav-link text-sm text-neutral-400 hover:text-white transition-colors">Build from scratch</button>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <a href="/auth/login" className="text-sm text-neutral-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">Sign in</a>
            <button
              onClick={() => { heroSearchRef.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-all glow-btn flex items-center gap-1.5"
            >
              Find my business <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button onClick={() => setMobileMenuOpen(o => !o)} className="md:hidden p-2 text-neutral-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <div id="mobile-menu" className={`mobile-menu md:hidden max-w-6xl mx-auto mt-2 glass rounded-2xl ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="p-4 flex flex-col gap-3">
            {[['#how-it-works','How It Works'],['#examples','Industries'],['#pricing','Pricing'],['#faq','FAQ']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="text-sm text-neutral-400 hover:text-white transition-colors py-2">{label}</a>
            ))}
            <a href="#" onClick={(e) => { e.preventDefault(); showToast('Build from scratch coming soon!'); setMobileMenuOpen(false) }} className="text-sm text-neutral-400 hover:text-white transition-colors py-2">Build from scratch</a>
            <hr className="border-white/10" />
            <a href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="text-sm text-neutral-400 hover:text-white transition-colors py-2">Sign in</a>
            <button
              onClick={() => { heroSearchRef.current?.focus(); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-all text-center flex items-center justify-center gap-1.5"
            >
              Find my business <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-40 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in-up opacity-0 mb-10">
            <Image src="/guma-logo.png" alt="Guma AI" width={1054} height={262} className="logo-img mx-auto" />
          </div>
          <h1 className="animate-fade-in-up opacity-0 text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-7xl font-semibold tracking-tight leading-[1.08] mb-4" style={{ animationDelay: '0.1s' }}>
            Your business website<br />
            <span className="shimmer">already exists.</span>
          </h1>
          <h2 className="animate-fade-in-up opacity-0 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight leading-[1.1] mb-8" style={{ animationDelay: '0.2s' }}>
            <span className="gradient-text">Claim it in minutes.</span>
          </h2>
          <p className="animate-fade-in-up opacity-0 text-base sm:text-lg text-neutral-400 font-light max-w-2xl mx-auto mb-10 leading-relaxed" style={{ animationDelay: '0.2s' }}>
            We&apos;ve already built a professional website for your local business — powered by AI, optimized for search, and ready to grow with you.
          </p>

          {/* Search box */}
          <div className="animate-fade-in-up opacity-0 max-w-xl mx-auto mb-6" style={{ animationDelay: '0.3s' }}>
            <div className="bbox-4 glass-strong rounded-2xl p-2 flex items-center gap-2 pulse-border">
              <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
              <div className="scan-line" />
              <div className="flex items-center gap-3 flex-1 px-4">
                <Search className="w-5 h-5 text-neutral-500 shrink-0" />
                <input
                  ref={heroSearchRef}
                  id="hero-search"
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter your business name..."
                  className="search-input w-full bg-transparent text-white text-base placeholder:text-neutral-500 py-3 border-none outline-none"
                />
              </div>
              <button onClick={handleSearch} className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-6 py-3.5 rounded-xl transition-all glow-btn flex items-center gap-2">
                Find my business <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Trust tags */}
          <div className="animate-fade-in-up opacity-0 flex flex-wrap items-center justify-center gap-3 mb-8" style={{ animationDelay: '0.4s' }}>
            {[
              [CheckCircle, 'Free to claim'],
              [CreditCard, 'No credit card'],
              [Smartphone, 'Mobile friendly'],
              [Zap, 'Live in minutes'],
            ].map(([Icon, label]) => (
              <div key={label as string} className="trust-tag glass rounded-full px-3.5 py-1.5 flex items-center gap-2 cursor-default">
                {(() => { const I = Icon as React.ElementType; return <I className="w-3.5 h-3.5 text-green-400" /> })()}
                <span className="text-xs text-neutral-300">{label as string}</span>
              </div>
            ))}
          </div>

          {/* Or divider */}
          <div className="animate-fade-in-up opacity-0 flex items-center gap-4 max-w-md mx-auto mb-5" style={{ animationDelay: '0.5s' }}>
            <div className="flex-1 h-px bg-white/[0.08]" />
            <span className="text-xs text-neutral-500 shrink-0">or</span>
            <div className="flex-1 h-px bg-white/[0.08]" />
          </div>

          {/* Alt actions */}
          <div className="animate-fade-in-up opacity-0 flex flex-col sm:flex-row items-center justify-center gap-3" style={{ animationDelay: '0.5s' }}>
            <button onClick={() => showToast('Build from scratch coming soon!')} className="text-sm text-neutral-400 hover:text-white transition-colors px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.03] flex items-center gap-2">
              <Plus className="w-4 h-4" /> Build your website from scratch
            </button>
            <button onClick={() => document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-neutral-400 hover:text-white transition-colors px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.03] flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" /> Browse by industry
            </button>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="relative px-4 sm:px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="reveal bbox-4 glass rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
            <div className="scan-line" />
            {[['10,000+','Sites Generated'],['3 min','Avg. Claim Time'],['4.9★','Owner Rating'],['47%','More Traffic']].map(([val, label]) => (
              <div key={label} className="stat-item text-center p-3 rounded-xl">
                <div className="stat-value text-3xl sm:text-4xl font-semibold gradient-text-accent mb-1">{val}</div>
                <div className="text-xs text-neutral-500 tracking-wide uppercase">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative px-4 sm:px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 bbox-4" style={{ borderRadius: '9999px' }}>
              <span className="corner tl" style={{ borderRadius: '9999px' }} /><span className="corner tr" style={{ borderRadius: '9999px' }} /><span className="corner bl" style={{ borderRadius: '9999px' }} /><span className="corner br" style={{ borderRadius: '9999px' }} />
              <Zap className="w-3.5 h-3.5 text-indigo-400" /><span className="text-xs font-medium text-neutral-300 tracking-wide">How It Works</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Three steps to your<br /><span className="gradient-text">online presence</span></h2>
            <p className="text-neutral-400 font-light max-w-xl mx-auto">No coding. No design skills. No waiting weeks. Just search, claim, and grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-4">
            {([
              { delay: 'delay-100', iconCls: 'bg-indigo-500/10 border-indigo-500/20', textCls: 'text-indigo-400', hoverCls: 'hover:border-indigo-500/30', icon: Search, step: '01', title: 'Search', desc: 'Enter your business name. Our AI has already scoured public data and built a site tailored to your business.' },
              { delay: 'delay-200', iconCls: 'bg-purple-500/10 border-purple-500/20', textCls: 'text-purple-400', hoverCls: 'hover:border-purple-500/30', icon: BadgeCheck, step: '02', title: 'Claim', desc: 'Verify your ownership with a simple process. Your site goes live instantly — no setup, no config files.' },
              { delay: 'delay-300', iconCls: 'bg-green-500/10 border-green-500/20', textCls: 'text-green-400', hoverCls: 'hover:border-green-500/30', icon: TrendingUp, step: '03', title: 'Grow', desc: 'Track visitors, update info, and watch your local search rankings climb. Built to scale with your success.' },
            ] as const).map(({ delay, iconCls, textCls, hoverCls, icon: Icon, step, title, desc }, i) => (
              <div key={step} className={`reveal ${delay} relative group step-card`}>
                <div className={`bbox-4 glass rounded-2xl p-8 h-full transition-all duration-500 hover:bg-white/[0.04] ${hoverCls}`}>
                  <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
                  <div className={`step-icon w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${iconCls}`}>
                    <Icon className={`w-5 h-5 ${textCls}`} />
                  </div>
                  <div className={`text-xs font-medium tracking-widest uppercase mb-3 ${textCls}`}>Step {step}</div>
                  <h3 className="text-xl font-semibold mb-3">{title}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">{desc}</p>
                </div>
                {i < 2 && <div className="hidden md:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 text-neutral-600"><ChevronRight className="w-5 h-5" /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section id="examples" className="relative px-4 sm:px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 bbox-4" style={{ borderRadius: '9999px' }}>
              <span className="corner tl" style={{ borderRadius: '9999px' }} /><span className="corner tr" style={{ borderRadius: '9999px' }} /><span className="corner bl" style={{ borderRadius: '9999px' }} /><span className="corner br" style={{ borderRadius: '9999px' }} />
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" /><span className="text-xs font-medium text-neutral-300 tracking-wide">Industries</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Real local business websites,<br /><span className="gradient-text">already built</span></h2>
            <p className="text-neutral-400 font-light max-w-xl mx-auto">Every site is unique — crafted from real business data with industry-specific designs and content.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Auto Repair */}
            <div className="reveal-scale website-card bbox-4 glass rounded-2xl overflow-hidden cursor-pointer" onClick={() => showToast("Opening Martin's Auto Repair preview...")}>
              <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
              <div className="bg-[#0a0f1a] p-3 border-b border-white/5">
                <div className="flex items-center gap-1.5 mb-2.5">{[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/10" />)}</div>
                <div className="mini-mockup bg-[#111827] rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-[#0f1629]"><div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-blue-500/30 flex items-center justify-center"><Wrench className="w-2 h-2 text-blue-400" /></div><span className="text-[8px] font-medium text-white/80">Martin&apos;s Auto</span></div><div className="flex gap-2"><span className="text-[6px] text-white/40">Services</span><span className="text-[6px] text-white/40">Contact</span></div></div>
                  <div className="px-3 py-3 bg-gradient-to-b from-blue-900/20 to-transparent"><div className="text-[9px] font-semibold text-white mb-0.5">Trusted Auto Repair</div><div className="text-[7px] text-white/50 mb-2">Serving Austin since 2005</div><div className="bg-blue-600 rounded px-2 py-1 inline-block"><span className="text-[7px] font-medium text-white">Book Now</span></div></div>
                  <div className="px-3 pb-3 space-y-1.5"><div className="grid grid-cols-3 gap-1">{[[Cog,'Engine'],[Disc,'Brakes'],[Thermometer,'A/C']].map(([I,l]) => { const Ic = I as React.ElementType; return <div key={l as string} className="bg-white/5 rounded p-1.5 text-center"><Ic className="w-3 h-3 text-blue-400 mx-auto mb-0.5" /><div className="text-[5px] text-white/40">{l as string}</div></div> })}</div><div className="flex items-center gap-1"><Star className="w-2 h-2 text-amber-400 fill-amber-400" /><span className="text-[6px] text-white/50">4.9 · 200+ reviews</span></div></div>
                </div>
              </div>
              <div className="p-4"><div className="flex items-center gap-2 mb-1.5"><div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center"><Wrench className="w-3 h-3 text-blue-400" /></div><span className="text-[10px] text-neutral-500 tracking-wide uppercase font-medium">Auto Repair</span></div><h3 className="font-semibold text-sm mb-1">Martin&apos;s Auto Repair</h3><p className="text-xs text-neutral-500 leading-relaxed">Full-service diagnostics, brakes, and engine repair. 5-star rated in Austin, TX.</p></div>
            </div>
            {/* Dental */}
            <div className="reveal-scale delay-100 website-card bbox-4 glass rounded-2xl overflow-hidden cursor-pointer" onClick={() => showToast('Opening Bright Smile Dental preview...')}>
              <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
              <div className="bg-[#f8fffe] p-3 border-b border-black/5">
                <div className="flex items-center gap-1.5 mb-2.5">{[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-black/[0.08]" />)}</div>
                <div className="mini-mockup bg-white rounded-lg overflow-hidden shadow-sm border border-black/5">
                  <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-black/5"><div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center"><Smile className="w-2 h-2 text-teal-600" /></div><span className="text-[8px] font-medium text-gray-800">Bright Smile</span></div><div className="flex gap-2"><span className="text-[6px] text-gray-400">Services</span><span className="text-[6px] text-gray-400">Book</span></div></div>
                  <div className="px-3 py-3 bg-gradient-to-b from-teal-50 to-white"><div className="text-[9px] font-semibold text-gray-900 mb-0.5">Your Smile, Our Priority</div><div className="text-[7px] text-gray-500 mb-2">Family &amp; cosmetic dentistry</div><div className="bg-teal-600 rounded px-2 py-1 inline-block"><span className="text-[7px] font-medium text-white">Schedule Visit</span></div></div>
                  <div className="px-3 pb-3 space-y-1.5"><div className="grid grid-cols-3 gap-1">{[[Scan,'Cleaning'],[Sparkles,'Whitening'],[Shield,'Braces']].map(([I,l]) => { const Ic = I as React.ElementType; return <div key={l as string} className="bg-teal-50 rounded p-1.5 text-center"><Ic className="w-3 h-3 text-teal-500 mx-auto mb-0.5" /><div className="text-[5px] text-gray-500">{l as string}</div></div> })}</div><div className="flex items-center gap-1"><Star className="w-2 h-2 text-amber-400 fill-amber-400" /><span className="text-[6px] text-gray-400">4.9 · Accepting new patients</span></div></div>
                </div>
              </div>
              <div className="p-4"><div className="flex items-center gap-2 mb-1.5"><div className="w-6 h-6 rounded-lg bg-teal-500/15 flex items-center justify-center"><Smile className="w-3 h-3 text-teal-400" /></div><span className="text-[10px] text-neutral-500 tracking-wide uppercase font-medium">Dental</span></div><h3 className="font-semibold text-sm mb-1">Bright Smile Dental</h3><p className="text-xs text-neutral-500 leading-relaxed">Family and cosmetic dentistry. Accepting new patients with flexible scheduling.</p></div>
            </div>
            {/* Restaurant */}
            <div className="reveal-scale delay-200 website-card bbox-4 glass rounded-2xl overflow-hidden cursor-pointer" onClick={() => showToast('Opening La Piazza Trattoria preview...')}>
              <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
              <div className="bg-[#1a1008] p-3 border-b border-white/5">
                <div className="flex items-center gap-1.5 mb-2.5">{[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/10" />)}</div>
                <div className="mini-mockup bg-[#1f150d] rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-[#251a10]"><div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-orange-500/30 flex items-center justify-center"><Utensils className="w-2 h-2 text-orange-400" /></div><span className="text-[8px] font-medium text-orange-100/80">La Piazza</span></div><div className="flex gap-2"><span className="text-[6px] text-white/40">Menu</span><span className="text-[6px] text-white/40">Reserve</span></div></div>
                  <div className="h-12 bg-gradient-to-r from-orange-900/40 via-amber-900/30 to-orange-900/40 flex items-center justify-center"><div className="text-[9px] font-semibold text-white mb-0.5">Authentic Italian</div></div>
                  <div className="px-3 pb-3 space-y-1.5"><div className="grid grid-cols-3 gap-1">{[[Flame,'Pasta'],[Pizza,'Pizza'],[Wine,'Wine']].map(([I,l]) => { const Ic = I as React.ElementType; return <div key={l as string} className="bg-white/5 rounded p-1.5 text-center"><Ic className="w-3 h-3 text-orange-400 mx-auto mb-0.5" /><div className="text-[5px] text-white/40">{l as string}</div></div> })}</div><div className="flex items-center gap-1"><Star className="w-2 h-2 text-amber-400 fill-amber-400" /><span className="text-[6px] text-white/50">4.8 · $$ · Open Tue–Sun</span></div></div>
                </div>
              </div>
              <div className="p-4"><div className="flex items-center gap-2 mb-1.5"><div className="w-6 h-6 rounded-lg bg-orange-500/15 flex items-center justify-center"><Utensils className="w-3 h-3 text-orange-400" /></div><span className="text-[10px] text-neutral-500 tracking-wide uppercase font-medium">Restaurant</span></div><h3 className="font-semibold text-sm mb-1">La Piazza Trattoria</h3><p className="text-xs text-neutral-500 leading-relaxed">Authentic Italian cuisine with locally sourced ingredients and family recipes.</p></div>
            </div>
            {/* Salon */}
            <div className="reveal-scale website-card bbox-4 glass rounded-2xl overflow-hidden cursor-pointer" onClick={() => showToast('Opening Luxe Hair Studio preview...')}>
              <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
              <div className="bg-[#fdf2f8] p-3 border-b border-black/5">
                <div className="flex items-center gap-1.5 mb-2.5">{[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-black/[0.08]" />)}</div>
                <div className="mini-mockup bg-white rounded-lg overflow-hidden shadow-sm border border-black/5">
                  <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-black/5"><div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-full bg-pink-100 flex items-center justify-center"><Scissors className="w-2 h-2 text-pink-600" /></div><span className="text-[8px] font-medium text-gray-800">Luxe Studio</span></div><div className="flex gap-2"><span className="text-[6px] text-gray-400">Services</span><span className="text-[6px] text-gray-400">Book</span></div></div>
                  <div className="px-3 py-3 bg-gradient-to-b from-pink-50 to-white"><div className="text-[9px] font-semibold text-gray-900 mb-0.5">Where Beauty Meets Art</div><div className="text-[7px] text-gray-500 mb-2">Modern cuts, color &amp; styling</div><div className="bg-pink-600 rounded px-2 py-1 inline-block"><span className="text-[7px] font-medium text-white">Book Online</span></div></div>
                  <div className="px-3 pb-3 space-y-1.5"><div className="grid grid-cols-3 gap-1">{[[Scissors,'Cuts'],[Palette,'Color'],[Sparkles,'Styling']].map(([I,l]) => { const Ic = I as React.ElementType; return <div key={l as string} className="bg-pink-50 rounded p-1.5 text-center"><Ic className="w-3 h-3 text-pink-500 mx-auto mb-0.5" /><div className="text-[5px] text-gray-500">{l as string}</div></div> })}</div><div className="flex items-center gap-1"><Star className="w-2 h-2 text-amber-400 fill-amber-400" /><span className="text-[6px] text-gray-400">4.9 · Walk-ins welcome</span></div></div>
                </div>
              </div>
              <div className="p-4"><div className="flex items-center gap-2 mb-1.5"><div className="w-6 h-6 rounded-lg bg-pink-500/15 flex items-center justify-center"><Scissors className="w-3 h-3 text-pink-400" /></div><span className="text-[10px] text-neutral-500 tracking-wide uppercase font-medium">Salon</span></div><h3 className="font-semibold text-sm mb-1">Luxe Hair Studio</h3><p className="text-xs text-neutral-500 leading-relaxed">Modern cuts, color, and styling. Book online and walk out feeling your best.</p></div>
            </div>
            {/* Gym */}
            <div className="reveal-scale delay-100 website-card bbox-4 glass rounded-2xl overflow-hidden cursor-pointer" onClick={() => showToast('Opening Iron Peak Gym preview...')}>
              <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
              <div className="bg-[#0f0a0a] p-3 border-b border-white/5">
                <div className="flex items-center gap-1.5 mb-2.5">{[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/10" />)}</div>
                <div className="mini-mockup bg-[#151010] rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-[#1a1212]"><div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-red-500/30 flex items-center justify-center"><Dumbbell className="w-2 h-2 text-red-400" /></div><span className="text-[8px] font-medium text-white/80">Iron Peak</span></div><div className="flex gap-2"><span className="text-[6px] text-white/40">Programs</span><span className="text-[6px] text-white/40">Join</span></div></div>
                  <div className="px-3 py-3 bg-gradient-to-b from-red-900/20 to-transparent"><div className="text-[9px] font-semibold text-white mb-0.5">Unleash Your Potential</div><div className="text-[7px] text-white/50 mb-2">24/7 access · No contracts</div><div className="bg-red-600 rounded px-2 py-1 inline-block"><span className="text-[7px] font-medium text-white">Start Free Trial</span></div></div>
                  <div className="px-3 pb-3 space-y-1.5"><div className="grid grid-cols-3 gap-1">{[[Dumbbell,'Weights'],[Users,'Classes'],[HeartPulse,'Cardio']].map(([I,l]) => { const Ic = I as React.ElementType; return <div key={l as string} className="bg-white/5 rounded p-1.5 text-center"><Ic className="w-3 h-3 text-red-400 mx-auto mb-0.5" /><div className="text-[5px] text-white/40">{l as string}</div></div> })}</div><div className="flex items-center gap-1"><Star className="w-2 h-2 text-amber-400 fill-amber-400" /><span className="text-[6px] text-white/50">4.8 · 500+ members</span></div></div>
                </div>
              </div>
              <div className="p-4"><div className="flex items-center gap-2 mb-1.5"><div className="w-6 h-6 rounded-lg bg-red-500/15 flex items-center justify-center"><Dumbbell className="w-3 h-3 text-red-400" /></div><span className="text-[10px] text-neutral-500 tracking-wide uppercase font-medium">Fitness</span></div><h3 className="font-semibold text-sm mb-1">Iron Peak Gym</h3><p className="text-xs text-neutral-500 leading-relaxed">24/7 access, personal training, and group classes. Your neighborhood fitness hub.</p></div>
            </div>
            {/* Plumbing */}
            <div className="reveal-scale delay-200 website-card bbox-4 glass rounded-2xl overflow-hidden cursor-pointer" onClick={() => showToast('Opening QuickFlow Plumbing preview...')}>
              <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
              <div className="bg-[#f0fdfa] p-3 border-b border-black/5">
                <div className="flex items-center gap-1.5 mb-2.5">{[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-black/[0.08]" />)}</div>
                <div className="mini-mockup bg-white rounded-lg overflow-hidden shadow-sm border border-black/5">
                  <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-black/5"><div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-full bg-cyan-100 flex items-center justify-center"><Droplets className="w-2 h-2 text-cyan-600" /></div><span className="text-[8px] font-medium text-gray-800">QuickFlow</span></div><div className="flex gap-2"><span className="text-[6px] text-gray-400">Services</span><span className="text-[6px] text-gray-400">Call</span></div></div>
                  <div className="px-3 py-3 bg-gradient-to-b from-cyan-50 to-white"><div className="text-[9px] font-semibold text-gray-900 mb-0.5">Fast, Reliable Plumbing</div><div className="text-[7px] text-gray-500 mb-2">Emergency service · Same day</div><div className="bg-cyan-600 rounded px-2 py-1 inline-block"><span className="text-[7px] font-medium text-white">Call Now</span></div></div>
                  <div className="px-3 pb-3 space-y-1.5"><div className="grid grid-cols-3 gap-1">{[[AlertTriangle,'Emergency'],[Droplets,'Drains'],[Flame,'Heaters']].map(([I,l]) => { const Ic = I as React.ElementType; return <div key={l as string} className="bg-cyan-50 rounded p-1.5 text-center"><Ic className="w-3 h-3 text-cyan-500 mx-auto mb-0.5" /><div className="text-[5px] text-gray-500">{l as string}</div></div> })}</div><div className="flex items-center gap-1"><Star className="w-2 h-2 text-amber-400 fill-amber-400" /><span className="text-[6px] text-gray-400">4.9 · Licensed &amp; insured</span></div></div>
                </div>
              </div>
              <div className="p-4"><div className="flex items-center gap-2 mb-1.5"><div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center"><Droplets className="w-3 h-3 text-cyan-400" /></div><span className="text-[10px] text-neutral-500 tracking-wide uppercase font-medium">Plumbing</span></div><h3 className="font-semibold text-sm mb-1">QuickFlow Plumbing</h3><p className="text-xs text-neutral-500 leading-relaxed">Emergency plumbing, drain cleaning, and water heater services. Fast response.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* BUILT FOR OWNERS */}
      <section className="relative px-4 sm:px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="reveal bbox-4 glass-strong rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden relative">
            <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />
            <div className="relative grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 bbox" style={{ borderRadius: '9999px' }}>
                  <div className="scan-line" /><UserCheck className="w-3.5 h-3.5 text-indigo-400" /><span className="text-xs font-medium text-neutral-300 tracking-wide">For Business Owners</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-6">Built for business owners,<br /><span className="gradient-text">not developers</span></h2>
                <p className="text-neutral-400 font-light leading-relaxed mb-8">You shouldn&apos;t need to learn WordPress, hire an agency, or wait months. Guma AI handles everything.</p>
                <div className="space-y-4">
                  {[['No coding required','Update text, photos, and hours from a simple dashboard.'],['AI-written content','Professional copy tailored to your business and location.'],['Mobile-first design','Looks perfect on every device, automatically.']].map(([title, desc]) => (
                    <div key={title} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-all cursor-default group">
                      <div className="w-6 h-6 rounded-full bg-green-500/15 flex items-center justify-center mt-0.5 shrink-0 group-hover:scale-110 transition-transform"><Check className="w-3.5 h-3.5 text-green-400" /></div>
                      <div><div className="text-sm font-medium mb-0.5">{title}</div><div className="text-xs text-neutral-500">{desc}</div></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 rounded-3xl blur-2xl" />
                <div className="relative bbox-4 glass rounded-2xl p-6"><span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
                  <div className="flex items-center justify-between mb-5"><span className="text-sm font-medium">Dashboard</span><div className="flex items-center gap-2"><div className="live-dot" /><span className="text-xs text-neutral-500">Live</span></div></div>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[['Visitors','247','+12%'],['Calls','18','+8%']].map(([label, val, pct]) => (
                      <div key={label} className="glass rounded-xl p-4 hover:border-indigo-500/20 transition-all cursor-default"><div className="text-xs text-neutral-500 mb-1">{label}</div><div className="text-xl font-semibold">{val}</div><div className="text-xs text-green-400 flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3" />{pct}</div></div>
                    ))}
                  </div>
                  <div className="glass rounded-xl p-4 hover:border-indigo-500/20 transition-all">
                    <div className="text-xs text-neutral-500 mb-3">Weekly visits</div>
                    <div className="flex items-end gap-1.5 h-20">
                      {[40,55,45,70,60,85,100].map((h, i) => (
                        <div key={i} className="flex-1 bg-indigo-500/30 rounded-t-sm hover:bg-indigo-500/50 transition-colors cursor-pointer" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d} className="text-[10px] text-neutral-600">{d}</span>)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative px-4 sm:px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 bbox-4" style={{ borderRadius: '9999px' }}>
              <span className="corner tl" style={{ borderRadius: '9999px' }} /><span className="corner tr" style={{ borderRadius: '9999px' }} /><span className="corner bl" style={{ borderRadius: '9999px' }} /><span className="corner br" style={{ borderRadius: '9999px' }} />
              <Target className="w-3.5 h-3.5 text-indigo-400" /><span className="text-xs font-medium text-neutral-300 tracking-wide">Discoverability</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Designed to be found<br />and to <span className="gradient-text">grow with you</span></h2>
            <p className="text-neutral-400 font-light max-w-xl mx-auto">Every page is optimized for local search from day one.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {([
              { cls:'reveal-left', iconCls:'bg-indigo-500/10 border-indigo-500/20', iconTxt:'text-indigo-400', hoverBdr:'hover:border-indigo-500/20', tagCls:'text-indigo-300 bg-indigo-500/10', Icon:MapPin, title:'Local SEO baked into every page', desc:'Schema markup, meta tags, local keywords, and Google Business Profile integration — all automatic.', tags:['Schema.org','Meta Tags','Sitemap','Fast Loading'] },
              { cls:'reveal-right', iconCls:'bg-purple-500/10 border-purple-500/20', iconTxt:'text-purple-400', hoverBdr:'hover:border-purple-500/20', tagCls:'text-purple-300 bg-purple-500/10', Icon:BarChart3, title:'Track visitors from one simple dashboard', desc:"See who's visiting, how they found you, and what they're looking at — no Google Analytics setup needed.", tags:['Real-time','Sources','Page Views','Privacy-first'] },
              { cls:'reveal-left', iconCls:'bg-green-500/10 border-green-500/20', iconTxt:'text-green-400', hoverBdr:'hover:border-green-500/20', tagCls:'text-green-300 bg-green-500/10', Icon:RefreshCw, title:'Auto-updates with your business data', desc:"Changed your hours? Added a new service? Your website stays current without you lifting a finger.", tags:['Hours Sync','Photos','Services','Contact Info'] },
              { cls:'reveal-right', iconCls:'bg-amber-500/10 border-amber-500/20', iconTxt:'text-amber-400', hoverBdr:'hover:border-amber-500/20', tagCls:'text-amber-300 bg-amber-500/10', Icon:Globe, title:'Your domain, your brand', desc:'Connect your own domain or use a free subdomain. SSL included. Professional email optional.', tags:['Custom Domain','Free SSL','CDN','99.9% Uptime'] },
            ] as const).map(({ cls, iconCls, iconTxt, hoverBdr, tagCls, Icon, title, desc, tags }) => (
              <div key={title} className={`${cls} feature-card bbox-4 glass rounded-2xl p-8 transition-all duration-500 hover:bg-white/[0.04] ${hoverBdr}`}>
                <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 hover:scale-110 transition-transform duration-500 border ${iconCls}`}><Icon className={`w-5 h-5 ${iconTxt}`} /></div>
                <h3 className="text-lg font-semibold mb-3">{title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed mb-5">{desc}</p>
                <div className="flex flex-wrap gap-2">{tags.map(t => <span key={t} className={`feature-tag text-[10px] font-medium rounded-full px-3 py-1 cursor-default ${tagCls}`}>{t}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="relative px-4 sm:px-6 py-24">
        <div className="max-w-3xl mx-auto text-center reveal">
          <div className="bbox-4 glass rounded-3xl p-10 sm:p-14"><span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8"><Heart className="w-3.5 h-3.5 text-indigo-400" /><span className="text-xs font-medium text-neutral-300 tracking-wide">Our Mission</span></div>
            <blockquote className="text-2xl sm:text-3xl font-light leading-relaxed text-neutral-200 mb-6">&ldquo;Every local business deserves a beautiful, findable website. We believe AI can level the playing field — giving small businesses the same digital presence as big brands, at a fraction of the cost.&rdquo;</blockquote>
            <div className="flex items-center justify-center gap-3 group cursor-default"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-semibold group-hover:scale-110 transition-transform">G</div><div className="text-left"><div className="text-sm font-medium">Guma AI Team</div><div className="text-xs text-neutral-500">Building the web, one business at a time</div></div></div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative px-4 sm:px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 bbox-4" style={{ borderRadius: '9999px' }}>
              <span className="corner tl" style={{ borderRadius: '9999px' }} /><span className="corner tr" style={{ borderRadius: '9999px' }} /><span className="corner bl" style={{ borderRadius: '9999px' }} /><span className="corner br" style={{ borderRadius: '9999px' }} />
              <MessageCircle className="w-3.5 h-3.5 text-indigo-400" /><span className="text-xs font-medium text-neutral-300 tracking-wide">Testimonials</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Loved by <span className="gradient-text">business owners</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { delay:'', from:'from-blue-500 to-cyan-500', init:'SR', name:'Sarah Rodriguez', role:'Fresh Brew Coffee, Portland', quote:"I was quoted $3,000 for a website. Guma gave me one for free in 2 minutes that actually looks better." },
              { delay:'delay-100', from:'from-indigo-500 to-purple-500', init:'MJ', name:'Mike Johnson', role:"Martin's Auto Repair, Austin", quote:"I didn't even know I needed a website until I saw mine already built. The SEO alone brought in 15 new clients this month." },
              { delay:'delay-200', from:'from-green-500 to-teal-500', init:'LP', name:'Lisa Park', role:'Bright Smile Dental, Denver', quote:"The dashboard is so simple. I can see how many people visited today and which pages they viewed." },
            ].map(({ delay, from, init, name, role, quote }) => (
              <div key={name} className={`reveal ${delay} testimonial-card bbox-4 glass rounded-2xl p-6`}>
                <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
                <div className="flex gap-1 mb-4">{[0,1,2,3,4].map(i => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}</div>
                <p className="text-sm text-neutral-300 leading-relaxed mb-5">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3 group cursor-default">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${from} flex items-center justify-center text-xs font-semibold group-hover:scale-110 transition-transform`}>{init}</div>
                  <div><div className="text-sm font-medium">{name}</div><div className="text-xs text-neutral-500">{role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative px-4 sm:px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 bbox-4" style={{ borderRadius: '9999px' }}>
              <span className="corner tl" style={{ borderRadius: '9999px' }} /><span className="corner tr" style={{ borderRadius: '9999px' }} /><span className="corner bl" style={{ borderRadius: '9999px' }} /><span className="corner br" style={{ borderRadius: '9999px' }} />
              <Tag className="w-3.5 h-3.5 text-indigo-400" /><span className="text-xs font-medium text-neutral-300 tracking-wide">Pricing</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">A fraction of the time,<br /><span className="gradient-text">a fraction of the cost</span></h2>
            <p className="text-neutral-400 font-light max-w-xl mx-auto">Compare the traditional way vs. Guma AI.</p>
          </div>
          <div className="reveal bbox-4 glass rounded-2xl overflow-hidden mb-12"><span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
            <div className="grid grid-cols-4 gap-0 text-center border-b border-white/5"><div className="p-4 text-xs text-neutral-500 text-left pl-6" /><div className="p-4 text-xs text-neutral-500">DIY Builder</div><div className="p-4 text-xs text-neutral-500">Agency</div><div className="p-4 text-xs text-indigo-400 font-medium bg-indigo-500/5">Guma AI</div></div>
            {[['Time to launch','Days–Weeks','4–8 Weeks','Minutes'],['Cost','$15–50/mo','$2,000–10k','$0–29/mo'],['SEO included',null,null,true],['Content written',null,true,true],['Technical skill','High','None','None']].map(([label, a, b, c], ri) => (
              <div key={label as string} className="compare-row grid grid-cols-4 gap-0 text-center border-b border-white/5 last:border-0">
                <div className="p-4 text-sm text-neutral-300 text-left pl-6">{label as string}</div>
                <div className="p-4 text-sm text-neutral-400">{a === null ? <X className="w-4 h-4 mx-auto text-neutral-600" /> : a === true ? <Check className="w-4 h-4 mx-auto text-green-400" /> : a as string}</div>
                <div className="p-4 text-sm text-neutral-400">{b === null ? <Minus className="w-4 h-4 mx-auto text-neutral-600" /> : b === true ? <Check className="w-4 h-4 mx-auto text-green-400" /> : b as string}</div>
                <div className="p-4 text-sm text-white font-medium bg-indigo-500/5">{c === null ? <X className="w-4 h-4 mx-auto text-neutral-600" /> : c === true ? <Check className="w-4 h-4 mx-auto text-green-400" /> : c as string}</div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="reveal pricing-card bbox-4 glass rounded-2xl p-8"><span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
              <div className="text-xs font-medium text-neutral-400 tracking-widest uppercase mb-2">Free</div>
              <div className="flex items-baseline gap-1 mb-1"><span className="text-4xl font-semibold">$0</span><span className="text-sm text-neutral-500">/month</span></div>
              <p className="text-sm text-neutral-500 mb-8">Perfect to get started.</p>
              <ul className="space-y-3 mb-8">{[['check','AI-generated website'],['check','Free subdomain'],['check','Basic local SEO'],['check','Mobile responsive'],['minus','Custom domain'],['minus','Visitor analytics']].map(([t, label]) => (
                <li key={label} className="pricing-feature flex items-center gap-3 text-sm text-neutral-300">
                  {t === 'check' ? <Check className="w-4 h-4 text-green-400 shrink-0" /> : <Minus className="w-4 h-4 text-neutral-600 shrink-0" />}{label}
                </li>
              ))}</ul>
              <button onClick={() => showToast('Free plan — search for your business above!')} className="w-full py-3.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 hover:border-white/20 transition-all">Get Started Free</button>
            </div>
            <div className="reveal delay-100 pricing-card bbox-4 pricing-featured rounded-2xl p-8 relative overflow-hidden"><span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
              <div className="absolute top-4 right-4"><span className="text-[10px] font-semibold bg-indigo-500 text-white rounded-full px-3 py-1">POPULAR</span></div>
              <div className="text-xs font-medium text-indigo-400 tracking-widest uppercase mb-2">Pro</div>
              <div className="flex items-baseline gap-1 mb-1"><span className="text-4xl font-semibold">$29</span><span className="text-sm text-neutral-500">/month</span></div>
              <p className="text-sm text-neutral-500 mb-8">Everything to dominate local search.</p>
              <ul className="space-y-3 mb-8">{['Everything in Free','Custom domain + SSL','Full visitor analytics','Advanced SEO tools','Priority support','Auto content updates'].map(label => (
                <li key={label} className="pricing-feature flex items-center gap-3 text-sm text-neutral-200"><Check className="w-4 h-4 text-indigo-400 shrink-0" />{label}</li>
              ))}</ul>
              <button onClick={() => showToast('Pro plan — search for your business to get started!')} className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-all glow-btn">Start Pro Trial</button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="relative px-4 sm:px-6 py-24">
        <div className="max-w-3xl mx-auto text-center reveal">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 bbox-4" style={{ borderRadius: '9999px' }}>
            <span className="corner tl" style={{ borderRadius: '9999px' }} /><span className="corner tr" style={{ borderRadius: '9999px' }} /><span className="corner bl" style={{ borderRadius: '9999px' }} /><span className="corner br" style={{ borderRadius: '9999px' }} />
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /><span className="text-xs font-medium text-neutral-300 tracking-wide">Trust &amp; Transparency</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-6">Built on trust<br />and <span className="gradient-text">transparency</span></h2>
          <p className="text-neutral-400 font-light leading-relaxed mb-10">You own your data. Export or delete anytime. No lock-in, no hidden fees.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[[Lock,'Data Ownership','Your data is yours. Always.'],[Download,'Easy Export','Download your site anytime.'],[EyeOff,'No Ads','We never show ads on your site.']].map(([Icon, title, desc]) => {
              const I = Icon as React.ElementType
              return (
                <div key={title as string} className="trust-card bbox-4 glass rounded-xl p-5 text-center cursor-default">
                  <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
                  <I className="trust-icon w-6 h-6 text-indigo-400 mx-auto mb-3" />
                  <div className="text-sm font-medium mb-1">{title as string}</div>
                  <div className="text-xs text-neutral-500">{desc as string}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative px-4 sm:px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 bbox-4" style={{ borderRadius: '9999px' }}>
              <span className="corner tl" style={{ borderRadius: '9999px' }} /><span className="corner tr" style={{ borderRadius: '9999px' }} /><span className="corner bl" style={{ borderRadius: '9999px' }} /><span className="corner br" style={{ borderRadius: '9999px' }} />
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /><span className="text-xs font-medium text-neutral-300 tracking-wide">FAQ</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Frequently asked <span className="gradient-text">questions</span></h2>
          </div>
          <div className="space-y-3 reveal">
            {FAQS.map((faq, i) => (
              <div key={i} className="faq-item bbox glass rounded-xl overflow-hidden"><div className="scan-line" />
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="text-sm font-medium pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`faq-answer px-5 ${openFaq === i ? 'open' : ''}`}>
                  <p className="text-sm text-neutral-400 leading-relaxed pb-5">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative px-4 sm:px-6 py-32">
        <div className="max-w-4xl mx-auto text-center reveal">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl blur-3xl" />
            <div className="relative bbox-4 glass-strong rounded-3xl p-10 sm:p-16 pulse-border"><span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" /><div className="scan-line" />
              <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight mb-6">Ready to claim<br /><span className="gradient-text">your website?</span></h2>
              <p className="text-neutral-400 font-light max-w-lg mx-auto mb-10 text-lg">Search your business name and see what we&apos;ve built for you.</p>
              <div className="max-w-md mx-auto mb-6">
                <div className="bbox-4 glass rounded-2xl p-2 flex items-center gap-2"><span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
                  <div className="flex items-center gap-3 flex-1 px-4">
                    <Search className="w-5 h-5 text-neutral-500 shrink-0" />
                    <input
                      type="text"
                      placeholder="Your business name..."
                      className="search-input w-full bg-transparent text-white text-base placeholder:text-neutral-500 py-3 border-none outline-none"
                      onKeyDown={e => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value.trim(); if (v) window.location.href = `/auth/signup?q=${encodeURIComponent(v)}`; else showToast('Please enter a business name to search.') } }}
                    />
                  </div>
                  <button
                    onClick={(e) => { const inp = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement)?.value?.trim(); if (inp) window.location.href = `/auth/signup?q=${encodeURIComponent(inp)}`; else showToast('Please enter a business name to search.') }}
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-6 py-3.5 rounded-xl transition-all glow-btn flex items-center gap-2"
                  >
                    Find it <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-neutral-500">Free forever · No credit card required · Live in minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative px-4 sm:px-6 py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4 group cursor-default">
                <Image src="/guma-logo.png" alt="Guma AI" width={1054} height={262} className="h-7 w-auto object-contain brightness-0 invert group-hover:scale-105 transition-transform duration-300" />
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">AI-powered websites for every local business.</p>
            </div>
            <div>
              <div className="text-xs font-medium text-neutral-300 tracking-widest uppercase mb-4">Product</div>
              <ul className="space-y-2.5">
                {[['#how-it-works','How It Works'],['#examples','Industries'],['#features','Features'],['#pricing','Pricing']].map(([href, label]) => (
                  <li key={href}><a href={href} className="footer-link text-sm text-neutral-500">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-medium text-neutral-300 tracking-widest uppercase mb-4">Company</div>
              <ul className="space-y-2.5">
                {['About','Blog','Careers','Contact'].map(label => (
                  <li key={label}><a href="#" onClick={(e) => { e.preventDefault(); showToast(`${label} coming soon!`) }} className="footer-link text-sm text-neutral-500">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-medium text-neutral-300 tracking-widest uppercase mb-4">Legal</div>
              <ul className="space-y-2.5">
                {['Privacy','Terms','Security'].map(label => (
                  <li key={label}><a href="#" onClick={(e) => { e.preventDefault(); showToast(`${label} coming soon!`) }} className="footer-link text-sm text-neutral-500">{label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-neutral-600">© 2025 Guma AI. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {[[Twitter,'Twitter'],[Linkedin,'LinkedIn'],[Github,'GitHub']].map(([Icon, label]) => {
                const I = Icon as React.ElementType
                return (
                  <a key={label as string} href="#" onClick={(e) => { e.preventDefault(); showToast(`${label as string} coming soon!`) }} className="text-neutral-600 hover:text-white transition-colors inline-block hover:scale-110">
                    <I className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
