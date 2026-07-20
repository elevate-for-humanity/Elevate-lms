export const VALID_PORTAL_KEYS = ['student', 'employer', 'instructor', 'admin'];

export interface PortalConfig {
  title: string;
  description: string;
  features: string[];
  color: string;
}

export const PORTAL_CONFIGS: Record<string, PortalConfig> = {
  student: {
    title: 'Student Portal',
    description: 'Access your courses, grades, and progress',
    features: ['Course access', 'Grade tracking', 'Certificate downloads'],
    color: 'blue',
  },
  employer: {
    title: 'Employer Portal',
    description: 'Manage employees and track credentials',
    features: ['Employee management', 'Credential verification', 'Reporting'],
    color: 'green',
  },
  instructor: {
    title: 'Instructor Portal',
    description: 'Manage courses and grade students',
    features: ['Course management', 'Student oversight', 'Grade entry'],
    color: 'purple',
  },
  admin: {
    title: 'Admin Portal',
    description: 'Full system administration',
    features: ['User management', 'System configuration', 'Analytics'],
    color: 'orange',
  },
};
