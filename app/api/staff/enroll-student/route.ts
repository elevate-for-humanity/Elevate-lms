import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { enqueueNotification, buildTokenUrl } from '@/lib/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MILADY_LOGIN_URL = 'https://www.miladytraining.com/users/sign_in';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

/**
 * Staff enrollment endpoint - enrolls student and sends Milady access email immediately.
 * Used when Elevate pays on behalf of student (workforce funding, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify staff/admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: staffProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!staffProfile || !['admin', 'super_admin', 'instructor', 'staff'].includes(staffProfile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      city,
      state,
      zipCode,
      county,
      programId,
      fundingType,
      caseManagerName,
      caseManagerEmail,
      caseManagerPhone,
      notes,
      staffId,
      documentIds,
    } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    let profileId: string;

    if (existingProfile) {
      profileId = existingProfile.id;
      // Update existing profile
      await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          phone: phone || null,
          role: 'student',
          enrollment_status: 'active',
        })
        .eq('id', profileId);
    } else {
      // Create new profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          phone: phone || null,
          role: 'student',
          enrollment_status: 'active',
        })
        .select()
        .single();

      if (profileError) {
        logger.error('Profile creation error:', profileError);
        return NextResponse.json(
          { error: 'Failed to create student profile' },
          { status: 500 }
        );
      }

      profileId = newProfile.id;
    }

    // Create or update student record
    await supabase
      .from('students')
      .upsert({
        id: profileId,
        date_of_birth: dateOfBirth || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip_code: zipCode || null,
        county: county || null,
        funding_type: fundingType || null,
        case_manager_name: caseManagerName || null,
        case_manager_email: caseManagerEmail || null,
        case_manager_phone: caseManagerPhone || null,
        notes: notes || null,
      });

    // Get program info
    let programName = 'Barber Apprenticeship';
    let totalHours = 2000;
    
    if (programId) {
      const { data: program } = await supabase
        .from('programs')
        .select('name, total_hours')
        .eq('id', programId)
        .single();
      
      if (program) {
        programName = program.name;
        totalHours = program.total_hours || 2000;
      }
    }

    // Create enrollment - ACTIVE immediately (Elevate paid)
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        user_id: profileId,
        program_id: programId || null,
        funding_type: fundingType || 'workforce',
        status: 'active', // Active immediately - Elevate paid
        milady_enrolled: true, // Grant Milady access
        enrolled_by: staffId || user.id,
        docs_verified: true, // Staff verified docs during enrollment
        docs_verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (enrollmentError) {
      logger.error('Enrollment creation error:', enrollmentError);
      return NextResponse.json(
        { error: 'Failed to create enrollment' },
        { status: 500 }
      );
    }

    // Create apprentice record for hour logging
    await supabase
      .from('apprentices')
      .upsert({
        user_id: profileId,
        program_id: programId || null,
        program_name: programName,
        status: 'active',
        total_hours_required: totalHours,
        hours_completed: 0,
        transfer_hours_credited: 0,
        enrollment_date: new Date().toISOString().split('T')[0],
      });

    // Link uploaded documents to user
    if (documentIds && documentIds.length > 0) {
      await supabase
        .from('documents')
        .update({
          user_id: profileId,
          status: 'verified', // Staff uploaded = verified
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .in('id', documentIds);
    }

    // Generate portal access token (no login required)
    const portalUrl = await buildTokenUrl('/lms', {
      purpose: 'continue_enrollment',
      email,
      expiresDays: 30,
      maxUses: 20,
      metadata: { enrollment_id: enrollment.id },
    });

    // Send welcome email with Milady link
    await enqueueNotification({
      toEmail: email,
      templateKey: 'apprentice_decision',
      templateData: {
        name: firstName,
        approved: true,
        portal_url: portalUrl || `${SITE_URL}/lms`,
        milady_url: MILADY_LOGIN_URL,
      },
      entityType: 'enrollment',
      entityId: enrollment.id,
    });

    return NextResponse.json({
      success: true,
      enrollment: {
        id: enrollment.id,
        status: 'active',
      },
      message: `Student enrolled successfully. Welcome email with Milady access sent to ${email}`,
    });
  } catch (error: any) {
    logger.error('Staff enrollment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enroll student' },
      { status: 500 }
    );
  }
}
