// Autopilot Phase 4: Health Logger Edge Function
// Securely writes health events to automation.health_log table
// Only accessible with AUTOPILOT_SECRET for server-to-server communication

import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const AUTOPILOT_SECRET = Deno.env.get('AUTOPILOT_SECRET')!;

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface HealthLogRequest {
  source?: 'self-heal' | 'autopilot' | 'worker' | 'manual' | 'cron' | 'api';
  kind?:
    | 'site'
    | 'db'
    | 'deploy'
    | 'migration'
    | 'rollback'
    | 'health-check'
    | 'backup';
  status?: 'ok' | 'warn' | 'error' | 'pending';
  http_code?: number | null;
  response_time_ms?: number | null;
  detail?: string | null;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  // CORS headers for browser requests (optional)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-autopilot-sign',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const sig = req.headers.get('x-autopilot-sign') || '';
    if (sig !== AUTOPILOT_SECRET) {
      return new Response(
        JSON.stringify({ ok: false, error: 'unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // POST: Log health event
    if (req.method === 'POST') {
      const body: HealthLogRequest = await req.json();

      // Validate required fields
      const source = body.source || 'autopilot';
      const kind = body.kind || 'site';
      const status = body.status || 'ok';
      const http_code = body.http_code ?? null;
      const response_time_ms = body.response_time_ms ?? null;
      const detail = body.detail ?? null;
      const metadata = body.metadata || {};

      // Insert log entry using the secure function
      const { data, error } = await supabase.rpc('log_health_event', {
        p_source: source,
        p_kind: kind,
        p_status: status,
        p_http_code: http_code,
        p_response_time_ms: response_time_ms,
        p_detail: detail,
        p_metadata: metadata,
      });

      if (error) {
        throw error;
      }

      console.log(
        `Health event logged: ${source}/${kind}/${status} (id: ${data})`
      );

      return new Response(
        JSON.stringify({
          ok: true,
          log_id: data,
          message: 'Health event logged successfully',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // GET: Health pulse endpoint (for external monitors)
    if (req.method === 'GET') {
      // Check database connectivity
      const { data, error } = await supabase
        .from('automation.health_log')
        .select('id')
        .limit(1);

      if (error) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'database_unreachable',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          ok: true,
          timestamp: new Date().toISOString(),
          database: 'connected',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ ok: false, error: 'method_not_allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'internal_server_error',
        message: String(e),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
