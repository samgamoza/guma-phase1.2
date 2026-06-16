import { Queue } from 'bullmq'

const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' }

export const generateQueue = new Queue('guma-generate', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 5_000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 200 },
  },
})

export const outreachQueue = new Queue('guma-outreach', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 30_000 },
    removeOnComplete: { count: 500 },
    removeOnFail:     { count: 200 },
  },
})

export async function enqueueGenerateJob(businessId) {
  const job = await generateQueue.add(
    `generate:${businessId}`,
    { businessId },
    { jobId: `gen-${businessId}` }
  )
  return job
}
