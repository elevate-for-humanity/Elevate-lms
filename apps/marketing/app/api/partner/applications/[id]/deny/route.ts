import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { reason } = body;

    // Update application status to denied
    const { data, error } = await supabase
      .from('partner_applications')
      .update({
        status: 'denied',
        denied_at: new Date().toISOString(),
        denied_by: (await supabase.auth.getUser()).data.user?.id,
        denial_reason: reason || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
