/**
 * Dev Studio Runtime — the AWS ECS worker (elevate-studio) that clones the repo,
 * runs pnpm, and serves the PTY used for git/build/terminal in Dev Studio.
 *
 * User-facing name is intentionally NOT "shell" — that implied a separate,
 * unfinished product. Env vars keep the STUDIO_SHELL_* prefix for backwards compatibility.
 */

import type { ShellProbe } from '@/lib/devstudio/shell-probe';

export const DEV_STUDIO_RUNTIME_LABEL = 'Dev Studio Runtime';
export const DEV_STUDIO_RUNTIME_ECS_SERVICE = 'elevate-studio';

export type StudioRuntimePhase =
  | 'not_configured'
  | 'offline'
  | 'booting'
  | 'ready';

export type StudioRuntimeStep = {
  id: string;
  label: string;
  done: boolean;
  detail?: string;
};

export type StudioRuntimeCompletion = {
  label: typeof DEV_STUDIO_RUNTIME_LABEL;
  phase: StudioRuntimePhase;
  complete: boolean;
  steps: StudioRuntimeStep[];
};

export function buildStudioRuntimeCompletion(input: {
  adminConfigured: boolean;
  probe: ShellProbe;
  hasGitHubToken: boolean;
  aiConfigured: boolean;
}): StudioRuntimeCompletion {
  const setup = input.probe.setupStatus ?? '';
  const missingGithub =
    setup.includes('missing GITHUB_TOKEN') || setup.includes('GITHUB_TOKEN');

  const steps: StudioRuntimeStep[] = [
    {
      id: 'admin-wiring',
      label: 'Admin app wired to runtime',
      done: input.adminConfigured,
      detail: input.adminConfigured
        ? 'STUDIO_SHELL_WS_URL + secrets present on admin task'
        : 'Set STUDIO_SHELL_WS_URL, STUDIO_SHELL_SECRET, and STUDIO_TOKEN_SECRET (SSM → admin ECS task), then redeploy admin',
    },
    {
      id: 'ecs-running',
      label: 'Runtime service running on AWS',
      done: input.probe.reachable,
      detail: input.probe.reachable
        ? 'Internal /health reachable'
        : 'Services → Dev Studio Runtime → Start, or run the Deploy Studio GitHub workflow',
    },
    {
      id: 'github-token',
      label: 'GitHub token on runtime task',
      done: input.hasGitHubToken && !missingGithub,
      detail: missingGithub
        ? 'Add GITHUB_TOKEN to elevate-studio ECS task (SSM /elevate/GITHUB_TOKEN)'
        : input.hasGitHubToken
          ? 'Token available for clone'
          : 'Set GITHUB_TOKEN in Secrets or SSM for the studio task',
    },
    {
      id: 'repo-ready',
      label: 'Repo cloned and pnpm install finished',
      done: input.probe.ready,
      detail: input.probe.ready
        ? 'Runtime ready for terminal and git commands'
        : setup
          ? `Current step: ${setup}`
          : input.probe.reachable
            ? 'Usually 3–8 minutes after start or restart'
            : 'Start the runtime task first',
    },
    {
      id: 'ai',
      label: 'AI keys for Ask / Run',
      done: input.aiConfigured,
      detail: input.aiConfigured
        ? 'At least one provider configured'
        : 'Add GROQ_API_KEY or OPENAI_API_KEY in Dev Studio → Secrets',
    },
  ];

  const coreDone =
    steps.find((s) => s.id === 'admin-wiring')?.done &&
    steps.find((s) => s.id === 'ecs-running')?.done &&
    steps.find((s) => s.id === 'repo-ready')?.done;

  let phase: StudioRuntimePhase = 'not_configured';
  if (!input.adminConfigured) phase = 'not_configured';
  else if (!input.probe.reachable) phase = 'offline';
  else if (!input.probe.ready) phase = 'booting';
  else phase = 'ready';

  return {
    label: DEV_STUDIO_RUNTIME_LABEL,
    phase,
    complete: Boolean(coreDone),
    steps,
  };
}
