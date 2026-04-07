import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Clock, XCircle, Eye, CheckCircle, } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Employer Onboarding Review | Admin',
};

export default async function EmployerOnboardingReview() {
  const auth = await createClient();

  const supabase = createAdminClient();
  
  let onboardings: any[] = [];
  if (supabase) {
    const { data } = await supabase
      .from('employer_onboarding')
      .select('*')
      .order('created_at', { ascending: false });
    onboardings = data || [];
  }

  const statusColors: Record<string, string> = {
    submitted: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-brand-blue-100 text-brand-blue-800',
    approved: 'bg-brand-green-100 text-brand-green-800',
    rejected: 'bg-brand-red-100 text-brand-red-800',
  };

  const statusIcons: Record<string, any> = {
    submitted: Clock,
    reviewed: Eye,
    approved: CheckCircle,
    rejected: XCircle,
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">

      {/* Hero Image */}
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Onboarding" }]} />
      </div>
<div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Employer Onboarding Review
          </h1>
          <p className="text-black">
            Review and approve employer applications
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black">
                    Business Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-black">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {onboardings?.map((onboarding) => {
                  const StatusIcon = statusIcons[onboarding.status] || Clock;
                  return (
                    <tr key={onboarding.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-black">
                        {onboarding.business_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-black">
                        {onboarding.contact_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-black">
                        {onboarding.contact_email}
                      </td>
                      <td className="px-6 py-4 text-sm text-black">
                        {onboarding.contact_phone}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold ${
                            statusColors[onboarding.status] ||
                            'bg-slate-100 text-black'
                          }`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {onboarding.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-black">
                        {new Date(onboarding.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/employers/onboarding/${onboarding.id}`}
                          className="text-brand-blue-600 hover:text-brand-blue-700 font-medium text-sm"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!onboardings || onboardings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-black">
                No employer onboarding submissions yet
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
