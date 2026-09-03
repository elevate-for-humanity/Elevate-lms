'use server';

import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export async function submitStudentApplication(data: {
  role?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  zipCode?: string;
  programInterest?: string;
  requestedFundingSource?: string;
  goals?: string;
  applicationType?: string;
  source?: string;
  password?: string;
  personalStatement?: string;
  fundingSource?: string;
}) {
  const firstName = data.firstName?.trim();
  const lastName = data.lastName?.trim();
  const email = data.email?.trim().toLowerCase();
  const phone = data.phone?.trim();
  const program = data.programInterest?.trim();

  if (!firstName || !lastName || !email || !phone || !program) {
    throw new Error('Missing required application fields.');
  }

  // This server action is a compatibility caller only. All public application
  // writes must pass through the canonical Marketing /api/applications boundary
  // so deduplication, funding state, auditing, account provisioning, WorkOne
  // continuity, and enrollment safeguards cannot drift by entry point.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  const canonicalUrl = new URL('/api/applications', siteUrl);
  const fundingType = data.requestedFundingSource || data.fundingSource || null;
  const response = await fetch(canonicalUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: canonicalUrl.origin,
      'X-Idempotency-Key': `server-action-${crypto.randomUUID()}`,
    },
    cache: 'no-store',
    body: JSON.stringify({
      firstName,
      lastName,
      email,
      phone,
      zip: data.zipCode?.trim() || '',
      program,
      programSlug: program,
      fundingType,
      fundingSource: fundingType,
      goals: data.goals || '',
      applicationType: data.applicationType || '',
      personalStatement: data.personalStatement || '',
      source: data.source || `program-page-${program}`,
      preferredContact: 'phone',
    }),
  });

  const result = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    id?: string;
    referenceNumber?: string;
    error?: string;
    existing?: boolean;
  };

  if (!response.ok || !result.ok || !result.id) {
    throw new Error(result.error || 'Failed to save application.');
  }

  return {
    success: true,
    applicationId: result.id,
    referenceNumber: result.referenceNumber,
    existing: Boolean(result.existing),
    message: result.existing
      ? 'Your existing application is still active. Continue using the same application.'
      : 'Application received. You will be contacted shortly.',
  };
}
