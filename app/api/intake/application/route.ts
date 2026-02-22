
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// =====================================================
// INTAKE STAGE 3: APPLICATION
// Full application submission after eligibility confirmed
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const ApplicationSchema = z.object({
  leadId: z.string().uuid(),
  programId: z.string().uuid(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zip: z.string().min(5).max(10),
  }),
  emergencyContact: z.object({
    name: z.string().min(1),
    relationship: z.string().min(1),
    phone: z.string().min(10),
  }),
  education: z.object({
    highestLevel: z.enum(['none', 'some_high_school', 'high_school', 'some_college', 'associates', 'bachelors', 'masters', 'doctorate']),
    schoolName: z.string().optional(),
    graduationYear: z.number().optional(),
  }),
  employment: z.object({
    currentEmployer: z.string().optional(),
    position: z.string().optional(),
    yearsExperience: z.number().optional(),
  }),
  documents: z.array(z.object({
    type: z.enum(['id', 'ssn', 'diploma', 'transcript', 'resume', 'other']),
    url: z.string().url(),
    name: z.string(),
  })).optional(),
  additionalInfo: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const parsed = ApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = await createServerSupabaseClient();

    // Verify lead exists and is eligible
    const { data: lead, error: leadError } = await db
      .from('leads')
      .select('id, stage, eligibility_data')
      .eq('id', data.leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (lead.stage !== 'ELIGIBLE') {
      return NextResponse.json(
        { error: 'Must complete eligibility check first' },
        { status: 400 }
      );
    }

    // Verify program exists and is active
    const { data: program, error: programError } = await db
      .from('programs')
      .select('id, title, status')
      .eq('id', data.programId)
      .single();

    if (programError || !program || program.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Program not available' },
        { status: 400 }
      );
    }

    // Update lead with application data
    const { error: updateError } = await db
      .from('leads')
      .update({
        stage: 'APPLICATION_SUBMITTED',
        program_id: data.programId,
        application_data: {
          address: data.address,
          emergency_contact: data.emergencyContact,
          education: data.education,
          employment: data.employment,
          documents: data.documents || [],
          additional_info: data.additionalInfo,
          submitted_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.leadId);

    if (updateError) {
      logger.error('Failed to submit application', { error: updateError, leadId: data.leadId });
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    // Log event
    await db.from('audit_logs').insert({
      event_type: 'application_submitted',
      resource_type: 'lead',
      resource_id: data.leadId,
      metadata: {
        program_id: data.programId,
        program_title: program.title,
      },
    });

    logger.info('Application submitted', {
      leadId: data.leadId,
      programId: data.programId,
    });

    return NextResponse.json({
      success: true,
      status: 'submitted',
      nextStep: 'advisor-review',
      expectedResponse: '3-5 business days',
      message: 'Your application has been submitted successfully! An advisor will review it and contact you within 3-5 business days.',
      applicationId: data.leadId,
    });
  } catch (error) {
    logger.error('Application submission error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
