import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const {
      organizationName,
      organizationType,
      industry,
      website,
      contactName,
      contactTitle,
      contactEmail,
      contactPhone,
      address,
      city,
      state,
      zip,
      programsInterested,
      capacityPerMonth,
      preferredSchedule,
      hasSupervision,
      experience,
      specialRequirements,
      howHeard,
      agreedToTerms,
    } = body || {};

    // Validation
    if (!organizationName || !contactName || !contactEmail || !contactPhone) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    if (!programsInterested || programsInterested.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one program.' },
        { status: 400 }
      );
    }

    if (!agreedToTerms) {
      return NextResponse.json(
        { error: 'You must agree to the terms.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Insert into partner_enrollments table
    const { error } = await db.from('partner_enrollments').insert({
      organization_name: organizationName,
      organization_type: organizationType,
      industry,
      website,
      contact_name: contactName,
      contact_title: contactTitle,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      address,
      city,
      state,
      zip,
      programs_interested: programsInterested,
      capacity_per_month: capacityPerMonth,
      preferred_schedule: preferredSchedule,
      has_supervision: hasSupervision,
      experience,
      special_requirements: specialRequirements,
      how_heard: howHeard,
      agreed_to_terms: agreedToTerms,
      status: 'pending', // Default status
    });

    if (error) {
      logger.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Unable to save enrollment.' },
        { status: 500 }
      );
    }

    // Note: Send notification email to admin
    // Note: Send confirmation email to partner

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    logger.error(
      'API error:',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 });
  }
}
