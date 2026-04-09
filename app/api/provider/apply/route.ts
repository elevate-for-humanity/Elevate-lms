
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

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
    orgName, orgType, ein, website,
    contactName, contactTitle, contactEmail, contactPhone,
    addressLine1, addressLine2, city, state, zip,
    programTypes, serviceArea, annualEnrollment, credentialAuthorities,
    wioaEligible, etplListed, etplState, accreditation,
    missionStatement, outcomesDescription, partnershipGoals,
    agreedToTerms,
  } = body as Record<string, unknown>;

  // Required field validation
  const missing: string[] = [];
  if (!orgName) missing.push('orgName');
  if (!orgType) missing.push('orgType');
  if (!contactName) missing.push('contactName');
  if (!contactEmail) missing.push('contactEmail');
  if (!contactPhone) missing.push('contactPhone');
  if (!addressLine1) missing.push('addressLine1');
  if (!city) missing.push('city');
  if (!state) missing.push('state');
  if (!zip) missing.push('zip');
  if (!programTypes || (programTypes as string[]).length === 0) missing.push('programTypes');
  if (!agreedToTerms) missing.push('agreedToTerms');

  if (missing.length > 0) {
    return safeError(`Missing required fields: ${missing.join(', ')}`, 400);
  }

  const validOrgTypes = ['training_provider', 'workforce_agency', 'employer', 'community_org'];
  if (!validOrgTypes.includes(orgType as string)) {
    return safeError('Invalid organization type', 400);
  }

  try {
    const supabase = createAdminClient();

    // Check for duplicate pending application
    const { data: existing } = await supabase
      .from('provider_applications')
      .select('id, status')
      .eq('contact_email', contactEmail)
      .in('status', ['pending', 'under_review'])
      .maybeSingle();

    if (existing) {
      return safeError('An application from this email is already under review', 409);
    }

    const { data, error } = await supabase
      .from('provider_applications')
      .insert({
        org_name: orgName,
        org_type: orgType,
        ein: ein || null,
        website: website || null,
        contact_name: contactName,
        contact_title: contactTitle || null,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        state,
        zip,
        program_types: programTypes,
        service_area: serviceArea || null,
        annual_enrollment: annualEnrollment ? Number(annualEnrollment) : null,
        credential_authorities: credentialAuthorities || [],
        wioa_eligible: Boolean(wioaEligible),
        etpl_listed: Boolean(etplListed),
        etpl_state: etplState || null,
        accreditation: accreditation || null,
        mission_statement: missionStatement || null,
        outcomes_description: outcomesDescription || null,
        partnership_goals: partnershipGoals || null,
        agreed_to_terms: true,
        agreed_at: new Date().toISOString(),
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      return safeInternalError(error, 'Failed to submit application');
    }

    return NextResponse.json({ success: true, applicationId: data.id }, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to submit application');
  }
}
