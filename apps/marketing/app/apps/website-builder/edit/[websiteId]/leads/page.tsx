import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getWebsiteBuilderAccess } from '@/lib/apps/website-builder-access';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ websiteId: string }> };

export default async function WebsiteLeadsPage({ params }: Props) {
  const { websiteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/apps/website-builder/edit/${websiteId}/leads`);

  const access = await getWebsiteBuilderAccess(user.id, supabase);
  if (!access.allowed) redirect(access.upgradeUrl || `/store/apps/website-builder?reason=${encodeURIComponent(access.reason || 'inactive')}`);

  const { data: site } = await supabase
    .from('user_websites')
    .select('id, user_id, site_name')
    .eq('id', websiteId)
    .maybeSingle();
  if (!site || site.user_id !== user.id) notFound();

  const { data: leads } = await supabase
    .from('tenant_site_leads')
    .select('id, name, email, phone, message, source_path, status, created_at')
    .eq('website_id', websiteId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-brand-red-700">Website Builder</p>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Leads · {site.site_name || 'Website'}</h1>
            <p className="mt-2 text-slate-600">Messages submitted through the published website contact form.</p>
          </div>
          <Link href={`/apps/website-builder/edit/${websiteId}`} className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-800">Back to editor</Link>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {!leads?.length ? (
            <div className="p-8 text-center text-slate-500">No website leads yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <article key={lead.id} className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">{lead.name}</h2>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-600">
                        <a href={`mailto:${lead.email}`} className="font-bold text-brand-red-700 hover:underline">{lead.email}</a>
                        {lead.phone ? <a href={`tel:${lead.phone}`} className="font-semibold hover:underline">{lead.phone}</a> : null}
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p className="font-bold uppercase">{lead.status || 'new'}</p>
                      <p className="mt-1">{new Date(lead.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">{lead.message}</p>
                  <p className="mt-3 text-xs font-semibold text-slate-400">Source: {lead.source_path || '/contact'}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
