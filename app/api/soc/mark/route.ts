import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createAdminClient } from '@/lib/supabase/admin';
import { auditLog } from '@/lib/auditLog';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { control_id, evidence, implemented } = body;

    if (!control_id) {
      return NextResponse.json(
        { error: 'control_id is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error }: any = await supabase
      .from('soc_controls')
      .upsert({
        control_id,
        implemented: implemented ?? true,
        evidence,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
    }

    // Log the control update
    await auditLog({
      actor_user_id: req.headers.get('x-user-id') || undefined,
      actor_role: 'admin',
      action: 'UPDATE',
      entity: 'audit_snapshot',
      entity_id: control_id,
      after: data,
      req,
      metadata: { control_type: 'SOC-2' },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error }: any = await supabase
      .from('soc_controls')
      .select('*')
      .order('control_id');

    if (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
    }

    const implemented = data?.filter((c) => c.implemented).length || 0;
    const total = data?.length || 0;

    return NextResponse.json({
      controls: data || [],
      summary: {
        total,
        implemented,
        percentage: total > 0 ? Math.round((implemented / total) * 100) : 0,
      },
    });
  } catch (error) { /* Error handled silently */ 
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
