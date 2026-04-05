'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  Users,
  Check,
  AlertCircle,
  Loader2,
  Download,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

interface AgreementStats {
  agreement_type: string;
  document_version: string;
  count: number;
}

interface RecentAcceptance {
  id: string;
  user_id: string;
  agreement_type: string;
  document_version: string;
  signer_name: string;
  signer_email: string;
  signature_method: string;
  accepted_at: string;
  ip_address: string;
}

export default function AdminAgreementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AgreementStats[]>([]);
  const [recentAcceptances, setRecentAcceptances] = useState<RecentAcceptance[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      // Verify admin access
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase!
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        setError('Admin access required');
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // Get total count
      const { count } = await supabase!
        .from('license_agreement_acceptances')
        .select('*', { count: 'exact', head: true });

      setTotalCount(count || 0);

      // Get stats by agreement type
      const { data: acceptances } = await supabase!
        .from('license_agreement_acceptances')
        .select('agreement_type, document_version');

      // Aggregate stats
      const statsMap = new Map<string, number>();
      for (const acc of acceptances || []) {
        const key = `${acc.agreement_type}:${acc.document_version}`;
        statsMap.set(key, (statsMap.get(key) || 0) + 1);
      }

      const aggregatedStats: AgreementStats[] = [];
      for (const [key, count] of statsMap) {
        const [type, version] = key.split(':');
        aggregatedStats.push({ agreement_type: type, document_version: version, count });
      }
      aggregatedStats.sort((a, b) => b.count - a.count);
      setStats(aggregatedStats);

      // Get recent acceptances
      const { data: recent } = await supabase!
        .from('license_agreement_acceptances')
        .select('id, user_id, agreement_type, document_version, signer_name, signer_email, signature_method, accepted_at, ip_address')
        .order('accepted_at', { ascending: false })
        .limit(20);

      setRecentAcceptances(recent || []);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = async (format: 'json' | 'csv') => {
    window.open(`/api/compliance/export?type=agreements&format=${format}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading agreement data...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-brand-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">{error || 'Admin access required'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Agreement Acceptances</h1>
            <p className="text-slate-600 mt-1">
              Monitor and audit agreement signing compliance
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => loadData()}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Acceptances</p>
                <p className="text-3xl font-bold text-slate-900">{totalCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-brand-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Agreement Types</p>
                <p className="text-3xl font-bold text-slate-900">{stats.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Today's Signings</p>
                <p className="text-3xl font-bold text-slate-900">
                  {recentAcceptances.filter(
                    (a) => new Date(a.accepted_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats by Agreement Type */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Acceptances by Agreement Type
            </h2>
          </div>
          <div className="p-6">
            {stats.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No agreement acceptances recorded yet.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.map((stat) => (
                  <div
                    key={`${stat.agreement_type}:${stat.document_version}`}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {stat.agreement_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </p>
                      <p className="text-sm text-slate-500">Version {stat.document_version}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{stat.count}</p>
                      <p className="text-sm text-slate-500">acceptances</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Acceptances */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Acceptances
            </h2>
          </div>
          <div className="overflow-x-auto">
            {recentAcceptances.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                No recent acceptances.
              </p>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Signer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Agreement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentAcceptances.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{acc.signer_name}</p>
                        <p className="text-sm text-slate-500">{acc.signer_email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-900">
                          {acc.agreement_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-slate-500">v{acc.document_version}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          acc.signature_method === 'drawn'
                            ? 'bg-brand-blue-100 text-brand-blue-700'
                            : acc.signature_method === 'typed'
                            ? 'bg-brand-blue-100 text-brand-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {acc.signature_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(acc.accepted_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-sm">
                        {acc.ip_address}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* SQL Query Helper */}
        <div className="mt-8 bg-slate-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Audit Query</h3>
          <pre className="text-brand-green-400 text-sm overflow-x-auto">
{`SELECT agreement_type, document_version, COUNT(*)
FROM public.license_agreement_acceptances
GROUP BY 1, 2
ORDER BY 1, 2;`}
          </pre>
        </div>
      </div>
    </div>
  );
}
