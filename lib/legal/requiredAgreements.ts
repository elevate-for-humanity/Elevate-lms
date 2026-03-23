/**
 * Required Agreements by Role
 * 
 * Defines which agreements each role must sign before accessing protected routes.
 * This is the source of truth for compliance gating.
 * 
 * Indiana Workforce Posture - Minimum defensible set for WIOA/apprenticeship audits.
 */

import type { AgreementType } from './recordAgreementAcceptance';

export interface RequiredAgreement {
  type: AgreementType;
  version: string;
  title: string;
  description: string;
  documentUrl: string;
}

export type UserRole = 
  | 'student'
  | 'program_holder'
  | 'employer'
  | 'staff'
  | 'admin'
  | 'super_admin'
  | 'partner'
  | 'instructor'
  | 'mentor';

/**
 * Required agreements by role.
 * Each role must sign ALL listed agreements before accessing protected routes.
 */
/**
 * Required agreements by role.
 * 
 * Valid enum values in database:
 * - enrollment, handbook, program_holder_mou, employer_agreement, staff_agreement, license
 */
export const REQUIRED_AGREEMENTS: Record<UserRole, RequiredAgreement[]> = {
  student: [
    {
      type: 'enrollment',
      version: '1.0',
      title: 'Enrollment Agreement',
      description: 'Terms and conditions of your enrollment in the training program',
      documentUrl: '/legal/enrollment-agreement',
    },
    {
      type: 'handbook',
      version: '1.0',
      title: 'Student Handbook Acknowledgment',
      description: 'Acknowledgment of student handbook policies and procedures',
      documentUrl: '/legal/student-handbook',
    },
  ],

  program_holder: [
    {
      type: 'program_holder_mou',
      version: '1.0',
      title: 'Program Holder MOU',
      description: 'Memorandum of Understanding for program delivery partnership',
      documentUrl: '/legal/program-holder-mou',
    },
  ],

  employer: [
    {
      type: 'employer_agreement',
      version: '1.0',
      title: 'Employer Partnership Agreement',
      description: 'Terms for employer participation in workforce programs',
      documentUrl: '/legal/employer-agreement',
    },
  ],

  staff: [
    {
      type: 'staff_agreement',
      version: '1.0',
      title: 'Staff Agreement',
      description: 'Terms of employment and confidentiality obligations',
      documentUrl: '/legal/staff-agreement',
    },
  ],

  admin: [
    {
      type: 'staff_agreement',
      version: '1.0',
      title: 'Staff Agreement',
      description: 'Terms of employment and confidentiality obligations',
      documentUrl: '/legal/staff-agreement',
    },
  ],

  super_admin: [
    {
      type: 'staff_agreement',
      version: '1.0',
      title: 'Staff Agreement',
      description: 'Terms of employment and confidentiality obligations',
      documentUrl: '/legal/staff-agreement',
    },
  ],

  partner: [
    {
      type: 'program_holder_mou',
      version: '1.0',
      title: 'Partner MOU',
      description: 'Memorandum of Understanding for partnership',
      documentUrl: '/legal/partner-mou',
    },
  ],

  instructor: [
    {
      type: 'staff_agreement',
      version: '1.0',
      title: 'Instructor Agreement',
      description: 'Terms for instructional services',
      documentUrl: '/legal/instructor-agreement',
    },
  ],

  mentor: [
    {
      type: 'staff_agreement',
      version: '1.0',
      title: 'Mentor Agreement',
      description: 'Terms for mentorship services',
      documentUrl: '/legal/mentor-agreement',
    },
  ],
};

/**
 * Get required agreements for a role.
 */
export function getRequiredAgreements(role: string): RequiredAgreement[] {
  const normalizedRole = role.toLowerCase() as UserRole;
  return REQUIRED_AGREEMENTS[normalizedRole] || REQUIRED_AGREEMENTS.student;
}

/**
 * Check which agreements a user is missing.
 */
export async function getMissingAgreements(
  supabase: any,
  userId: string,
  role: string
): Promise<RequiredAgreement[]> {
  const required = getRequiredAgreements(role);

  if (required.length === 0) {
    return [];
  }

  // Get user's signed agreements
  const { data: signed } = await supabase
    .from('license_agreement_acceptances')
    .select('agreement_type, document_version')
    .eq('user_id', userId);

  const signedSet = new Set(
    (signed || []).map((s: any) => `${s.agreement_type}:${s.document_version}`)
  );

  // Find missing
  return required.filter(
    (req) => !signedSet.has(`${req.type}:${req.version}`)
  );
}

/**
 * Check if user has signed all required agreements.
 */
export async function hasSignedAllRequired(
  supabase: any,
  userId: string,
  role: string
): Promise<boolean> {
  const missing = await getMissingAgreements(supabase, userId, role);
  return missing.length === 0;
}

/**
 * Protected route groups by role.
 * Used by middleware to determine which routes require agreement gating.
 */
export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  '/lms': ['student', 'instructor', 'admin', 'staff', 'super_admin'],
  '/student-portal': ['student'],
  '/student': ['student'],
  '/program-holder': ['program_holder'],
  '/employer-portal': ['employer'],
  '/employer': ['employer'],
  '/staff-portal': ['staff', 'admin', 'super_admin'],
  '/admin': ['admin', 'super_admin'],
  '/partner-portal': ['partner'],
};

/**
 * Routes that are exempt from agreement gating.
 * Users can access these even without signed agreements.
 */
export const EXEMPT_ROUTES = [
  '/legal/agreements',
  '/onboarding',
  '/student-portal/onboarding',
  '/login',
  '/signup',
  '/logout',
  '/api/legal',
  '/api/auth',
  '/api/client-info',
  '/',
  '/about',
  '/contact',
  '/programs',
  '/apply',
];

/**
 * Check if a route requires agreement gating.
 */
export function requiresAgreementGating(pathname: string): boolean {
  // Check exempt routes first
  for (const exempt of EXEMPT_ROUTES) {
    if (pathname === exempt || pathname.startsWith(exempt + '/')) {
      return false;
    }
  }

  // Check protected routes
  for (const prefix of Object.keys(PROTECTED_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

/**
 * Get the role(s) that can access a route.
 */
export function getRouteRoles(pathname: string): UserRole[] {
  for (const [prefix, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      return roles;
    }
  }
  return [];
}
