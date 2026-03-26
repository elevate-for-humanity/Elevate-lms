import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PartnerProgramClient from './PartnerProgramClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${title} Program | Partner Portal`,
    robots: { index: false, follow: false },
  };
}

export default async function PartnerProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/partner/programs/${slug}`);


  // Partner role guard
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['partner', 'admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Verify this partner has access to this program
  const { data: partnerUser } = await supabase
    .from('partner_users')
    .select('partner_id')
    .eq('user_id', user.id)
    .single();

  const orgId = partnerUser?.partner_id ?? null;

  // Resolve program display name from DB, fall back to slug
  const { data: program } = await supabase
    .from('programs')
    .select('title, name')
    .eq('slug', slug)
    .single();

  const programName = program?.title || program?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <PartnerProgramClient
      slug={slug}
      programName={programName}
      orgId={orgId}
    />
  );
}
