import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPublicClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

/**
 * Compatibility API for older authenticated PARIS clients.
 *
 * Canonical admissions authority is public.applications through /api/applications.
 * This route must never recreate the retired paris_applications authority.
 */

const createApplicationSchema = z.object({
  programId: z.string().uuid('Invalid program ID'),
  applicationType: z.enum(['STUDENT', 'APPRENTICE', 'TESTING_CANDIDATE']).default('STUDENT'),
  firstName: z.string().trim().min(1).max(100),
  middleName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().min(1).max(100),
  dateOfBirth: z.string().optional(),
  email: z.string().email(),
  phone: z.string().trim().min(10).max(30),
  addressLine1: z.string().trim().max(200).optional(),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(50).optional(),
  postalCode: z.string().trim().max(20).optional(),
  highestEducation: z.string().max(100).optional(),
  employmentStatus: z.string().max(100).optional(),
  preferredSchedule: z.string().max(100).optional(),
  desiredStartDate: z.string().optional(),
  careerGoal: z.string().max(2000).optional(),
  barriers: z.array(z.string().max(100)).default([]),
  eligibilityAnswers: z.record(z.string(), z.unknown()).default({}),
  requestedFunding: z.array(z.enum([
    'WIOA',
    'WORKFORCE_READY_GRANT',
    'VOCATIONAL_REHABILITATION',
    'EMPLOYER_SPONSORSHIP',
    'APPRENTICESHIP',
    'GRANT',
    'SELF_PAY',
    'BNPL',
    'PAYMENT_PLAN',
    'OTHER',
  ])).min(1),
  source: z.string().max(100).optional(),
  referralCode: z.string().max(100).optional(),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authenticatedUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const supabase = createPublicClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error ? null : user;
}

function canonicalFunding(value: string | undefined) {
  const map: Record<string, string> = {
    WIOA: 'wioa',
    WORKFORCE_READY_GRANT: 'wrg',
    VOCATIONAL_REHABILITATION: 'vr',
    EMPLOYER_SPONSORSHIP: 'employer',
    APPRENTICESHIP: 'apprenticeship',
    GRANT: 'grant',
    SELF_PAY: 'self_pay',
    BNPL: 'payment_plan',
    PAYMENT_PLAN: 'payment_plan',
    OTHER: 'not_sure',
  };
  return value ? map[value] ?? 'not_sure' : 'not_sure';
}

export async function POST(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const parsed = createApplicationSchema.parse(await request.json());
    const db = await requireAdminClient();
    const { data: program, error: programError } = await db
      .from('programs')
      .select('id, slug')
      .eq('id', parsed.programId)
      .maybeSingle();
    if (programError || !program?.slug) {
      return NextResponse.json({ success: false, error: 'Program could not be resolved' }, { status: 409 });
    }

    const funding = canonicalFunding(parsed.requestedFunding[0]);
    const supportNeeds = [
      parsed.careerGoal ? `Career goal: ${parsed.careerGoal}` : '',
      parsed.highestEducation ? `Highest education: ${parsed.highestEducation}` : '',
      parsed.employmentStatus ? `Employment status: ${parsed.employmentStatus}` : '',
      parsed.preferredSchedule ? `Preferred schedule: ${parsed.preferredSchedule}` : '',
      parsed.barriers.length ? `Barriers/support considerations: ${parsed.barriers.join(', ')}` : '',
    ].filter(Boolean).join(' | ');

    const canonicalPayload = {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      dateOfBirth: parsed.dateOfBirth,
      email: parsed.email,
      phone: parsed.phone,
      address: parsed.addressLine1,
      city: parsed.city,
      state: parsed.state,
      zip: parsed.postalCode,
      zipCode: parsed.postalCode,
      program: program.slug,
      programSlug: program.slug,
      fundingType: funding,
      funding,
      supportNeeds: supportNeeds || undefined,
      source: parsed.source || 'paris-compat',
      applicationCertification: true,
    };

    const canonicalUrl = new URL('/api/applications', request.url);
    const headers = new Headers({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: canonicalUrl.origin,
      'X-Idempotency-Key': `paris-${user.id}-${crypto.randomUUID()}`,
    });
    const response = await fetch(canonicalUrl, {
      method: 'POST',
      headers,
      cache: 'no-store',
      body: JSON.stringify(canonicalPayload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      return NextResponse.json(
        { success: false, error: data?.error || 'Unable to create application' },
        { status: response.status || 400 },
      );
    }

    return NextResponse.json({
      success: true,
      applicationId: data.id,
      applicationNumber: data.referenceNumber,
      workflowStatus: 'submitted',
      redirectTo: `/apply/track?id=${encodeURIComponent(data.referenceNumber || data.id)}`,
      canonicalAuthority: 'applications',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      }, { status: 400 });
    }
    console.error('paris.application.compat.create.failed', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, error: 'Unable to create application' }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const db = await requireAdminClient();
    const { data, error } = await db
      .from('applications')
      .select('id, reference_number, status, program_id, program_slug, program_interest, funding_type, submitted_at, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({
      success: true,
      applications: (data ?? []).map((application) => ({
        id: application.id,
        application_number: application.reference_number,
        workflow_status: application.status,
        program_id: application.program_id,
        program_slug: application.program_slug || application.program_interest,
        funding_type: application.funding_type,
        submitted_at: application.submitted_at,
        created_at: application.created_at,
        updated_at: application.updated_at,
      })),
      canonicalAuthority: 'applications',
    });
  } catch (error) {
    console.error('paris.application.compat.list.failed', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ success: false, error: 'Unable to list applications' }, { status: 400 });
  }
}
