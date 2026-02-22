import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
  const _admin = createAdminClient(); const db = _admin || supabase;
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
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';
    const isSelf = preparer.user_id === user.id;

    // Check if user owns the office
    let isOwner = false;
    if (preparer.office_id) {
      const { data: office } = await db
        .from('franchise_offices')
        .select('owner_id')
        .eq('id', preparer.office_id)
        .single();
      isOwner = office?.owner_id === user.id;
    }

    if (!isAdmin && !isOwner && !isSelf) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(preparer);
  } catch (error) {
    logger.error('Error getting preparer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ preparerId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
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
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';

    // Check if user owns the office
    let isOwner = false;
    if (preparer.office_id) {
      const { data: office } = await db
        .from('franchise_offices')
        .select('owner_id')
        .eq('id', preparer.office_id)
        .single();
      isOwner = office?.owner_id === user.id;
    }

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Office owners can only update certain fields
    if (!isAdmin) {
      const allowedFields = [
        'first_name', 'last_name', 'phone', 'status',
        'commission_type', 'commission_rate', 'per_return_fee',
        'is_ero_authorized', 'is_efin_authorized'
      ];
      const updates: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      }
      const updated = await preparerService.updatePreparer(preparerId, updates, user.id);
      return NextResponse.json(updated);
    }

    const updated = await preparerService.updatePreparer(preparerId, body, user.id);
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Error updating preparer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ preparerId: string }> }
) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
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
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';

    // Check if user owns the office
    let isOwner = false;
    if (preparer.office_id) {
      const { data: office } = await db
        .from('franchise_offices')
        .select('owner_id')
        .eq('id', preparer.office_id)
        .single();
      isOwner = office?.owner_id === user.id;
    }

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await preparerService.deactivatePreparer(preparerId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting preparer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
