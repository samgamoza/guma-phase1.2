import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getSiteUrl } from '@/lib/site-url'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan, priceId } = await request.json()
  if (!priceId) return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })

  const origin = request.headers.get('origin') || getSiteUrl()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: user.id, plan },
    success_url: `${origin}/dashboard?upgraded=1`,
    cancel_url:  `${origin}/dashboard/upgrade`,
  })

  return NextResponse.json({ url: session.url })
}
