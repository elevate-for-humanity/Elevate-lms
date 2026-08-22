/**
 * Legacy AI Course Create compatibility endpoint.
 *
 * COURSE GENERATION IS OWNED BY lib/course-factory/factory.ts.
 * This Edge Function previously implemented an independent AI generator and
 * wrote directly to courses/modules/lessons with the service-role client.
 * Keeping that execution path would violate the single-authority Course Factory
 * contract and bypass Admin authorization/governance.
 *
 * The endpoint is intentionally retained as a non-writing compatibility surface
 * so old callers fail explicitly instead of silently creating parallel data.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: 'Method not allowed',
        code: 'COURSE_FACTORY_REQUIRED',
      }),
      { status: 405, headers: corsHeaders },
    );
  }

  return new Response(
    JSON.stringify({
      error: 'Legacy AI course creation is disabled. Use the canonical Admin Course Factory.',
      code: 'COURSE_FACTORY_REQUIRED',
      canonicalSurface: '/admin/course-builder',
      canonicalApi: '/api/admin/course-builder',
    }),
    { status: 410, headers: corsHeaders },
  );
});
