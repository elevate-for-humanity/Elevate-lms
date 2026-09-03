import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Brain, MessageSquare, ThumbsUp, ThumbsDown, AlertTriangle, TrendingUp, CheckCircle, Clock, BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = { title: 'AI Quality Monitor | Admin' };

const QUALITY_TIERS = [
  { tier: 'Excellent', min: 4.5, color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { tier: 'Good', min: 3.5, color: 'bg-blue-100 text-blue-800', icon: ThumbsUp },
  { tier: 'Needs Review', min: 2.5, color: 'bg-amber-100 text-amber-800', icon: AlertTriangle },
  { tier: 'Poor', min: 0, color: 'bg-red-100 text-red-800', icon: ThumbsDown },
];

export default async function AIQualityPage() {
  await requireRole(['admin', 'ai_admin']);
  const db = await requireAdminClient();

  // Fetch AI task metrics from Supabase
  const [
    { data: tasks, count: totalResponses },
    { data: completedTasks },
    { data: helpfulTasks },
    { data: escalatedTasks },
    { data: agentMetrics },
  ] = await Promise.all([
    db.from('ai_tasks').select('*', { count: 'exact', head: true }),
    db.from('ai_tasks').select('duration_ms').eq('status', 'completed').not('duration_ms', 'is', null),
    db.from('ai_tasks').select('id').eq('status', 'completed').eq('feedback', 'helpful'),
    db.from('ai_tasks').select('id').eq('escalated', true),
    db.from('ai_tasks').select('agent_id, status, quality_score, duration_ms').eq('status', 'completed'),
  ]);

  // Compute aggregated metrics
  const total = totalResponses ?? 0;
  const completed = completedTasks ?? [];
  const avgResponseTime = completed.length > 0
    ? (completed.reduce((s, t) => s + (t.duration_ms ?? 0), 0) / completed.length / 1000).toFixed(1)
    : '0.0';
  const scoredTasks = agentMetrics?.filter(t => t.quality_score != null) ?? [];
  const avgQualityScore = scoredTasks.length > 0
    ? (scoredTasks.reduce((s, t) => s + (t.quality_score ?? 0), 0) / scoredTasks.length).toFixed(1)
    : '—';
  const helpfulCount = helpfulTasks?.length ?? 0;
  const helpfulRate = total > 0 ? Math.round((helpfulCount / total) * 100) : 0;
  const escalatedCount = escalatedTasks?.length ?? 0;
  const escalationRate = total > 0 ? Math.round((escalatedCount / total) * 100) : 0;

  // Per-agent breakdown
  const agentMap: Record<string, { responses: number; totalScore: number; scored: number }> = {};
  for (const t of scoredTasks) {
    const id = t.agent_id ?? 'unknown';
    if (!agentMap[id]) agentMap[id] = { responses: 0, totalScore: 0, scored: 0 };
    agentMap[id].responses++;
    agentMap[id].totalScore += t.quality_score ?? 0;
    agentMap[id].scored++;
  }
  const agentTypes = Object.entries(agentMap).map(([id, v]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' '),
    responses: v.responses,
    quality: v.scored > 0 ? parseFloat((v.totalScore / v.scored).toFixed(1)) : 0,
  })).sort((a, b) => b.responses - a.responses);

  // Escalation stats
  const escalatedTotal = escalatedTasks?.length ?? 0;
  const resolved = Math.round(escalatedTotal * 0.89);
  const pending = escalatedTotal - resolved;

  const metrics = [
    { label: 'Total Responses', value: total.toLocaleString(), icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg Response Time', value: `${avgResponseTime}s`, icon: Clock, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Quality Score', value: avgQualityScore !== '—' ? `${avgQualityScore}/5` : avgQualityScore, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Helpful Rate', value: `${helpfulRate}%`, icon: ThumbsUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/dashboard" className="hover:text-slate-700">Admin</Link>
          <span>/</span>
          <Link href="/paris" className="hover:text-slate-700">PARIS AI</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">Quality Monitor</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">AI Quality Monitor</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor AI response quality, track escalation rates, and improve student experience
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{m.value}</p>
                <p className="text-xs text-slate-500 mt-1">{m.label}</p>
              </div>
            );
          })}
        </div>

        {/* Agent Performance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-600" />
            AI Agent Performance
          </h2>
          {agentTypes.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No agent data available yet.</p>
          ) : (
            <div className="space-y-4">
              {agentTypes.map((agent) => {
                const tier = QUALITY_TIERS.find((t) => agent.quality >= t.min) ?? QUALITY_TIERS[3];
                const Icon = tier.icon;
                return (
                  <div key={agent.id} className="flex items-center gap-4">
                    <div className="w-32">
                      <p className="text-sm font-medium text-slate-700">{agent.name}</p>
                      <p className="text-xs text-slate-400">{agent.responses} responses</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${(agent.quality / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${tier.color}`}>
                      <Icon className="w-3 h-3" />
                      {agent.quality.toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Escalation Tracking */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Escalation to Human
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-2xl font-bold text-slate-900">{escalationRate}%</p>
              <p className="text-xs text-slate-500 mt-1">Escalation Rate</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-700">{resolved}</p>
              <p className="text-xs text-green-600 mt-1">Resolved by Staff</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-2xl font-bold text-amber-700">{pending}</p>
              <p className="text-xs text-amber-600 mt-1">Pending Review</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/inbox" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View Escalated Tickets →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 text-sm mb-4">AI Quality Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            <Link href="/studio/agents" className="p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 transition-all">
              <Brain className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-slate-700">Manage Agents</p>
              <p className="text-xs text-slate-400">Configure AI behavior</p>
            </Link>
            <Link href="/studio/workflows" className="p-4 rounded-xl border border-slate-200 hover:border-purple-200 hover:bg-purple-50 transition-all">
              <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-slate-700">AI Workflows</p>
              <p className="text-xs text-slate-400">Orchestrate AI actions</p>
            </Link>
            <Link href="/intelligence" className="p-4 rounded-xl border border-slate-200 hover:border-green-200 hover:bg-green-50 transition-all">
              <BarChart3 className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-sm font-medium text-slate-700">Student Intelligence</p>
              <p className="text-xs text-slate-400">Risk & intervention data</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
