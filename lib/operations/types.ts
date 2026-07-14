/**
 * Authoritative Data Layer - TypeScript Types
 * Single Source of Truth for all platform data
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// Organization Types
// =============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  legal_name?: string;
  ein?: string;
  dba?: string;
  phone_main?: string;
  phone_toll_free?: string;
  phone_fax?: string;
  email_primary?: string;
  email_support?: string;
  email_admissions?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  verified: boolean;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
  is_active: boolean;
  deactivated_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationUpdate {
  name?: string;
  legal_name?: string;
  ein?: string;
  dba?: string;
  phone_main?: string;
  phone_toll_free?: string;
  phone_fax?: string;
  email_primary?: string;
  email_support?: string;
  email_admissions?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  verified?: boolean;
  verification_notes?: string;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Program Registry Types
// =============================================================================

export interface ProgramRegistry {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  category?: string;
  description?: string;
  tuition?: number;
  deposit?: number;
  stripe_price_id?: string;
  stripe_product_id?: string;
  duration_weeks?: number;
  duration_hours?: number;
  schedule_type?: 'full-time' | 'part-time' | 'flexible';
  minimum_age?: number;
  required_documents?: string[];
  prerequisites?: string[];
  credential_name?: string;
  credential_type?: 'certificate' | 'license' | 'certification' | 'degree';
  credential_issuer?: string;
  is_etpl_registered: boolean;
  is_wioa_eligible: boolean;
  is_dol_sponsored: boolean;
  rapids_program_id?: string;
  program_holder_id?: string;
  application_route?: string;
  has_syllabus: boolean;
  has_orientation: boolean;
  has_handbook: boolean;
  syllabus_url?: string;
  handbook_url?: string;
  orientation_duration_minutes?: number;
  hero_image_url?: string;
  hero_video_url?: string;
  is_published: boolean;
  is_active: boolean;
  publish_date?: string;
  sunset_date?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProgramRegistryUpdate {
  name?: string;
  category?: string;
  description?: string;
  tuition?: number;
  deposit?: number;
  stripe_price_id?: string;
  stripe_product_id?: string;
  duration_weeks?: number;
  duration_hours?: number;
  schedule_type?: 'full-time' | 'part-time' | 'flexible';
  minimum_age?: number;
  required_documents?: string[];
  prerequisites?: string[];
  credential_name?: string;
  credential_type?: 'certificate' | 'license' | 'certification' | 'degree';
  credential_issuer?: string;
  is_etpl_registered?: boolean;
  is_wioa_eligible?: boolean;
  is_dol_sponsored?: boolean;
  rapids_program_id?: string;
  program_holder_id?: string;
  application_route?: string;
  has_syllabus?: boolean;
  has_orientation?: boolean;
  has_handbook?: boolean;
  syllabus_url?: string;
  handbook_url?: string;
  orientation_duration_minutes?: number;
  hero_image_url?: string;
  hero_video_url?: string;
  is_published?: boolean;
  is_active?: boolean;
  sunset_date?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Funding Rules Types
// =============================================================================

export interface FundingRule {
  id: string;
  organization_id: string;
  program_registry_id: string;
  name: string;
  code: string;
  type: 'grant' | 'scholarship' | 'loan' | 'employer_reimbursement' | 'payment_plan';
  amount?: number;
  amount_max?: number;
  percentage_covered?: number;
  copay?: number;
  eligibility_criteria: EligibilityCriterion[];
  income_limits: IncomeLimits;
  residency_requirements?: string[];
  age_requirements?: number[];
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  requires_approval: boolean;
  approving_authority?: string;
  approval_process?: string;
  max_awards?: number;
  required_documents?: string[];
  application_url?: string;
  badge_name?: string;
  badge_color?: string;
  display_on_public_site: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EligibilityCriterion {
  type: 'income' | 'age' | 'residency' | 'employment' | 'education' | 'custom';
  operator: 'lte' | 'gte' | 'eq' | 'in' | 'contains';
  field: string;
  value: string | number | string[];
}

export interface IncomeLimits {
  household_size?: number;
  income_limit?: number;
  income_limit_type?: 'fpl' | 'ami' | 'absolute'; // Federal Poverty Level, Area Median Income, Absolute
}

// =============================================================================
// Verified Claims Types
// =============================================================================

export interface VerifiedClaim {
  id: string;
  organization_id: string;
  claim_key: string;
  claim_value: string;
  category: 'compliance' | 'accreditation' | 'partnership' | 'outcome' | 'certification';
  evidence_type: 'document' | 'url' | 'certificate' | 'api' | 'manual';
  evidence_url?: string;
  evidence_reference?: string;
  evidence_expiration?: string;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  approver_name?: string;
  approver_role?: string;
  valid_from: string;
  valid_until?: string;
  auto_expire: boolean;
  display_on_website: boolean;
  display_locations?: ('footer' | 'program_page' | 'landing' | 'header' | 'badge_bar')[];
  display_priority: number;
  is_active: boolean;
  deprecated_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ClaimDisplay {
  claim_key: string;
  claim_value: string;
  badge_name?: string;
  badge_color?: string;
  display_locations: string[];
}

// Common claim keys
export const CLAIM_KEYS = {
  ETPL_REGISTERED: 'ETPL_REGISTERED',
  WIOA_ELIGIBLE: 'WIOA_ELIGIBLE',
  DOL_SPONSORED: 'DOL_SPONSORED',
  RAPIDS_COMPLIANT: 'RAPIDS_COMPLIANT',
  FERPA_COMPLIANT: 'FERPA_COMPLIANT',
  SOC2_HOSTED: 'SOC2_HOSTED',
  ACCREDITED: 'ACCREDITED',
  BBB_ACCREDITED: 'BBB_ACCREDITED',
  EQUAL_OPPORTUNITY: 'EQUAL_OPPORTUNITY',
  VETERAN_FRIENDLY: 'VETERAN_FRIENDLY',
  WORKPLACE_AWARD: 'WORKPLACE_AWARD',
  EMPLOYER_PARTNER: 'EMPLOYER_PARTNER',
} as const;

// =============================================================================
// Workflow Instances Types
// =============================================================================

export type WorkflowType = 
  | 'inquiry'
  | 'application'
  | 'enrollment'
  | 'apprenticeship'
  | 'employer_onboarding'
  | 'instructor_onboarding'
  | 'funding_application'
  | 'credential_process';

export type WorkflowStatus = 'active' | 'completed' | 'cancelled' | 'failed' | 'paused';

export interface WorkflowInstance {
  id: string;
  organization_id: string;
  workflow_type: WorkflowType;
  workflow_version: number;
  entity_type: 'lead' | 'application' | 'enrollment' | 'apprentice' | 'employer' | 'instructor';
  entity_id: string;
  current_state: string;
  previous_state?: string;
  state_entered_at: string;
  total_steps: number;
  completed_steps: number;
  progress_percentage: number;
  context: Record<string, unknown>;
  metadata: Record<string, unknown>;
  status: WorkflowStatus;
  started_at: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  error_count: number;
  last_error?: string;
  last_error_at?: string;
  retry_count: number;
  created_by?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Workflow Events Types
// =============================================================================

export type WorkflowEventType = 
  | 'state_change'
  | 'step_start'
  | 'step_complete'
  | 'step_skip'
  | 'error'
  | 'retry'
  | 'notification'
  | 'approval'
  | 'rejection'
  | 'escalation';

export type ActorType = 'system' | 'user' | 'admin' | 'api' | 'ai';

export interface WorkflowEvent {
  id: string;
  workflow_instance_id: string;
  organization_id: string;
  event_type: WorkflowEventType;
  event_name: string;
  from_state?: string;
  to_state?: string;
  step_id?: string;
  step_name?: string;
  event_data: Record<string, unknown>;
  actor_type: ActorType;
  actor_id?: string;
  actor_name?: string;
  duration_ms?: number;
  source?: string;
  source_ip?: string;
  is_error: boolean;
  error_message?: string;
  error_stack?: string;
  created_at: string;
}

// =============================================================================
// Notification Outbox Types
// =============================================================================

export type NotificationType = 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
export type NotificationStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'dead_letter';

export interface NotificationOutbox {
  id: string;
  organization_id: string;
  notification_type: NotificationType;
  idempotency_key?: string;
  recipient_type: 'user' | 'email' | 'phone' | 'api';
  recipient_id?: string;
  recipient_address: string;
  subject?: string;
  body: string;
  html_body?: string;
  template_id?: string;
  template_data: Record<string, unknown>;
  priority: number;
  scheduled_for?: string;
  expires_at?: string;
  status: NotificationStatus;
  attempts: number;
  max_attempts: number;
  last_attempt_at?: string;
  next_attempt_at?: string;
  provider?: string;
  provider_message_id?: string;
  provider_response?: Record<string, unknown>;
  error_code?: string;
  error_message?: string;
  error_details?: Record<string, unknown>;
  dead_letter_reason?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  metadata: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
}

// =============================================================================
// Service Interfaces
// =============================================================================

export interface OperationsService {
  // Organization
  getOrganization(slug: string): Promise<Organization | null>;
  getOrganizationById(id: string): Promise<Organization | null>;
  updateOrganization(id: string, data: OrganizationUpdate): Promise<Organization>;
  
  // Program Registry
  getProgram(slug: string): Promise<ProgramRegistry | null>;
  getPrograms(filters?: { category?: string; isPublished?: boolean }): Promise<ProgramRegistry[]>;
  getActiveFundingForProgram(programId: string): Promise<FundingRule[]>;
  validateProgramForEnrollment(programId: string): Promise<{ valid: boolean; errors: string[] }>;
  
  // Verified Claims
  getActiveClaims(location?: string): Promise<ClaimDisplay[]>;
  isClaimValid(claimKey: string): Promise<boolean>;
  getClaimStatus(claimKey: string): Promise<VerifiedClaim | null>;
  
  // Workflows
  getWorkflow(entityType: string, entityId: string): Promise<WorkflowInstance | null>;
  createWorkflow(data: Partial<WorkflowInstance>): Promise<WorkflowInstance>;
  advanceWorkflow(workflowId: string, newState: string, context?: Record<string, unknown>): Promise<WorkflowInstance>;
  
  // Notifications
  queueNotification(data: Partial<NotificationOutbox>): Promise<NotificationOutbox>;
  getPendingNotifications(limit?: number): Promise<NotificationOutbox[]>;
  markNotificationSent(id: string, providerMessageId?: string): Promise<void>;
  markNotificationFailed(id: string, error: string): Promise<void>;
  markNotificationDeadLetter(id: string, reason: string): Promise<void>;
}

// Factory function type
export type OperationsServiceFactory = (supabase: SupabaseClient) => OperationsService;
