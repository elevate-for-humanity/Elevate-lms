export const PHONE_MANAGER_ROLES = [
  'admin',
  'org_admin',
  'program_holder',
  'provider_admin',
  'host_shop_admin',
] as const;

export const COMMUNICATION_MEMBER_ROLES = [
  ...PHONE_MANAGER_ROLES,
  'staff',
  'instructor',
  'case_manager',
  'support',
  'employee',
] as const;
