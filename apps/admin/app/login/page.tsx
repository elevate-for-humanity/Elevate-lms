import AdminLoginForm from './LoginForm';

export const metadata = {
  title: 'Sign In — Elevate Admin',
  description: 'Sign in to the secure Elevate for Humanity Admin portal to manage training programs, courses, student support, and authorized operations.',
  alternates: { canonical: 'https://admin.elevateforhumanity.org/login' },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  return <AdminLoginForm redirectTo={params.redirect} initialError={params.error === 'profile_missing' ? 'Your account has no profile record. Run migration 20260701000011 in Supabase Dashboard, then try again.' : undefined} />;
}
