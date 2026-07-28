import { NextRequest } from 'next/server';


import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  return capabilityHealthResponse(
    request,
    async () => {
      let databasePassed = false;
      let databaseMessage = 'Media table unavailable.';


      try {
        const db = await requireAdminClient();


        const { error } = await db
          .from('media_assets')
          .select('id')
          .limit(1);


        databasePassed = !error;
        databaseMessage = error
          ? error.message
          : 'Media table query succeeded.';
      } catch (error) {
        databaseMessage =
          error instanceof Error
            ? error.message
            : 'Media table query failed.';
      }


      const storageConfigured = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
          process.env.SUPABASE_URL,
      );


      const serviceRoleConfigured = Boolean(
        process.env.SUPABASE_SERVICE_ROLE_KEY,
      );


      return buildCapabilityHealth('media', [
        {
          name: 'supabase-url',
          passed: storageConfigured,
          required: true,
          message: storageConfigured
            ? 'Supabase URL is configured.'
            : 'Supabase URL is missing.',
        },
        {
          name: 'service-role',
          passed: serviceRoleConfigured,
          required: true,
          message: serviceRoleConfigured
            ? 'Service role is configured.'
            : 'Supabase service role is missing.',
        },
        {
          name: 'media-assets-table',
          passed: databasePassed,
          required: true,
          message: databaseMessage,
        },
      ]);
    },
  );
}
