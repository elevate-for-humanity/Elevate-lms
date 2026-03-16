/**
 * Workforce Ledger — Event Payload Schemas
 *
 * Each schema validates the `payload` field of a specific event type.
 * Payloads are validated independently from the envelope so that:
 *   1. The envelope validator does not need to know about payload shape.
 *   2. Each builder can validate its payload before assembling the envelope.
 *   3. Tests can assert payload validity without constructing a full envelope.
 *
 * Import enums from commands.ts — do not redefine them here.
 */

import { z } from 'zod';
import {
  IntakeSourceSchema,
  VerificationLevelSchema,
  IdTypeSchema,
  FundingSourceSchema,
  CorrectionReasonSchema,
  CorrectableEnrollmentFieldSchema,
} from './commands';

// ─── ParticipantCreated ───────────────────────────────────────────────────────

/**
 * Minimal payload for participant creation.
 * Keeps PII out of the creation event — attributes are recorded separately
 * via ProfileAttributesRecorded so each attribute change is independently auditable.
 */
export const ParticipantCreatedPayloadSchema = z.object({
  intake_source: IntakeSourceSchema,
  initial_verification_level: VerificationLevelSchema,
});
export type ParticipantCreatedPayload = z.infer<typeof ParticipantCreatedPayloadSchema>;

// ─── ProfileAttributesRecorded ────────────────────────────────────────────────

/**
 * Structured attribute payload.
 * Fields are separated by domain (legal_name, postal_code, demographics)
 * so projections can update only the changed slice without re-parsing
 * a monolithic blob.
 *
 * All fields are optional at the payload level — the command validator
 * ensures at least one is present before this payload is built.
 */
export const LegalNameSchema = z.object({
  first: z.string().min(1).max(100),
  middle: z.string().max(100).optional(),
  last: z.string().min(1).max(100),
  suffix: z.string().max(20).optional(),
});
export type LegalName = z.infer<typeof LegalNameSchema>;

export const DemographicsSchema = z.object({
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  race: z.array(z.enum([
    'american_indian_alaska_native',
    'asian',
    'black_african_american',
    'native_hawaiian_pacific_islander',
    'white',
    'other',
    'prefer_not_to_say',
  ])).optional(),
  ethnicity: z.enum(['hispanic_latino', 'not_hispanic_latino', 'prefer_not_to_say']).optional(),
  veteran_status: z.boolean().optional(),
  disability_status: z.boolean().optional(),
  english_language_learner: z.boolean().optional(),
});
export type Demographics = z.infer<typeof DemographicsSchema>;

export const ProfileAttributesRecordedPayloadSchema = z.object({
  legal_name: LegalNameSchema.optional(),
  postal_code: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
  date_of_birth: z.string().date().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  email: z.string().email().optional(),
  demographics: DemographicsSchema.optional(),
}).refine(
  (payload) => Object.values(payload).some((v) => v !== undefined),
  { message: 'ProfileAttributesRecorded payload must contain at least one attribute' },
);
export type ProfileAttributesRecordedPayload = z.infer<typeof ProfileAttributesRecordedPayloadSchema>;

// ─── IdentityLinked ───────────────────────────────────────────────────────────

/**
 * Identity document linkage payload.
 *
 * id_value_hashed: SHA-256 hex digest of the raw identifier.
 * The raw value must never appear in the ledger — the caller hashes before sending.
 *
 * verification_level drives policy-gated enrollment eligibility.
 * Without it, the enrollment guard cannot determine if the participant
 * meets the identity threshold required for a given funding source.
 */
export const IdentityLinkedPayloadSchema = z.object({
  id_type: IdTypeSchema,
  id_value_hashed: z.string().regex(/^[a-f0-9]{64}$/, 'Must be a lowercase SHA-256 hex digest'),
  issuing_authority: z.string().min(1).max(200),
  verification_level: VerificationLevelSchema,
  verified_at: z.string().datetime({ offset: true }).optional(),
});
export type IdentityLinkedPayload = z.infer<typeof IdentityLinkedPayloadSchema>;

// ─── EnrollmentRecorded ───────────────────────────────────────────────────────

/**
 * Enrollment payload.
 *
 * All four program/grant/blueprint fields are required here — not nullable.
 * enrollment_effective_date is the business-effective date of enrollment,
 * which may differ from occurred_at (e.g. backdated cohort entry).
 *
 * This is the payload that funder reporting projections read.
 * Every field here maps to a PIRL data element or grant reporting requirement.
 */
export const EnrollmentRecordedPayloadSchema = z.object({
  program_id: z.string().uuid(),
  grant_id: z.string().uuid(),
  blueprint_id: z.string().uuid(),
  blueprint_version: z.number().int().positive(),
  funding_source_id: FundingSourceSchema,
  enrollment_effective_date: z.string().date(),
});
export type EnrollmentRecordedPayload = z.infer<typeof EnrollmentRecordedPayloadSchema>;

// ─── EnrollmentCorrected ─────────────────────────────────────────────────────

/**
 * Enrollment correction payload.
 *
 * target_event_id: the event_id of the EnrollmentRecorded event being corrected.
 * corrected_fields: partial record of only the fields being changed.
 *   Keyed by CorrectableEnrollmentField — prevents arbitrary patching.
 * reason: controlled vocabulary — prevents free-text noise in audit queries.
 * corrected_by: UUID of the staff member authorizing the correction.
 *
 * The projection layer applies corrections by merging corrected_fields
 * over the original enrollment payload when building the current view.
 */
export const EnrollmentCorrectedPayloadSchema = z.object({
  target_event_id: z.string().uuid(),
  corrected_fields: z.record(CorrectableEnrollmentFieldSchema, z.unknown())
    .refine(
      (fields) => Object.keys(fields).length > 0,
      { message: 'corrected_fields must contain at least one field' },
    ),
  reason: CorrectionReasonSchema,
  corrected_by: z.string().uuid(),
});
export type EnrollmentCorrectedPayload = z.infer<typeof EnrollmentCorrectedPayloadSchema>;

// ─── Payload union (for type narrowing in projections) ────────────────────────

export const WorkforceEventPayloadSchema = z.discriminatedUnion('_event_type', [
  ParticipantCreatedPayloadSchema.extend({ _event_type: z.literal('ParticipantCreated') }),
  ProfileAttributesRecordedPayloadSchema.extend({ _event_type: z.literal('ProfileAttributesRecorded') }),
  IdentityLinkedPayloadSchema.extend({ _event_type: z.literal('IdentityLinked') }),
  EnrollmentRecordedPayloadSchema.extend({ _event_type: z.literal('EnrollmentRecorded') }),
  EnrollmentCorrectedPayloadSchema.extend({ _event_type: z.literal('EnrollmentCorrected') }),
]);
export type WorkforceEventPayload = z.infer<typeof WorkforceEventPayloadSchema>;
