import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email, redirectTo } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
    const resendApiKey = process.env.RESEND_API_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase URL or Service Key not configured' }, { status: 500 })
    }

    // 1. Initialize Supabase Admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })

    // 2. Generate Magic Link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo,
      }
    })

    if (error) {
      console.error('Supabase admin generateLink error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const actionLink = data?.properties?.action_link
    if (!actionLink) {
      return NextResponse.json({ error: 'Could not generate login link' }, { status: 500 })
    }

    // 3. Send email via Resend API
    if (!resendApiKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Jake <onboarding@resend.dev>',
        to: [email],
        subject: 'Your Guma AI Login Link',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Your Guma AI Login Link</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f9fafb; padding: 32px 16px; margin: 0; }
              .card { max-width: 480px; margin: 0 auto; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              .logo { font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 24px; }
              .logo span { color: #6366f1; }
              p { color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
              .btn { display: inline-block; background: #6366f1; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; }
              .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; line-height: 1.5; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="logo">Guma <span>AI</span></div>
              <p>Welcome! Click the button below to sign in or complete your registration securely.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${actionLink}" class="btn">Log In / Sign Up →</a>
              </div>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; font-size: 13px; color: #6366f1;">${actionLink}</p>
              <div class="footer">
                <p style="margin: 0;">This link will expire in 24 hours. If you did not request this, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      })
    })

    if (!resendRes.ok) {
      const resendErr = await resendRes.json()
      console.error('Resend API error:', resendErr)
      
      // If Resend fails due to sandbox/unverified recipient restrictions
      return NextResponse.json({
        error: `Failed to send email: ${resendErr.message || 'Resend API returned error'}`
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('send-magic-link API error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
