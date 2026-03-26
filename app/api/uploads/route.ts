import { NextRequest, NextResponse } from 'next/server';

import { parseBody } from '@/lib/api-helpers';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const { dashboard_type, file_name, file_url, file_size, file_type } = body;

    // Validate required fields
    if (!dashboard_type || !file_name || !file_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save upload record
    const { data, error }: any = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        dashboard_type,
        file_name,
        file_url,
        file_size,
        file_type,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save upload record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dashboardType = searchParams.get('dashboard_type');

    let query = supabase
      .from('uploads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dashboardType) {
      query = query.eq('dashboard_type', dashboardType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch uploads' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function _DELETE(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const uploadId = searchParams.get('id');

    if (!uploadId) {
      return NextResponse.json(
        { error: 'Upload ID required' },
        { status: 400 }
      );
    }

    // Delete upload record (only if owned by user)
    const { error } = await supabase
      .from('uploads')
      .delete()
      .eq('id', uploadId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete upload' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/uploads', _GET);
export const POST = withApiAudit('/api/uploads', _POST);
export const DELETE = withApiAudit('/api/uploads', _DELETE);
