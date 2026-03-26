import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { Award } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Program Certificates | Elevate Admin' };

export default async function ProgramCertificatesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: program } = await supabase.from('programs').select('id, title').or(`code.eq.${code},slug.eq.${code}`).single();
  if (!program) return <div className="p-8"><h1 className="text-2xl font-bold">Program not found</h1></div>;

  const { data: certs } = await supabase
    .from('certificates')
    .select('*')
    .eq('program_id', program.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm mb-4">
        <ol className="flex items-center space-x-2 text-gray-500">
          <li><Link href="/admin/programs" className="hover:text-brand-blue-600">Programs</Link></li>
          <li>/</li>
          <li><Link href={`/admin/programs/${code}/dashboard`} className="hover:text-brand-blue-600">{program.title}</Link></li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Certificates</li>
        </ol>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Certificates — {program.title}</h1>
        <Link
          href="/admin/certificates/issue"
          className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 text-sm font-medium"
        >
          Issue Certificate
        </Link>
      </div>

      {(!certs || certs.length === 0) ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates issued</h3>
          <p className="text-gray-500">Certificates will appear here once students complete this program.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Certificate ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Issued</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {certs.map((cert: any) => (
                <tr key={cert.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{cert.id?.slice(0, 12)}...</td>
                  <td className="px-4 py-3 text-gray-900">{cert.student_name || cert.user_id?.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-gray-500">{cert.created_at ? new Date(cert.created_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    {cert.verification_token ? (
                      <Link href={`/verify/${cert.verification_token}`} className="text-brand-blue-600 hover:underline text-xs">Verify</Link>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
