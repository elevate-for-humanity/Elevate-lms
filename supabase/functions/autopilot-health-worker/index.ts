// Autopilot Health Worker - Monitors and auto-heals system issues
// Runs inside Supabase Edge Functions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const autopilotToken = Deno.env.get('AUTOPILOT_TOKEN');

    if (!authHeader || !authHeader.includes(autopilotToken || '')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { task, data } = await req.json();

    let result;

    switch (task) {
      case 'full_health_check':
        result = await fullHealthCheck(supabase);
        break;

      case 'auto_heal':
        result = await autoHeal(supabase, data);
        break;

      case 'check_database':
        result = await checkDatabase(supabase);
        break;

      case 'check_api':
        result = await checkAPI(supabase);
        break;

      case 'check_storage':
        result = await checkStorage(supabase);
        break;

      case 'monitor_performance':
        result = await monitorPerformance(supabase);
        break;

      default:
        return new Response(JSON.stringify({ error: 'Unknown task' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Full system health check
async function fullHealthCheck(supabase: any) {
  const checks = [];
  const startTime = Date.now();

  // Database check
  try {
    const dbCheck = await checkDatabase(supabase);
    checks.push({ component: 'database', ...dbCheck });
  } catch (error) {
    checks.push({
      component: 'database',
      status: 'unhealthy',
      error: error.message,
    });
  }

  // API check
  try {
    const apiCheck = await checkAPI(supabase);
    checks.push({ component: 'api', ...apiCheck });
  } catch (error) {
    checks.push({
      component: 'api',
      status: 'unhealthy',
      error: error.message,
    });
  }

  // Storage check
  try {
    const storageCheck = await checkStorage(supabase);
    checks.push({ component: 'storage', ...storageCheck });
  } catch (error) {
    checks.push({
      component: 'storage',
      status: 'unhealthy',
      error: error.message,
    });
  }

  const responseTime = Date.now() - startTime;
  const allHealthy = checks.every((c) => c.status === 'healthy');

  return {
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    responseTime,
    timestamp: new Date().toISOString(),
  };
}

// Auto-heal detected issues
async function autoHeal(supabase: any, data: any) {
  const { issues } = data;
  const healResults = [];

  for (const issue of issues || []) {
    try {
      let result;

      switch (issue.type) {
        case 'missing_table':
          result = await healMissingTable(supabase, issue.table);
          break;

        case 'disabled_rls':
          result = await healRLS(supabase, issue.table);
          break;

        case 'missing_policy':
          result = await healPolicy(supabase, issue.table, issue.policy);
          break;

        case 'stale_data':
          result = await healStaleData(supabase, issue.table);
          break;

        default:
          result = { healed: false, reason: 'Unknown issue type' };
      }

      healResults.push({ issue: issue.type, ...result });
    } catch (error) {
      healResults.push({
        issue: issue.type,
        healed: false,
        error: error.message,
      });
    }
  }

  return {
    healed: healResults.filter((r) => r.healed).length,
    failed: healResults.filter((r) => !r.healed).length,
    results: healResults,
  };
}

// Check database health
async function checkDatabase(supabase: any) {
  const expectedTables = [
    'programs',
    'courses',
    'lessons',
    'enrollments',
    'lesson_progress',
    'certificates',
  ];

  const tableChecks = [];

  for (const table of expectedTables) {
    const startTime = Date.now();
    const { error } = await supabase.from(table).select('count').limit(0);
    const responseTime = Date.now() - startTime;

    tableChecks.push({
      table,
      exists: !error,
      responseTime,
    });
  }

  const allExist = tableChecks.every((t) => t.exists);
  const avgResponseTime =
    tableChecks.reduce((sum, t) => sum + t.responseTime, 0) / tableChecks.length;

  return {
    status: allExist ? 'healthy' : 'unhealthy',
    tables: tableChecks,
    avgResponseTime,
  };
}

// Check API health
async function checkAPI(supabase: any) {
  const startTime = Date.now();

  // Test read
  const { error: readError } = await supabase.from('programs').select('id').limit(1);

  const readTime = Date.now() - startTime;

  return {
    status: !readError ? 'healthy' : 'unhealthy',
    readTime,
    error: readError?.message,
  };
}

// Check storage health
async function checkStorage(supabase: any) {
  try {
    const { data, error } = await supabase.storage.listBuckets();

    return {
      status: !error ? 'healthy' : 'unhealthy',
      buckets: data?.length || 0,
      error: error?.message,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

// Monitor performance metrics
async function monitorPerformance(supabase: any) {
  const metrics = [];

  // Query performance
  const queryStart = Date.now();
  await supabase.from('programs').select('count').limit(0);
  const queryTime = Date.now() - queryStart;
  metrics.push({ metric: 'query_time', value: queryTime, unit: 'ms' });

  // Connection health
  const connectionStart = Date.now();
  await supabase.from('courses').select('count').limit(0);
  const connectionTime = Date.now() - connectionStart;
  metrics.push({
    metric: 'connection_time',
    value: connectionTime,
    unit: 'ms',
  });

  return {
    metrics,
    timestamp: new Date().toISOString(),
  };
}

// Healing functions
async function healMissingTable(supabase: any, table: string) {
  // Would trigger migration re-application
  return { healed: false, reason: 'Requires manual migration' };
}

async function healRLS(supabase: any, table: string) {
  try {
    await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`,
    });
    return { healed: true };
  } catch (error) {
    return { healed: false, error: error.message };
  }
}

async function healPolicy(supabase: any, table: string, policy: string) {
  return { healed: false, reason: 'Policy healing requires a reviewed SQL migration and is not auto-applied by the health worker' };
}

async function healStaleData(supabase: any, table: string) {
  return { healed: false, reason: 'Stale data cleanup requires an approved retention policy and is not auto-applied by the health worker' };
}
