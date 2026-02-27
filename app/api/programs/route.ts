export const runtime = 'nodejs';
import { createAdminClient } from '@/lib/supabase/admin';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { sanitizeSearchInput } from '@/lib/utils';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// Create Supabase client for edge runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isActive = searchParams.get('active') !== 'false';

    let query = db
      .from('programs')
      .select('*')
      .eq('is_active', isActive)
      .order('name');

    // Filter by category
    if (category) {
      const sanitizedCategory = sanitizeSearchInput(category);
      query = query.ilike('category', `%${sanitizedCategory}%`);
    }

    // Filter by search term
    if (search) {
      const sanitizedSearch = sanitizeSearchInput(search);
      query = query.or(`name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%,slug.ilike.%${sanitizedSearch}%`);
    }

    const { data: programs, error } = await query;

    if (error) {
      logger.error('Error fetching programs from database:', error);
      return NextResponse.json(
        { status: 'error', error: 'Failed to fetch programs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      count: programs?.length || 0,
      programs: programs || [],
    });
  } catch (error) {
    logger.error('Error in programs API:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/programs', _GET);
