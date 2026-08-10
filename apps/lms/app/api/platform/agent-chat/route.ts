import { NextRequest } from 'next/server';
import { handleCommercialAgentChat } from '@/lib/platform/handle-commercial-agent-chat';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// AUTH: Enforced inside handler — handleCommercialAgentChat calls
// requireFeatureForAuth, which requires a valid Supabase session and tenant
// feature/trial entitlement before any AI task is executed.
async function _POST(request: NextRequest) {
  return handleCommercialAgentChat(request);
}

export const POST = withApiAudit('/api/platform/agent-chat', _POST);
