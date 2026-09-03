// Scheduled Edge Function: Auto clock-out enforcement
// Runs every 10 minutes via Supabase Dashboard schedule
// Cron: */10 * * * *

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data, error } = await supabase.rpc('auto_clock_out_if_needed', { grace_minutes: 15 });

  if (error) {
    console.error('Auto clock-out failed:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`Auto clock-out complete: ${data} entries processed`);

  return new Response(JSON.stringify({ success: true, auto_clocked_out: data }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
