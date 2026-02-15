import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { returnService } from '@/lib/franchise/return-service';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const officeId = searchParams.get('officeId') || undefined;
    const preparerId = searchParams.get('preparerId') || undefined;
    const taxYear = searchParams.get('taxYear') 
      ? parseInt(searchParams.get('taxYear')!) 
      : undefined;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';

    // Non-admins must specify an office they own or be a preparer
    if (!isAdmin && !officeId && !preparerId) {
      // Check if user is a preparer
      const { data: preparer } = await supabase
        .from('franchise_preparers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (preparer) {
        const result = await returnService.getPreparerReturns(preparer.id, {
          taxYear,
          status,
          limit,
          offset
        });
        return NextResponse.json(result);
      }

      return NextResponse.json(
        { error: 'Office ID or Preparer ID required' },
        { status: 400 }
      );
    }

    // Verify office ownership for non-admins
    if (!isAdmin && officeId) {
      const { data: office } = await supabase
        .from('franchise_offices')
        .select('owner_id')
        .eq('id', officeId)
        .single();

      if (office?.owner_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Verify preparer access for non-admins
    if (!isAdmin && preparerId) {
      const { data: preparer } = await supabase
        .from('franchise_preparers')
        .select('user_id, office_id')
        .eq('id', preparerId)
        .single();

      const isSelf = preparer?.user_id === user.id;
      
      let isOwner = false;
      if (preparer?.office_id) {
        const { data: office } = await supabase
          .from('franchise_offices')
          .select('owner_id')
          .eq('id', preparer.office_id)
          .single();
        isOwner = office?.owner_id === user.id;
      }

      if (!isSelf && !isOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (officeId) {
      const result = await returnService.getOfficeReturns(officeId, {
        taxYear,
        status,
        limit,
        offset
      });
      return NextResponse.json(result);
    }

    if (preparerId) {
      const result = await returnService.getPreparerReturns(preparerId, {
        taxYear,
        status,
        limit,
        offset
      });
      return NextResponse.json(result);
    }

    // Admin without filters - return all
    const { data, error } = await supabase
      .from('franchise_return_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ data, total: data?.length || 0 });
  } catch (error) {
    logger.error('Error listing returns:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list returns' },
      { status: 500 }
    );
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

    // Validate required fields
    if (!body.officeId || !body.preparerId || !body.clientId || !body.taxReturn) {
      return NextResponse.json(
        { error: 'Missing required fields: officeId, preparerId, clientId, taxReturn' },
        { status: 400 }
      );
    }

    // Check if user is admin, office owner, or the preparer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';

    if (!isAdmin) {
      // Check if user is the preparer
      const { data: preparer } = await supabase
        .from('franchise_preparers')
        .select('user_id, office_id')
        .eq('id', body.preparerId)
        .single();

      const isSelf = preparer?.user_id === user.id;

      // Check if user owns the office
      let isOwner = false;
      const { data: office } = await supabase
        .from('franchise_offices')
        .select('owner_id')
        .eq('id', body.officeId)
        .single();
      isOwner = office?.owner_id === user.id;

      if (!isSelf && !isOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const result = await returnService.createReturn({
      officeId: body.officeId,
      preparerId: body.preparerId,
      clientId: body.clientId,
      taxReturn: body.taxReturn,
      clientFee: body.clientFee
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logger.error('Error creating return:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create return' },
      { status: 500 }
    );
  }
}
