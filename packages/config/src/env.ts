type EnvironmentName = 'marketing' | 'admin' | 'lms';

const sharedRequired = [
  'NODE_ENV',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_ADMIN_URL',
  'NEXT_PUBLIC_APP_URL',
] as const;

const serviceRequired: Record<EnvironmentName, readonly string[]> = {
  marketing: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
  admin: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
  lms: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
};

export function validateEnvironment(service: EnvironmentName): void {
  const required = [
    ...sharedRequired,
    ...serviceRequired[service],
  ];

  const missing = required.filter((name) => {
    const value = process.env[name];
    return !value || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required variables for ${service}: ${missing.join(', ')}`,
    );
  }
}
