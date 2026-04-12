import { logger } from '@/lib/logger';

import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { DOT_CODES } from '@/lib/compliance/rapids-integration';
import { RAPIDS_CONFIG, getRAPIDSEnrollmentData } from '@/lib/compliance/rapids-config';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { sendOnboardingEmail } from '@/lib/email/send-onboarding';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const barberApplicationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  dateOfBirth: z.string(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2),
  zipCode: z.string().min(5),
  hasHostShop: z.string(),
  hostShopName: z.string().optional(),
  hostShopAddress: z.string().optional(),
  hostShopContact: z.string().optional(),
  enrolledInBarberSchool: z.string(),
  barberSchoolName: z.string().optional(),
  priorExperience: z.string().optional(),
  program: z.string(),
  programType: z.string(),
  fundingSource: z.string(),
});

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;

    const data = await req.json();
    const validated = barberApplicationSchema.parse(data);

    const supabase = await getAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Insert into applications table
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        first_name: validated.firstName,
        last_name: validated.lastName,
        email: validated.email,
        phone: validated.phone,
        city: validated.city,
        zip: validated.zipCode,
        program_interest: 'Barber Apprenticeship',
        status: 'pending_payment',
        // date_of_birth, address, state stored in eligibility_data (not in applications schema)
        eligibility_data: {
          date_of_birth: validated.dateOfBirth,
          address: validated.address,
          state: validated.state,
        },
        support_notes: JSON.stringify({
          programType: 'apprenticeship',
          fundingSource: 'self-pay',
          hasHostShop: validated.hasHostShop,
          hostShopName: validated.hostShopName,
          hostShopAddress: validated.hostShopAddress,
          hostShopContact: validated.hostShopContact,
          enrolledInBarberSchool: validated.enrolledInBarberSchool,
          barberSchoolName: validated.barberSchoolName,
          priorExperience: validated.priorExperience,
        }),
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to submit application. Please call 317-314-3757.' },
        { status: 500 }
      );
    }

    // Create RAPIDS pre-registration record (will be finalized after payment)
    // Uses centralized RAPIDS config for consistency
    const rapidsEnrollmentData = getRAPIDSEnrollmentData('barber-apprenticeship');
    const rapidsPreRegistration = {
      application_id: application.id,
      program_number: RAPIDS_CONFIG.programNumber,
      sponsor_name: RAPIDS_CONFIG.sponsorOfRecord,
      occupation_code: DOT_CODES.BARBER,
      occupation_title: 'Barber',
      status: 'pending_payment',
      created_at: new Date().toISOString(),
      // Additional RAPIDS enrollment data
      ...(rapidsEnrollmentData || {}),
    };

    // Store RAPIDS pre-registration
    await supabase.from('rapids_registrations').insert(rapidsPreRegistration).single();

    // Audit log: Application created
    await auditLog({
      actorId: application.id,
      actorRole: 'student',
      action: AuditAction.CASE_CREATED,
      entity: AuditEntity.APPLICATION,
      entityId: application.id,
      metadata: {
        program: 'barber-apprenticeship',
        email: validated.email,
        fundingSource: 'self-pay',
        rapidsProgram: rapidsPreRegistration.program_number,
      },
    });

    // Send barber onboarding email with Calendly link (BCC admin)
    sendOnboardingEmail({
      email: validated.email,
      name: `${validated.firstName} ${validated.lastName}`.trim(),
      program: 'Barber Apprenticeship',
    }).catch((err) => {
      logger.error('[barber-apply] Onboarding email failed (non-blocking):', err);
    });

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      rapidsPreRegistration: rapidsPreRegistration.program_number,
      message: 'Application submitted. Proceed to payment.',
    });
  } catch (err: any) {
    logger.error('Barber application error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
