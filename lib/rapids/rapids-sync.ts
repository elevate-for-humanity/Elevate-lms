/**
 * Legacy RAPIDS service compatibility surface; no agency transport is implemented.
 *
 * Sponsors use the authenticated RAPIDS portal and reviewed uploads. DOL documents
 * restricted agency integrations, which do not establish an EFH sponsor API.
 * https://www.apprenticeship.gov/help/what-rapids
 * https://www.dol.gov/agencies/oasam/centers-offices/ocio/privacy/eta/rapids
 * Keep submission disabled until an agency-approved interface is implemented.
 */
import type { SupabaseClient } from '@/lib/supabase';

export interface RAPIDSConfig {
  agencyId: string;
  apiKey: string;
  baseUrl: string;
}

export interface ApprenticeData {
  ssn?: string; // Required for RAPIDS (encrypted)
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  ethnicity?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  email: string;
  programId: string;
  occupationCode: string;
  relatedInstructionProvider?: string;
  sponsorId: string;
  startDate: string;
  termMonths?: number;
  probationMonths?: number;
  wageRate: {
    initial: number;
    progression: { months: number; wage: number }[];
  };
}

export interface RAPIDSRegistrationResult {
  success: boolean;
  rapidsId?: string;
  localEnrollmentId?: string;
  error?: string;
  registeredAt?: string;
}

export interface RAPIDSHoursUpdate {
  apprenticeId: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  overtimeHours?: number;
  approvedBy: string;
}

const UNAVAILABLE = 'RAPIDS_MANUAL_SUBMISSION_REQUIRED: no verified sponsor API transport is implemented; use the authenticated RAPIDS portal and retain the agency receipt.';

class RAPIDSService {
  /** Retained for callers; supplying a URL/key must never enable guessed endpoints. */
  configure(_config: RAPIDSConfig): void {}

  async registerApprentice(_data: ApprenticeData): Promise<RAPIDSRegistrationResult> {
    return { success: false, error: UNAVAILABLE };
  }

  async submitHours(_update: RAPIDSHoursUpdate): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: UNAVAILABLE };
  }

  async completeApprentice(
    _apprenticeId: string,
    _completionDate: string,
    _certificateNumber?: string,
  ): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: UNAVAILABLE };
  }

  async syncPendingEnrollments(_supabase: SupabaseClient): Promise<{
    synced: number; failed: number; blocked: boolean; error: string;
  }> {
    // Nothing was attempted. Do not read PII, invent wages/start dates, or mark
    // local enrollments as agency-registered without an actual agency receipt.
    return { synced: 0, failed: 0, blocked: true, error: UNAVAILABLE };
  }
}

export const rapidsService = new RAPIDSService();

// OCCUPATION CODES (O*NET SOC Codes)
export const OCCUPATION_CODES = {
  BARBER: '39-5011.00',
  COSMETOLOGIST: '39-5012.00',
  ESTHETICIAN: '39-5094.00',
  NAIL_TECHNICIAN: '39-5092.00',
  HVAC: '49-9021.02',
  ELECTRICIAN: '47-2111.00',
  PLUMBER: '47-2111.00',
  CDL_TRUCK: '53-3032.00',
  MEDICAL_ASSISTANT: '31-9092.00',
};
