import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auditLog } from '@/lib/logging/auditLog';

export const dynamic = 'force-dynamic';

/**
 * POST /api/audit/log
 * Log an audit event from the client
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: false }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await req.json();
    const { action, metadata } = body;

    if (!action) {
      return NextResponse.json({ error: 'action required' }, { status: 400 });
    }

    await auditLog({
      actorId: user?.id,
      actorRole: user ? 'user' : 'anonymous',
      action,
      entity: 'tax_return',
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Audit log error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
