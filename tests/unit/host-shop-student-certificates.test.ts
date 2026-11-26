import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { writeFileSync } from 'node:fs';
import { buildHostStudentCertificates, enrollmentCertificationContinuation, type CertificateApplication, type CertificateEnrollment, type HostStudentCertificate } from '@/lib/certificates/host-shop-student-records';
import { hostStudentCertificatePdf } from '@/lib/certificates/host-shop-student-pdf';

const shops = [{ id: 'shop-a', name: 'Elevate Host Site' }];
const placement = { id: 'p1', student_id: 'student-a', shop_id: 'shop-a', name: 'Alex Example', program_slug: 'barber-apprenticeship', start_date: '2026-09-08' };
const enrollment: CertificateEnrollment = { user_id: 'student-a', student_id: null, program_slug: 'barber-apprenticeship', status: 'active', enrolled_at: '2026-09-08', enrollment_confirmed_at: null, revoked_at: null };
const application: CertificateApplication = { id: 'a1', assigned_shop_id: 'shop-a', user_id: 'student-a', full_name: 'Alex Example', first_name: null, last_name: null, email: 'alex@example.test', program_slug: 'barber-apprenticeship', program_interest: null, status: 'submitted', submitted_at: '2026-09-01', created_at: '2026-09-01' };

describe('Host Shop student certificates', () => {
  it('automatically covers existing placements and identifies actual enrollment without awarding completion', () => {
    const [record] = buildHostStudentCertificates(shops, [placement], [], [enrollment]);
    expect(record.title).toBe('Certificate of Enrollment');
    expect(record.reference).toBe('EFH-HS-P1');
    expect(record.title).not.toMatch(/completion/i);
  });
  it.each([
    { ...enrollment, revoked_at: '2026-10-01' },
    { ...enrollment, user_id: 'another-student' },
    { ...enrollment, program_slug: 'cosmetology-apprenticeship' },
    { ...enrollment, status: 'pending' },
  ])('never infers enrollment from unrelated, pending or revoked records', row => {
    expect(buildHostStudentCertificates(shops, [placement], [], [row])[0].status).toBe('assigned');
  });
  it('includes a newly assigned application without falsely confirming enrollment', () => {
    const records = buildHostStudentCertificates(shops, [], [application], [enrollment]);
    expect(records).toHaveLength(1);
    expect(records[0].title).toBe('Certificate of Application');
  });
  it('does not duplicate an application once the same student has a placement', () => {
    expect(buildHostStudentCertificates(shops, [placement], [application], [enrollment])).toHaveLength(1);
  });
  it('excludes other shops, withdrawn applications, drafts and unassigned applicants', () => {
    const applications = [{ ...application, assigned_shop_id: 'shop-b' }, { ...application, assigned_shop_id: null }, { ...application, status: 'withdrawn' }, { ...application, status: 'draft' }];
    expect(buildHostStudentCertificates(shops, [{ ...placement, shop_id: 'shop-b' }], applications, [])).toEqual([]);
  });
  it('builds the full certification statement from record data', () => {
    const record: HostStudentCertificate = {
      id: 'placement-p1', reference: 'EFH-HS-P1', studentName: 'Alex Example', studentId: 'student-a',
      shopId: 'shop-a', shopName: 'Executive Cuts', program: 'Barber Apprenticeship',
      title: 'Certificate of Enrollment', status: 'enrolled', recordDate: '2026-09-08',
      programHours: 2000, shopCity: 'Lafayette', shopState: 'IN',
    };
    expect(enrollmentCertificationContinuation(record)).toBe(
      'is enrolled as a Barber Apprentice in the Barber Apprenticeship Program at Elevate for Humanity Career & Technical Institute — a 2,000-hour Registered Apprenticeship sponsored by 2Exclusive LLC-S d/b/a Elevate for Humanity — and is receiving hands-on training at Executive Cuts in Lafayette, Indiana.');
  });
  it('derives the apprentice role and shop place on built records', () => {
    const [record] = buildHostStudentCertificates([{ id: 'shop-a', name: 'Elevate Host Site', city: 'Lafayette', state: 'IN' }], [placement], [], [enrollment]);
    expect(record.roleLabel).toBe('Barber Apprentice');
    expect(record.shopCity).toBe('Lafayette');
    expect(record.shopState).toBe('IN');
    expect(enrollmentCertificationContinuation(record)).toContain('hands-on training at Elevate Host Site in Lafayette, Indiana.');
  });
  it('omits statement segments whose data is absent instead of printing placeholders', () => {
    const record: HostStudentCertificate = {
      id: 'placement-p1', reference: 'EFH-HS-P1', studentName: 'Alex Example', studentId: 'student-a',
      shopId: 'shop-a', shopName: 'Elevate Host Site', program: 'Barber Apprenticeship',
      title: 'Certificate of Enrollment', status: 'enrolled', recordDate: '2026-09-08',
    };
    const text = enrollmentCertificationContinuation(record);
    expect(text).not.toMatch(/-hour/);
    expect(text).toContain('a Registered Apprenticeship sponsored by 2Exclusive LLC-S d/b/a Elevate for Humanity');
    expect(text).toMatch(/hands-on training at Elevate Host Site\.$/);
  });
  it('renders a single landscape PDF with a stable reference and no completion credential', async () => {
    const [record] = buildHostStudentCertificates(shops, [placement], [], [enrollment]);
    const bytes = await hostStudentCertificatePdf(record);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getSize()).toEqual({ width: 792, height: 612 });
    expect(pdf.getTitle()).toBe('Certificate of Enrollment - Alex Example');
    if (process.env.HOST_CERT_PREVIEW_PATH) writeFileSync(process.env.HOST_CERT_PREVIEW_PATH, bytes);
  });
});
