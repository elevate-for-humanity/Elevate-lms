/**
 * Demo Seed API
 * Idempotent endpoint to create/reset demo tenant data
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isDemoEnabled, getDemoTenantSlug } from '@/lib/demo/context';

export const dynamic = 'force-dynamic';

// Demo tenant and user IDs (stable for idempotency)
const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_ADMIN_ID = '00000000-0000-0000-0000-000000000010';
const DEMO_STAFF_ID = '00000000-0000-0000-0000-000000000011';
const DEMO_PARTNER_ID = '00000000-0000-0000-0000-000000000012';
const DEMO_LEARNER_ID = '00000000-0000-0000-0000-000000000013';

// Demo program IDs
const DEMO_PROGRAM_1_ID = '00000000-0000-0000-0000-000000000100';
const DEMO_PROGRAM_2_ID = '00000000-0000-0000-0000-000000000101';

// Demo course IDs
const DEMO_COURSE_1_ID = '00000000-0000-0000-0000-000000000200';
const DEMO_COURSE_2_ID = '00000000-0000-0000-0000-000000000201';

// Demo enrollment IDs
const DEMO_ENROLLMENT_1_ID = '00000000-0000-0000-0000-000000000300';
const DEMO_ENROLLMENT_2_ID = '00000000-0000-0000-0000-000000000301';

export async function POST() {
// Block in production — this endpoint is for development/testing only
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

  try {
    // Check if demo mode is enabled
    if (!isDemoEnabled()) {
      return NextResponse.json(
        { error: 'Demo mode is not enabled' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const demoSlug = getDemoTenantSlug();
    const results: Record<string, any> = {};

    // 1. Upsert demo tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .upsert({
        id: DEMO_TENANT_ID,
        slug: demoSlug,
        name: 'Demo Training Academy',
        type: 'training_provider',
        settings: {
          demo_mode: true,
          branding: {
            primary_color: '#4F46E5',
            logo_url: '/images/demo/demo-logo.png',
          },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    results.tenant = tenant || { id: DEMO_TENANT_ID, slug: demoSlug };
    if (tenantError && !tenantError.message.includes('duplicate')) {
      console.error('Tenant upsert error:', tenantError);
    }

    // 2. Upsert demo users (profiles)
    const demoProfiles = [
      {
        id: DEMO_ADMIN_ID,
        email: 'demo-admin@elevateforhumanity.org',
        full_name: 'Demo Admin',
        role: 'demo_admin',
        tenant_id: DEMO_TENANT_ID,
      },
      {
        id: DEMO_STAFF_ID,
        email: 'demo-staff@elevateforhumanity.org',
        full_name: 'Demo Staff',
        role: 'demo_staff',
        tenant_id: DEMO_TENANT_ID,
      },
      {
        id: DEMO_PARTNER_ID,
        email: 'demo-partner@elevateforhumanity.org',
        full_name: 'Demo Partner',
        role: 'demo_partner',
        tenant_id: DEMO_TENANT_ID,
      },
      {
        id: DEMO_LEARNER_ID,
        email: 'demo-learner@elevateforhumanity.org',
        full_name: 'Demo Learner',
        role: 'demo_learner',
        tenant_id: DEMO_TENANT_ID,
      },
    ];

    for (const profile of demoProfiles) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          ...profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`Profile upsert error for ${profile.email}:`, error);
      }
    }
    results.profiles = demoProfiles.length;

    // 3. Upsert demo programs
    const demoPrograms = [
      {
        id: DEMO_PROGRAM_1_ID,
        tenant_id: DEMO_TENANT_ID,
        name: 'Workforce Development Program',
        slug: 'workforce-development',
        description: 'Comprehensive workforce training with WIOA funding support',
        status: 'active',
        program_type: 'workforce',
        duration_weeks: 12,
        total_hours: 480,
      },
      {
        id: DEMO_PROGRAM_2_ID,
        tenant_id: DEMO_TENANT_ID,
        name: 'Partner Apprenticeship Program',
        slug: 'partner-apprenticeship',
        description: 'Employer-sponsored apprenticeship with OJT hours tracking',
        status: 'active',
        program_type: 'apprenticeship',
        duration_weeks: 52,
        total_hours: 2000,
      },
    ];

    for (const program of demoPrograms) {
      const { error } = await supabase
        .from('programs')
        .upsert({
          ...program,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`Program upsert error for ${program.name}:`, error);
      }
    }
    results.programs = demoPrograms.length;

    // 4. Upsert demo courses
    const demoCourses = [
      {
        id: DEMO_COURSE_1_ID,
        tenant_id: DEMO_TENANT_ID,
        program_id: DEMO_PROGRAM_1_ID,
        title: 'Professional Skills Fundamentals',
        slug: 'professional-skills',
        description: 'Essential workplace skills including communication, time management, and professionalism',
        status: 'published',
        duration_hours: 40,
      },
      {
        id: DEMO_COURSE_2_ID,
        tenant_id: DEMO_TENANT_ID,
        program_id: DEMO_PROGRAM_2_ID,
        title: 'Industry Certification Prep',
        slug: 'certification-prep',
        description: 'Preparation for industry-recognized certifications',
        status: 'published',
        duration_hours: 80,
      },
    ];

    for (const course of demoCourses) {
      const { error } = await supabase
        .from('courses')
        .upsert({
          ...course,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`Course upsert error for ${course.title}:`, error);
      }
    }
    results.courses = demoCourses.length;

    // 5. Upsert demo enrollments
    const demoEnrollments = [
      {
        id: DEMO_ENROLLMENT_1_ID,
        tenant_id: DEMO_TENANT_ID,
        student_id: DEMO_LEARNER_ID,
        program_id: DEMO_PROGRAM_1_ID,
        status: 'active',
        funding_type: 'wioa',
        enrolled_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        hours_completed: 120,
      },
      {
        id: DEMO_ENROLLMENT_2_ID,
        tenant_id: DEMO_TENANT_ID,
        student_id: DEMO_LEARNER_ID,
        program_id: DEMO_PROGRAM_2_ID,
        status: 'active',
        funding_type: 'self_pay',
        enrolled_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        hours_completed: 450,
      },
    ];

    for (const enrollment of demoEnrollments) {
      const { error } = await supabase
        .from('enrollments')
        .upsert({
          ...enrollment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`Enrollment upsert error:`, error);
      }
    }
    results.enrollments = demoEnrollments.length;

    // 6. Insert demo audit log entries
    const auditEntries = [
      { action: 'student.enrollment_created', resource_type: 'enrollment', resource_id: DEMO_ENROLLMENT_1_ID },
      { action: 'admin.program_created', resource_type: 'program', resource_id: DEMO_PROGRAM_1_ID },
      { action: 'student.hours_logged', resource_type: 'enrollment', resource_id: DEMO_ENROLLMENT_1_ID },
      { action: 'program_holder.requirement_verified', resource_type: 'enrollment', resource_id: DEMO_ENROLLMENT_2_ID },
      { action: 'system.report_generated', resource_type: 'report', resource_id: 'demo-report-001' },
    ];

    for (const entry of auditEntries) {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: DEMO_ADMIN_ID,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          details: { demo: true, seeded: true },
          success: true,
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
    }
    results.audit_logs = auditEntries.length;

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded successfully',
      results,
    });

  } catch (error) {
    console.error('Demo seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed demo data', details: String(error) },
      { status: 500 }
    );
  }
}
