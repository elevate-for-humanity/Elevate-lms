/**
 * Canonical Apply menu surfaces — used by lib/navigation.ts and audit scripts.
 */

export type ApplySurface = {
  section: string;
  name: string;
  href: string;
  expectForm?: string | null;
  api?: string | null;
  note?: string;
};

/** Extra program-specific apply URLs. All student/program forms use the canonical applications API. */
export const PROGRAM_APPLY_LINKS: ApplySurface[] = [
  { section: 'Program applies', name: 'Barber apprentice apply', href: '/programs/barber-apprenticeship/apply', api: '/api/applications' },
  { section: 'Program applies', name: 'Cosmetology apprentice apply', href: '/programs/cosmetology-apprenticeship/apply', api: '/api/applications' },
  { section: 'Program applies', name: 'HVAC technician apply', href: '/apply/student?program=hvac-technician', api: '/api/applications', note: 'Canonical student application; legacy HVAC apply route redirects here.' },
  { section: 'Program applies', name: 'Esthetician apprentice apply', href: '/programs/esthetician-apprenticeship/apply', api: '/api/applications' },
  { section: 'Program applies', name: 'Nail technician apprentice apply', href: '/programs/nail-technician-apprenticeship/apply', api: '/api/applications' },
  { section: 'Program applies', name: 'Peer recovery specialist apply', href: '/programs/peer-recovery-specialist/apply', api: '/api/applications' },
  { section: 'Program applies', name: 'QMA apply', href: '/programs/qma/apply', api: '/api/applications' },
];

/** Legacy trade-specific Host Shop links redirect into one universal Host Site application. */
export const EXTRA_HOST_APPLY_LINKS: ApplySurface[] = [
  {
    section: 'Providers & hosts',
    name: 'Esthetician host shop apply',
    href: '/partners/esthetician-apprenticeship/apply',
    api: '/api/host-shop/apply-multipart',
    note: 'Redirects to the universal Host Site application.',
  },
  {
    section: 'Providers & hosts',
    name: 'Nail technician host shop apply',
    href: '/partners/nail-technician-apprenticeship/apply',
    api: '/api/host-shop/apply-multipart',
    note: 'Redirects to the universal Host Site application.',
  },
];

export const APPLY_AUDIT_SURFACES: ApplySurface[] = [
  {
    section: 'Students',
    name: 'Apply hub',
    href: '/apply',
    api: '/api/applications',
    note: 'Redirects to /apply/student; no parallel short-intake record.',
  },
  {
    section: 'Students',
    name: 'Student application',
    href: '/apply/student',
    expectForm: 'StudentApplicationForm',
    api: '/api/applications',
  },
  { section: 'Students', name: 'Enroll hub', href: '/enrollment' },
  { section: 'Students', name: 'Track', href: '/apply/track', api: '/api/applications/track' },
  {
    section: 'Employers',
    name: 'Employer application',
    href: '/apply/employer',
    expectForm: 'EmployerApplicationForm',
    api: '/api/employer/apply',
  },
  { section: 'Employers', name: 'Employer onboarding', href: '/onboarding/employer', note: 'Auth required after approval/authorization.' },
  {
    section: 'Providers & hosts',
    name: 'Program holder',
    href: '/apply/program-holder',
    expectForm: 'ProgramHolderForm',
    api: '/api/program-holder/apply',
  },
  {
    section: 'Providers & hosts',
    name: 'Universal Host Site application',
    href: '/partners/host-shop/apply',
    expectForm: 'UniversalHostSiteApplyPage',
    api: '/api/host-shop/apply-multipart',
  },
  {
    section: 'Providers & hosts',
    name: 'Cosmetology host apply',
    href: '/partners/cosmetology-host-shop/apply',
    api: '/api/host-shop/apply-multipart',
    note: 'Compatibility route redirects to /partners/host-shop/apply.',
  },
  ...EXTRA_HOST_APPLY_LINKS,
  { section: 'Providers & hosts', name: 'Booth rental', href: '/booth-rental/apply', api: '/api/booth-rental/checkout', note: 'Commercial checkout, not an application-review workflow.' },
  { section: 'Providers & hosts', name: 'Create program', href: '/partners/create-program', note: 'CTA routes into the partner selection flow.' },
  {
    section: 'Staff',
    name: 'Staff application',
    href: '/apply/staff',
    expectForm: 'StaffApplicationForm',
    api: '/api/staff/apply',
  },
  { section: 'Staff', name: 'Instructor onboarding', href: '/onboarding/instructor', note: 'Authorized onboarding surface; not a public application.' },
  {
    section: 'Agencies',
    name: 'Partner selection',
    href: '/partners/apply',
    note: 'Selector routes users to Employer, Training Provider, Host Shop, or Community pathways; it is not itself a provider application form.',
  },
  ...PROGRAM_APPLY_LINKS,
];
