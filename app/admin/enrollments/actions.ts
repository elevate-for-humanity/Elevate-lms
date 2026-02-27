'use server';

import { createClient } from '@/lib/supabase/server';
import { writeAdminAuditEvent } from '@/lib/audit';

export async function auditEnrollmentAction(action: string, targetId: string, meta?: Record<string, unknown>) {
  const supabase = await createClient();
  await writeAdminAuditEvent(supabase, {
    action,
    target_type: 'enrollment',
    target_id: targetId,
    metadata: meta,
  });
}
