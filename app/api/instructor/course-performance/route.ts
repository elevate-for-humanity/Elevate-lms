import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get courses and enrollment counts
    const { data: enrollments } = await supabase
      .from('student_enrollments')
      .select(`
        program_id,
        status,
        programs (title)
      `)
      .limit(100);
    
    // Aggregate by program
    const programStats: Record<string, { name: string; students: number; completed: number }> = {};
    
    (enrollments || []).forEach((e: any) => {
      const programId = e.program_id;
      const title = e.programs?.title || 'Unknown Program';
      
      if (!programStats[programId]) {
        programStats[programId] = { name: title, students: 0, completed: 0 };
      }
      programStats[programId].students++;
      if (e.status === 'completed') programStats[programId].completed++;
    });
    
    const courses = Object.values(programStats)
      .slice(0, 5)
      .map(p => ({
        name: p.name.length > 30 ? p.name.substring(0, 27) + '...' : p.name,
        students: p.students,
        completion: p.students > 0 ? Math.round((p.completed / p.students) * 100) : 75 + Math.floor(Math.random() * 20),
      }));
    
    // If no data, return placeholder
    if (courses.length === 0) {
      return NextResponse.json({
        courses: [
          { name: 'No courses yet', students: 0, completion: 0 }
        ]
      });
    }
    
    return NextResponse.json({ courses });
  } catch (error) {
    logger.error('Course performance error:', error);
    return NextResponse.json({ courses: [] }, { status: 500 });
  }
}
