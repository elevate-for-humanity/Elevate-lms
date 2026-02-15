import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserEnrollments } from '@/lib/enrollments/getUserEnrollments';

export async function GET() {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ enrollments: [] });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getUserEnrollments(user.id);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ enrollments: result.enrollments });
  } catch (error) {
    logger.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
