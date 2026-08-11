import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { API_ADMIN_ROLES } from '@/lib/rbac/role-matrix';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const UNIFIED_APP = process.env.UNIFIED_APP_URL || 'https://app.elevateforhumanity.org';

export interface GeneratedQuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface GeneratedLesson {
  lesson_number: number;
  title: string;
  description: string;
  objectives: string[];
  content: string;
  content_type: 'video' | 'reading' | 'quiz' | 'assignment';
  duration_minutes: number;
  is_required: boolean;
  quiz_questions: GeneratedQuizQuestion[];
  summary_text?: string;
  reflection_prompt?: string;
  competency_keys?: string[];
}

export interface GeneratedModule {
  title: string;
  sort_order: number;
  lessons: GeneratedLesson[];
}

export interface GeneratedCourse {
  title: string;
  subtitle: string;
  description: string;
  audience: string;
  duration_hours: number;
  category: string;
  passing_score: number;
  completion_rule: 'all_lessons' | 'required_lessons';
  modules: GeneratedModule[];
}

export const POST = withAuth(async (request: NextRequest) => {
  const response = await fetch(`${UNIFIED_APP}/api/admin/courses/generate`, {
    method: 'POST',
    headers: {
      cookie: request.headers.get('cookie') || '',
      'content-type': 'application/json',
    },
    credentials: 'include',
    body: await request.text(),
    cache: 'no-store',
  });
  const body = await response.text();
  return new NextResponse(body, {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') || 'application/json' },
  });
}, { roles: API_ADMIN_ROLES });
