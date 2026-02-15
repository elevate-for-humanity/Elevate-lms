import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a partner
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['partner', 'program_holder'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Partner access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      course_name,
      course_code,
      description,
      duration_hours,
      capacity,
      license_id,
    } = body;

    if (!course_name) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      );
    }

    // Validate license if provided
    if (license_id) {
      const { data: license } = await supabase
        .from('program_licenses')
        .select('*')
        .eq('id', license_id)
        .eq('license_holder_id', user.id)
        .single();

      if (!license) {
        return NextResponse.json({ error: 'Invalid license' }, { status: 400 });
      }

      if (license.status !== 'active') {
        return NextResponse.json(
          { error: 'License is not active' },
          { status: 400 }
        );
      }

      if (!license.can_create_courses) {
        return NextResponse.json(
          { error: 'License does not allow course creation' },
          { status: 403 }
        );
      }

      if (license.expires_at && new Date(license.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'License has expired' },
          { status: 400 }
        );
      }
    }

    // Create course (trigger will validate license)
    const { data: course, error } = await supabase
      .from('partner_lms_courses')
      .insert({
        partner_id: user.id,
        course_name,
        course_code,
        description,
        duration_hours,
        capacity,
        license_id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Course creation error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      course,
      message: 'Course created successfully',
    });
  } catch (error) {
    logger.error('Create course error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get partner's courses
    const { data: courses, error } = await supabase
      .from('partner_lms_courses')
      .select('*')
      .eq('partner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, courses });
  } catch (error) {
    logger.error('Get courses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
