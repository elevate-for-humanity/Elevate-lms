/**
 * RETIRED legacy AI Course Create compatibility endpoint.
 *
 * COURSE GENERATION IS OWNED BY THE CANONICAL ULTIMATE COURSE BUILDER CONTROL PLANE.
 * This Edge Function previously implemented an independent AI generator and
 * wrote directly to courses/modules/lessons with the service-role client.
 * The private generation engine may be reached only through the governed Course Builder orchestrator.
 * Keeping an independent execution path here would violate the single-authority Ultimate Course Builder
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
        code: 'ULTIMATE_COURSE_BUILDER_REQUIRED',
      }),
      { status: 405, headers: corsHeaders },
    );
  }

  return new Response(
    JSON.stringify({
      error: 'Legacy AI course creation is disabled. Use the canonical Admin Ultimate Course Builder.',
      code: 'ULTIMATE_COURSE_BUILDER_REQUIRED',
      canonicalSurface: '/studio/courses',
      canonicalApi: '/api/studio/courses',
    }),
    { status: 410, headers: corsHeaders },
  );
});
