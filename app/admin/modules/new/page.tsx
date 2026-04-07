import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { ModuleForm } from '../module-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create Module | Admin',
  description: 'Create a new program module',
};

export default async function NewModulePage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();



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
