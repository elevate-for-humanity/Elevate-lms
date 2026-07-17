// PUBLIC ROUTE: suboffice onboarding application form submission
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid request body', 400);
  }

  const {
    businessName, ein, businessAddress, city, state, zip,
    contactName, contactEmail, contactPhone,
    ptin, efin, preparerCount,
    acknowledgedSplit, acknowledgedAddons, acknowledgedSoftware,
    acknowledgedPayroll, acknowledgedPolicy,
  } = body as Record<string, string | number | boolean>;

  // Required field validation
  const missing = [];
  if (!businessName) missing.push('businessName');
  if (!contactName) missing.push('contactName');
  if (!contactEmail) missing.push('contactEmail');
  if (!contactPhone) missing.push('contactPhone');
  if (!ptin) missing.push('ptin');
  if (!efin) missing.push('efin');
  if (!acknowledgedSplit || !acknowledgedAddons || !acknowledgedSoftware ||
      !acknowledgedPayroll || !acknowledgedPolicy) {
    missing.push('acknowledgments');
  }

  if (missing.length > 0) {
    return safeError(`Missing required fields: ${missing.join(', ')}`, 400);
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(contactEmail))) {
    return safeError('Invalid email address', 400);
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  try {
    const db = await requireAdminClient();

    const { data, error } = await db
      .from('sub_office_agreements')
      .insert({
        name: String(businessName),
        business_name: String(businessName),
        ein: ein ? String(ein) : null,
        business_address: businessAddress ? String(businessAddress) : null,
        city: city ? String(city) : null,
        state: state ? String(state) : null,
        zip: zip ? String(zip) : null,
        contact_name: String(contactName),
        contact_email: String(contactEmail),
        contact_phone: String(contactPhone),
        ptin: String(ptin),
        efin: String(efin),
        preparer_count: Number(preparerCount) || 1,
        acknowledged_split: Boolean(acknowledgedSplit),
        acknowledged_addons: Boolean(acknowledgedAddons),
        acknowledged_software: Boolean(acknowledgedSoftware),
        acknowledged_payroll: Boolean(acknowledgedPayroll),
        acknowledged_policy: Boolean(acknowledgedPolicy),
        status: 'pending',
        ip_address: ip,
        submitted_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) return safeDbError(error, 'Failed to submit application');

    logger.info('[suboffice/apply] Application submitted', {
      id: data.id,
      businessName: String(businessName),
      contactEmail: String(contactEmail),
    });

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    return safeInternalError(err, 'Suboffice application submission failed');
  }
}
