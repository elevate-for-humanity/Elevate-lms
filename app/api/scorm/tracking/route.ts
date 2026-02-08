export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await parseBody<Record<string, any>>(request);
    const {
      scormPackageId,
      enrollmentId,
      userId,
      status,
      progress,
      score,
      timeSpent,
      cmiData,
    } = body;

    // Update SCORM enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('scorm_enrollments')
      .upsert({
        scorm_package_id: scormPackageId,
        user_id: userId,
        enrollment_id: enrollmentId,
        status,
        progress_percentage: progress,
        score,
        time_spent_seconds: timeSpent,
        last_accessed_at: new Date().toISOString(),
        cmi_data: cmiData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'scorm_package_id,user_id'
      })
      .select()
      .single();

    if (enrollmentError) {
      logger.error('Error updating SCORM enrollment:', enrollmentError);
      return NextResponse.json({ error: 'Failed to update enrollment' }, { status: 500 });
    }

    // Track individual SCORM elements
    if (cmiData) {
      const trackingPromises = Object.entries(cmiData).map(([element, value]: any) =>
        supabase.from('scorm_tracking').insert({
          scorm_enrollment_id: enrollment.id,
          element,
          value: String(value),
        })
      );

      await Promise.all(trackingPromises);
    }

    // If completed, update main enrollment if linked
    if (status === 'completed' || status === 'passed') {
      if (enrollmentId) {
        await supabase
          .from('enrollments')
          .update({
            progress: 100,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', enrollmentId);
      }
    }

    return NextResponse.json({ success: true, enrollment });
  } catch (error) { /* Error handled silently */ 
    logger.error('SCORM tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scormPackageId = searchParams.get('scormPackageId');
    const userId = searchParams.get('userId') || user.id;

    if (!scormPackageId) {
      return NextResponse.json({ error: 'Missing scormPackageId' }, { status: 400 });
    }

    const { data: enrollment, error } = await supabase
      .from('scorm_enrollments')
      .select('*')
      .eq('scorm_package_id', scormPackageId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching SCORM enrollment:', error);
      return NextResponse.json({ error: 'Failed to fetch enrollment' }, { status: 500 });
    }

    return NextResponse.json(enrollment || {});
  } catch (error) { /* Error handled silently */ 
    logger.error('SCORM tracking GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
