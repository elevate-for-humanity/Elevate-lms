import 'server-only';
import { requireAdminClient } from '@/lib/supabase/admin';

/**
 * External OpenHands identifiers are not authorization credentials.
 * Resolve the canonical task by its owner and only then compare provider IDs.
 * Never accept a conversation identifier by itself as proof of ownership.
 */
export async function findOwnedOpenHandsTask(input: {
  actorId: string;
  taskId: string;
  conversationId?: string | null;
  startTaskId?: string | null;
}) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.taskId)) {
    return null;
  }
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('ai_tasks')
    .select('id,user_id,tenant_id,tool_name,status,tool_output')
    .eq('id', input.taskId)
    .eq('user_id', input.actorId)
    .eq('tool_name', 'openhands.execute')
    .maybeSingle();
  if (error) throw new Error('Unable to verify OpenHands task ownership');
  if (!data) return null;
  const external = data.tool_output && typeof data.tool_output === 'object' && !Array.isArray(data.tool_output)
    ? data.tool_output as Record<string, unknown>
    : {};
  if (input.conversationId && external.conversation_id !== input.conversationId) return null;
  if (input.startTaskId && external.start_task_id !== input.startTaskId) return null;
  return {
    taskId: data.id as string,
    status: String(data.status),
    startTaskId: typeof external.start_task_id === 'string' ? external.start_task_id : null,
    conversationId: typeof external.conversation_id === 'string' ? external.conversation_id : null,
  };
}
