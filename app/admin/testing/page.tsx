import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import TestingAdminClient from './TestingAdminClient';

export const metadata: Metadata = {
  title: 'Testing Center Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export default async function TestingAdminPage() {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const { data: bookings } = await db
    .from('exam_bookings')
    .select('*')
    .order('preferred_date', { ascending: true });

  const pending = (bookings ?? []).filter((b: any) => b.status === 'pending').length;
  const confirmed = (bookings ?? []).filter((b: any) => b.status === 'confirmed').length;
  const total = (bookings ?? []).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Testing Center' }]} />
        </div>
      </div>
      <TestingAdminClient bookings={bookings ?? []} stats={{ pending, confirmed, total }} />
    </div>
  );
}
