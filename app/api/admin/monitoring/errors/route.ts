import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch recent errors from audit_logs table
    const { data: errors, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action_type', 'error')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Error fetching errors:', error);
      return NextResponse.json({ errors: [] });
    }

    // Transform to expected format
    const formattedErrors = (errors || []).map((log: any) => ({
      id: log.id,
      timestamp: log.created_at,
      endpoint: log.details?.endpoint || 'unknown',
      error: log.details?.error || log.description,
      statusCode: log.details?.statusCode || 500,
      ip: log.ip_address || 'unknown',
    }));

    return NextResponse.json({
      errors: formattedErrors,
      total: formattedErrors.length,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('Monitoring errors endpoint error:', error);
    return NextResponse.json({
      errors: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
