import 'server-only';

import { aiChat } from '@/lib/ai/ai-service';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export type OperatorAction =
  | { type: 'create_page'; title: string; path: string }
  | { type: 'suggest_upgrade'; feature: string }
  | { type: 'answer'; message: string };

const SYSTEM_PROMPT = `You are the Elevate customer AI Operator. You help training providers manage their platform.

You can help with:
- Creating landing page ideas and copy
- Suggesting CRM / enrollment workflows
- Course structure recommendations
- SEO improvements for their public site

Respond in plain language. If the user asks you to CREATE something, end your reply with a JSON block:
{"action":"create_page","title":"...","path":"/..."}
Only use create_page when they explicitly want a new page.

Keep responses under 400 words.`;

export async function runCustomerOperator(params: {
  prompt: string;
  userId: string;
  workspaceId?: string | null;
  organizationId?: string | null;
}): Promise<{ reply: string; action: OperatorAction | null; taskId: string | null }> {
  const db = await requireAdminClient();

  const { data: task } = await db
    .from('operator_tasks')
    .insert({
      workspace_id: params.workspaceId ?? null,
      created_by: params.userId,
      task_type: 'customer_chat',
      status: 'processing',
      prompt: params.prompt,
      metadata: { organization_id: params.organizationId ?? null },
    } as Record<string, unknown>)
    .select('id')
    .maybeSingle();

  let reply: string;
  try {
    const result = await aiChat({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: params.prompt },
      ],
      temperature: 0.7,
      maxTokens: 600,
    });
    reply =
      result.content?.trim() ||
      'I can help you create pages, improve SEO, or set up enrollment workflows. What would you like to do first?';
  } catch (err) {
    logger.warn('[customer-operator] aiChat failed', err);
    reply =
      'I am temporarily unavailable. You can still edit your site in Website Builder or courses in the admin dashboard.';
  }

  let action: OperatorAction | null = null;
  const jsonMatch = reply.match(/\{[\s\S]*"action"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { action?: string; title?: string; path?: string };
      if (parsed.action === 'create_page' && parsed.title) {
        action = {
          type: 'create_page',
          title: parsed.title,
          path: parsed.path ?? '/',
        };
        reply = reply.replace(jsonMatch[0], '').trim();
      }
    } catch {
      // ignore parse errors
    }
  }

  if (!action) {
    action = { type: 'answer', message: reply };
  }

  if (task?.id) {
    await db
      .from('operator_tasks')
      .update({
        status: 'completed',
        result: { reply, action },
        completed_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', task.id);
  }

  return { reply, action, taskId: task?.id ?? null };
}
