/**
 * Course Builder Integrated API
 * 
 * Endpoint that wires credential engine to existing AI services.
 */

import { apiRequireAdmin } from '@/lib/admin/guards';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { buildIntegratedCourse, listAllCredentials, searchAvailableCredentials, getCredentialBySlug } from '@/lib/course-builder/integration';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const auth = await apiRequireAdmin(request);
    if (auth) return auth;
    const body = await request.json();
    const { userRequest, credentialSlug, options } = body;

    if (!userRequest) {
      return NextResponse.json(
        { error: 'userRequest is required' },
        { status: 400 }
      );
    }

    logger.info('Course builder request received', {
      userRequest,
      credentialSlug,
    });

    const result = await buildIntegratedCourse({
      userRequest,
      credentialSlug,
      options,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.errors?.[0] || 'Build failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      courseId: result.courseId,
      credential: {
        slug: result.credential.slug,
        name: result.credential.name,
        provider: result.credential.provider,
        category: result.credential.category,
      },
      qualityScore: result.qualityScore,
      readiness: {
        isReady: result.readiness.isReady,
        overallScore: result.readiness.overallScore,
        categories: result.readiness.categories.map(c => ({
          name: c.name,
          score: c.score,
          passed: c.passed,
        })),
      },
    });
  } catch (error) {
    logger.error('Course builder API error', { error });
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const query = searchParams.get('q');
  const slug = searchParams.get('slug');

  if (action === 'list') {
    const credentials = listAllCredentials();
    return NextResponse.json({
      ok: true,
      credentials: credentials.map(c => ({
        slug: c.slug,
        name: c.name,
        provider: c.provider,
        category: c.category,
        type: c.type,
        description: c.description,
      })),
    });
  }

  if (action === 'search' && query) {
    const results = searchAvailableCredentials(query);
    return NextResponse.json({
      ok: true,
      results: results.map(c => ({
        slug: c.slug,
        name: c.name,
        provider: c.provider,
      })),
    });
  }

  if (action === 'info' && slug) {
    const credential = getCredentialBySlug(slug);
    if (!credential) {
      return NextResponse.json(
        { error: 'Credential not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      ok: true,
      credential,
    });
  }

  return NextResponse.json({
    ok: true,
    message: 'Course Builder API',
    endpoints: {
      POST: '/api/course-builder/integrated - Build a course',
      GET: '/api/course-builder/integrated?action=list - List credentials',
      GET: '/api/course-builder/integrated?action=search&q=HVAC - Search credentials',
      GET: '/api/course-builder/integrated?action=info&slug=epa-608 - Get credential info',
    },
  });
}
