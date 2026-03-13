import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/admin';
const supabaseAdmin = createAdminClient();
import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Grants Workflow | Elevate For Humanity',
  description: 'Admin dashboard',
};

async function getWorkflowData() {
  const { data: grants } = await supabaseAdmin
    .from('grants')
    .select('*')
    .order('due_date', { ascending: true });

  const { data: entities } = await supabaseAdmin
    .from('grant_entities')
    .select('*');

  const { data: applications } = await supabaseAdmin
    .from('grant_applications')
    .select('*');

  return {
    grants: grants || [],
    entities: entities || [],
    applications: applications || [],
  };
}

export default async function GrantWorkflowPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  await requireAdmin();

  const { grants, entities, applications } = await getWorkflowData();

  const statusCounts = {
    intake: grants.length,
    draft: applications.filter((a: Record<string, any>) => a.status === 'draft')
      .length,
    review: applications.filter(
      (a: Record<string, any>) => a.status === 'review'
    ).length,
    ready: applications.filter((a: Record<string, any>) => a.status === 'ready')
      .length,
    submitted: applications.filter(
      (a: Record<string, any>) => a.status === 'submitted'
    ).length,
  };

  return (
    <div>

      {/* Hero Image */}
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/admin-grants-workflow-detail.jpg"
          alt="Grant Workflow"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">
              Grant Autopilot Workflow
            </h1>
            <p className="text-black">
              Complete grant management from discovery to submission
            </p>
          </div>

          {/* Workflow Progress Bar */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-yellow-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                  {statusCounts.intake}
                </div>
                <p className="text-sm font-medium text-black">🟡 Intake</p>
                <p className="text-xs text-slate-500">New Opportunities</p>
              </div>
              <div className="flex-shrink-0 w-16 h-1 bg-slate-200" />
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-brand-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                  {statusCounts.draft}
                </div>
                <p className="text-sm font-medium text-black">🟢 Draft</p>
                <p className="text-xs text-slate-500">AI Generated</p>
              </div>
              <div className="flex-shrink-0 w-16 h-1 bg-slate-200" />
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-brand-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                  {statusCounts.review}
                </div>
                <p className="text-sm font-medium text-black">🔵 Review</p>
                <p className="text-xs text-slate-500">In Progress</p>
              </div>
              <div className="flex-shrink-0 w-16 h-1 bg-slate-200" />
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-brand-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                  {statusCounts.ready}
                </div>
                <p className="text-sm font-medium text-black">🟣 Ready</p>
                <p className="text-xs text-slate-500">Package Built</p>
              </div>
              <div className="flex-shrink-0 w-16 h-1 bg-slate-200" />
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                  {statusCounts.submitted}
                </div>
                <p className="text-sm font-medium text-black">
                  <span className="text-slate-400 flex-shrink-0">•</span> Submitted
                </p>
                <p className="text-xs text-slate-500">Complete</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Stage 1: Intake - New Opportunities */}
            <section className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-black">
                  🟡 Intake: New Opportunities
                </h2>
                <Link
                  href="/admin/grants/intake"
                  className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                >
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {grants.slice(0, 5).map((grant: Record<string, any>) => (
                  <div
                    key={grant.id}
                    className="border border-slate-200 rounded-lg p-4 hover:border-brand-blue-300 transition"
                  >
                    <h3 className="font-semibold text-black mb-1">
                      {grant.title}
                    </h3>
                    <p className="text-sm text-black mb-2">
                      {grant.agency || 'Federal Agency'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Due: {new Date(grant.due_date).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/admin/grants/intake/${grant.id}`}
                        className="text-xs bg-brand-blue-600 text-white px-3 py-2 rounded-md hover:bg-brand-blue-700"
                      >
                        Start Draft
                      </Link>
                    </div>
                  </div>
                ))}
                {grants.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No new opportunities. Run sync to import grants.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
