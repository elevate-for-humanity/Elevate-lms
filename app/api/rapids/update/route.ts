
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { auditedMutation } from '@/lib/audit/transactional';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await apiRequireAdmin(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const {
      apprentice_id,
      rapids_id,
      status,
      registration_date,
      completion_date,
    } = body;

    const supabase = await getAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    const updateData: any = {
      apprentice_id,
      rapids_id,
      status,
    };

    if (status === 'registered' && !registration_date) {
      updateData.registration_date = new Date().toISOString().split('T')[0];
    } else if (registration_date) {
      updateData.registration_date = registration_date;
    }

    if (status === 'completed' && !completion_date) {
      updateData.completion_date = new Date().toISOString().split('T')[0];
    } else if (completion_date) {
      updateData.completion_date = completion_date;
    }

    const { data, error } = await auditedMutation({
      table: 'rapids_tracking',
      operation: 'upsert',
      rowData: updateData,
      conflictOn: ['apprentice_id'],
      audit: {
        action: 'api:post:/api/rapids/update',
        targetType: 'rapids_tracking',
        targetId: apprentice_id,
        metadata: { status, rapids_id },
      },
    });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    return NextResponse.json({ success: true, rapids: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await getAdminClient();

    const { data, error }: any = await supabase
      .from('rapids_tracking')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 400 });
    }

    return NextResponse.json({ rapids: data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/rapids/update', _GET, { critical: true });
export const POST = withApiAudit('/api/rapids/update', _POST, { critical: true });
