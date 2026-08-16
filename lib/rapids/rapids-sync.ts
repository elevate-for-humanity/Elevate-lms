/**
 * RAPIDS Integration Service
 * Department of Labor Registered Apprenticeship System
 * 
 * DOC: https://dol.gov/agencies/vets/registered-apprenticeship
 * API: https://www.dol.gov/agencies/vets/registered-apprenticeship-programs/rapids-api
 */

import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';
import { logger } from '@/lib/logger';
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

class RAPIDSService {
  private config: RAPIDSConfig | null = null;
  private isConfigured = false;

  configure(config: RAPIDSConfig) {
    this.config = config;
    this.isConfigured = true;
    logger.info('[rapids] Configured with agency', { agencyId: config.agencyId });
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.config) {
      throw new Error('RAPIDS not configured');
    }

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Agency-ID': this.config.agencyId,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`RAPIDS API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Register a new apprentice with DOL
   */
  async registerApprentice(data: ApprenticeData): Promise<RAPIDSRegistrationResult> {
    if (!this.isConfigured) {
      logger.warn('[rapids] Not configured - storing locally for sync later');
      return {
        success: false,
        error: 'RAPIDS not configured - enrollment created locally',
      };
    }

    try {
      const payload = {
        registration: {
          programId: data.programId,
          occupationCode: data.occupationCode,
          relatedInstructionProvider: data.relatedInstructionProvider,
          sponsorId: data.sponsorId,
          apprentice: {
            ssn4: data.ssn?.slice(-4) || '', // Last 4 digits only
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            ethnicity: data.ethnicity,
            address: data.address,
            phone: data.phone,
            email: data.email,
          },
          terms: {
            startDate: data.startDate,
            termMonths: data.termMonths || 12,
            probationMonths: data.probationMonths || 3,
          },
          wages: data.wageRate,
        },
      };

      const result = await this.makeRequest<{ registrationId: string; status: string }>(
        '/api/v1/registrations',
        { method: 'POST', body: JSON.stringify(payload) }
      );

      logger.info('[rapids] Apprentice registered', {
        rapidsId: result.registrationId,
        localId: data.programId,
      });

      return {
        success: true,
        rapidsId: result.registrationId,
        registeredAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('[rapids] Registration failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * Submit hours for an apprentice
   */
  async submitHours(update: RAPIDSHoursUpdate): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      logger.warn('[rapids] Hours sync deferred - not configured');
      return { success: false, error: 'RAPIDS not configured' };
    }

    try {
      await this.makeRequest(
        `/api/v1/apprentices/${update.apprenticeId}/hours`,
        {
          method: 'POST',
          body: JSON.stringify({
            periodStart: update.periodStart,
            periodEnd: update.periodEnd,
            regularHours: update.totalHours,
            overtimeHours: update.overtimeHours || 0,
            approvedBy: update.approvedBy,
            submittedAt: new Date().toISOString(),
          }),
        }
      );

      logger.info('[rapids] Hours submitted', {
        apprenticeId: update.apprenticeId,
        hours: update.totalHours,
      });

      return { success: true };
    } catch (error) {
      logger.error('[rapids] Hours submission failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Submission failed',
      };
    }
  }

  /**
   * Update apprentice completion status
   */
  async completeApprentice(
    apprenticeId: string,
    completionDate: string,
    certificateNumber?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, error: 'RAPIDS not configured' };
    }

    try {
      await this.makeRequest(
        `/api/v1/apprentices/${apprenticeId}/completion`,
        {
          method: 'PUT',
          body: JSON.stringify({
            completionDate,
            certificateNumber,
          }),
        }
      );

      logger.info('[rapids] Apprentice completed', { apprenticeId });
      return { success: true };
    } catch (error) {
      logger.error('[rapids] Completion update failed', error);
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
    }
  }

  /**
   * Sync pending enrollments to RAPIDS
   * Called by cron job
   */
  async syncPendingEnrollments(supabase: SupabaseClient): Promise<{ synced: number; failed: number }> {
    // Only unsynced enrollments without a RAPIDS id belong in the registration queue.
    const { data: pending } = await supabase
      .from('program_enrollments')
      .select('id, user_id, program_id, enrolled_at, programs(rapids_code)')
      .eq('rapids_registered', false)
      .is('rapids_id', null)
      .limit(50);

    if (!pending?.length) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const enrollment of pending) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', enrollment.user_id)
        .single();

      if (!profile) {
        failed++;
        continue;
      }

      const occupationCode = (enrollment.programs as { rapids_code?: string })?.rapids_code?.trim();
      if (!occupationCode) {
        logger.error('[rapids] Pending enrollment is missing a RAPIDS occupation code', {
          enrollmentId: enrollment.id,
          programId: enrollment.program_id,
        });
        failed++;
        continue;
      }

      const result = await this.registerApprentice({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        dateOfBirth: profile.date_of_birth || '',
        address: {
          street: profile.address || '',
          city: profile.city || '',
          state: profile.state || RAPIDS_CONFIG.stateCode,
          zip: profile.zip || '',
        },
        phone: profile.phone || '',
        email: profile.email || '',
        programId: enrollment.program_id,
        occupationCode,
        sponsorId: RAPIDS_CONFIG.registrationId,
        startDate: enrollment.enrolled_at || new Date().toISOString(),
        wageRate: { initial: 12.00, progression: [] },
      });

      if (result.success) {
        await supabase
          .from('program_enrollments')
          .update({ rapids_registered: true, rapids_id: result.rapidsId })
          .eq('id', enrollment.id);
        synced++;
      } else {
        failed++;
      }
    }

    logger.info('[rapids] Batch sync complete', { synced, failed });
    return { synced, failed };
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
