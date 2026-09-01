import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    let directoryTablesPassed = false;
    let directoryMessage = 'Website directory tables are unavailable.';
    let memoryPassed = false;
    let campaignsPassed = false;
    try {
      const db = await requireAdminClient();
      const [{ error: teamError }, { error: partnerError }, { error: memoryError }, { error: campaignsError }] = await Promise.all([
        db.from('team_members').select('id').limit(1),
        db.from('training_partners').select('id').limit(1),
        db.from('ai_conversation_memory').select('id').limit(1),
        db.from('social_campaigns').select('id').limit(1),
      ]);
      directoryTablesPassed = !teamError && !partnerError;
      directoryMessage = directoryTablesPassed ? 'Team and training-partner tables are accessible.' : 'A website directory table query failed.';
      memoryPassed = !memoryError;
      campaignsPassed = !campaignsError;
    } catch {
      directoryMessage = 'Website directory table query failed.';
    }
    return buildCapabilityHealth('content', [
      { name: 'website-directory', passed: directoryTablesPassed, required: true, message: directoryMessage },
      { name: 'ai-provider', passed: Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY), required: true, message: 'At least one AI content provider must be configured.' },
      { name: 'ai-memory', passed: memoryPassed, required: true, message: memoryPassed ? 'AI memory is accessible.' : 'AI memory is unavailable.' },
      { name: 'social-campaigns', passed: campaignsPassed, required: false, message: campaignsPassed ? 'Social campaigns are accessible.' : 'Social campaigns are unavailable.' },
      { name: 'email-provider', passed: Boolean(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY), required: false, message: 'Email provider configuration checked.' },
    ]);
  });
}
