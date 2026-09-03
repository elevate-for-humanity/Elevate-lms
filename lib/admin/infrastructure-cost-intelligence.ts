import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import {
  getNorthflankProjectId,
  getNorthflankService,
  getNorthflankServices,
  isNorthflankReady,
} from '@/lib/northflank/runtime';
import { gpuVideoAvailable } from '@/lib/video/gpu-video-client';

const DAY_MS = 86_400_000;

export type CostRecommendation = {
  severity: 'critical' | 'warning' | 'opportunity' | 'healthy';
  title: string;
  detail: string;
  estimatedMonthlySavings: number | null;
};

export type InfrastructureCostIntelligence = {
  generatedAt: string;
  windowDays: number;
  gpu: {
    ready: boolean;
    queued: number;
    rendering: number;
    completed: number;
    failed: number;
    stale: number;
    deadLettered: number;
    repeatedRetries: number;
    storageFailures: number;
    renderSeconds: number;
    videoSeconds: number;
    outputBytes: number;
    failedAttemptSeconds: number;
    configuredHourlyRate: number | null;
    estimatedWindowCost: number | null;
    estimatedFailedAttemptCost: number | null;
  };
  northflank: {
    configured: boolean;
    services: Array<{ key: string; label: string; status: string; deployedCommit: string | null }>;
  };
  recommendations: CostRecommendation[];
};

type UsageRow = {
  metric: string;
  quantity: number | string;
  metadata: Record<string, unknown> | null;
};

type VideoJobRow = {
  status: string;
  retry_count: number | null;
  failure_class: string | null;
  lease_expires_at: string | null;
  dead_lettered_at: string | null;
};

function finiteNonNegative(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function numberFrom(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function serviceField(service: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = service[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

export function buildCostRecommendations(input: {
  gpuReady: boolean;
  queued: number;
  rendering: number;
  stale: number;
  repeatedRetries: number;
  storageFailures: number;
  deadLettered: number;
  failedAttemptCost: number | null;
}): CostRecommendation[] {
  const recommendations: CostRecommendation[] = [];

  if (!input.gpuReady && input.queued > 0) {
    recommendations.push({
      severity: 'critical',
      title: 'Queued work cannot reach the GPU',
      detail: 'Restore the configured GPU worker before adding capacity or replaying the queue. Repeated dispatches would spend retries without producing assets.',
      estimatedMonthlySavings: null,
    });
  }
  if (input.stale > 0) {
    recommendations.push({
      severity: 'warning',
      title: 'Recover stale renders before starting new work',
      detail: `${input.stale} rendering job${input.stale === 1 ? ' has' : 's have'} an expired lease. Recovering the durable checkpoint prevents duplicate GPU rendering.`,
      estimatedMonthlySavings: null,
    });
  }
  if (input.repeatedRetries > 0 || input.deadLettered > 0) {
    recommendations.push({
      severity: 'warning',
      title: 'Stop expensive retry loops',
      detail: `${input.repeatedRetries} job${input.repeatedRetries === 1 ? '' : 's'} used multiple retries and ${input.deadLettered} reached dead letter. Repair the classified failure before replay.`,
      estimatedMonthlySavings: input.failedAttemptCost,
    });
  }
  if (input.storageFailures > 0) {
    recommendations.push({
      severity: 'warning',
      title: 'Fix storage transfer failures first',
      detail: `${input.storageFailures} job${input.storageFailures === 1 ? '' : 's'} failed in storage. Rendering replacements before upload is healthy wastes GPU time.`,
      estimatedMonthlySavings: null,
    });
  }
  if (input.gpuReady && input.queued === 0 && input.rendering === 0) {
    recommendations.push({
      severity: 'opportunity',
      title: 'GPU is eligible to scale to zero',
      detail: 'There is no queued or rendering work. Keep Admin and LMS online, but let the isolated GPU worker sleep until the durable queue receives work.',
      estimatedMonthlySavings: null,
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      severity: 'healthy',
      title: 'No immediate GPU waste signal',
      detail: 'The queue, leases, retry budget, and classified failures show no current cost leak.',
      estimatedMonthlySavings: null,
    });
  }
  return recommendations;
}

export async function getInfrastructureCostIntelligence(
  windowDays = 30,
): Promise<InfrastructureCostIntelligence> {
  const db = await requireAdminClient();
  const generatedAt = new Date();
  const since = new Date(generatedAt.getTime() - windowDays * DAY_MS).toISOString();
  const rate = finiteNonNegative(
    process.env.NORTHFLANK_GPU_COST_PER_HOUR ?? process.env.GPU_COST_PER_HOUR,
  );

  const [usageResult, jobsResult, gpuReadyResult] = await Promise.all([
    db
      .from('platform_usage_events')
      .select('metric,quantity,metadata')
      .in('metric', ['gpu_video_seconds', 'gpu_render_seconds', 'gpu_output_bytes', 'video_generation_attempt'])
      .gte('occurred_at', since),
    db
      .from('video_jobs')
      .select('status,retry_count,failure_class,lease_expires_at,dead_lettered_at'),
    gpuVideoAvailable().catch(() => false),
  ]);

  if (usageResult.error) throw new Error(`GPU usage ledger unavailable: ${usageResult.error.message}`);
  if (jobsResult.error) throw new Error(`Video job ledger unavailable: ${jobsResult.error.message}`);

  const usage = (usageResult.data ?? []) as UsageRow[];
  const jobs = (jobsResult.data ?? []) as VideoJobRow[];
  const sumMetric = (metric: string) => usage
    .filter((row) => row.metric === metric)
    .reduce((sum, row) => sum + numberFrom(row.quantity), 0);
  const failedAttemptSeconds = usage
    .filter((row) => row.metric === 'video_generation_attempt' && row.metadata?.outcome === 'failed')
    .reduce((sum, row) => sum + numberFrom(row.metadata?.elapsed_seconds), 0);
  const nowIso = generatedAt.toISOString();
  const queued = jobs.filter((job) => job.status === 'queued' && !job.dead_lettered_at).length;
  const rendering = jobs.filter((job) => job.status === 'rendering').length;
  const stale = jobs.filter((job) => job.status === 'rendering' && job.lease_expires_at && job.lease_expires_at < nowIso).length;
  const completed = jobs.filter((job) => job.status === 'complete').length;
  const failed = jobs.filter((job) => job.status === 'failed').length;
  const deadLettered = jobs.filter((job) => Boolean(job.dead_lettered_at)).length;
  const repeatedRetries = jobs.filter((job) => numberFrom(job.retry_count) >= 2).length;
  const storageFailures = jobs.filter((job) => job.failure_class === 'storage').length;
  const renderSeconds = sumMetric('gpu_render_seconds');
  const estimatedWindowCost = rate == null ? null : (renderSeconds / 3600) * rate;
  const estimatedFailedAttemptCost = rate == null ? null : (failedAttemptSeconds / 3600) * rate;

  const projectId = getNorthflankProjectId();
  const northflankConfigured = Boolean(projectId && isNorthflankReady());
  const serviceConfigs = getNorthflankServices();
  const services = northflankConfigured && projectId
    ? await Promise.all(serviceConfigs.map(async (config) => {
        try {
          const service = await getNorthflankService(projectId, config.id);
          return {
            key: config.key,
            label: config.label,
            status: serviceField(service, ['status', 'deploymentStatus', 'buildStatus']) ?? 'reachable',
            deployedCommit: serviceField(service, ['deploymentCommitSha', 'commitSha', 'sha']),
          };
        } catch {
          return { key: config.key, label: config.label, status: 'unavailable', deployedCommit: null };
        }
      }))
    : serviceConfigs.map((config) => ({
        key: config.key,
        label: config.label,
        status: 'integration not configured',
        deployedCommit: null,
      }));

  const recommendations = buildCostRecommendations({
    gpuReady: gpuReadyResult,
    queued,
    rendering,
    stale,
    repeatedRetries,
    storageFailures,
    deadLettered,
    failedAttemptCost: estimatedFailedAttemptCost,
  });

  return {
    generatedAt: generatedAt.toISOString(),
    windowDays,
    gpu: {
      ready: gpuReadyResult,
      queued,
      rendering,
      completed,
      failed,
      stale,
      deadLettered,
      repeatedRetries,
      storageFailures,
      renderSeconds,
      videoSeconds: sumMetric('gpu_video_seconds'),
      outputBytes: sumMetric('gpu_output_bytes'),
      failedAttemptSeconds,
      configuredHourlyRate: rate,
      estimatedWindowCost,
      estimatedFailedAttemptCost,
    },
    northflank: { configured: northflankConfigured, services },
    recommendations,
  };
}
