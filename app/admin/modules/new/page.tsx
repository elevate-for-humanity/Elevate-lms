import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ModuleForm } from '../module-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create Module | Admin',
  description: 'Create a new program module',
};

export default async function NewModulePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch programs for selection
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="min-h-screen bg-white p-8">

      {/* Hero Image */}
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Create New Module</h1>
          <p className="text-black mt-1">Add a new module to a program</p>
        </div>

        <ModuleForm programs={programs || []} />
      </div>
    </div>
  );
}
