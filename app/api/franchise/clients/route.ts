import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clientService } from '@/lib/franchise/client-service';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const officeId = searchParams.get('officeId');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!officeId) {
      return NextResponse.json({ error: 'Office ID required' }, { status: 400 });
    }

    // Check access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';

    if (!isAdmin) {
      // Check if user owns the office or is a preparer there
      const { data: office } = await supabase
        .from('franchise_offices')
        .select('owner_id')
        .eq('id', officeId)
        .single();

      const isOwner = office?.owner_id === user.id;

      if (!isOwner) {
        const { data: preparer } = await supabase
          .from('franchise_preparers')
          .select('id')
          .eq('office_id', officeId)
          .eq('user_id', user.id)
          .single();

        if (!preparer) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    if (search) {
      const clients = await clientService.searchClients(officeId, search);
      return NextResponse.json({ clients, total: clients.length });
    }

    const result = await clientService.listClientsByOffice(officeId, {
      status,
      limit,
      offset
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error listing clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    if (!body.office_id || !body.first_name || !body.last_name || !body.ssn) {
      return NextResponse.json(
        { error: 'Missing required fields: office_id, first_name, last_name, ssn' },
        { status: 400 }
      );
    }

    // Check access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin' || profile?.role === 'franchise_admin';

    if (!isAdmin) {
      const { data: office } = await supabase
        .from('franchise_offices')
        .select('owner_id')
        .eq('id', body.office_id)
        .single();

      const isOwner = office?.owner_id === user.id;

      if (!isOwner) {
        const { data: preparer } = await supabase
          .from('franchise_preparers')
          .select('id')
          .eq('office_id', body.office_id)
          .eq('user_id', user.id)
          .single();

        if (!preparer) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const client = await clientService.createClient(body);

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    logger.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
