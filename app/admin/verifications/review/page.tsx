import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, XCircle, Clock, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Review ID Verifications | Admin',
  description: 'Review and approve ID verifications',
};

export default async function AdminVerificationReviewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    (profile.role !== 'admin' && profile.role !== 'super_admin')
  ) {
    redirect('/unauthorized');
  }

  const { data: verifications, error: verificationsError } = await supabase
    .from('id_verifications')
    .select(
      `
      *,
      profiles:user_id (
        id,
        full_name,
        email,
        role
      )
    `
    )
    .order('created_at', { ascending: false });
  if (verificationsError) throw new Error(`id_verifications query failed: ${verificationsError.message}`);

  const pendingVerifications  = verifications.filter((v) => v.status === 'pending');
  const approvedVerifications = verifications.filter((v) => v.status === 'approved');
  const rejectedVerifications = verifications.filter((v) => v.status === 'rejected');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="text-slate-400 flex-shrink-0">•</span>;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-brand-red-600" />;
      default:
        return <Shield className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-brand-green-100 text-brand-green-800 border-brand-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      rejected: 'bg-brand-red-100 text-brand-red-800 border-brand-red-300',
    };
    return (
      styles[status as keyof typeof styles] ||
      'bg-slate-100 text-black border-slate-300'
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero Image */}
      <section className="border-b py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">
                ID Verification Review
              </h1>
              <p className="text-lg text-black">
                Review and approve identity verifications
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-6 py-3 bg-slate-200 text-black font-semibold rounded-lg hover:bg-slate-300 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-8 h-8 text-brand-blue-600" />
              <span className="text-3xl font-bold text-black">
                {verifications?.length || 0}
              </span>
            </div>
            <div className="text-sm text-black">Total Verifications</div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-600 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <span className="text-3xl font-bold text-yellow-900">
                {pendingVerifications.length}
              </span>
            </div>
            <div className="text-sm text-yellow-900 font-semibold">
              Pending Review
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span className="text-3xl font-bold text-black">
                {approvedVerifications.length}
              </span>
            </div>
            <div className="text-sm text-black">Approved</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 text-brand-red-600" />
              <span className="text-3xl font-bold text-black">
                {rejectedVerifications.length}
              </span>
            </div>
            <div className="text-sm text-black">Rejected</div>
          </div>
        </div>

        {pendingVerifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              Pending Review ({pendingVerifications.length})
            </h2>
            <div className="space-y-3">
              {pendingVerifications.map((verification) => (
                <div
                  key={verification.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(verification.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-black">
                        {verification.first_name} {verification.last_name}
                      </h3>
                      <p className="text-sm text-black">
                        {verification.id_type
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l: string) =>
                            l.toUpperCase()
                          )}{' '}
                        •{(verification.profiles as any)?.email} (
                        {(verification.profiles as any)?.role}) • Submitted{' '}
                        {new Date(verification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/verifications/review/${verification.id}`}
                      className="px-4 py-2 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold text-black mb-4">
            All Verifications
          </h2>

          {verifications && verifications.length > 0 ? (
            <div className="space-y-3">
              {verifications.map((verification) => (
                <div
                  key={verification.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(verification.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-black">
                        {verification.first_name} {verification.last_name}
                      </h3>
                      <p className="text-sm text-black">
                        {verification.id_type
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l: string) =>
                            l.toUpperCase()
                          )}{' '}
                        •{(verification.profiles as any)?.email} (
                        {(verification.profiles as any)?.role}) • Submitted{' '}
                        {new Date(verification.created_at).toLocaleDateString()}
                      </p>
                      {verification.status === 'rejected' &&
                        verification.rejection_reason && (
                          <p className="text-sm text-brand-red-600 mt-1">
                            <strong>Reason:</strong>{' '}
                            {verification.rejection_reason}
                          </p>
                        )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-2 rounded-full text-xs font-semibold border ${getStatusBadge(verification.status)}`}
                    >
                      {verification.status.charAt(0).toUpperCase() +
                        verification.status.slice(1)}
                    </span>
                    <Link
                      href={`/admin/verifications/review/${verification.id}`}
                      className="px-4 py-2 bg-slate-200 text-black font-semibold rounded-lg hover:bg-slate-300 transition"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-black">No verifications to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
