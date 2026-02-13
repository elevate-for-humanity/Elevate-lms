import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Supersonic Fast Cash | Admin | Elevate for Humanity',
  description: 'Admin dashboard for Supersonic Fast Cash tax services.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/admin',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  if (!supabase) {
    redirect('/login?redirect=/supersonic-fast-cash/admin');
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login?redirect=/supersonic-fast-cash/admin');
  }

  // Check if user has admin or staff role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['admin', 'staff', 'tax_preparer'];
  
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/supersonic-fast-cash?error=unauthorized');
  }

  return <>{children}</>;
}
