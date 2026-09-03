import { NextRequest } from 'next/server';
import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const supabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
    const serviceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    return buildCapabilityHealth('settings', [
      {
        name: 'supabase-url',
        passed: supabaseUrl,
        required: true,
        message: supabaseUrl ? 'Supabase URL is configured.' : 'Supabase URL is missing.',
      },
      {
        name: 'supabase-service-role',
        passed: serviceRole,
        required: true,
        message: serviceRole ? 'Supabase service role is configured.' : 'Supabase service role is missing.',
      },
    ]);
  });
}
