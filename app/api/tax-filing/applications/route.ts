export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/tax-filing/applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { supabaseServer } from '@/lib/supabase-server';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = supabaseServer();
    const searchParams = request.nextUrl.searchParams;

    // Get query parameters
    const status = searchParams.get('status');
    const tax_year = searchParams.get('tax_year');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabase
      .from('tax_filing_applications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Filter by tax year if provided
    if (tax_year) {
      query = query.eq('tax_year', tax_year);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      applications: data,
      total: count,
      limit,
      offset,
    });
  } catch (error) { 
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = supabaseServer();
    const body = await parseBody<Record<string, any>>(request);

    const { data, error }: any = await supabase
      .from('tax_filing_applications')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) { 
    return NextResponse.json(
      { error: toErrorMessage(error) },
      { status: 500 }
    );
  }
}
