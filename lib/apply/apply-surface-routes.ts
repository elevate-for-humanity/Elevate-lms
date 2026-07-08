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

/** Extra program-specific apply URLs (not duplicated in header nav elsewhere). */
export const PROGRAM_APPLY_LINKS: ApplySurface[] = [
  { section: 'Program applies', name: 'Barber apprentice apply', href: '/programs/barber-apprenticeship/apply' },
  { section: 'Program applies', name: 'Cosmetology apprentice apply', href: '/programs/cosmetology-apprenticeship/apply' },
  { section: 'Program applies', name: 'HVAC technician apply', href: '/programs/hvac-technician/apply' },
  { section: 'Program applies', name: 'Esthetician apprentice apply', href: '/programs/esthetician-apprenticeship/apply' },
  { section: 'Program applies', name: 'Nail technician apprentice apply', href: '/programs/nail-technician-apprenticeship/apply' },
  { section: 'Program applies', name: 'Peer recovery specialist apply', href: '/programs/peer-recovery-specialist/apply' },
  { section: 'Program applies', name: 'QMA apply', href: '/programs/qma/apply' },
];

/** Host shop applies under partners (esthetician/nail were missing from menu). */
export const EXTRA_HOST_APPLY_LINKS: ApplySurface[] = [
  {
    section: 'Providers & hosts',
    name: 'Esthetician host shop apply',
    href: '/partners/esthetician-apprenticeship/apply',
  },
  {
    section: 'Providers & hosts',
    name: 'Nail technician host shop apply',
    href: '/partners/nail-technician-apprenticeship/apply',
  },
];

export const APPLY_AUDIT_SURFACES: ApplySurface[] = [
  { section: 'Students', name: 'Apply hub', href: '/apply', expectForm: 'IntakeFormInner', api: '/api/intake' },
  {
    section: 'Students',
    name: 'Student application',
    href: '/apply/student',
    expectForm: 'StudentApplicationForm',
    api: 'server:submitStudentApplication',
  },
  { section: 'Students', name: 'Enroll hub', href: '/enrollment' },
  { section: 'Students', name: 'Track', href: '/apply/track', api: '/api/applications/track' },
  { section: 'Employers', name: 'Employer application', href: '/apply/employer', expectForm: 'EmployerApplicationForm' },
  { section: 'Employers', name: 'Employer onboarding', href: '/onboarding/employer', note: 'Auth required' },
  {
    section: 'Providers & hosts',
    name: 'Program holder',
    href: '/apply/program-holder',
    expectForm: 'ProgramHolderForm',
  },
  {
    section: 'Providers & hosts',
    name: 'Barber host apply',
    href: '/partners/barber-host-shop/apply',
    expectForm: 'Compliance Uploads',
    api: '/api/partners/barber-host-shop/apply',
  },
  {
    section: 'Providers & hosts',
    name: 'Cosmetology host apply',
    href: '/partners/cosmetology-host-shop/apply',
    expectForm: 'Compliance Uploads',
    api: '/api/partners/cosmetology-host-shop/apply',
  },
  ...EXTRA_HOST_APPLY_LINKS,
  { section: 'Providers & hosts', name: 'Booth rental', href: '/booth-rental/apply', api: '/api/booth-rental/checkout' },
  { section: 'Providers & hosts', name: 'Create program', href: '/partners/create-program', note: 'CTA → /partners/apply' },
  { section: 'Staff', name: 'Staff application', href: '/apply/staff', expectForm: 'StaffApplicationForm' },
  { section: 'Staff', name: 'Instructor onboarding', href: '/onboarding/instructor' },
  { section: 'Agencies', name: 'Partner application', href: '/partners/apply', expectForm: 'ProviderApplicationForm', api: '/api/provider/apply' },
  ...PROGRAM_APPLY_LINKS,
];
