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
};
type Shop = { id: string; name?: string | null };
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
    records.set(makeKey(placement.student_id, shop.id, placement.program_slug), {
      id, reference: `EFH-HS-${placement.id.toUpperCase()}`,
      studentName: placement.name, studentId: placement.student_id,
      shopId: shop.id, shopName: shop.name || 'Assigned host site',
      program: programLabel(placement.program_slug),
      title: enrollment ? 'Certificate of Enrollment' : 'Certificate of Host-Site Assignment',
      status: enrollment ? 'enrolled' : 'assigned',
      recordDate: enrollment?.enrollment_confirmed_at || enrollment?.enrolled_at || placement.start_date || null,
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
    records.set(key, {
      id: `application-${application.id}`, reference: `EFH-APP-${application.id.toUpperCase()}`,
      studentName: name, studentId: application.user_id, shopId: shop.id,
      shopName: shop.name || 'Assigned host site', program: programLabel(program),
      title: 'Certificate of Application', status: 'application',
      recordDate: application.submitted_at || application.created_at,
    });
  }
  return [...records.values()].sort((a, b) => a.studentName.localeCompare(b.studentName));
}
