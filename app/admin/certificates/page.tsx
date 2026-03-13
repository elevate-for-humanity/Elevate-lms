import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Award, Plus, Users, Search, Shield, Download } from 'lucide-react';
import { revokeCertificate } from './actions';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Certificates | Admin | Elevate For Humanity',
  description: 'Issue, manage, and verify certificates and credentials.',
};

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cert?: string; error?: string; search?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const db = createAdminClient() || supabase;
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  // Fetch certificates from both tables
  let certificates: any[] = [];
  const searchTerm = params.search || '';

  const { data: issuedCerts } = await db
    .from('issued_certificates')
    .select('id, certificate_number, recipient_name, recipient_email, issue_date, status, signed_by, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: legacyCerts } = await db
    .from('certificates')
    .select('id, certificate_number, student_name, student_email, issued_date, status, signed_by, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  // Merge and normalize
  certificates = [
    ...(issuedCerts || []).map((c: any) => ({
      id: c.id, number: c.certificate_number, name: c.recipient_name,
      email: c.recipient_email, date: c.issue_date, status: c.status,
      signedBy: c.signed_by, source: 'issued',
    })),
    ...(legacyCerts || []).map((c: any) => ({
      id: c.id, number: c.certificate_number, name: c.student_name,
      email: c.student_email, date: c.issued_date, status: c.status,
      signedBy: c.signed_by, source: 'legacy',
    })),
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    certificates = certificates.filter(c =>
      c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.number?.toLowerCase().includes(q)
    );
  }

  const totalCount = certificates.length;
  const activeCount = certificates.filter(c => c.status === 'issued' || c.status === 'active').length;
  const revokedCount = certificates.filter(c => c.status === 'revoked').length;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Certificates</li>
            </ol>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Certificate Management</h1>
              <p className="text-gray-600 mt-1">Issue, verify, and manage certificates</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/certificates/issue"
                className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 text-sm font-medium">
                <Plus className="w-4 h-4" /> Issue Certificate
              </Link>
              <Link href="/admin/certificates/bulk"
                className="flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">
                <Users className="w-4 h-4" /> Bulk Issue
              </Link>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {params.success === 'issued' && (
          <div className="mb-6 p-4 bg-brand-green-50 border border-brand-green-200 rounded-lg text-brand-green-800">
            Certificate <strong>{params.cert}</strong> issued successfully.
          </div>
        )}
        {params.success === 'revoked' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            Certificate revoked.
          </div>
        )}
        {params.error && (
          <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-800">
            Error: {params.error.replace(/_/g, ' ')}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-5">
            <Award className="w-5 h-5 text-brand-blue-600 mb-2" />
            <p className="text-2xl font-bold">{totalCount}</p>
            <p className="text-sm text-gray-500">Total Certificates</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <Shield className="w-5 h-5 text-brand-green-600 mb-2" />
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-sm text-gray-500">Active</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <Shield className="w-5 h-5 text-brand-red-600 mb-2" />
            <p className="text-2xl font-bold">{revokedCount}</p>
            <p className="text-sm text-gray-500">Revoked</p>
          </div>
        </div>

        {/* Search */}
        <form className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input name="search" type="text" defaultValue={searchTerm}
              placeholder="Search by name, email, or certificate number..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
          </div>
        </form>

        {/* Quick Links */}
        <div className="flex gap-3 mb-6">
          <Link href="/verify-credential" className="text-sm text-brand-blue-600 hover:underline flex items-center gap-1">
            <Shield className="w-4 h-4" /> Public Verification Portal
          </Link>
          <Link href="/admin/certificates/bulk" className="text-sm text-brand-blue-600 hover:underline flex items-center gap-1">
            <Users className="w-4 h-4" /> Bulk Issue
          </Link>
        </div>

        {/* Certificates Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Certificate #</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Recipient</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Issued</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {certificates.length > 0 ? certificates.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm">{c.number || c.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 font-medium text-sm">{c.name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.email || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.date ? new Date(c.date).toLocaleDateString() : '—'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      c.status === 'issued' || c.status === 'active' ? 'bg-brand-green-100 text-brand-green-700' :
                      c.status === 'revoked' ? 'bg-brand-red-100 text-brand-red-700' :
                      c.status === 'expired' ? 'bg-gray-100 text-gray-700' :
                      'bg-brand-blue-100 text-brand-blue-700'
                    }`}>{c.status || 'unknown'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {(c.status === 'issued' || c.status === 'active') && (
                      <form action={revokeCertificate} className="inline">
                        <input type="hidden" name="certId" value={c.id} />
                        <input type="hidden" name="reason" value="Admin revocation" />
                        <button type="submit"
                          className="text-brand-red-600 hover:text-brand-red-800 text-sm font-medium"
                          onClick={(e) => { if (!confirm('Revoke this certificate?')) e.preventDefault(); }}>
                          Revoke
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No certificates found. <Link href="/admin/certificates/issue" className="text-brand-blue-600 hover:underline">Issue your first certificate</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
