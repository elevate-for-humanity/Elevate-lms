import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import TestingAdminClient from './TestingAdminClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Testing Center Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export default async function TestingAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(\'/login\');


  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin'].includes(profile?.role ?? '')) redirect('/unauthorized');

  const { data: bookings } = await supabase
    .from('exam_bookings')
    .select('*')
    .order('preferred_date', { ascending: true });

  const { data: slots } = await supabase
    .from('testing_slots')
    .select('*')
    .eq('is_cancelled', false)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  const pending = (bookings ?? []).filter((b: any) => b.status === 'pending').length;
  const confirmed = (bookings ?? []).filter((b: any) => b.status === 'confirmed').length;
  const total = (bookings ?? []).length;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Testing Center' }]} />
        </div>
      </div>
      <TestingAdminClient bookings={bookings ?? []} slots={slots ?? []} stats={{ pending, confirmed, total }} />
    </div>
  );
}
