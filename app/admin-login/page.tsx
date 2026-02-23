import { redirect } from 'next/navigation';

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  // Forward to the main login page with the redirect param
  redirect('/login?redirect=/admin/dashboard');
}
