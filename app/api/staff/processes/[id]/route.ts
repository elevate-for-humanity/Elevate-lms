

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { id } = await params;
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is staff/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      !profile ||
      !['admin', 'super_admin', 'staff', 'advisor'].includes(profile.role)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: process, error } = await supabase
      .from('processes')
      .select('*, process_steps(*)')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!process) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }

    // Sort steps by step_number
    if (process.process_steps) {
      process.process_steps.sort(
        (a: any, b: any) => a.step_number - b.step_number
      );
    }

    return NextResponse.json({ process });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/staff/processes/[id]', _GET);
