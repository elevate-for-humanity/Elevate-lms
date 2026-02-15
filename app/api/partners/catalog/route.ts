import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeSearchInput } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/partners/catalog
 * 
 * Partner Content Catalog API - allows partners to browse and select
 * available courses/content that can be attached to their programs.
 * 
 * Query params:
 * - category: Filter by category (healthcare, trades, technology, etc.)
 * - delivery_mode: Filter by delivery mode (internal, partner_link, scorm, lti)
 * - search: Search by title/description
 * - partner_id: Filter by partner (for partner-specific content)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const deliveryMode = searchParams.get('delivery_mode');
    const search = searchParams.get('search');
    const partnerId = searchParams.get('partner_id');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Build query for courses
    let query = supabase
      .from('courses')
      .select(`
        id,
        course_name,
        course_code,
        description,
        duration_hours,
        price,
        is_active,
        delivery_mode,
        partner_url,
        launch_mode,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('course_name');

    // Apply filters
    if (category) {
      const sanitizedCategory = sanitizeSearchInput(category);
      query = query.ilike('category', `%${sanitizedCategory}%`);
    }

    if (deliveryMode) {
      query = query.eq('delivery_mode', deliveryMode);
    }

    if (search) {
      const sanitizedSearch = sanitizeSearchInput(search);
      query = query.or(`course_name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
    }

    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: courses, error, count } = await query;

    if (error) {
      logger.error('Catalog query error:', error);
      return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 });
    }

    // Also fetch available programs for context
    const { data: programs } = await supabase
      .from('programs')
      .select('id, slug, name, category, is_active')
      .eq('is_active', true)
      .order('name')
      .limit(100);

    return NextResponse.json({
      status: 'success',
      data: {
        courses: courses || [],
        programs: programs || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
      meta: {
        delivery_modes: ['internal', 'partner_link', 'scorm', 'lti'],
        categories: ['healthcare', 'trades', 'technology', 'business', 'beauty'],
      },
    });
  } catch (error) {
    logger.error('Catalog API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/partners/catalog
 * 
 * Add new content to the catalog (partner content submission)
 * 
 * Body:
 * - course_name: string (required)
 * - description: string
 * - delivery_mode: 'internal' | 'partner_link' | 'scorm' | 'lti'
 * - partner_url: string (for partner_link mode)
 * - duration_hours: number
 * - price: number
 * - program_id: string (optional - attach to program)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      course_name,
      description,
      delivery_mode = 'partner_link',
      partner_url,
      duration_hours,
      price = 0,
      program_id,
      category,
    } = body;

    // Validate required fields
    if (!course_name) {
      return NextResponse.json({ error: 'course_name is required' }, { status: 400 });
    }

    if (delivery_mode === 'partner_link' && !partner_url) {
      return NextResponse.json({ error: 'partner_url is required for partner_link delivery mode' }, { status: 400 });
    }

    // Generate course code
    const course_code = course_name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .substring(0, 20) + '_' + Date.now().toString(36).toUpperCase();

    // Insert course
    const { data: course, error: insertError } = await supabase
      .from('courses')
      .insert({
        course_name,
        course_code,
        description,
        delivery_mode,
        partner_url,
        duration_hours,
        price,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Course insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
    }

    // If program_id provided, link course to program
    if (program_id && course) {
      await supabase
        .from('program_courses')
        .insert({
          program_id,
          course_id: course.id,
        });
    }

    return NextResponse.json({
      status: 'success',
      data: course,
      message: 'Course added to catalog successfully',
    }, { status: 201 });
  } catch (error) {
    logger.error('Catalog POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
