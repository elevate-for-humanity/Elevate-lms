// Autopilot Phase 5: Metrics Exporter
// Exports Prometheus-compatible metrics for Grafana
// Provides real-time system metrics in OpenMetrics format

import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const AUTOPILOT_SECRET = Deno.env.get('AUTOPILOT_SECRET')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  value: number;
  labels?: Record<string, string>;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-autopilot-sign',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const sig = req.headers.get('x-autopilot-sign') || '';
    if (sig !== AUTOPILOT_SECRET) {
      return new Response('unauthorized', {
        status: 401,
        headers: corsHeaders,
      });
    }

    if (req.method === 'GET') {
      const metrics = await collectMetrics();
      const prometheusFormat = formatPrometheus(metrics);

      return new Response(prometheusFormat, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; version=0.0.4',
        },
      });
    }

    return new Response('method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function collectMetrics(): Promise<Metric[]> {
  const metrics: Metric[] = [];
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Uptime metrics (last 24h)
  const { data: uptimeData } = await supabase
    .from('automation.health_log')
    .select('kind, status')
    .gte('checked_at', last24h.toISOString());

  if (uptimeData) {
    const byKind = uptimeData.reduce((acc: any, row: any) => {
      if (!acc[row.kind]) acc[row.kind] = { ok: 0, warn: 0, error: 0, total: 0 };
      acc[row.kind][row.status]++;
      acc[row.kind].total++;
      return acc;
    }, {});

    for (const [kind, counts] of Object.entries(byKind) as [string, any][]) {
      const uptime = (counts.ok / counts.total) * 100;
      metrics.push({
        name: 'autopilot_uptime_percentage',
        type: 'gauge',
        help: 'System uptime percentage (last 24h)',
        value: uptime,
        labels: { kind, period: '24h' },
      });

      metrics.push({
        name: 'autopilot_health_checks_total',
        type: 'counter',
        help: 'Total health checks performed',
        value: counts.total,
        labels: { kind, period: '24h' },
      });

      metrics.push({
        name: 'autopilot_errors_total',
        type: 'counter',
        help: 'Total errors detected',
        value: counts.error || 0,
        labels: { kind, period: '24h' },
      });
    }
  }

  // 2. Response time metrics
  const { data: responseData } = await supabase
    .from('automation.health_log')
    .select('kind, response_time_ms')
    .gte('checked_at', last24h.toISOString())
    .not('response_time_ms', 'is', null);

  if (responseData) {
    const byKind = responseData.reduce((acc: any, row: any) => {
      if (!acc[row.kind]) acc[row.kind] = [];
      acc[row.kind].push(row.response_time_ms);
      return acc;
    }, {});

    for (const [kind, times] of Object.entries(byKind) as [string, number[]][]) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = Math.min(...times);
      const max = Math.max(...times);
      const p95 = percentile(times, 95);
      const p99 = percentile(times, 99);

      metrics.push({
        name: 'autopilot_response_time_ms',
        type: 'gauge',
        help: 'Average response time in milliseconds',
        value: avg,
        labels: { kind, stat: 'avg' },
      });

      metrics.push({
        name: 'autopilot_response_time_ms',
        type: 'gauge',
        help: 'Response time percentiles',
        value: p95,
        labels: { kind, stat: 'p95' },
      });

      metrics.push({
        name: 'autopilot_response_time_ms',
        type: 'gauge',
        help: 'Response time percentiles',
        value: p99,
        labels: { kind, stat: 'p99' },
      });
    }
  }

  // 3. Migration metrics (last 7 days)
  const { data: migrationData } = await supabase
    .from('automation.migration_log')
    .select('status, duration_ms')
    .gte('ran_at', last7d.toISOString());

  if (migrationData) {
    const total = migrationData.length;
    const successful = migrationData.filter((m: any) => m.status === 'success').length;
    const failed = migrationData.filter((m: any) => m.status === 'failure').length;
    const rollbacks = migrationData.filter((m: any) => m.status === 'rollback').length;
    const successRate = total > 0 ? (successful / total) * 100 : 100;

    metrics.push({
      name: 'autopilot_migrations_total',
      type: 'counter',
      help: 'Total migrations executed',
      value: total,
      labels: { period: '7d' },
    });

    metrics.push({
      name: 'autopilot_migrations_success_rate',
      type: 'gauge',
      help: 'Migration success rate percentage',
      value: successRate,
      labels: { period: '7d' },
    });

    metrics.push({
      name: 'autopilot_rollbacks_total',
      type: 'counter',
      help: 'Total rollbacks executed',
      value: rollbacks,
      labels: { period: '7d' },
    });

    // Average migration duration
    const durations = migrationData
      .filter((m: any) => m.duration_ms)
      .map((m: any) => m.duration_ms);

    if (durations.length > 0) {
      const avgDuration = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
      metrics.push({
        name: 'autopilot_migration_duration_ms',
        type: 'gauge',
        help: 'Average migration duration in milliseconds',
        value: avgDuration,
        labels: { stat: 'avg' },
      });
    }
  }

  // 4. Deployment metrics (last 7 days)
  const { data: deployData } = await supabase
    .from('automation.deployment_log')
    .select('status, platform')
    .gte('deployed_at', last7d.toISOString());

  if (deployData) {
    const byPlatform = deployData.reduce((acc: any, row: any) => {
      if (!acc[row.platform]) acc[row.platform] = { total: 0, success: 0, failed: 0 };
      acc[row.platform].total++;
      if (row.status === 'success') acc[row.platform].success++;
      if (row.status === 'failed') acc[row.platform].failed++;
      return acc;
    }, {});

    for (const [platform, counts] of Object.entries(byPlatform) as [string, any][]) {
      metrics.push({
        name: 'autopilot_deployments_total',
        type: 'counter',
        help: 'Total deployments triggered',
        value: counts.total,
        labels: { platform, period: '7d' },
      });

      const successRate = counts.total > 0 ? (counts.success / counts.total) * 100 : 100;
      metrics.push({
        name: 'autopilot_deployment_success_rate',
        type: 'gauge',
        help: 'Deployment success rate percentage',
        value: successRate,
        labels: { platform, period: '7d' },
      });
    }
  }

  // 5. System health score (composite metric)
  const healthScore = calculateHealthScore(metrics);
  metrics.push({
    name: 'autopilot_health_score',
    type: 'gauge',
    help: 'Overall system health score (0-100)',
    value: healthScore,
    labels: {},
  });

  return metrics;
}

function formatPrometheus(metrics: Metric[]): string {
  const lines: string[] = [];
  const grouped = new Map<string, Metric[]>();

  // Group metrics by name
  for (const metric of metrics) {
    if (!grouped.has(metric.name)) {
      grouped.set(metric.name, []);
    }
    grouped.get(metric.name)!.push(metric);
  }

  // Format each group
  for (const [name, metricGroup] of grouped) {
    // Add HELP and TYPE once per metric name
    lines.push(`# HELP ${name} ${metricGroup[0].help}`);
    lines.push(`# TYPE ${name} ${metricGroup[0].type}`);

    // Add each metric value with labels
    for (const metric of metricGroup) {
      const labels = metric.labels
        ? Object.entries(metric.labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(',')
        : '';

      const labelStr = labels ? `{${labels}}` : '';
      lines.push(`${name}${labelStr} ${metric.value}`);
    }

    lines.push(''); // Empty line between metric groups
  }

  return lines.join('\n');
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function calculateHealthScore(metrics: Metric[]): number {
  // Composite health score based on multiple factors
  let score = 100;

  // Find uptime metrics
  const uptimeMetrics = metrics.filter((m) => m.name === 'autopilot_uptime_percentage');
  if (uptimeMetrics.length > 0) {
    const avgUptime = uptimeMetrics.reduce((sum, m) => sum + m.value, 0) / uptimeMetrics.length;
    score = Math.min(score, avgUptime);
  }

  // Penalize for errors
  const errorMetrics = metrics.filter((m) => m.name === 'autopilot_errors_total');
  const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
  if (totalErrors > 10) score -= Math.min(20, totalErrors - 10);

  // Penalize for rollbacks
  const rollbackMetrics = metrics.filter((m) => m.name === 'autopilot_rollbacks_total');
  const totalRollbacks = rollbackMetrics.reduce((sum, m) => sum + m.value, 0);
  if (totalRollbacks > 0) score -= Math.min(15, totalRollbacks * 5);

  // Bonus for high migration success rate
  const migrationSuccessMetrics = metrics.filter(
    (m) => m.name === 'autopilot_migrations_success_rate',
  );
  if (migrationSuccessMetrics.length > 0 && migrationSuccessMetrics[0].value === 100) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}
