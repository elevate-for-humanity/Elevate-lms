/**
 * Application type routing config.
 *
 * Each entry defines:
 *  - destination: the workflow table to insert into during processing
 *  - required: fields the client MUST provide (400 if missing)
 *  - allowed: full allowlist of client-writable fields (extras are stripped)
 *  - defaults: server-set values merged at insert time
 *  - hasJsonbPayload: if true, allowed fields are stuffed into a single
 *    JSONB column (e.g. employer_applications.intake)
 *  - jsonbColumn: name of the JSONB column (when hasJsonbPayload is true)
 */

export interface ApplicationTypeConfig {
  destination: string;
  required: string[];
  allowed: string[];
  defaults: Record<string, string | boolean | null>;
  hasJsonbPayload?: boolean;
  jsonbColumn?: string;
}

export const APPLICATION_TYPES: Record<string, ApplicationTypeConfig> = {
  // ── General-purpose application ──────────────────────────────
  application: {
    destination: 'applications',
    required: ['email', 'program'],
    allowed: [
      'name', 'email', 'phone', 'program', 'funding',
      'eligible', 'notes',
    ],
    defaults: {
      status: 'submitted',
      source: 'public_form',
    },
  },

  // ── Career / workforce application (uses state-machine RPCs) ─
  career: {
    destination: 'career_applications',
    required: ['first_name', 'last_name', 'email', 'phone'],
    allowed: [
      'first_name', 'last_name', 'email', 'phone',
      'position', 'date_of_birth',
      'address', 'city', 'state', 'zip_code',
      'high_school', 'graduation_year', 'gpa', 'college', 'major',
      'program_id', 'funding_type',
      'employment_status', 'current_employer', 'years_experience',
    ],
    defaults: {
      status: 'draft',
      application_state: 'started',
    },
  },

  // ── Student application ──────────────────────────────────────
  student: {
    destination: 'student_applications',
    required: ['full_name', 'email'],
    allowed: [
      'full_name', 'email', 'phone', 'program_id',
      'funding_type', 'notes', 'data',
    ],
    defaults: {
      status: 'submitted',
      source: 'public_form',
    },
  },

  // ── Employer / hiring partner ────────────────────────────────
  employer: {
    destination: 'employer_applications',
    required: ['company_name', 'contact_name', 'email'],
    allowed: [
      'company_name', 'contact_name', 'email', 'phone',
      'industry', 'employee_count', 'hiring_needs', 'notes',
    ],
    defaults: {
      status: 'submitted',
      source: 'public_form',
    },
  },

  // ── Staff application ────────────────────────────────────────
  staff: {
    destination: 'staff_applications',
    required: ['full_name', 'email'],
    allowed: [
      'full_name', 'email', 'phone', 'position',
      'resume_url', 'cover_letter', 'notes',
    ],
    defaults: {
      status: 'submitted',
      source: 'public_form',
    },
  },

  // ── Partner (barbershop / training site) ─────────────────────
  partner: {
    destination: 'partner_applications',
    required: ['shop_name', 'owner_name', 'contact_email', 'phone', 'address_line1', 'city', 'state', 'zip'],
    allowed: [
      'shop_name', 'owner_name', 'contact_email', 'phone',
      'address_line1', 'address_line2', 'city', 'state', 'zip',
      'website', 'notes',
    ],
    defaults: {
      status: 'submitted',
    },
  },

  // ── Barbershop partner (detailed) ────────────────────────────
  barbershop_partner: {
    destination: 'barbershop_partner_applications',
    required: [
      'shop_legal_name', 'owner_name', 'contact_name', 'contact_email',
      'contact_phone', 'shop_address_line1', 'shop_city', 'shop_zip',
      'indiana_shop_license_number', 'supervisor_name',
      'supervisor_license_number', 'employment_model',
    ],
    allowed: [
      'shop_legal_name', 'owner_name', 'contact_name', 'contact_email',
      'contact_phone', 'shop_address_line1', 'shop_address_line2',
      'shop_city', 'shop_state', 'shop_zip',
      'indiana_shop_license_number', 'supervisor_name',
      'supervisor_license_number', 'employment_model',
      'stations_available', 'notes',
    ],
    defaults: {
      status: 'submitted',
    },
  },

  // ── Program holder ───────────────────────────────────────────
  program_holder: {
    destination: 'program_holder_applications',
    required: ['organization_name', 'contact_name', 'email'],
    allowed: [
      'organization_name', 'contact_name', 'email', 'phone',
      'website', 'program_types', 'notes',
    ],
    defaults: {
      status: 'submitted',
      source: 'public_form',
    },
  },

  // ── Shop application ────────────────────────────────────────
  shop: {
    destination: 'shop_applications',
    required: ['shop_name', 'owner_name', 'email', 'phone', 'address', 'city', 'zip'],
    allowed: [
      'shop_name', 'owner_name', 'email', 'phone',
      'address', 'city', 'state', 'zip',
      'website', 'notes',
    ],
    defaults: {
      status: 'submitted',
    },
  },

  // ── Affiliate ────────────────────────────────────────────────
  affiliate: {
    destination: 'affiliate_applications',
    required: ['email', 'full_name'],
    allowed: [
      'email', 'full_name', 'phone', 'website',
      'social_media', 'audience_size', 'notes',
    ],
    defaults: {
      status: 'submitted',
    },
  },

  // ── Funding application ──────────────────────────────────────
  funding: {
    destination: 'funding_applications',
    required: ['email', 'full_name', 'program_type'],
    allowed: [
      'email', 'full_name', 'phone', 'program_type',
      'funding_source', 'notes',
    ],
    defaults: {
      status: 'submitted',
    },
  },

  // ── Job application ──────────────────────────────────────────
  job: {
    destination: 'job_applications',
    required: ['email', 'full_name'],
    allowed: [
      'email', 'full_name', 'phone', 'position',
      'resume_url', 'cover_letter', 'notes',
    ],
    defaults: {
      status: 'submitted',
    },
  },

  // ── SupersonicFastCash (tax prep) ────────────────────────────
  supersonic: {
    destination: 'supersonic_applications',
    required: ['first_name', 'last_name', 'email', 'phone'],
    allowed: [
      'first_name', 'last_name', 'email', 'phone',
      'service_type', 'tax_year', 'notes',
    ],
    defaults: {
      status: 'submitted',
    },
  },

  // ── Tax application ──────────────────────────────────────────
  tax: {
    destination: 'tax_applications',
    required: ['email', 'full_name'],
    allowed: [
      'email', 'full_name', 'phone', 'tax_year',
      'service_type', 'filing_status', 'notes',
    ],
    defaults: {
      status: 'submitted',
    },
  },

  // ── Generic submission (JSONB payload) ───────────────────────
  submission: {
    destination: 'application_submissions',
    required: ['program_id'],
    allowed: [
      'program_id', 'data', 'notes',
    ],
    defaults: {
      status: 'submitted',
    },
    hasJsonbPayload: true,
    jsonbColumn: 'data',
  },
};

/** All valid application_type values */
export const VALID_TYPES = Object.keys(APPLICATION_TYPES);
