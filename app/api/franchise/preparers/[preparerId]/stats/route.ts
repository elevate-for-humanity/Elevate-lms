import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { preparerService } from '@/lib/franchise/preparer-service';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ preparerId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { preparerId } = await params;
    const preparer = await preparerService.getPreparer(preparerId);

    if (!preparer) {
      return NextResponse.json({ error: 'Preparer not found' }, { status: 404 });
    }

    // Check access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';
    const isSelf = preparer.user_id === user.id;

    // Check if user owns the office
    let isOwner = false;
    if (preparer.office_id) {
      const { data: office } = await supabase
        .from('franchise_offices')
        .select('owner_id')
        .eq('id', preparer.office_id)
        .single();
      isOwner = office?.owner_id === user.id;
    }

    if (!isAdmin && !isOwner && !isSelf) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const taxYear = searchParams.get('taxYear') 
      ? parseInt(searchParams.get('taxYear')!) 
      : new Date().getFullYear();

    const stats = await preparerService.getPreparerStats(preparerId, taxYear);

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error getting preparer stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get preparer stats' },
      { status: 500 }
    );
  }
}
