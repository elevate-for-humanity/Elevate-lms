import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createServerSupabaseClient } from '@/lib/auth';
import { withAuth } from '@/lib/with-auth';
import { toError, toErrorMessage } from '@/lib/safe';

export const GET = withAuth(
  async (req, context) => {
    const user = context.user;
    try {
      const supabase = await createServerSupabaseClient();

      // Test courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, status')
        .limit(100);

      // Test programs
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('id, title, status')
        .limit(100);

      // Test modules
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id, title')
        .limit(100);

      // Test lessons
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title')
        .limit(100);

      return NextResponse.json({
        courses: {
          count: courses?.length || 0,
          error: coursesError?.message,
          sample: courses?.slice(0, 5),
        },
        programs: {
          count: programs?.length || 0,
          error: programsError?.message,
          sample: programs?.slice(0, 5),
        },
        modules: {
          count: modules?.length || 0,
          error: modulesError?.message,
        },
        lessons: {
          count: lessons?.length || 0,
          error: lessonsError?.message,
        },
      });
    } catch (error) { /* Error handled silently */ 
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 500 }
      );
    }
  },
  { roles: ['admin', 'super_admin'] }
);
