import { describe, expect, it } from 'vitest';
import { buildVendorDashboard, safeVendorUrl } from '../../lib/partners/vendor-dashboard';

const provider = {
  id: 'vendor',
  provider_name: 'Vendor',
  provider_type: 'external_lms',
  active: true,
};
const program = {
  id: 'program',
  slug: 'hvac-technician',
  title: 'HVAC',
  is_active: true,
  published: true,
};
const empty = {
  providers: [provider],
  programs: [program],
  links: [],
  catalog: [],
  importedCourses: [],
  courseMappings: [],
};

describe('vendor readiness evidence', () => {
  it('does not treat an enabled vendor or catalog listing as verified access', () => {
    const [vendor] = buildVendorDashboard({
      ...empty,
      catalog: [{ id: 'c', provider_id: 'vendor', course_name: 'Course', is_active: true }],
    });
    expect(vendor.enabled).toBe(true);
    expect(vendor.accountConfirmed).toBe(false);
    expect(vendor.coursesConfirmed).toBe(false);
    expect(vendor.needsReview).toBe(true);
  });
  it('excludes a retired organization even when legacy program associations remain', () => {
    expect(
      buildVendorDashboard({
        ...empty,
        providers: [{ ...provider, metadata: { retired: true } }],
        links: [
          {
            id: 'l',
            program_id: 'program',
            provider_id: 'vendor',
            is_required: false,
            auto_enroll_on_program_start: false,
          },
        ],
      }),
    ).toEqual([]);
  });
  it('groups duplicate vendor records and exposes disabled program references', () => {
    const [vendor] = buildVendorDashboard({
      ...empty,
      providers: [provider, { ...provider, id: 'old', active: false }],
      links: [
        {
          id: 'l',
          program_id: 'program',
          provider_id: 'old',
          is_required: true,
          auto_enroll_on_program_start: false,
        },
      ],
    });
    expect(vendor.recordCount).toBe(2);
    expect(vendor.id).toBe('vendor');
    expect(vendor.warnings).toContain('A program still points to a disabled vendor record.');
    expect(vendor.programs).toHaveLength(1);
  });
  it('counts active imported course mappings without including archived programs', () => {
    const [vendor] = buildVendorDashboard({
      ...empty,
      programs: [program, { ...program, id: 'old', archived_at: '2026-01-01' }],
      importedCourses: [
        { id: 'c', provider_id: 'vendor', course_name: 'EPA 608', is_active: true },
      ],
      courseMappings: [
        { partner_course_id: 'c', internal_program_id: 'program', active: true },
        { partner_course_id: 'c', internal_program_id: 'old', active: true },
      ],
    });
    expect(vendor.programs.map((p) => p.id)).toEqual(['program']);
    expect(vendor.programs[0].importedCourseCount).toBe(1);
  });
  it('uses explicit account evidence without inferring a purchase grants every course', () => {
    const [vendor] = buildVendorDashboard({
      ...empty,
      providers: [
        {
          ...provider,
          metadata: {
            secret: 'never-render',
            vendor_setup: {
              account_status: 'confirmed',
              course_status: 'purchases_documented',
              evidence: [{ label: 'Unsafe', url: 'javascript:alert(1)' }],
            },
          },
        },
      ],
    });
    expect(vendor.accountConfirmed).toBe(true);
    expect(vendor.coursesConfirmed).toBe(false);
    expect(vendor.evidence).toEqual([]);
    expect(JSON.stringify(vendor)).not.toContain('never-render');
  });
  it('rejects script and embedded-credential destinations', () => {
    expect(safeVendorUrl('https://user:password@example.com')).toBeNull();
    expect(safeVendorUrl('javascript:alert(1)')).toBeNull();
    expect(safeVendorUrl('https://www.nhanow.com')).toBe('https://www.nhanow.com/');
  });
  it('keeps prepared course shells separate from licenses and sanitizes contract links', () => {
    const [vendor] = buildVendorDashboard({
      ...empty,
      providers: [
        {
          ...provider,
          metadata: {
            vendor_setup: {
              account_status: 'confirmed',
              contract_status: 'Executed copy needed',
              contract_source_url: 'javascript:alert(1)',
              prepared_courses: [
                {
                  name: 'CCMA',
                  url: 'https://nhacertportal.nhanow.com/courses/manage/142047/details',
                },
                { name: 'Unsafe', url: 'https://user:secret@example.com' },
              ],
            },
          },
        },
      ],
    });
    expect(vendor.preparedCourses).toHaveLength(1);
    expect(vendor.contractStatus).toBe('Executed copy needed');
    expect(vendor.contractSource).toBeNull();
    expect(vendor.coursesConfirmed).toBe(false);
    expect(JSON.stringify(vendor)).not.toContain('secret');
  });
});
