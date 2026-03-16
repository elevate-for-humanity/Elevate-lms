/**
 * Workforce Ledger — Command Schemas
 *
 * Commands represent intent. They are validated before any handler runs.
 * A valid command does not guarantee a valid event — the handler is
 * responsible for producing a well-formed event from a valid command.
 *
 * Enums are defined here because commands and payloads share them.
 * Import enums from this file; do not redefine them in payloads.
 */

import { z } from 'zod';

// ─── Shared Enums ────────────────────────────────────────────────────────────

/**
 * Controlled vocabulary for all event types in the ledger.
 * Adding a new event type requires adding it here first.
 */
export const EventTypeSchema = z.enum([
  'ParticipantCreated',
  'ProfileAttributesRecorded',
  'IdentityLinked',
  'EnrollmentRecorded',
  'EnrollmentCorrected',
]);
export type EventType = z.infer<typeof EventTypeSchema>;

/**
 * How the participant's identity was verified.
 * Drives policy-gated enrollment eligibility checks.
 */
export const VerificationLevelSchema = z.enum([
  'unverified',    // Self-reported only, no document check
  'self_attested', // Participant signed attestation
  'document',      // Staff reviewed a physical or digital document
  'authoritative', // Verified against an authoritative external source (e.g. SSA, DMV)
]);
export type VerificationLevel = z.infer<typeof VerificationLevelSchema>;

/**
 * Accepted government-issued or program identity document types.
 */
export const IdTypeSchema = z.enum([
  'ssn',
  'itin',
  'state_id',
  'drivers_license',
  'passport',
  'military_id',
  'tribal_id',
  'birth_certificate',
  'ead',              // Employment Authorization Document
  'other',
]);
export type IdType = z.infer<typeof IdTypeSchema>;

/**
 * Funding sources that can be attached to an enrollment.
 * Matches the existing fundingSource enum in lib/validation/schemas.ts.
 */
export const FundingSourceSchema = z.enum([
  'WIOA_ADULT',
  'WIOA_DW',       // Dislocated Worker
  'WIOA_YOUTH',
  'WRG',           // Workforce Ready Grant (Indiana)
  'JRI',           // Justice Reinvestment Initiative
  'WEX',           // Work Experience
  'TANF',
  'SNAP_ET',       // SNAP Employment & Training
  'SELF_PAY',
  'EMPLOYER_SPONSORED',
  'SCHOLARSHIP',
  'OTHER',
]);
export type FundingSource = z.infer<typeof FundingSourceSchema>;

/**
 * How the participant entered the system.
 * Used for intake provenance on ParticipantCreated.
 */
export const IntakeSourceSchema = z.enum([
  'online_application',
  'staff_entry',
  'partner_referral',
  'workforce_board_referral',
  'jri_referral',
  'walk_in',
  'import',         // Bulk data migration
]);
export type IntakeSource = z.infer<typeof IntakeSourceSchema>;

/**
 * Allowed fields that EnrollmentCorrected can patch.
 * Explicit list prevents EnrollmentCorrected from becoming a generic patch endpoint.
 */
export const CorrectableEnrollmentFieldSchema = z.enum([
  'program_id',
  'grant_id',
  'blueprint_id',
  'blueprint_version',
  'funding_source_id',
  'enrollment_effective_date',
  'exit_date',
  'exit_reason',
  'status',
]);
export type CorrectableEnrollmentField = z.infer<typeof CorrectableEnrollmentFieldSchema>;

/**
 * Reason codes for EnrollmentCorrected.
 * Prevents free-text reasons from becoming unqueryable noise.
 */
export const CorrectionReasonSchema = z.enum([
  'data_entry_error',
  'funding_source_change',
  'program_transfer',
  'date_correction',
  'status_correction',
  'duplicate_resolution',
  'administrative_adjustment',
]);
export type CorrectionReason = z.infer<typeof CorrectionReasonSchema>;

// ─── Command Schemas ─────────────────────────────────────────────────────────

/**
 * CreateParticipantCommand
 *
 * Opens a new participant record in the ledger.
 * participant_uid is assigned by the caller (UUID v4) so it can be
 * referenced in subsequent commands within the same transaction.
 */
export const CreateParticipantCommandSchema = z.object({
  command_type: z.literal('CreateParticipant'),
  participant_uid: z.string().uuid(),
  intake_source: IntakeSourceSchema,
  initial_verification_level: VerificationLevelSchema,
  authority_id: z.string().uuid({ message: 'authority_id must be the UUID of the staff member or system creating this record' }),
  correlation_id: z.string().uuid(),
  occurred_at: z.string().datetime({ offset: true }),
});
export type CreateParticipantCommand = z.infer<typeof CreateParticipantCommandSchema>;

/**
 * RecordAttributesCommand
 *
 * Records or updates profile attributes for an existing participant.
 * All attribute fields are optional — only changed fields need to be sent.
 * The handler must produce a payload containing only the fields present in the command.
 */
export const RecordAttributesCommandSchema = z.object({
  command_type: z.literal('RecordAttributes'),
  participant_uid: z.string().uuid(),
  authority_id: z.string().uuid(),
  causation_id: z.string().uuid().optional(),
  correlation_id: z.string().uuid(),
  occurred_at: z.string().datetime({ offset: true }),
  attributes: z.object({
    legal_name: z.object({
      first: z.string().min(1).max(100),
      middle: z.string().max(100).optional(),
      last: z.string().min(1).max(100),
      suffix: z.string().max(20).optional(),
    }).optional(),
    postal_code: z.string().regex(/^\d{5}(-\d{4})?$/, 'Must be a valid US ZIP code').optional(),
    date_of_birth: z.string().date().optional(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    email: z.string().email().optional(),
    demographics: z.object({
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
    }).optional(),
  }).refine(
    (attrs) => Object.keys(attrs).length > 0,
    { message: 'RecordAttributes command must include at least one attribute' },
  ),
});
export type RecordAttributesCommand = z.infer<typeof RecordAttributesCommandSchema>;

/**
 * LinkIdentityCommand
 *
 * Associates a government-issued or program identity document with a participant.
 * id_value_hashed must be a SHA-256 hex digest of the raw identifier.
 * The raw value must never appear in the ledger.
 */
export const LinkIdentityCommandSchema = z.object({
  command_type: z.literal('LinkIdentity'),
  participant_uid: z.string().uuid(),
  authority_id: z.string().uuid(),
  causation_id: z.string().uuid().optional(),
  correlation_id: z.string().uuid(),
  occurred_at: z.string().datetime({ offset: true }),
  id_type: IdTypeSchema,
  id_value_hashed: z.string().regex(/^[a-f0-9]{64}$/, 'Must be a lowercase SHA-256 hex digest'),
  issuing_authority: z.string().min(1).max(200),
  verification_level: VerificationLevelSchema,
  verified_at: z.string().datetime({ offset: true }).optional(),
});
export type LinkIdentityCommand = z.infer<typeof LinkIdentityCommandSchema>;

/**
 * RecordEnrollmentCommand
 *
 * Records a participant's enrollment in a funded program.
 * program_id, grant_id, blueprint_id, and blueprint_version are required
 * at the command level — not nullable — because enrollment without these
 * fields cannot be reported to funders.
 */
export const RecordEnrollmentCommandSchema = z.object({
  command_type: z.literal('RecordEnrollment'),
  participant_uid: z.string().uuid(),
  authority_id: z.string().uuid(),
  causation_id: z.string().uuid().optional(),
  correlation_id: z.string().uuid(),
  occurred_at: z.string().datetime({ offset: true }),
  program_id: z.string().uuid(),
  grant_id: z.string().uuid(),
  blueprint_id: z.string().uuid(),
  blueprint_version: z.number().int().positive(),
  funding_source_id: FundingSourceSchema,
  // Business-effective date — not always the same as occurred_at.
  // Example: a staff member records an enrollment on Monday for a cohort that started Friday.
  enrollment_effective_date: z.string().date(),
});
export type RecordEnrollmentCommand = z.infer<typeof RecordEnrollmentCommandSchema>;

/**
 * CorrectEnrollmentCommand
 *
 * Appends a correction event to the ledger for a previously recorded enrollment.
 * Does not mutate the original event. The projection layer applies corrections
 * when building the current enrollment view.
 *
 * corrected_fields is a partial record of only the fields being changed,
 * keyed by CorrectableEnrollmentField. This prevents arbitrary patching.
 */
export const CorrectEnrollmentCommandSchema = z.object({
  command_type: z.literal('CorrectEnrollment'),
  participant_uid: z.string().uuid(),
  authority_id: z.string().uuid(),
  causation_id: z.string().uuid(),  // Required — must reference the enrollment event being corrected
  correlation_id: z.string().uuid(),
  occurred_at: z.string().datetime({ offset: true }),
  target_event_id: z.string().uuid({ message: 'target_event_id must be the event_id of the EnrollmentRecorded event being corrected' }),
  corrected_fields: z.record(CorrectableEnrollmentFieldSchema, z.unknown())
    .refine(
      (fields) => Object.keys(fields).length > 0,
      { message: 'corrected_fields must contain at least one field' },
    ),
  reason: CorrectionReasonSchema,
  corrected_by: z.string().uuid({ message: 'corrected_by must be the UUID of the staff member authorizing the correction' }),
});
export type CorrectEnrollmentCommand = z.infer<typeof CorrectEnrollmentCommandSchema>;

// ─── Union ───────────────────────────────────────────────────────────────────

export const WorkforceCommandSchema = z.discriminatedUnion('command_type', [
  CreateParticipantCommandSchema,
  RecordAttributesCommandSchema,
  LinkIdentityCommandSchema,
  RecordEnrollmentCommandSchema,
  CorrectEnrollmentCommandSchema,
]);
export type WorkforceCommand = z.infer<typeof WorkforceCommandSchema>;
