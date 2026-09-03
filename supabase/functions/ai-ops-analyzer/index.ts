// Autopilot Phase 6: AI-Powered Operations
// Anomaly detection, predictive failure analysis, and intelligent recommendations

import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const AUTOPILOT_SECRET = Deno.env.get('AUTOPILOT_SECRET')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY'); // Optional

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface AnomalyDetectionResult {
  isAnomaly: boolean;
  confidence: number;
  reason: string;
  expectedValue: number;
  actualValue: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PredictiveAnalysis {
  prediction: string;
  probability: number;
  timeframe: string;
  recommendations: string[];
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-autopilot-sign',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const sig = req.headers.get('x-autopilot-sign') || '';
    if (sig !== AUTOPILOT_SECRET) {
      return new Response('unauthorized', {
        status: 401,
        headers: corsHeaders,
      });
    }

    if (req.method === 'POST') {
      const { task, data } = await req.json();

      let result;
      switch (task) {
        case 'detect_anomalies':
          result = await detectAnomalies();
          break;
        case 'predict_failures':
          result = await predictFailures();
          break;
        case 'analyze_trends':
          result = await analyzeTrends(data);
          break;
        case 'generate_insights':
          result = await generateInsights();
          break;
        case 'optimize_system':
          result = await optimizeSystem();
          break;
        default:
          return new Response(JSON.stringify({ error: 'Unknown task' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }

      return new Response(JSON.stringify({ ok: true, result }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Anomaly Detection using Statistical Methods
async function detectAnomalies(): Promise<AnomalyDetectionResult[]> {
  const anomalies: AnomalyDetectionResult[] = [];

  // Get recent health metrics
  const { data: recentMetrics } = await supabase
    .from('automation.health_log')
    .select('kind, response_time_ms, status, checked_at')
    .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('checked_at', { ascending: false });

  if (!recentMetrics || recentMetrics.length === 0) {
    return anomalies;
  }

  // Group by kind
  const byKind = recentMetrics.reduce((acc: any, metric: any) => {
    if (!acc[metric.kind]) acc[metric.kind] = [];
    acc[metric.kind].push(metric);
    return acc;
  }, {});

  // Detect anomalies for each kind
  for (const [kind, metrics] of Object.entries(byKind) as [string, any[]][]) {
    // Response time anomalies (using Z-score)
    const responseTimes = metrics
      .filter((m) => m.response_time_ms !== null)
      .map((m) => m.response_time_ms);

    if (responseTimes.length > 10) {
      const mean = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const stdDev = Math.sqrt(
        responseTimes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / responseTimes.length,
      );

      const latestTime = responseTimes[0];
      const zScore = Math.abs((latestTime - mean) / stdDev);

      if (zScore > 3) {
        // 3 standard deviations
        anomalies.push({
          isAnomaly: true,
          confidence: Math.min(0.99, zScore / 5),
          reason: `Response time for ${kind} is ${zScore.toFixed(2)} standard deviations from normal`,
          expectedValue: mean,
          actualValue: latestTime,
          severity: zScore > 5 ? 'critical' : zScore > 4 ? 'high' : 'medium',
        });
      }
    }

    // Error rate anomalies
    const recentErrors = metrics.filter((m) => m.status === 'error').length;
    const errorRate = recentErrors / metrics.length;
    const historicalErrorRate = 0.05; // 5% baseline

    if (errorRate > historicalErrorRate * 3) {
      anomalies.push({
        isAnomaly: true,
        confidence: Math.min(0.95, errorRate / historicalErrorRate / 5),
        reason: `Error rate for ${kind} is ${(errorRate * 100).toFixed(1)}% (expected ${(historicalErrorRate * 100).toFixed(1)}%)`,
        expectedValue: historicalErrorRate,
        actualValue: errorRate,
        severity: errorRate > 0.5 ? 'critical' : errorRate > 0.2 ? 'high' : 'medium',
      });
    }
  }

  // Log anomalies
  for (const anomaly of anomalies) {
    await supabase.from('automation.health_log').insert({
      source: 'ai-ops',
      kind: 'anomaly',
      status: anomaly.severity === 'critical' ? 'error' : 'warn',
      detail: anomaly.reason,
      metadata: {
        confidence: anomaly.confidence,
        expected: anomaly.expectedValue,
        actual: anomaly.actualValue,
      },
    });
  }

  return anomalies;
}

// Predictive Failure Analysis
async function predictFailures(): Promise<PredictiveAnalysis[]> {
  const predictions: PredictiveAnalysis[] = [];

  // Get historical data
  const { data: historicalData } = await supabase
    .from('automation.health_log')
    .select('kind, status, response_time_ms, checked_at')
    .gte('checked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('checked_at', { ascending: true });

  if (!historicalData || historicalData.length < 100) {
    return predictions;
  }

  // Analyze trends
  const byKind = historicalData.reduce((acc: any, metric: any) => {
    if (!acc[metric.kind]) acc[metric.kind] = [];
    acc[metric.kind].push(metric);
    return acc;
  }, {});

  for (const [kind, metrics] of Object.entries(byKind) as [string, any[]][]) {
    // Calculate error trend
    const recentErrors = metrics.slice(-24).filter((m: any) => m.status === 'error').length;
    const olderErrors = metrics.slice(-48, -24).filter((m: any) => m.status === 'error').length;
    const errorTrend = recentErrors - olderErrors;

    if (errorTrend > 3) {
      predictions.push({
        prediction: `${kind} failure likely within 24 hours`,
        probability: Math.min(0.85, 0.5 + errorTrend / 10),
        timeframe: '24 hours',
        recommendations: [
          `Monitor ${kind} closely`,
          'Review recent changes',
          'Prepare rollback plan',
          'Check resource utilization',
        ],
      });
    }

    // Calculate response time trend
    const responseTimes = metrics
      .filter((m: any) => m.response_time_ms !== null)
      .map((m: any) => m.response_time_ms);

    if (responseTimes.length > 20) {
      const recentAvg = responseTimes.slice(-10).reduce((a: number, b: number) => a + b, 0) / 10;
      const olderAvg =
        responseTimes.slice(-20, -10).reduce((a: number, b: number) => a + b, 0) / 10;
      const degradation = (recentAvg - olderAvg) / olderAvg;

      if (degradation > 0.5) {
        // 50% degradation
        predictions.push({
          prediction: `${kind} performance degradation detected`,
          probability: Math.min(0.9, 0.6 + degradation),
          timeframe: '12 hours',
          recommendations: [
            'Investigate slow queries',
            'Check database indexes',
            'Review recent deployments',
            'Consider scaling resources',
          ],
        });
      }
    }
  }

  // Log predictions
  for (const prediction of predictions) {
    await supabase.from('automation.health_log').insert({
      source: 'ai-ops',
      kind: 'prediction',
      status: prediction.probability > 0.7 ? 'warn' : 'ok',
      detail: prediction.prediction,
      metadata: {
        probability: prediction.probability,
        timeframe: prediction.timeframe,
        recommendations: prediction.recommendations,
      },
    });
  }

  return predictions;
}

// Trend Analysis
async function analyzeTrends(data: any): Promise<any> {
  const period = data?.period || '7d';
  const metric = data?.metric || 'uptime';

  const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 1;

  const { data: metrics } = await supabase
    .from('automation.health_log')
    .select('*')
    .gte('checked_at', new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString())
    .order('checked_at', { ascending: true });

  if (!metrics || metrics.length === 0) {
    return { trend: 'stable', confidence: 0 };
  }

  // Simple linear regression
  const dataPoints = metrics.map((m: any, i: number) => ({
    x: i,
    y: m.status === 'ok' ? 1 : 0,
  }));

  const n = dataPoints.length;
  const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
  const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
  const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  return {
    trend: slope > 0.01 ? 'improving' : slope < -0.01 ? 'degrading' : 'stable',
    slope,
    confidence: Math.min(0.95, Math.abs(slope) * 10),
    dataPoints: n,
  };
}

// Generate AI Insights (using OpenAI if available)
async function generateInsights(): Promise<any> {
  // Get recent system state
  const { data: recentEvents } = await supabase
    .from('automation.health_log')
    .select('*')
    .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('checked_at', { ascending: false })
    .limit(100);

  const { data: migrations } = await supabase
    .from('automation.migration_log')
    .select('*')
    .gte('ran_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('ran_at', { ascending: false });

  // Calculate basic insights
  const totalEvents = recentEvents?.length || 0;
  const errors = recentEvents?.filter((e: any) => e.status === 'error').length || 0;
  const errorRate = totalEvents > 0 ? errors / totalEvents : 0;

  const totalMigrations = migrations?.length || 0;
  const failedMigrations = migrations?.filter((m: any) => m.status === 'failure').length || 0;

  const insights = {
    summary: `System processed ${totalEvents} health checks in the last 24 hours with ${(errorRate * 100).toFixed(1)}% error rate.`,
    health:
      errorRate < 0.05 ? 'excellent' : errorRate < 0.1 ? 'good' : errorRate < 0.2 ? 'fair' : 'poor',
    migrations: {
      total: totalMigrations,
      failed: failedMigrations,
      successRate:
        totalMigrations > 0
          ? (((totalMigrations - failedMigrations) / totalMigrations) * 100).toFixed(1) + '%'
          : 'N/A',
    },
    recommendations: [],
  };

  // Generate recommendations
  if (errorRate > 0.1) {
    insights.recommendations.push('High error rate detected - investigate root cause');
  }
  if (failedMigrations > 0) {
    insights.recommendations.push('Recent migration failures - review migration scripts');
  }
  if (errorRate < 0.01 && failedMigrations === 0) {
    insights.recommendations.push('System is performing well - no immediate action needed');
  }

  // If OpenAI is available, enhance insights
  if (OPENAI_API_KEY) {
    try {
      const enhancedInsights = await enhanceWithAI(insights, recentEvents, migrations);
      return enhancedInsights;
    } catch (e) {
      console.warn('[ai-ops-analyzer] AI enhancement failed, using base insights:', e instanceof Error ? e.message : e);
    }
  }

  return insights;
}

// Enhance insights with OpenAI (optional)
async function enhanceWithAI(
  insights: any,
  events: unknown[],
  migrations: unknown[],
): Promise<any> {
  if (!OPENAI_API_KEY) return insights;

  const prompt = `Analyze this system health data and provide actionable insights:

Recent Events: ${events.length} health checks
Error Rate: ${insights.health === 'excellent' ? '< 5%' : insights.health === 'good' ? '5-10%' : '> 10%'}
Migrations: ${migrations.length} in last 7 days, ${insights.migrations.failed} failed

Provide:
1. Key observations
2. Potential issues
3. Specific recommendations
4. Priority actions

Keep response concise and actionable.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const aiInsights = data.choices[0].message.content;

  return {
    ...insights,
    aiAnalysis: aiInsights,
  };
}

// System Optimization Suggestions
async function optimizeSystem(): Promise<any> {
  const optimizations = [];

  // Check for slow queries
  const { data: slowQueries } = await supabase
    .from('automation.slow_queries_summary')
    .select('*')
    .limit(10);

  if (slowQueries && slowQueries.length > 0) {
    optimizations.push({
      type: 'query_optimization',
      priority: 'high',
      description: `Found ${slowQueries.length} slow queries`,
      action: 'Review and optimize slow queries',
      impact: 'Improve response times by 30-50%',
    });
  }

  // Check for missing indexes
  const { data: recommendations } = await supabase
    .from('automation.performance_recommendations')
    .select('*')
    .eq('implemented', false)
    .eq('recommendation_type', 'add_index')
    .limit(5);

  if (recommendations && recommendations.length > 0) {
    optimizations.push({
      type: 'indexing',
      priority: 'high',
      description: `${recommendations.length} tables need indexes`,
      action: 'Add recommended indexes',
      impact: 'Reduce query time by 50-80%',
    });
  }

  // Check for tables needing VACUUM
  const { data: vacuumNeeded } = await supabase
    .from('automation.table_health')
    .select('*')
    .ilike('vacuum_health', '%Needs VACUUM%');

  if (vacuumNeeded && vacuumNeeded.length > 0) {
    optimizations.push({
      type: 'maintenance',
      priority: 'medium',
      description: `${vacuumNeeded.length} tables need VACUUM`,
      action: 'Run VACUUM ANALYZE on affected tables',
      impact: 'Improve query performance and reclaim disk space',
    });
  }

  return {
    totalOptimizations: optimizations.length,
    optimizations,
    estimatedImpact:
      optimizations.length > 0
        ? 'Significant performance improvement expected'
        : 'System is well optimized',
  };
}
