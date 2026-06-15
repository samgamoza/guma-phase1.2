export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { oid?: string }
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  )
  const { oid } = searchParams
  let success = false

  if (oid) {
    const { error } = await supabase
      .from('outreach')
      .update({ status: 'unsubscribed' })
      .eq('id', oid)

    success = !error
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="card p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-mint/15 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={26} className="text-mint" />
        </div>
        <h1 className="text-xl font-semibold text-ink mb-2">
          {success ? "You've been unsubscribed" : 'Already unsubscribed'}
        </h1>
        <p className="text-warm-gray-500 text-sm mb-6">
          We won't send any more emails about this business listing. Your free website
          at <span className="text-indigo font-medium">guma.ai/sites/{params.slug}</span> remains
          live — you can claim it any time.
        </p>
        <Link href="/" className="btn-ghost text-sm">← Back to Guma AI</Link>
      </div>
    </div>
  )
}
