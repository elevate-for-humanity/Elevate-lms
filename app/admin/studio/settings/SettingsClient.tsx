'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Settings, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface HealthStatus {
  hasGroq: boolean;
  hasGemini: boolean;
  hasOpenAI: boolean;
  hasAnthropic: boolean;
  hasGitHub: boolean;
  aiConfigured: boolean;
  shell: { configured: boolean; ready: boolean };
}

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'offline';
  detail: string;
}

export default function SettingsClient() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchHealth() {
    setLoading(true);
    setError(null);
    const results: HealthCheck[] = [];

    // Client-side NEXT_PUBLIC_ check (inlined at build time)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    results.push({
      name: 'Supabase',
      status: supabaseUrl ? 'healthy' : 'offline',
      detail: supabaseUrl
        ? 'NEXT_PUBLIC_SUPABASE_URL configured'
        : 'NEXT_PUBLIC_SUPABASE_URL missing',
    });

    // Server-side health endpoint — granular provider + shell checks
    try {
      const res = await fetch('/api/devstudio/health');
      if (!res.ok) throw new Error(await res.text());
      const health: HealthStatus = await res.json();

      // AI Providers
      results.push({
        name: 'Groq',
        status: health.hasGroq ? 'healthy' : 'offline',
        detail: health.hasGroq ? 'API key configured' : 'GROQ_API_KEY missing',
      });
      results.push({
        name: 'Gemini',
        status: health.hasGemini ? 'healthy' : 'offline',
        detail: health.hasGemini ? 'API key configured' : 'GEMINI_API_KEY missing',
      });
      results.push({
        name: 'OpenAI',
        status: health.hasOpenAI ? 'healthy' : 'offline',
        detail: health.hasOpenAI ? 'API key configured' : 'OPENAI_API_KEY missing',
      });
      results.push({
        name: 'Anthropic',
        status: health.hasAnthropic ? 'healthy' : 'offline',
        detail: health.hasAnthropic ? 'API key configured' : 'ANTHROPIC_API_KEY missing',
      });

      // Infrastructure
      results.push({
        name: 'GitHub Token',
        status: health.hasGitHub ? 'healthy' : 'offline',
        detail: health.hasGitHub ? 'Token configured' : 'GITHUB_TOKEN missing',
      });
      results.push({
        name: 'Shell WebSocket',
        status: health.shell?.ready ? 'healthy' : health.shell?.configured ? 'degraded' : 'offline',
        detail: health.shell?.ready
          ? 'Connected and ready'
          : health.shell?.configured
            ? 'Configured, not ready'
            : 'Not configured',
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to reach /api/devstudio/health');
      results.push({
        name: 'Dev Studio API',
        status: 'offline',
        detail: 'Health endpoint not responding',
      });
    }

    // Northflank connectivity check
    try {
      const res = await fetch('/api/devstudio/builds');
      if (res.ok) {
        const data = await res.json();
        const hasToken = data.builds !== undefined;
        results.push({
          name: 'Northflank',
          status: hasToken ? 'healthy' : 'degraded',
          detail: hasToken ? 'Build API reachable' : 'NORTHFLANK_API_TOKEN may be missing',
        });
      } else {
        results.push({ name: 'Northflank', status: 'degraded', detail: `Status ${res.status}` });
      }
    } catch {
      results.push({ name: 'Northflank', status: 'offline', detail: 'Unable to reach build API' });
    }

    setChecks(results);
    setLoading(false);
  }

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[280px] w-full overflow-hidden">
        <Image
          src="/images/pages/admin-activity-hero.webp"
          alt="System Settings"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-gray-900/60" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-6 w-full">
            <div className="flex items-center gap-3 mb-3">
              <Settings className="h-8 w-8 text-white/90" />
              <span className="text-xs font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white">
                Infrastructure
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              System Settings
            </h1>
            <p className="text-slate-200 text-lg mt-2 max-w-2xl">
              Health monitoring, configuration status, and infrastructure overview.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-end mb-8">
          <button
            onClick={fetchHealth}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 mb-6 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Health Checks */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Service Health</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {checks.map((check) => {
              const Icon = check.status === 'healthy' ? CheckCircle : XCircle;
              const color =
                check.status === 'healthy'
                  ? 'text-emerald-500'
                  : check.status === 'degraded'
                    ? 'text-amber-500'
                    : 'text-red-500';
              return (
                <div
                  key={check.name}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${color}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{check.name}</p>
                      <p className="text-xs text-slate-500">{check.detail}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold capitalize ${
                      check.status === 'healthy'
                        ? 'bg-emerald-50 text-emerald-700'
                        : check.status === 'degraded'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {check.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deployment Info */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Deployment Configuration</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Admin Service</p>
              <p className="font-mono text-sm font-bold text-blue-700">elevate-admin</p>
              <p className="text-xs text-slate-400 mt-1"></p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">LMS Service</p>
              <p className="font-mono text-sm font-bold text-emerald-700">elevate-lms</p>
              <p className="text-xs text-slate-400 mt-1">www.elevateforhumanity.org</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Database</p>
              <p className="font-mono text-sm font-bold text-slate-700">cuxzzpsyufcewtmicszk</p>
              <p className="text-xs text-slate-400 mt-1">Supabase PostgreSQL</p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-xs text-slate-500 mb-1">Platform</p>
              <p className="font-mono text-sm font-bold text-slate-700">Northflank</p>
              <p className="text-xs text-slate-400 mt-1">Docker + CI/CD</p>
            </div>
          </div>
        </div>
      </div>
      {checks.length === 0 && !loading && !error && (
        <p className="py-8 text-center text-sm text-slate-500">
          Health check unavailable — verify /api/devstudio/health endpoint is deployed
        </p>
      )}
    </div>
  );
}
