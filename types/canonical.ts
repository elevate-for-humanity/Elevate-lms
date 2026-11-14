/**
 * Canonical Type Definitions
 * 
 * This file contains the authoritative type definitions for the Elevate LMS platform.
 * All other type definitions should import from here to ensure consistency.
 * 
 * @module types/canonical
 */

// =====================================================
// CANONICAL USER ROLE
// =====================================================

export const CANONICAL_ROLES = [
  'student',
  'admin',
  'advisor',
  'staff',
  'employer',
  'workforce_board',
  'partner',
  'sponsor',
  'mentor',
  'org_admin',
  'program_holder',
  'delegate',
  'creator',
  'instructor',
  'case_manager',
  'provider_admin',
  'super_admin',
  'grant_client',
  'partner_admin',
  'host_shop',
  'government',
  'testing_center',
  'financial_aid',
  'compliance',
  'dev_studio',
] as const;

export type CanonicalUserRole = typeof CANONICAL_ROLES[number];

// Re-export for backward compatibility
export type UserRole = CanonicalUserRole;

// =====================================================
// CANONICAL ENROLLMENT STATUS
// =====================================================

export const ENROLLMENT_STATUSES = [
  'pending',
  'active',
  'completed',
  'withdrawn',
  'suspended',
] as const;

export type EnrollmentStatus = typeof ENROLLMENT_STATUSES[number];

// =====================================================
// CANONICAL FUNDING TYPES
// =====================================================

export const FUNDING_TYPES = [
  'wrg',
  'wioa',
  'jri',
  'employindy',
  'self_pay',
  'employer_sponsored',
] as const;

export type FundingType = typeof FUNDING_TYPES[number];

// =====================================================
// CANONICAL PROGRAM HOLDER STATUS
// =====================================================

export const PROGRAM_HOLDER_STATUSES = [
  'pending',
  'approved',
  'inactive',
] as const;

export type ProgramHolderStatus = typeof PROGRAM_HOLDER_STATUSES[number];

// =====================================================
// CANONICAL MOU STATUS
// =====================================================

export const MOU_STATUSES = [
  'not_sent',
  'pending',
  'sent',
  'signed_by_holder',
  'fully_executed',
] as const;

export type MouStatus = typeof MOU_STATUSES[number];

// =====================================================
// ROLE HIERARCHY (for authorization)
// =====================================================

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  // Super admin has highest privileges
  super_admin: 100,
  org_admin: 90,
  provider_admin: 85,
  // Admin and staff
  admin: 80,
  staff: 70,
  advisor: 65,
  // Education roles
  instructor: 60,
  creator: 55,
  case_manager: 50,
  // Workforce roles
  workforce_board: 45,
  partner: 40,
  sponsor: 40,
  grant_client: 40,
  partner_admin: 40,
  // Operations roles
  mentor: 35,
  host_shop: 30,
  program_holder: 25,
  delegate: 20,
  testing_center: 15,
  financial_aid: 15,
  compliance: 15,
  // Employer
  employer: 10,
  // Base user
  student: 5,
  // Special roles
  government: 0,
  dev_studio: 0,
};

// Check if user has required role or higher
export function hasRoleOrHigher(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Admin role check
export function isAdminRole(role: UserRole): boolean {
  return ['super_admin', 'admin', 'org_admin', 'provider_admin', 'staff'].includes(role);
}

// Instructor role check
export function isInstructorRole(role: UserRole): boolean {
  return ['instructor', 'creator', 'admin', 'super_admin'].includes(role);
}

// Employer role check
export function isEmployerRole(role: UserRole): boolean {
  return role === 'employer';
}

// Student role check
export function isStudentRole(role: UserRole): boolean {
  return role === 'student';
}
