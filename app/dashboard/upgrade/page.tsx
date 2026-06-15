'use client'
import { useState } from 'react'
import { CheckCircle2, Loader2, Zap } from 'lucide-react'
import { PLANS } from '@/lib/database.types'

const STRIPE_PRICE_IDS: Record<string, string> = {
  pro:      process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID      || 'price_pro_placeholder',
  business: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID || 'price_business_placeholder',
}

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function checkout(plan: 'pro' | 'business') {
    setLoading(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, priceId: STRIPE_PRICE_IDS[plan] }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Upgrade your plan</h1>
        <p className="text-warm-gray-500 text-sm">
          Unlock your domain, the editor, forms, and more.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {(Object.entries(PLANS) as [string, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => {
          const isFree = key === 'free'
          const isPro  = key === 'pro'
          return (
            <div
              key={key}
              className={`card p-6 flex flex-col ${isPro ? 'ring-2 ring-indigo' : ''}`}
            >
              {isPro && (
                <div className="text-[10px] font-semibold tracking-widest uppercase text-indigo mb-3">
                  Most popular
                </div>
              )}
              <div className="text-sm font-medium text-warm-gray-500 mb-1">{plan.name}</div>
              <div className="text-4xl font-bold text-ink mb-1">
                {plan.price === 0 ? 'Free' : `$${plan.price}`}
                {plan.price > 0 && (
                  <span className="text-sm font-normal text-warm-gray-400"> /mo</span>
                )}
              </div>

              <div className="h-px bg-warm-gray-100 my-5" />

              <ul className="space-y-2.5 mb-7 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-warm-gray-600">
                    <CheckCircle2 size={14} className="text-mint mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isFree ? (
                <div className="w-full text-center py-2.5 rounded-xl text-sm font-medium bg-warm-gray-100 text-warm-gray-400 cursor-default">
                  Current plan
                </div>
              ) : (
                <button
                  onClick={() => checkout(key as 'pro' | 'business')}
                  disabled={loading !== null}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isPro
                      ? 'bg-indigo text-white hover:bg-indigo-light'
                      : 'border border-warm-gray-200 text-ink hover:bg-warm-gray-50'
                    } disabled:opacity-50`}
                >
                  {loading === key ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <><Zap size={14} /> Upgrade to {plan.name}</>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-warm-gray-400 mt-6 text-center">
        Payments are handled securely by Stripe. Cancel anytime — no lock-in.
      </p>
    </div>
  )
}
