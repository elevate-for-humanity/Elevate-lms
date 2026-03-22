/**
 * Contract tests for POST /api/admin/lms/courses
 *
 * These tests verify the response shape contract that AutomaticCourseBuilder
 * depends on. They mock Supabase and createDraftCourse so no live DB is needed.
 *
 * The critical invariant: the response body must contain { course: { id: <uuid> } }
 * so that resolveCourseId() can extract a valid UUID via the data.course.id path.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ────────────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const mockCourse = {
  id: VALID_UUID,
  slug: 'test-course',
  title: 'Test Course',
  status: 'draft',
};

const mockCreateDraftCourse = vi.fn().mockResolvedValue(mockCourse);

vi.mock('@/lib/lms/course-service', () => ({
  createDraftCourse: mockCreateDraftCourse,
}));

vi.mock('@/lib/api/safe-error', () => ({
  safeInternalError: vi.fn((err: unknown, msg: string) => {
    const { NextResponse } = require('next/server');
    return NextResponse.json({ error: msg }, { status: 500 });
  }),
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/admin/lms/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function authorizedProfile() {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/admin/lms/courses — response shape contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { course: { id } } with a valid UUID on success', async () => {
    authorizedProfile();
    const { POST } = await import('@/app/api/admin/lms/courses/route');

    const res = await POST(makeRequest({ slug: 'test-course', title: 'Test Course' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    // This is the exact shape resolveCourseId() depends on
    expect(body).toHaveProperty('course');
    expect(body.course).toHaveProperty('id');
    expect(body.course.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('does NOT return { id } at the top level (would break resolveCourseId fallback order)', async () => {
    authorizedProfile();
    const { POST } = await import('@/app/api/admin/lms/courses/route');

    const res = await POST(makeRequest({ slug: 'test-course', title: 'Test Course' }));
    const body = await res.json();

    // Top-level id would be picked up by data.id path — confirm it is absent
    // so the contract is unambiguous: always data.course.id
    expect(body.id).toBeUndefined();
  });

  it('returns 400 when slug is missing', async () => {
    authorizedProfile();
    const { POST } = await import('@/app/api/admin/lms/courses/route');

    const res = await POST(makeRequest({ title: 'No Slug' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/slug/i);
  });

  it('returns 400 when title is missing', async () => {
    authorizedProfile();
    const { POST } = await import('@/app/api/admin/lms/courses/route');

    const res = await POST(makeRequest({ slug: 'no-title' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/title/i);
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('no session') });
    const { POST } = await import('@/app/api/admin/lms/courses/route');

    const res = await POST(makeRequest({ slug: 'test', title: 'Test' }));

    expect(res.status).toBe(401);
  });

  it('returns 403 when user role is student', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-456' } }, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'student' }, error: null }),
    });
    const { POST } = await import('@/app/api/admin/lms/courses/route');

    const res = await POST(makeRequest({ slug: 'test', title: 'Test' }));

    expect(res.status).toBe(403);
  });

  it('passes modules array through to createDraftCourse', async () => {
    authorizedProfile();
    const { POST } = await import('@/app/api/admin/lms/courses/route');

    const modules = [{ id: 'mod-1', title: 'Module 1', lessons: [] }];
    await POST(makeRequest({ slug: 'test', title: 'Test', modules }));

    expect(mockCreateDraftCourse).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ modules })
    );
  });
});
