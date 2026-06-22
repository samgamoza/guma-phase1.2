/**
 * sms/sender.js
 *
 * Twilio SMS outreach for phone-only leads (businesses with no email).
 * Mirrors email/sender.js: build a message, send it, surface errors.
 *
 * Required env:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_FROM_NUMBER   e.g. +15551234567  (or a Messaging Service SID via TWILIO_MESSAGING_SERVICE_SID)
 */
import twilio from 'twilio'
import { buildOutreachSMS, buildFollowUpSMS } from './templates.js'

let _client = null
function getClient() {
  if (!_client) {
    const sid   = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    if (!sid || !token) throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN')
    _client = twilio(sid, token)
  }
  return _client
}

/** Normalise a scraped PH phone number to E.164 (+63...). Returns null if unusable. */
export function toE164(raw, defaultCountry = 'PH') {
  if (!raw) return null
  let digits = String(raw).replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  // Strip leading zeros / trunk prefix
  digits = digits.replace(/^0+/, '')
  if (defaultCountry === 'PH') {
    // Mobile numbers are 10 digits after the country code (9XXXXXXXXX)
    if (digits.startsWith('63')) return `+${digits}`
    if (digits.length === 10 && digits.startsWith('9')) return `+63${digits}`
    if (digits.length >= 10) return `+63${digits.slice(-10)}`
    return null
  }
  if (defaultCountry === 'US') {
    if (digits.startsWith('1')) return `+${digits}`
    if (digits.length === 10) return `+1${digits}`
    return null
  }
  return `+${digits}`
}

function fromParams() {
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID
  if (messagingServiceSid) return { messagingServiceSid }
  const from = process.env.TWILIO_FROM_NUMBER
  if (!from) throw new Error('Missing TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID')
  return { from }
}

/**
 * sendOutreachSMS()
 * Sends the cold-outreach text to a business phone number.
 */
export async function sendOutreachSMS({ to, businessName, previewUrl, country = 'PH' }) {
  const e164 = toE164(to, country)
  if (!e164) throw new Error(`Unusable phone number for SMS: ${to}`)

  const body = buildOutreachSMS({ businessName, previewUrl })

  const msg = await getClient().messages.create({
    ...fromParams(),
    to: e164,
    body,
  })
  return { sid: msg.sid, to: e164 }
}

/**
 * sendFollowUpSMS()
 * Softer follow-up text sent 72h later.
 */
export async function sendFollowUpSMS({ to, businessName, previewUrl, country = 'PH' }) {
  const e164 = toE164(to, country)
  if (!e164) return null

  const body = buildFollowUpSMS({ businessName, previewUrl })

  const msg = await getClient().messages.create({
    ...fromParams(),
    to: e164,
    body,
  })
  return { sid: msg.sid, to: e164 }
}
