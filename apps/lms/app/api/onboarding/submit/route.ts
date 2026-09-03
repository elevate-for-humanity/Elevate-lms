import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  OnboardingData,
  generateCompleteOnboardingPackage,
  generateW4Form,
  generateI9Form,
  generateDirectDepositForm,
  generateEmergencyContactForm,
  generateBackgroundCheckForm,
  generateOnboardingSummary,
} from '@/lib/onboarding-complete-digital';
import { generateNDAText } from '@/lib/onboarding-nda-template';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function requestIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  return request.headers.get('x-real-ip');
}

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    const data: OnboardingData = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const w4Form = generateW4Form(data);
    const i9Form = generateI9Form(data);
    const directDepositForm = generateDirectDepositForm(data);
    const emergencyContactForm = generateEmergencyContactForm(data);
    const backgroundCheckForm = generateBackgroundCheckForm(data);
    const ndaDocument = generateNDAText({
      recipientName: `${data.firstName} ${data.lastName}`,
      recipientType: data.employeeType,
      effectiveDate: data.startDate,
      recipientEmail: data.email,
      recipientAddress: `${data.streetAddress}, ${data.city}, ${data.state} ${data.zipCode}`,
    });
    const summary = generateOnboardingSummary(data);
    const onboardingPackage = generateCompleteOnboardingPackage(data);

    const { data: onboardingRecord, error: onboardingError } = await supabase
      .from('onboarding_submissions')
      .insert({
        user_id: user.id,
        employee_type: data.employeeType,
        position: data.position,
        department: data.department,
        start_date: data.startDate,
        personal_info: {
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          address: { street: data.streetAddress, city: data.city, state: data.state, zip: data.zipCode },
        },
        tax_info: {
          filingStatus: data.filingStatus,
          dependents: data.dependents,
          additionalWithholding: data.additionalWithholding,
          claimExempt: data.claimExempt,
        },
        banking_info: {
          bankName: data.bankName,
          accountType: data.accountType,
          routingNumber: data.routingNumber,
          accountNumber: data.accountNumber,
        },
        emergency_contact: {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone,
          relationship: data.emergencyContactRelationship,
        },
        i9_info: {
          citizenshipStatus: data.citizenshipStatus,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          documentExpiration: data.documentExpiration,
        },
        agreements: {
          ndaAccepted: data.ndaAccepted,
          nonCompeteAccepted: data.nonCompeteAccepted,
          handbookAccepted: data.handbookAccepted,
          codeOfConductAccepted: data.codeOfConductAccepted,
          backgroundCheckConsent: data.backgroundCheckConsent,
        },
        signature: data.signature,
        signature_date: data.signatureDate,
        ip_address: data.ipAddress || requestIp(request),
        forms_generated: {
          w4: w4Form,
          i9: i9Form,
          directDeposit: directDepositForm,
          emergencyContact: emergencyContactForm,
          backgroundCheck: backgroundCheckForm,
          nda: ndaDocument,
        },
        onboarding_package: onboardingPackage,
        summary,
        status: onboardingPackage.status.isComplete ? 'complete' : 'in-progress',
        can_start_work: onboardingPackage.status.canStartWork,
        progress_percentage: onboardingPackage.status.overallProgress,
        created_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (onboardingError || !onboardingRecord) {
      logger.error('Error storing onboarding data', onboardingError || new Error('Onboarding record missing'));
      return NextResponse.json({ error: 'Failed to store onboarding data', details: onboardingError?.message }, { status: 500 });
    }

    if (onboardingPackage.status.isComplete) {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/onboarding-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: data.email, name: `${data.firstName} ${data.lastName}`, startDate: data.startDate }),
      });
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/onboarding-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName: `${data.firstName} ${data.lastName}`, position: data.position, startDate: data.startDate, onboardingId: onboardingRecord.id }),
      });
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `Onboarding Complete: ${data.firstName} ${data.lastName}` }),
        });
      }
    }

    return NextResponse.json({
      success: true,
      onboardingId: onboardingRecord.id,
      status: onboardingPackage.status,
      message: onboardingPackage.status.isComplete ? 'Onboarding completed successfully!' : 'Onboarding saved. Please complete remaining items.',
    });
  } catch (error) {
    logger.error('Onboarding submission error', error);
    return NextResponse.json({ error: 'Failed to process onboarding', details: toErrorMessage(error) }, { status: 500 });
  }
}

async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: onboarding, error } = await supabase
      .from('onboarding_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching onboarding', normalizeError(error, 'Failed to fetch onboarding'), getErrorContext(error));
      return NextResponse.json({ error: 'Failed to fetch onboarding data' }, { status: 500 });
    }
    return NextResponse.json({ success: true, onboarding: onboarding || null, hasOnboarding: !!onboarding });
  } catch (error) {
    logger.error('Onboarding fetch error', error);
    return NextResponse.json({ error: 'Failed to fetch onboarding', details: toErrorMessage(error) }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/onboarding/submit', _GET);
export const POST = withApiAudit('/api/onboarding/submit', _POST);
