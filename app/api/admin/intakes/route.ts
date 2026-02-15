import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get intakes/applications
    const { data: intakes, error } = await supabase
      .from('applications')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        program_id,
        status,
        submitted_at,
        notes
      `)
      .order('submitted_at', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('Intakes error:', error);
      return NextResponse.json({ intakes: [] });
    }

    return NextResponse.json({ intakes: intakes || [] });
  } catch (error) {
    logger.error('Intakes error:', error);
    return NextResponse.json({ intakes: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const { data: intake, error } = await supabase
      .from('applications')
      .insert({
        ...body,
        submitted_at: new Date().toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      logger.error('Create intake error:', error);
      return NextResponse.json({ error: 'Failed to create intake' }, { status: 500 });
    }

    return NextResponse.json({ success: true, intake });
  } catch (error) {
    logger.error('Create intake error:', error);
    return NextResponse.json({ error: 'Failed to create intake' }, { status: 500 });
  }
}
