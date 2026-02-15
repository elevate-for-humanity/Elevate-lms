export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Public REST API - Courses Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import {
  authenticateAPI,
  apiResponse,
  hasScope,
  logAPIRequest,
} from '@/lib/api/rest-api';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { sanitizeSearchInput } from '@/lib/utils';

// GET /api/v1/courses - List all courses
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 200;
  let error: string | undefined;

  try {
    // Authenticate API request
    const apiKey = await authenticateAPI(request);

    if (!apiKey) {
      statusCode = 401;
      return NextResponse.json(
        apiResponse(false, null, 'Invalid or missing API credentials'),
        { status: 401 }
      );
    }

    // Check scope
    if (!hasScope(apiKey, 'courses:read')) {
      statusCode = 403;
      return NextResponse.json(
        apiResponse(false, null, 'Insufficient permissions'),
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Filters
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'published';
    const search = searchParams.get('search');

    let query = supabase
      .from('courses')
      .select(
        `
        id,
        title,
        description,
        category,
        difficulty_level,
        duration_hours,
        price,
        currency,
        thumbnail_url,
        status,
        created_at,
        updated_at,
        instructor:profiles!instructor_id(id, full_name, email),
        enrollments:enrollments(count)
      `,
        { count: 'exact' }
      )
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      const sanitizedSearch = sanitizeSearchInput(search);
      query = query.or(`title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
    }

    const { data: courses, error: queryError, count } = await query;

    if (queryError) throw queryError;

    const responseTime = Date.now() - startTime;

    // Log request
    await logAPIRequest(
      apiKey.id,
      'GET',
      '/api/v1/courses',
      statusCode,
      responseTime,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(
      apiResponse(true, courses, undefined, {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      })
    );
  } catch (err: any) {
    error = err instanceof Error ? err.message : String(err);
    statusCode = 500;
    logger.error(
      'API Error:',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(apiResponse(false, null, error), { status: 500 });
  }
}

// POST /api/v1/courses - Create a new course
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 201;
  let error: string | undefined;

  try {
    const apiKey = await authenticateAPI(request);

    if (!apiKey) {
      statusCode = 401;
      return NextResponse.json(
        apiResponse(false, null, 'Invalid or missing API credentials'),
        { status: 401 }
      );
    }

    if (!hasScope(apiKey, 'courses:write')) {
      statusCode = 403;
      return NextResponse.json(
        apiResponse(false, null, 'Insufficient permissions'),
        { status: 403 }
      );
    }

    const body = await parseBody<Record<string, any>>(request);
    const supabase = await createClient();

    const { data: course, error: createError } = await supabase
      .from('courses')
      .insert({
        title: body.title,
        description: body.description,
        category: body.category,
        difficulty_level: body.difficulty_level,
        duration_hours: body.duration_hours,
        price: body.price,
        currency: body.currency || 'USD',
        thumbnail_url: body.thumbnail_url,
        instructor_id: apiKey.userId,
        status: 'draft',
      })
      .select()
      .single();

    if (createError) throw createError;

    const responseTime = Date.now() - startTime;

    await logAPIRequest(
      apiKey.id,
      'POST',
      '/api/v1/courses',
      statusCode,
      responseTime,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(apiResponse(true, course), { status: 201 });
  } catch (err: any) {
    error = err instanceof Error ? err.message : String(err);
    statusCode = 500;
    logger.error(
      'API Error:',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(apiResponse(false, null, error), { status: 500 });
  }
}
