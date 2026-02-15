import { logger } from '@/lib/logger';
/**
 * Credential Verification System
 *
 * Verifies credentials against state databases and national registries.
 */

import { createClient } from '@supabase/supabase-js';

export interface CredentialVerificationRequest {
  student_id: string;
  credential_type: string;
  credential_number: string;
  issuing_organization: string;
  issue_date: string;
}

export interface StateDatabase {
  name: string;
  url: string;
  api_endpoint?: string;
  verification_method: 'api' | 'manual' | 'web_scraping';
}

/**
 * State credential databases
 */
export const STATE_DATABASES: Record<string, StateDatabase> = {
  // Indiana Professional Licensing Agency
  IPLA: {
    name: 'Indiana Professional Licensing Agency',
    url: 'https://mylicense.in.gov/everification/',
    verification_method: 'manual',
  },

  // Indiana Department of Education
  IDOE: {
    name: 'Indiana Department of Education',
    url: 'https://www.doe.in.gov/licensing',
    verification_method: 'manual',
  },

  // National Registry of Emergency Medical Technicians
  NREMT: {
    name: 'National Registry of EMTs',
    url: 'https://www.nremt.org/rwd/public',
    verification_method: 'manual',
  },

  // American Red Cross
  RED_CROSS: {
    name: 'American Red Cross',
    url: 'https://www.redcross.org/take-a-class/digital-certificate',
    verification_method: 'manual',
  },

  // CompTIA
  COMPTIA: {
    name: 'CompTIA Certification',
    url: 'https://www.certmetrics.com/comptia/',
    verification_method: 'manual',
  },
};

/**
 * Verify credential against state database
 */
export async function verifyCredential(
  request: CredentialVerificationRequest
): Promise<{
  verified: boolean;
  verification_method: string;
  verification_date: string;
  details?: any;
  error?: string;
}> {
  // Determine which database to check
  const database = determineDatabase(request.credential_type);

  if (!database) {
    return {
      verified: false,
      verification_method: 'unknown',
      verification_date: new Date().toISOString(),
      error: 'No verification database found for this credential type',
    };
  }

  // In production, this would:
  // 1. Call state database API (if available)
  // 2. Or provide manual verification link
  // 3. Or use web scraping (with permission)

  // Log the verification request for debugging
  logger.info('Credential verification request:', {
    credential_type: request.credential_type,
    database: database.name,
    method: database.verification_method,
  });

  // For now, log the verification request
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return {
      verified: false,
      verification_method: 'manual',
      verification_date: new Date().toISOString(),
      error: 'Supabase not configured',
    };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create verification record
  await supabase.from('credential_verification').insert({
    student_id: request.student_id,
    credential_type: request.credential_type,
    credential_number: request.credential_number,
    issuing_organization: request.issuing_organization,
    issue_date: request.issue_date,
    verification_status: 'pending',
    verification_method: database.verification_method,
    verification_url: database.url,
  });

  return {
    verified: false, // Requires manual verification
    verification_method: database.verification_method,
    verification_date: new Date().toISOString(),
    details: {
      database: database.name,
      url: database.url,
      instructions: `Visit ${database.url} to verify credential ${request.credential_number}`,
    },
  };
}

/**
 * Determine which database to use for verification
 */
function determineDatabase(credentialType: string): StateDatabase | null {
  const type = credentialType.toLowerCase();

  if (
    type.includes('nursing') ||
    type.includes('cna') ||
    type.includes('lpn')
  ) {
    return STATE_DATABASES.IPLA;
  }

  if (type.includes('teacher') || type.includes('education')) {
    return STATE_DATABASES.IDOE;
  }

  if (type.includes('emt') || type.includes('paramedic')) {
    return STATE_DATABASES.NREMT;
  }

  if (type.includes('cpr') || type.includes('first aid')) {
    return STATE_DATABASES.RED_CROSS;
  }

  if (
    type.includes('comptia') ||
    type.includes('a+') ||
    type.includes('network+')
  ) {
    return STATE_DATABASES.COMPTIA;
  }

  // Default to IPLA for Indiana professional licenses
  return STATE_DATABASES.IPLA;
}

/**
 * Bulk verify credentials
 */
export async function bulkVerifyCredentials(
  requests: CredentialVerificationRequest[]
): Promise<
  Array<{
    student_id: string;
    verified: boolean;
    error?: string;
  }>
> {
  const results = [];

  for (const request of requests) {
    try {
      const result = await verifyCredential(request);
      results.push({
        student_id: request.student_id,
        verified: result.verified,
        error: result.error,
      });
    } catch (error: any) {
      results.push({
        student_id: request.student_id,
        verified: false,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Get pending verifications
 */
export async function getPendingVerifications() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return [];
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data }: any = await supabase
    .from('credential_verification')
    .select('*')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true });

  return data || [];
}

/**
 * Mark credential as verified
 */
export async function markCredentialVerified(
  verificationId: string,
  verifiedBy: string,
  notes?: string
) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error('Supabase not configured');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from('credential_verification')
    .update({
      verification_status: 'verified',
      verified_date: new Date().toISOString(),
      verified_by: verifiedBy,
      state_verified: true,
      state_verification_date: new Date().toISOString(),
      notes,
    })
    .eq('id', verificationId);
}

/**
 * Generate credential verification report
 */
export async function generateCredentialReport() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error('Supabase not configured');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: all } = await supabase
    .from('credential_verification')
    .select('*');

  const total = all?.length || 0;
  const verified =
    all?.filter((c) => c.verification_status === 'verified').length || 0;
  const pending =
    all?.filter((c) => c.verification_status === 'pending').length || 0;
  const failed =
    all?.filter((c) => c.verification_status === 'failed').length || 0;

  return {
    total_credentials: total,
    verified: verified,
    pending: pending,
    failed: failed,
    verification_rate: total > 0 ? ((verified / total) * 100).toFixed(1) : '0',
    by_type: groupByType(all || []),
  };
}

function groupByType(credentials: any[]) {
  const grouped: Record<string, number> = {};

  for (const cred of credentials) {
    const type = cred.credential_type;
    grouped[type] = (grouped[type] || 0) + 1;
  }

  return grouped;
}
