/**
 * SMS templates — kept short (single segment ≈ 160 chars where possible) to
 * minimise Twilio cost and avoid multi-part messages. Plain text only.
 */

export function buildOutreachSMS({ businessName, previewUrl }) {
  // Keep it personal, identify clearly, single CTA link.
  return (
    `Hi ${businessName}! We built a free modern website preview for your business. ` +
    `Take a look: ${previewUrl} — reply STOP to opt out. — Guma AI`
  )
}

export function buildFollowUpSMS({ businessName, previewUrl }) {
  return (
    `Following up — your free website preview for ${businessName} is still ready: ` +
    `${previewUrl}. Claim it anytime. Reply STOP to opt out. — Guma AI`
  )
}
