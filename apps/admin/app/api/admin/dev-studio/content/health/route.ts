import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    let contentTablePassed = false;
    let contentMessage = 'Content table is unavailable.';
    let memoryPassed = false;
    let campaignsPassed = false;
    try {
      const db = await requireAdminClient();
      const { error } = await db.from('content').select('id').limit(1);
      contentTablePassed = !error;
      contentMessage = error ? 'Content table query failed.' : 'Content table query succeeded.';
      const [{ error: memoryError }, { error: campaignsError }] = await Promise.all([
        db.from('ai_conversation_memory').select('id').limit(1),
        db.from('social_campaigns').select('id').limit(1),
      ]);
      memoryPassed = !memoryError;
      campaignsPassed = !campaignsError;
    } catch {
      contentMessage = 'Content table query failed.';
    }
    return buildCapabilityHealth('content', [
      { name: 'content-table', passed: contentTablePassed, required: true, message: contentMessage },
      { name: 'ai-provider', passed: Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY), required: true, message: 'At least one AI content provider must be configured.' },
      { name: 'ai-memory', passed: memoryPassed, required: true, message: memoryPassed ? 'AI memory is accessible.' : 'AI memory is unavailable.' },
      { name: 'social-campaigns', passed: campaignsPassed, required: false, message: campaignsPassed ? 'Social campaigns are accessible.' : 'Social campaigns are unavailable.' },
      { name: 'email-provider', passed: Boolean(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY), required: false, message: 'Email provider configuration checked.' },
    ]);
  });
}
