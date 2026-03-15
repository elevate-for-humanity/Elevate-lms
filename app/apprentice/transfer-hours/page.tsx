import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Clock, FileText, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Transfer Hours | Apprentice Portal',
  description: 'Request to transfer hours from previous training or employment.',
};

export const dynamic = 'force-dynamic';

export default async function TransferHoursPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) { redirect("/login"); }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice/transfer-hours');
  }

  // Get apprentice profile
  const { data: apprentice } = await db
    .from('apprentices')
    .select('*, program:program_id(name, allows_transfer)')
    .eq('user_id', user.id)
    .single();

  // Get transfer requests
  const { data: transferRequests } = await db
    .from('hour_transfer_requests')
    .select('*')
    .eq('apprentice_id', apprentice?.id)
    .order('created_at', { ascending: false });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="text-slate-400 flex-shrink-0">•</span>;
      case 'denied':
        return <AlertCircle className="w-5 h-5 text-brand-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-brand-green-100 text-brand-green-700';
      case 'denied':
        return 'bg-brand-red-100 text-brand-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Apprentice Portal', href: '/apprentice' },
          { label: 'Transfer Hours' },
        ]}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Transfer Hours</h1>
          <p className="text-gray-600">Request to transfer hours from previous training or employment</p>
        </div>

        {/* Info Box */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-brand-blue-800 mb-2">About Hour Transfers</h3>
          <p className="text-brand-blue-700 text-sm mb-4">
            You may be eligible to transfer hours from previous related work experience or training. 
            Transfers are subject to approval and verification of documentation.
          </p>
          <ul className="text-sm text-brand-blue-700 space-y-1">
            <li>• Maximum transfer: Up to 50% of required hours</li>
            <li>• Documentation required: Employment records, training certificates</li>
            <li>• Processing time: 5-10 business days</li>
          </ul>
        </div>

        {/* Request Form Link */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Submit a Transfer Request</h2>
          <p className="text-gray-600 mb-6">
            To request a transfer of hours, you'll need to provide documentation of your 
            previous experience and complete the transfer request form.
          </p>
          <Link
            href="/apprentice/transfer-hours/request"
            className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-700 transition"
          >
            Start Transfer Request
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Previous Requests */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Transfer Request History</h2>
          </div>
          {transferRequests && transferRequests.length > 0 ? (
            <div className="divide-y">
              {transferRequests.map((request: any) => (
                <div key={request.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText className="w-10 h-10 text-brand-blue-500" />
                    <div>
                      <h3 className="font-medium">
                        {request.hours_requested} hours from {request.source}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    {getStatusIcon(request.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transfer requests submitted</p>
            </div>
          )}
        </div>

        {/* Required Documents */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">Required Documentation</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Employment verification letter from previous employer</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Pay stubs or W-2 forms showing dates of employment</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Training certificates or completion records</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span>Job description or duties performed</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
