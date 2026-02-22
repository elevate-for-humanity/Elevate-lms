import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import TaxPrepForm from './TaxPrepForm';

export const metadata: Metadata = {
  title: 'Start Filing | Self-Prep Tax | Elevate For Humanity',
  description: 'File your taxes with our self-prep tool.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function TaxSelfPrepStartPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/tax-self-prep/start');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Check for existing draft
  const { data: existingDraft } = await db
    .from('tax_return_drafts')
    .select('*')
    .eq('user_id', user.id)
    .eq('tax_year', new Date().getFullYear() - 1)
    .eq('status', 'draft')
    .single();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-brand-orange-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/tax-self-prep" className="hover:text-brand-orange-600">Self-Prep</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Start Filing</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Self-Prep Tax Filing</h1>
        <p className="text-gray-600 mb-8">Complete each section to file your taxes</p>

        <TaxPrepForm 
          userId={user.id}
          profile={profile}
          existingDraft={existingDraft}
          taxYear={new Date().getFullYear() - 1}
        />
      </div>
    </div>
  );
}
