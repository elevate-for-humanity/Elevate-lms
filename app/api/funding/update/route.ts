export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { auditLog } from '@/lib/auditLog';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const {
      apprentice_id,
      funding_source,
      ita_number,
      approved_amount,
      status,
      case_manager,
      workone_region,
      approval_date,
    } = body;

    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Get existing record for audit trail
    const { data: before } = await db
      .from('funding_cases')
      .select('*')
      .eq('apprentice_id', apprentice_id)
      .eq('funding_source', funding_source)
      .single();

    const { data, error }: any = await db
      .from('funding_cases')
      .upsert(
        {
          apprentice_id,
          funding_source,
          ita_number,
          approved_amount,
          status,
          case_manager,
          workone_region,
          approval_date,
        },
        { onConflict: 'apprentice_id,funding_source' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    // Log the change
    await auditLog({
      actor_user_id: req.headers.get('x-user-id') || undefined,
      actor_role: (req.headers.get('x-user-role') as any) || 'system',
      action: before ? 'UPDATE' : 'CREATE',
      entity: 'funding',
      entity_id: data.id,
      before,
      after: data,
      req,
    });

    return NextResponse.json({ success: true, funding: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = createAdminClient();

    const { data, error }: any = await db
      .from('funding_cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    return NextResponse.json({ funding_cases: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
