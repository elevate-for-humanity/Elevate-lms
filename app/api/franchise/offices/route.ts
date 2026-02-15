import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { officeService } from '@/lib/franchise/office-service';
import { CreateOfficeInput } from '@/lib/franchise/types';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if user is admin or office owner
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';

    const result = await officeService.listOffices({
      status,
      ownerId: isAdmin ? undefined : user.id,
      limit,
      offset
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error listing offices:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list offices' },
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin' && profile?.role !== 'franchise_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: CreateOfficeInput = await request.json();

    // Validate required fields
    if (!body.office_code || !body.office_name || !body.owner_name || !body.owner_email) {
      return NextResponse.json(
        { error: 'Missing required fields: office_code, office_name, owner_name, owner_email' },
        { status: 400 }
      );
    }

    if (!body.address_street || !body.address_city || !body.address_state || !body.address_zip) {
      return NextResponse.json(
        { error: 'Missing required address fields' },
        { status: 400 }
      );
    }

    const office = await officeService.createOffice(body, user.id);

    return NextResponse.json(office, { status: 201 });
  } catch (error) {
    logger.error('Error creating office:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create office' },
      { status: 500 }
    );
  }
}
