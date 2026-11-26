import { resolveCanonicalSlug } from '@/lib/programs/slug';

export type HostStudentCertificate = {
  id: string;
  reference: string;
  studentName: string;
  studentId: string | null;
  shopId: string;
  shopName: string;
  program: string;
  title: string;
  status: 'enrolled' | 'assigned' | 'application';
  recordDate: string | null;
  completion?: { startDate: string; completionDate: string };
  /** Learner role for the certification statement, e.g. 'Barber Apprentice'. */
  roleLabel?: string | null;
  /** Program length in hours for the certification statement, e.g. 2000. */
  programHours?: number | null;
  /** Sponsoring legal entity; defaults to CERTIFICATE_SPONSOR_LEGAL_NAME. */
  sponsorLegalName?: string | null;
  shopCity?: string | null;
  shopState?: string | null;
};
type Shop = { id: string; name?: string | null; city?: string | null; state?: string | null };

export const CERTIFICATE_SPONSOR_LEGAL_NAME = '2Exclusive LLC-S';

/** 'Barber Apprenticeship' -> 'Barber Apprentice'; null when the program is not an apprenticeship. */
export function deriveCertificateRoleLabel(program: string): string | null {
  return /Apprenticeship$/i.test(program) ? program.replace(/Apprenticeship$/i, 'Apprentice') : null;
}

const US_STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky',
  LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

/** Expand a USPS state code ('IN') to its full name ('Indiana'); pass other values through. */
export function certificateStateLabel(state: string | null | undefined): string | null {
  const value = (state || '').trim();
  if (!value) return null;
  return US_STATE_NAMES[value.toUpperCase()] || value;
}

/**
 * The certification statement that follows the student's name on an enrollment
 * certificate: 'This certifies that <name> ' + this continuation. Every fact in
 * the sentence comes from the record; segments drop out when their data is
 * absent instead of printing placeholders.
 */
export function enrollmentCertificationContinuation(record: HostStudentCertificate): string {
  const sponsor = record.sponsorLegalName || CERTIFICATE_SPONSOR_LEGAL_NAME;
  const role = record.roleLabel || deriveCertificateRoleLabel(record.program);
  let text = role
    ? `is enrolled as a ${role} in the ${record.program} Program at Elevate for Humanity Career & Technical Institute`
    : `is enrolled in the ${record.program} Program at Elevate for Humanity Career & Technical Institute`;
  if (/Apprenticeship/i.test(record.program)) {
    const hours = record.programHours && record.programHours > 0
      ? `${Math.round(record.programHours).toLocaleString('en-US')}-hour `
      : '';
    text += ` — a ${hours}Registered Apprenticeship sponsored by ${sponsor} d/b/a Elevate for Humanity —`;
  }
  if (record.shopName) {
    const city = (record.shopCity || '').trim();
    const state = certificateStateLabel(record.shopState);
    const place = city && state ? ` in ${city}, ${state}` : city ? ` in ${city}` : state ? ` in ${state}` : '';
    text += ` and is receiving hands-on training at ${record.shopName}${place}.`;
  } else {
    text += '.';
  }
  return text;
}
type Placement = { id: string; student_id: string; shop_id: string; name: string; program_slug: string | null; start_date?: string | null };
export type CertificateApplication = { id: string; assigned_shop_id: string | null; user_id: string | null; full_name: string | null; first_name: string | null; last_name: string | null; email: string | null; program_slug: string | null; program_interest: string | null; status: string | null; submitted_at: string | null; created_at: string | null };
export type CertificateEnrollment = { user_id: string | null; student_id: string | null; program_slug: string | null; status: string | null; enrolled_at: string | null; enrollment_confirmed_at: string | null; revoked_at: string | null };

const enrolledStatuses = new Set(['active', 'enrolled', 'confirmed', 'completed']);
const excludedApplications = new Set(['draft', 'rejected', 'denied', 'withdrawn', 'cancelled', 'canceled', 'revoked']);
const programKey = (value: string | null) => resolveCanonicalSlug(value || '') || value || '';
const programLabel = (value: string | null) => (value || 'Career training').replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

/** Derive certificates from current source records: no completion awards or invented admission dates. */
export function buildHostStudentCertificates(shops: Shop[], placements: Placement[], applications: CertificateApplication[], enrollments: CertificateEnrollment[]): HostStudentCertificate[] {
  const shopMap = new Map(shops.map(shop => [shop.id, shop]));
  const records = new Map<string, HostStudentCertificate>();
  const makeKey = (student: string, shop: string, program: string | null) => JSON.stringify([student, shop, programKey(program)]);
  for (const placement of placements) {
    const shop = shopMap.get(placement.shop_id);
    if (!shop || !placement.student_id) continue;
    const enrollment = enrollments.find(row => (row.user_id || row.student_id) === placement.student_id && programKey(row.program_slug) === programKey(placement.program_slug) && !row.revoked_at && enrolledStatuses.has(row.status || ''));
    const id = `placement-${placement.id}`;
    const program = programLabel(placement.program_slug);
    records.set(makeKey(placement.student_id, shop.id, placement.program_slug), {
      id, reference: `EFH-HS-${placement.id.toUpperCase()}`,
      studentName: placement.name, studentId: placement.student_id,
      shopId: shop.id, shopName: shop.name || 'Assigned host site',
      program,
      title: enrollment ? 'Certificate of Enrollment' : 'Certificate of Host-Site Assignment',
      status: enrollment ? 'enrolled' : 'assigned',
      recordDate: enrollment?.enrollment_confirmed_at || enrollment?.enrolled_at || placement.start_date || null,
      roleLabel: deriveCertificateRoleLabel(program),
      sponsorLegalName: CERTIFICATE_SPONSOR_LEGAL_NAME,
      shopCity: shop.city || null, shopState: shop.state || null,
    });
  }
  for (const application of applications) {
    const shop = application.assigned_shop_id ? shopMap.get(application.assigned_shop_id) : null;
    if (!shop || excludedApplications.has(application.status || 'draft')) continue;
    const program = application.program_slug || application.program_interest;
    const key = makeKey(application.user_id || application.email?.toLowerCase() || application.id, shop.id, program);
    if (records.has(key)) continue;
    const name = application.full_name || [application.first_name, application.last_name].filter(Boolean).join(' ');
    if (!name) continue;
    const applicationProgram = programLabel(program);
    records.set(key, {
      id: `application-${application.id}`, reference: `EFH-APP-${application.id.toUpperCase()}`,
      studentName: name, studentId: application.user_id, shopId: shop.id,
      shopName: shop.name || 'Assigned host site', program: applicationProgram,
      title: 'Certificate of Application', status: 'application',
      recordDate: application.submitted_at || application.created_at,
      roleLabel: deriveCertificateRoleLabel(applicationProgram),
      sponsorLegalName: CERTIFICATE_SPONSOR_LEGAL_NAME,
      shopCity: shop.city || null, shopState: shop.state || null,
    });
  }
  return [...records.values()].sort((a, b) => a.studentName.localeCompare(b.studentName));
}
