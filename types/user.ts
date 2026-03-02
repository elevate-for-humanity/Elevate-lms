export type UserRole =
  | 'student'
  | 'admin'
  | 'super_admin'
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
  | 'instructor';

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
