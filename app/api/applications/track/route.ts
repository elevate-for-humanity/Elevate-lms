import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!id && !email) {
      return NextResponse.json(
        { error: 'Application ID or email is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    let query = supabase
      .from('applications')
      .select(
        'id, first_name, last_name, email, phone, program_id, status, submitted_at, notes'
      );

    if (id) {
      query = query.eq('id', id);
    } else if (email) {
      query = query.eq('email', email.toLowerCase());
    }

    const { data, error } = await query
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ application: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve application' },
      { status: 500 }
    );
  }
}
