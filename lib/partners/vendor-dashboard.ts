export type VendorProvider = {
  id: string;
  provider_name: string;
  provider_type: string;
  active: boolean;
  website_url?: string | null;
  metadata?: unknown;
};
export type VendorProgram = {
  id: string;
  slug: string;
  title: string;
  is_active: boolean;
  published?: boolean | null;
  archived_at?: string | null;
};
export type VendorProgramLink = {
  id: string;
  program_id: string;
  provider_id: string;
  is_required: boolean;
  auto_enroll_on_program_start: boolean;
};
export type VendorCourse = {
  id: string;
  provider_id: string;
  course_name: string;
  is_active: boolean;
};
export type VendorCourseMapping = {
  partner_course_id: string;
  internal_program_id: string | null;
  active: boolean;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
export function safeVendorUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

/** Enabled flags, catalog entries and program associations are not proof of vendor entitlement. */
export function buildVendorDashboard(input: {
  providers: VendorProvider[];
  programs: VendorProgram[];
  links: VendorProgramLink[];
  catalog: VendorCourse[];
  importedCourses: VendorCourse[];
  courseMappings: VendorCourseMapping[];
}) {
  const groups = new Map<string, VendorProvider[]>();
  for (const provider of input.providers) {
    if (record(provider.metadata).retired === true) continue;
    // Types may cover unrelated external LMSs; identify duplicates by organization name.
    const key = provider.provider_name.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) || []), provider]);
  }
  const programs = new Map(
    input.programs.filter((p) => p.is_active && !p.archived_at).map((p) => [p.id, p]),
  );
  return [...groups.values()]
    .map((group) => {
      const ordered = [...group].sort(
        (a, b) =>
          Number(b.active) - Number(a.active) ||
          Number(Boolean(record(record(b.metadata).vendor_setup).checked_at)) -
            Number(Boolean(record(record(a.metadata).vendor_setup).checked_at)) ||
          a.id.localeCompare(b.id),
      );
      const provider = ordered[0];
      const ids = new Set(group.map((p) => p.id));
      const setup = record(record(provider.metadata).vendor_setup);
      const links = input.links.filter((l) => ids.has(l.provider_id) && programs.has(l.program_id));
      const importedCourses = input.importedCourses.filter(
        (c) => ids.has(c.provider_id) && c.is_active,
      );
      const importedIds = new Set(importedCourses.map((c) => c.id));
      const mappings = input.courseMappings.filter(
        (m) =>
          m.active &&
          importedIds.has(m.partner_course_id) &&
          m.internal_program_id &&
          programs.has(m.internal_program_id),
      );
      const mappedIds = new Set(mappings.map((m) => m.internal_program_id!));
      const programIds = new Set([...links.map((l) => l.program_id), ...mappedIds]);
      const linkedPrograms = [...programIds]
        .map((id) => ({
          ...programs.get(id)!,
          required: links.some((l) => l.program_id === id && l.is_required),
          automatic: links.some((l) => l.program_id === id && l.auto_enroll_on_program_start),
          importedCourseCount: new Set(
            mappings.filter((m) => m.internal_program_id === id).map((m) => m.partner_course_id),
          ).size,
        }))
        .sort((a, b) => a.title.localeCompare(b.title));
      const warnings: string[] = [];
      if (!provider.active) warnings.push('Vendor is disabled in Elevate.');
      if (group.filter((p) => p.active).length > 1)
        warnings.push('Multiple enabled records need reconciliation.');
      if (links.some((l) => !group.find((p) => p.id === l.provider_id)?.active)) {
        warnings.push('A program still points to a disabled vendor record.');
      }
      if (setup.account_status !== 'confirmed')
        warnings.push('Vendor account access needs confirmation.');
      if (setup.course_status !== 'confirmed')
        warnings.push('Course licenses or learner access need confirmation.');
      if (!linkedPrograms.length) warnings.push('No active programs are linked.');
      if (importedCourses.some((c) => !mappings.some((m) => m.partner_course_id === c.id))) {
        warnings.push('An imported course has no active program mapping.');
      }
      const evidence = Array.isArray(setup.evidence)
        ? setup.evidence.flatMap((item) => {
            const row = record(item);
            const url = safeVendorUrl(row.url);
            return url && text(row.label) ? [{ label: text(row.label), url }] : [];
          })
        : [];
      const preparedCourses = Array.isArray(setup.prepared_courses)
        ? setup.prepared_courses.flatMap((item) => {
            const course = record(item);
            const url = safeVendorUrl(course.url);
            return url && text(course.name) ? [{ name: text(course.name), url }] : [];
          })
        : [];
      return {
        id: provider.id,
        name: provider.provider_name,
        type: provider.provider_type,
        enabled: provider.active,
        recordCount: group.length,
        accountConfirmed: setup.account_status === 'confirmed',
        coursesConfirmed: setup.course_status === 'confirmed',
        courseStatus:
          setup.course_status === 'purchases_documented'
            ? 'Purchases documented; learner access to verify'
            : setup.course_status === 'confirmed'
              ? 'Course access confirmed'
              : 'Course access needs confirmation',
        delivery: text(setup.delivery_mode) || 'Delivery needs confirmation',
        accountDetail: text(setup.account_detail),
        loginStatus: text(setup.login_status),
        authorizedScope: text(setup.authorized_scope),
        contractStatus: text(setup.contract_status),
        contractSummary: text(setup.contract_summary),
        contractDocument: text(setup.contract_document),
        contractSource: safeVendorUrl(setup.contract_source_url),
        portal: safeVendorUrl(setup.portal_url),
        proctorStatus: text(setup.proctor_status),
        supplementalMaterials: Array.isArray(setup.supplemental_materials)
          ? setup.supplemental_materials.filter((item): item is string => typeof item === 'string')
          : [],
        supplementalPaymentModel: text(setup.supplemental_payment_model),
        preparedCourses,
        checkedAt: text(setup.checked_at),
        nextAction: text(setup.next_action),
        website: safeVendorUrl(provider.website_url),
        logoStatus:
          setup.logo_status === 'approved'
            ? 'Provided / website use approved'
            : setup.logo_status === 'approval_pending'
              ? 'Vendor approval pending'
              : setup.logo_status === 'provided_needs_review'
                ? 'Provided asset needs review'
                : 'Approved asset not yet documented',
        evidence,
        programs: linkedPrograms,
        warnings,
        needsReview: warnings.length > 0,
        catalog: input.catalog.filter((c) => ids.has(c.provider_id) && c.is_active),
        importedCourses,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
