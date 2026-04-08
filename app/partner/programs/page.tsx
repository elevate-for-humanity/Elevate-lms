import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Programs | Partner Portal',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PartnerProgramsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const db = createAdminClient();
  if (!db) redirect('/partner/login');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['partner', 'admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Resolve partner_id
  const { data: partnerLink } = await db
    .from('partner_users')
    .select('partner_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  let programs: { id: string; title: string; slug: string; description: string | null }[] = [];

  if (partnerLink?.partner_id) {
    // Get programs this partner has access to
    const { data: access } = await db
      .from('partner_program_access')
      .select('program_id, programs(id, title, slug, description)')
      .eq('partner_id', partnerLink.partner_id)
      .is('revoked_at', null);

    if (access) {
      programs = access
        .map((a: any) => a.programs)
        .filter(Boolean);
    }

    // If no explicit access rows, fall back to all active programs
    if (programs.length === 0) {
      const { data: allPrograms } = await db
        .from('programs')
        .select('id, title, slug, description')
        .eq('is_active', true)
        .eq('published', true)
        .order('title');
      programs = allPrograms || [];
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner/dashboard' }, { label: 'Programs' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-gray-600 mt-1">View apprentice progress and manage attendance by program.</p>
        </div>

        {programs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No programs assigned</h3>
            <p className="text-gray-500 text-sm">Contact your Elevate coordinator to get programs linked to your account.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map((program) => (
              <Link
                key={program.id}
                href={`/partner/programs/${program.slug}`}
                className="flex items-center justify-between bg-white rounded-xl shadow-sm px-6 py-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-blue-50 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-brand-blue-600 transition-colors">
                      {program.title}
                    </p>
                    {program.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{program.description}</p>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-blue-600 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
