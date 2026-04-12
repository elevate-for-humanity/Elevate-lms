import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import CreateGroupForm from './CreateGroupForm';

export const metadata: Metadata = {
  title: 'Create Study Group | Community | Elevate For Humanity',
  description: 'Create a new study group.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CreateGroupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/community/groups/create');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // Fetch available programs for group topics
  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, slug')
    .eq('is_active', true)
    .order('title');

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-black mb-6">
          <Link href="/" className="hover:text-brand-orange-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/community" className="hover:text-brand-orange-600">Community</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/community/discussions/study-groups" className="hover:text-brand-orange-600">Study Groups</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Create</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Study Group</h1>
        <p className="text-black mb-8">Start a study group to connect with other learners</p>

        <CreateGroupForm 
          userId={user.id}
          userName={profile?.full_name || 'Anonymous'}
          programs={programs || []}
        />
      </div>
    </div>
  );
}
