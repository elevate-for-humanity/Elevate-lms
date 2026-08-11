import type { NextRequest } from 'next/server';
import { handleCommercialAgentChat } from '@/lib/platform/handle-commercial-agent-chat';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function commercialAgentChat(request: NextRequest) {
  return handleCommercialAgentChat(request);
}

export const postCommercialAgentChat = withApiAudit('/api/platform/agent-chat', commercialAgentChat);
