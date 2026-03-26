import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Shield, AlertTriangle, MessageCircle, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'AI Tutor Logs | Admin',
};

export default async function AiTutorLogsPage() {
  const supabase = await createClient();
  if (!supabase) {
    return <div className="p-8 text-center text-gray-500">Service unavailable</div>;
  }

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Total hits last 24h
  const { count: total24h } = await supabase
    .from('public_ai_tutor_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', last24h);

  // Blocked last 24h
  const { count: blocked24h } = await supabase
    .from('public_ai_tutor_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', last24h)
    .not('blocked_reason', 'is', null);

  // Total hits last 7d
  const { count: total7d } = await supabase
    .from('public_ai_tutor_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', last7d);

  // Recent logs (last 50)
  const { data: recentLogs } = await supabase
    .from('public_ai_tutor_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // Top IPs by volume (last 24h) — for abuse detection
  const { data: topIps } = await supabase
    .from('public_ai_tutor_logs')
    .select('ip_hash')
    .gte('created_at', last24h)
    .order('created_at', { ascending: false })
    .limit(500);

  // Count by IP
  const ipCounts: Record<string, number> = {};
  topIps?.forEach(row => {
    ipCounts[row.ip_hash] = (ipCounts[row.ip_hash] || 0) + 1;
  });
  const topIpList = Object.entries(ipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Hero Image */}
      <Breadcrumbs items={[
        { label: 'Admin', href: '/admin' },
        { label: 'AI Tutor Logs' },
      ]} />

      <h1 className="text-2xl font-bold mt-4 mb-6">Public AI Tutor Logs</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center gap-2 text-brand-blue-600 mb-1">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Last 24h</span>
          </div>
          <p className="text-2xl font-bold">{total24h ?? 0}</p>
          <p className="text-xs text-gray-500">total requests</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Blocked 24h</span>
          </div>
          <p className="text-2xl font-bold">{blocked24h ?? 0}</p>
          <p className="text-xs text-gray-500">rate limit / PII / origin</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center gap-2 text-brand-green-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Last 7 days</span>
          </div>
          <p className="text-2xl font-bold">{total7d ?? 0}</p>
          <p className="text-xs text-gray-500">total requests</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Unique IPs 24h</span>
          </div>
          <p className="text-2xl font-bold">{Object.keys(ipCounts).length}</p>
          <p className="text-xs text-gray-500">distinct visitors</p>
        </div>
      </div>

      {/* Top IPs (abuse detection) */}
      {topIpList.length > 0 && (
        <div className="bg-white border rounded-xl p-4 mb-8">
          <h2 className="font-semibold mb-3">Top IPs (Last 24h)</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {topIpList.map(([hash, count]) => (
              <div key={hash} className={`text-xs font-mono px-2 py-1 rounded ${count > 20 ? 'bg-brand-red-50 text-brand-red-700' : count > 10 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600'}`}>
                {hash.slice(0, 8)}... <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Logs Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold">Recent Requests (Last 50)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium text-gray-600">Time</th>
                <th className="px-4 py-2 font-medium text-gray-600">IP Hash</th>
                <th className="px-4 py-2 font-medium text-gray-600">Q Length</th>
                <th className="px-4 py-2 font-medium text-gray-600">R Length</th>
                <th className="px-4 py-2 font-medium text-gray-600">Blocked</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentLogs?.map((log: any) => (
                <tr key={log.id} className={log.blocked_reason ? 'bg-brand-red-50' : ''}>
                  <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">
                    {log.ip_hash?.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-2">{log.question_length}</td>
                  <td className="px-4 py-2">{log.response_length}</td>
                  <td className="px-4 py-2">
                    {log.blocked_reason ? (
                      <span className="text-xs bg-brand-red-100 text-brand-red-700 px-2 py-0.5 rounded-full font-medium">
                        {log.blocked_reason}
                      </span>
                    ) : (
                      <span className="text-xs text-brand-green-600">OK</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!recentLogs || recentLogs.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No logs yet. The public AI tutor hasn&apos;t received any requests.
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
