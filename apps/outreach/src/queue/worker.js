import { Worker } from 'bullmq';
import { sendOutreachEmail } from '../email/sender.js';
import { sendOutreachSMS } from '../sms/sender.js';
import { enqueueFollowUp } from './queues.js';
import { getSupabase, updateOutreachStatus, getSentTodayCount, getSmsSentTodayCount } from '../db/client.js';

const DAILY_SEND_LIMIT = parseInt(process.env.DAILY_SEND_LIMIT || '200', 10);
const DAILY_SMS_LIMIT  = parseInt(process.env.DAILY_SMS_LIMIT || '50', 10);

function calculateLeadScore(business) {
  let score = 0;
  const rd = business.raw_data || {};
  const reviews = parseInt(rd.review_count || 0);
  if (reviews >= 200) score += 40;
  else if (reviews >= 100) score += 30;
  else if (reviews >= 20) score += 15;

  const rating = parseFloat(rd.rating || 0);
  if (rating >= 4.5) score += 20;
  else if (rating >= 4.0) score += 10;

  if (business.email) score += 20;
  if (business.phone) score += 10;

  const hasSocial = rd.social_links && Object.keys(rd.social_links).length > 0;
  const hasServices = rd.services && rd.services.length > 0;
  if (hasSocial) score += 5;
  if (hasServices) score += 5;

  return Math.min(100, score);
}

/**
 * startOutreachWorker()
 * 
 * Consumes 'guma-outreach' jobs.
 * Expected data: { outreachId }
 */
export function startOutreachWorker() {
  const worker = new Worker(
    'guma-outreach',
    async (job) => {
      const { outreachId } = job.data;
      if (!outreachId) {
        throw new Error('Outreach worker job missing outreachId');
      }

      // 1. Fetch the outreach record, business, and website
      const { data: outreach, error: outError } = await getSupabase()
        .from('outreach')
        .select(`
          id,
          to_email,
          businesses (
            id,
            name,
            email,
            phone,
            country,
            raw_data
          ),
          websites (
            id,
            slug
          )
        `)
        .eq('id', outreachId)
        .single();

      if (outError || !outreach) {
        throw new Error(`Outreach record ${outreachId} not found: ${outError?.message}`);
      }

      const business = outreach.businesses;
      const website = outreach.websites;

      if (!business) {
        throw new Error(`Business not found for outreach record ${outreachId}`);
      }

      const rating = business.raw_data?.rating;
      const leadScore = calculateLeadScore(business);
      const siteBase = process.env.SITE_BASE_URL || 'https://guma.ai';
      const publicUrl = website?.slug ? `${siteBase}/sites/${website.slug}` : '';

      // ── Channel routing: email preferred, SMS fallback for phone-only leads ──
      const targetEmail = outreach.to_email || business.email;
      const targetPhone = business.phone;

      if (targetEmail) {
        // Enforce daily email cap to protect sender reputation
        const sentToday = await getSentTodayCount();
        if (sentToday >= DAILY_SEND_LIMIT) {
          console.warn(`Daily email limit reached (${sentToday}/${DAILY_SEND_LIMIT}). Releasing job back to queue.`);
          throw new Error(`DAILY_LIMIT_REACHED: ${sentToday}/${DAILY_SEND_LIMIT}`);
        }
        try {
          await sendOutreachEmail({ to: targetEmail, businessName: business.name, previewUrl: publicUrl, rating, leadScore });
          await updateOutreachStatus(outreachId, 'sent', { channel: 'email' });
          await enqueueFollowUp(outreachId);
        } catch (err) {
          console.error(`Failed to send email to ${targetEmail}:`, err.message);
          await updateOutreachStatus(outreachId, 'failed');
          throw err; // Re-throw to trigger BullMQ retry logic
        }
      } else if (targetPhone) {
        // Phone-only lead → Twilio SMS
        const smsToday = await getSmsSentTodayCount();
        if (smsToday >= DAILY_SMS_LIMIT) {
          console.warn(`Daily SMS limit reached (${smsToday}/${DAILY_SMS_LIMIT}). Releasing job back to queue.`);
          throw new Error(`DAILY_SMS_LIMIT_REACHED: ${smsToday}/${DAILY_SMS_LIMIT}`);
        }
        try {
          const res = await sendOutreachSMS({
            to: targetPhone,
            businessName: business.name,
            previewUrl: publicUrl,
            country: business.country || 'PH',
          });
          await updateOutreachStatus(outreachId, 'sent', { channel: 'sms' });
          console.log(`SMS sent to ${res.to} for "${business.name}" (sid ${res.sid})`);
          await enqueueFollowUp(outreachId);
        } catch (err) {
          console.error(`Failed to send SMS to ${targetPhone}:`, err.message);
          await updateOutreachStatus(outreachId, 'failed');
          throw err;
        }
      } else {
        console.warn(`Business "${business.name}" has no email or phone. Skipping outreach.`);
        await updateOutreachStatus(outreachId, 'failed');
        return;
      }
    },
    {
      connection: { url: process.env.REDIS_URL },
      // Concurrency limit to protect your email reputation
      concurrency: 2,
    }
  );

  return worker;
}