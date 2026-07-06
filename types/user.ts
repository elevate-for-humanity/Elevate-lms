export type UserRole =
  | 'student'
  | 'admin'
  | 'advisor'
  | 'staff'
  | 'employer'
  | 'workforce_board'
  | 'partner'
  | 'sponsor'
  | 'mentor'
  | 'org_admin'
  | 'program_holder'
  | 'delegate'
  | 'creator'
  | 'instructor'
  | 'case_manager'
  | 'provider_admin'
  | 'super_admin'
  | 'grant_client'
  | 'partner_admin'
  | 'host_shop'
  | 'government'
  | 'testing_center'
  | 'financial_aid'
  | 'compliance'
  | 'dev_studio';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role: UserRole;
  avatar?: string;
  verified?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  user: User | null;
  error?: string;
}
