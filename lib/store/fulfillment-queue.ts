import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';

const QUEUE_KEY = 'store:fulfillment:queue';
const PROCESSING_KEY = 'store:fulfillment:processing';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

interface FulfillmentJob {
  eventId: string;
  sessionId: string;
  email: string;
  productId: string;
  productTitle: string;
  repo?: string;
  downloadUrl?: string;
  retryCount?: number;
  createdAt?: string;
}

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL;
  if (!url) {
    logger.warn('Redis not configured - fulfillment queue disabled');
    return null;
  }

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5_000,
      enableReadyCheck: true,
    });
    redis.on('error', (error) => {
      logger.warn('[fulfillment-queue] Redis connection error', {
        error: error instanceof Error ? error.message : String(error),
      });
    });
    return redis;
  } catch (error) {
    logger.error('Failed to initialize fulfillment Redis client', error as Error);
    redis = null;
    return null;
  }
}

/** Queue a fulfillment job for background processing. */
export async function queueFulfillment(job: FulfillmentJob): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    const jobWithMeta: FulfillmentJob = {
      ...job,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    await client.lpush(QUEUE_KEY, JSON.stringify(jobWithMeta));
    logger.info('Fulfillment job queued', { eventId: job.eventId });
    return true;
  } catch (error) {
    logger.error('Failed to queue fulfillment job', error as Error);
    return false;
  }
}

/** Get next job from queue for processing. */
export async function getNextJob(): Promise<FulfillmentJob | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const jobStr = await client.lmove(QUEUE_KEY, PROCESSING_KEY, 'RIGHT', 'LEFT');
    if (!jobStr) return null;
    return JSON.parse(jobStr) as FulfillmentJob;
  } catch (error) {
    logger.error('Failed to get next job', error as Error);
    return null;
  }
}

/** Mark job as completed and remove from processing. */
export async function completeJob(job: FulfillmentJob): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.lrem(PROCESSING_KEY, 1, JSON.stringify(job));
    logger.info('Fulfillment job completed', { eventId: job.eventId });
  } catch (error) {
    logger.error('Failed to complete job', error as Error);
  }
}

/** Retry a failed job with exponential backoff. */
export async function retryJob(job: FulfillmentJob): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  const retryCount = (job.retryCount || 0) + 1;

  if (retryCount > MAX_RETRIES) {
    logger.error('Job exceeded max retries', undefined, { eventId: job.eventId, retryCount });
    await client.lpush(
      'store:fulfillment:dead',
      JSON.stringify({
        ...job,
        retryCount,
        failedAt: new Date().toISOString(),
      }),
    );
    await client.lrem(PROCESSING_KEY, 1, JSON.stringify(job));
    return false;
  }

  try {
    await client.lrem(PROCESSING_KEY, 1, JSON.stringify(job));
    const updatedJob: FulfillmentJob = { ...job, retryCount };

    setTimeout(async () => {
      try {
        await client.lpush(QUEUE_KEY, JSON.stringify(updatedJob));
        logger.info('Job re-queued for retry', { eventId: job.eventId, retryCount });
      } catch (error) {
        logger.error('Delayed fulfillment requeue failed', error as Error);
      }
    }, RETRY_DELAY_MS * retryCount);

    return true;
  } catch (error) {
    logger.error('Failed to retry job', error as Error);
    return false;
  }
}

/** Get queue stats. */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  dead: number;
} | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const [pending, processing, dead] = await Promise.all([
      client.llen(QUEUE_KEY),
      client.llen(PROCESSING_KEY),
      client.llen('store:fulfillment:dead'),
    ]);

    return { pending, processing, dead };
  } catch (error) {
    logger.error('Failed to get queue stats', error as Error);
    return null;
  }
}

/** Process fulfillment jobs (called by cron or background worker). */
export async function processFulfillmentQueue(): Promise<number> {
  const { provisionLicense } = await import('@/lib/licensing/provisioning');

  let processed = 0;
  const maxBatch = 10;

  for (let i = 0; i < maxBatch; i++) {
    const job = await getNextJob();
    if (!job) break;

    try {
      const result = await provisionLicense({
        correlationId: job.eventId,
        email: job.email,
        productId: job.productId,
        paymentIntentId: job.eventId,
        sessionId: job.sessionId,
        amountCents: 0,
        currency: 'usd',
        metadata: {
          repo: job.repo,
          download_url: job.downloadUrl,
          product_title: job.productTitle,
          queued: true,
        },
      });

      if (result.success) {
        await completeJob(job);
        processed++;
        logger.info('Fulfillment processed via queue', {
          eventId: job.eventId,
          tenantId: result.tenantId,
          licenseId: result.licenseId,
        });
      } else {
        throw new Error(result.error || 'Provisioning failed');
      }
    } catch (error) {
      logger.error('Fulfillment failed', error as Error);
      await retryJob(job);
    }
  }

  return processed;
}
