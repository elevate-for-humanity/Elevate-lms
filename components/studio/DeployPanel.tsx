'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ExternalLink, GitBranch, Loader2, Play, RefreshCw, Rocket, XCircle } from 'lucide-react';
import PublishWebsiteDevPanel from '@/components/studio/PublishWebsiteDevPanel';

type WorkflowKey = 'deploy-lms' | 'deploy-admin' | 'ci' | 'lint' | string;

interface WorkflowButton {
  key: WorkflowKey;
  label: string;
  description: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  url: string;
  jobs?: { id: number; name: string; status: string; conclusion: string | null; url: string }[];
}

interface DispatchResult {
  ok: boolean;
  workflow: string;
  method: string;
  runId: number | null;
  runUrl: string;
  status: string;
  error?: string;
}

const DEFAULT_WORKFLOWS: WorkflowButton[] = [
  { key: 'deploy-all', label: 'Deploy All', description: 'Build and deploy LMS plus Admin on Northflank from main' },
  { key: 'deploy-lms', label: 'Deploy Website', description: 'Build and deploy the public website service on Northflank' },
  { key: 'deploy-admin', label: 'Deploy Admin', description: 'Build and deploy the admin dashboard service on Northflank' },
  { key: 'ci', label: 'Run CI', description: 'Run the validation pipeline before deployment' },
  { key: 'lint', label: 'Run Lint', description: 'Run lint checks against the repository' },
];

function statusTone(status?: string, conclusion?: string | null) {
  if (conclusion === 'success') return { color: '#4ade80', Icon: CheckCircle2, label: 'Passed' };
  if (conclusion === 'failure' || conclusion === 'cancelled') return { color: '#f87171', Icon: XCircle, label: conclusion };
  if (status === 'queued' || status === 'in_progress') return { color: '#f59e0b', Icon: Loader2, label: status.replace('_', ' ') };
  return { color: '#94a3b8', Icon: Activity, label: status || 'ready' };
}

export default function DeployPanel({ workflowButtons }: { workflowButtons?: WorkflowButton[] }) {
  const workflows = useMemo(() => workflowButtons?.length ? workflowButtons : DEFAULT_WORKFLOWS, [workflowButtons]);
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<DispatchResult | null>(null);
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [deployAllState, setDeployAllState] = useState<'idle' | 'confirm' | 'loading'>('idle');
  const [gitPushState, setGitPushState] = useState<'idle' | 'confirm' | 'loading'>('idle');

  async function dispatchWorkflow(workflow: WorkflowButton) {
    if (workflow.key.startsWith('deploy-') && confirmKey !== workflow.key) {
      setConfirmKey(workflow.key);
      return;
    }

    setConfirmKey(null);
    setRunningKey(workflow.key);
    setError(null);
    setRun(null);

    try {
      const res = await fetch('/api/devstudio/shell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: workflow.key }),
      });
      const data = await res.json().catch(() => ({})) as DispatchResult;
      if (!res.ok || data.error) throw new Error(data.error || `Dispatch failed with HTTP ${res.status}`);
      setLastResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start workflow');
    } finally {
      setRunningKey(null);
    }
  }

  async function refreshRun() {
    if (!lastResult?.runId) return;
    try {
      const res = await fetch(`/api/devstudio/shell?run_id=${lastResult.runId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Status failed with HTTP ${res.status}`);
      setRun(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refresh workflow status');
    }
  }


  async function pushCurrentBranchToMain() {
    if (gitPushState !== 'confirm') {
      setGitPushState('confirm');
      return;
    }

    setGitPushState('loading');
    setError(null);
    try {
      const res = await fetch('/api/devstudio/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'configure-and-push', targetBranch: 'main', confirmation: 'CONFIRM PUSH' }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string; sourceBranch?: string; targetBranch?: string };
      if (!res.ok || data.error) throw new Error(data.error || `Git push failed with HTTP ${res.status}`);
      setLastResult({
        ok: true,
        workflow: 'git-push-main',
        method: 'git-push',
        runId: null,
        runUrl: 'https://github.com/elevate-for-humanity/Elevate-lms/actions',
        status: `pushed ${data.sourceBranch ?? 'current'} → ${data.targetBranch ?? 'main'}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not push current branch to main');
    } finally {
      setGitPushState('idle');
    }
  }

  async function deployAll() {
    if (deployAllState !== 'confirm') {
      setDeployAllState('confirm');
      return;
    }

    setDeployAllState('loading');
    setError(null);
    try {
      const res = await fetch('/api/devstudio/shell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: 'deploy-production-dispatch' }),
      });
      const data = await res.json().catch(() => ({})) as DispatchResult;
      if (!res.ok || data.error) throw new Error(data.error || `Deploy failed with HTTP ${res.status}`);
      setLastResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not trigger Northflank deploy');
    } finally {
      setDeployAllState('idle');
    }
  }

  useEffect(() => {
    if (!lastResult?.runId) return;
    refreshRun();
    const timer = window.setInterval(refreshRun, 5000);
    return () => window.clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResult?.runId]);

  const activeStatus = statusTone(run?.status ?? lastResult?.status, run?.conclusion);
  const ActiveIcon = activeStatus.Icon;

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: '#1e1e1e' }}>
      <div className="flex-shrink-0 border-b px-4 py-3" style={{ background: '#252526', borderColor: '#3c3c3c' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4" style={{ color: '#4ec9b0' }} />
              <h2 className="text-sm font-semibold text-white">Northflank Deploy Control</h2>
            </div>
            <p className="mt-1 text-[11px]" style={{ color: '#858585' }}>
              Dispatch GitHub Actions workflows that build and deploy on Northflank.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={pushCurrentBranchToMain}
              disabled={gitPushState === 'loading'}
              className="inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-semibold text-white transition hover:border-brand-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ borderColor: gitPushState === 'confirm' ? '#f59e0b' : '#3c3c3c', background: gitPushState === 'confirm' ? '#92400e' : '#1f2937' }}
              title="Configure git origin and push this container branch to main using GITHUB_TOKEN/GH_TOKEN/GITHUB_PAT."
            >
              {gitPushState === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitBranch className="h-3.5 w-3.5" />}
              {gitPushState === 'confirm' ? 'Confirm Push Main' : 'Push Main'}
            </button>
            <button
              type="button"
              onClick={deployAll}
              disabled={deployAllState === 'loading'}
              className="inline-flex h-8 items-center gap-1.5 rounded px-2 text-[11px] font-semibold disabled:opacity-50"
              style={{
                background: deployAllState === 'confirm' ? '#f59e0b' : '#0078d4',
                color: deployAllState === 'confirm' ? '#111827' : '#ffffff',
              }}
            >
              {deployAllState === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
              {deployAllState === 'confirm' ? 'Confirm Deploy All' : 'Deploy All'}
            </button>
            <button
              type="button"
              onClick={refreshRun}
              disabled={!lastResult?.runId}
              className="inline-flex h-8 items-center gap-1.5 rounded border px-2 text-[11px] disabled:opacity-40"
              style={{ borderColor: '#3c3c3c', color: '#cccccc' }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded border px-3 py-2 text-xs" style={{ borderColor: '#7f1d1d', background: 'rgba(127,29,29,0.22)', color: '#fecaca' }}>
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workflows.map((workflow) => {
            const pending = runningKey === workflow.key;
            const needsConfirm = confirmKey === workflow.key;
            return (
              <div key={workflow.key} className="rounded-md border p-3" style={{ borderColor: needsConfirm ? '#f59e0b' : '#3c3c3c', background: '#252526' }}>
                <div className="mb-3 flex min-h-12 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{workflow.label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed" style={{ color: '#9ca3af' }}>{workflow.description}</p>
                  </div>
                  <Rocket className="h-4 w-4 flex-shrink-0" style={{ color: '#4ec9b0' }} />
                </div>

                {needsConfirm && (
                  <p className="mb-2 rounded border px-2 py-1.5 text-[11px]" style={{ borderColor: '#f59e0b', color: '#fcd34d', background: 'rgba(245,158,11,0.08)' }}>
                    Click again to deploy production.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => dispatchWorkflow(workflow)}
                  disabled={pending}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded text-xs font-semibold transition disabled:opacity-50"
                  style={{ background: needsConfirm ? '#f59e0b' : '#0078d4', color: needsConfirm ? '#111827' : '#ffffff' }}
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  {workflow.key.startsWith('deploy-')
                    ? needsConfirm
                      ? 'Confirm Deploy'
                      : 'Deploy'
                    : 'Run'}
                </button>
              </div>
            );
          })}
        </div>

        <PublishWebsiteDevPanel />

        {(lastResult || run) && (
          <section className="mt-4 rounded-md border" style={{ borderColor: '#3c3c3c', background: '#252526' }}>
            <div className="flex items-center justify-between gap-3 border-b px-3 py-2" style={{ borderColor: '#3c3c3c' }}>
              <div className="flex items-center gap-2">
                <ActiveIcon className={`h-4 w-4 ${activeStatus.Icon === Loader2 ? 'animate-spin' : ''}`} style={{ color: activeStatus.color }} />
                <span className="text-xs font-semibold text-white">{run?.name ?? lastResult?.workflow}</span>
                <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ color: activeStatus.color, background: '#1e1e1e' }}>
                  {activeStatus.label}
                </span>
              </div>
              {(run?.url || lastResult?.runUrl) && (
                <a
                  href={run?.url || lastResult?.runUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px]"
                  style={{ color: '#4ec9b0' }}
                >
                  <ExternalLink className="h-3 w-3" />
                  GitHub Actions
                </a>
              )}
            </div>

            {run?.jobs?.length ? (
              <div className="divide-y" style={{ borderColor: '#3c3c3c' }}>
                {run.jobs.map((job) => {
                  const tone = statusTone(job.status, job.conclusion);
                  const JobIcon = tone.Icon;
                  return (
                    <a
                      key={job.id}
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                      style={{ color: '#cccccc', borderColor: '#3c3c3c' }}
                    >
                      <span className="truncate">{job.name}</span>
                      <span className="inline-flex items-center gap-1.5" style={{ color: tone.color }}>
                        <JobIcon className={`h-3.5 w-3.5 ${JobIcon === Loader2 ? 'animate-spin' : ''}`} />
                        {tone.label}
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="px-3 py-3 text-[11px]" style={{ color: '#858585' }}>
                Workflow queued. Job details will appear when GitHub reports the run.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
