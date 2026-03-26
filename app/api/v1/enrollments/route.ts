/**
 * @deprecated Use canonical enrollment routes:
 *   - /api/enroll (student enrollment)
 *   - /api/enrollment/submit (comprehensive wizard)
 *   - /api/enrollments/create-enforced (admin/partner)
 */

// Public REST API - Enrollments Endpoint
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
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

// GET /api/v1/enrollments - List enrollments
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const startTime = Date.now();
  let statusCode = 200;

  try {
    const apiKey = await authenticateAPI(request);

    if (!apiKey) {
      statusCode = 401;
      return NextResponse.json(
        apiResponse(false, null, 'Invalid or missing API credentials'),
        { status: 401 }
      );
    }

    if (!hasScope(apiKey, 'enrollments:read')) {
      statusCode = 403;
      return NextResponse.json(
        apiResponse(false, null, 'Insufficient permissions'),
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;
    const courseId = searchParams.get('course_id');
    const userId = searchParams.get('user_id');

    let query = supabase
      .from('program_enrollments')
      .select(
        `
        id,
        enrolled_at,
        completed_at,
        progress_percentage,
        status,
        user:profiles!user_id(id, full_name, email),
        course:courses!course_id(id, title, category)
      `,
        { count: 'exact' }
      )
      .order('enrolled_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (courseId) query = query.eq('course_id', courseId);
    if (userId) query = query.eq('user_id', userId);

    const { data: enrollments, error: queryError, count } = await query;

    if (queryError) throw queryError;

    const responseTime = Date.now() - startTime;

    await logAPIRequest(
      apiKey.id,
      'GET',
      '/api/v1/enrollments',
      statusCode,
      responseTime,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(
      apiResponse(true, enrollments, undefined, {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      })
    );
  } catch (err: any) {
    statusCode = 500;
    logger.error(
      'API Error:',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      apiResponse(
        false,
        null,
        'Internal server error'
      ),
      {
        status: 500,
      }
    );
  }
}

// POST /api/v1/enrollments - Create enrollment
async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const startTime = Date.now();
  let statusCode = 201;

  try {
    const apiKey = await authenticateAPI(request);

    if (!apiKey) {
      statusCode = 401;
      return NextResponse.json(
        apiResponse(false, null, 'Invalid or missing API credentials'),
        { status: 401 }
      );
    }

    if (!hasScope(apiKey, 'enrollments:write')) {
      statusCode = 403;
      return NextResponse.json(
        apiResponse(false, null, 'Insufficient permissions'),
        { status: 403 }
      );
    }

    const body = await parseBody<Record<string, any>>(request);
    const supabase = await createClient();

    const { data: enrollment, error: createError } = await supabase
      .from('program_enrollments')
      .insert({
        user_id: body.user_id,
        course_id: body.course_id,
        enrolled_at: new Date().toISOString(),
        status: 'active',
      })
      .select(
        `
        *,
        user:profiles!user_id(id, full_name, email),
        course:courses!course_id(id, title)
      `
      )
      .single();

    if (createError) throw createError;

    const responseTime = Date.now() - startTime;

    await logAPIRequest(
      apiKey.id,
      'POST',
      '/api/v1/enrollments',
      statusCode,
      responseTime,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(apiResponse(true, enrollment), { status: 201 });
  } catch (err: any) {
    statusCode = 500;
    logger.error(
      'API Error:',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      apiResponse(
        false,
        null,
        'Internal server error'
      ),
      {
        status: 500,
      }
    );
  }
}
export const GET = withApiAudit('/api/v1/enrollments', _GET);
export const POST = withApiAudit('/api/v1/enrollments', _POST);
