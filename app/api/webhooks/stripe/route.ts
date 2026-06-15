import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session  = event.data.object as Stripe.Checkout.Session
      const userId   = session.metadata?.user_id
      const plan     = session.metadata?.plan
      const subId    = session.subscription as string

      if (!userId || !plan) break

      // Upsert subscription record
      await supabase.from('subscriptions').upsert({
        user_id:       userId,
        plan,
        stripe_sub_id: subId,
        status:        'active',
      }, { onConflict: 'user_id' })

      // Upgrade all of this user's websites to new plan
      await supabase
        .from('websites')
        .update({ plan })
        .eq('claimed_by', userId)

      break
    }

    case 'customer.subscription.deleted': {
      const sub    = event.data.object as Stripe.Subscription
      const record = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_sub_id', sub.id)
        .single()

      if (record.data) {
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_sub_id', sub.id)

        // Downgrade websites back to free
        await supabase
          .from('websites')
          .update({ plan: 'free' })
          .eq('claimed_by', record.data.user_id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
