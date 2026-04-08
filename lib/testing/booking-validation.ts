/**
 * Booking input validation — enforced at the API boundary.
 *
 * Dates and times are validated and normalized here, before they reach
 * any formatting, email, or DB layer. Empty strings are rejected, not
 * passed through to crash downstream.
 *
 * Design rule: if a field is optional (e.g. preferredDate when using Calendly),
 * it must be explicitly marked optional here and normalized to null — never
 * allowed to propagate as "".
 */

export interface BookingInput {
  examType: string;
  examName: string;
  bookingType: 'individual' | 'organization';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  participantCount?: number | null;
  /** ISO date string YYYY-MM-DD. Optional when scheduling via Calendly. */
  preferredDate?: string | null;
  preferredTime?: string | null;
  alternateDate?: string | null;
  notes?: string | null;
  addOn?: boolean;
  slotId?: string | null;
  paymentStatus?: string | null;
  stripeSessionId?: string | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  /** Normalized input — safe to pass to DB and email layers. */
  data: BookingInput;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeDate(raw: unknown): string | null {
  if (!raw || typeof raw !== 'string' || raw.trim() === '') return null;
  const trimmed = raw.trim();
  if (!ISO_DATE_RE.test(trimmed)) return null;
  // Validate it's an actual calendar date
  const d = new Date(trimmed + 'T12:00:00');
  if (isNaN(d.getTime())) return null;
  return trimmed;
}

function normalizeString(raw: unknown): string | null {
  if (!raw || typeof raw !== 'string' || raw.trim() === '') return null;
  return raw.trim();
}

/**
 * Validates and normalizes a raw booking request body.
 *
 * Returns { valid: false, errors } if required fields are missing or malformed.
 * Returns { valid: true, data } with all optional fields normalized to null (never "").
 */
export function validateBookingInput(body: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  const examType    = normalizeString(body.examType);
  const examName    = normalizeString(body.examName);
  const firstName   = normalizeString(body.firstName);
  const lastName    = normalizeString(body.lastName);
  const email       = normalizeString(body.email);
  const bookingType = body.bookingType === 'organization' ? 'organization' : 'individual';

  if (!examType)  errors.push({ field: 'examType',  message: 'Required' });
  if (!examName)  errors.push({ field: 'examName',  message: 'Required' });
  if (!firstName) errors.push({ field: 'firstName', message: 'Required' });
  if (!lastName)  errors.push({ field: 'lastName',  message: 'Required' });
  if (!email)     errors.push({ field: 'email',     message: 'Required' });
  if (email && !EMAIL_RE.test(email)) {
    errors.push({ field: 'email', message: 'Invalid email address' });
  }

  // Organization bookings require org name
  if (bookingType === 'organization' && !normalizeString(body.organization)) {
    errors.push({ field: 'organization', message: 'Required for organization bookings' });
  }

  // Optional date fields — normalize "" → null, validate format if present
  const preferredDate = normalizeDate(body.preferredDate);
  const alternateDate = normalizeDate(body.alternateDate);

  // If a date string was provided but failed normalization, it's malformed
  if (body.preferredDate && typeof body.preferredDate === 'string' &&
      body.preferredDate.trim() !== '' && preferredDate === null) {
    errors.push({ field: 'preferredDate', message: 'Invalid date format — use YYYY-MM-DD' });
  }
  if (body.alternateDate && typeof body.alternateDate === 'string' &&
      body.alternateDate.trim() !== '' && alternateDate === null) {
    errors.push({ field: 'alternateDate', message: 'Invalid date format — use YYYY-MM-DD' });
  }

  // participantCount must be a positive integer
  let participantCount: number | null = null;
  if (body.participantCount != null) {
    const n = Number(body.participantCount);
    if (!Number.isInteger(n) || n < 1) {
      errors.push({ field: 'participantCount', message: 'Must be a positive integer' });
    } else {
      participantCount = n;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, data: {} as BookingInput };
  }

  return {
    valid: true,
    errors: [],
    data: {
      examType:         examType!,
      examName:         examName!,
      bookingType,
      firstName:        firstName!,
      lastName:         lastName!,
      email:            email!,
      phone:            normalizeString(body.phone),
      organization:     normalizeString(body.organization),
      participantCount: participantCount ?? 1,
      preferredDate,
      preferredTime:    normalizeString(body.preferredTime),
      alternateDate,
      notes:            normalizeString(body.notes),
      addOn:            body.addOn === true,
      slotId:           normalizeString(body.slotId),
      paymentStatus:    normalizeString(body.paymentStatus),
      stripeSessionId:  normalizeString(body.stripeSessionId),
    },
  };
}

/**
 * Formats a normalized date string for display in emails and UI.
 * Input must be YYYY-MM-DD or null (from validateBookingInput).
 * Never receives raw user input — that's already been validated.
 */
export function formatBookingDate(date: string | null | undefined): string {
  if (!date) return 'To be scheduled via Calendly';
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}
