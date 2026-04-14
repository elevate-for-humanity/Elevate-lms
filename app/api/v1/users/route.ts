// PUBLIC ROUTE: v1 API — auth inside handler

// Public REST API - Users Endpoint
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

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

// GET /api/v1/users - List users
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

    if (!hasScope(apiKey, 'users:read')) {
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

    const {
      data: users,
      error: queryError,
      count,
    } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (queryError) throw queryError;

    const responseTime = Date.now() - startTime;

    await logAPIRequest(
      apiKey.id,
      'GET',
      '/api/v1/users',
      statusCode,
      responseTime,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(
      apiResponse(true, users, undefined, {
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

// POST /api/v1/users - Create user
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

    if (!hasScope(apiKey, 'users:write')) {
      statusCode = 403;
      return NextResponse.json(
        apiResponse(false, null, 'Insufficient permissions'),
        { status: 403 }
      );
    }

    const body = await parseBody<Record<string, any>>(request);
    const supabase = await createClient();

    // Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          full_name: body.full_name,
        },
      });

    if (authError) throw authError;

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: body.full_name,
        email: body.email,
        role: body.role || 'student',
      })
      .select()
      .single();

    if (profileError) throw profileError;

    const responseTime = Date.now() - startTime;

    await logAPIRequest(
      apiKey.id,
      'POST',
      '/api/v1/users',
      statusCode,
      responseTime,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json(apiResponse(true, profile), { status: 201 });
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
export const GET = withApiAudit('/api/v1/users', _GET);
export const POST = withApiAudit('/api/v1/users', _POST);
