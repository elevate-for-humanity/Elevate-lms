export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const {
      apprentice_id,
      rapids_id,
      status,
      registration_date,
      completion_date,
    } = body;

    const supabase = createAdminClient();

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

    const { data, error }: any = await supabase
      .from('rapids_tracking')
      .upsert(updateData, { onConflict: 'apprentice_id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
    }

    return NextResponse.json({ success: true, rapids: data });
  } catch (error) { 
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = createAdminClient();

    const { data, error }: any = await supabase
      .from('rapids_tracking')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
    }

    return NextResponse.json({ rapids: data });
  } catch (error) { 
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
