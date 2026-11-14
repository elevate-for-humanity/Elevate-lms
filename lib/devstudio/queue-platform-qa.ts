import 'server-only';
import { getGitHubToken } from '@/lib/devstudio/github-token';

const repository = 'elevate-for-humanity/Elevate-lms';
const workflow = 'ci.yml';
type QaDispatch =
  | { status: 'queued'; workflow: string; ref: string; reportUrl: string }
  | { status: 'failed'; error: string; httpStatus: number; providerStatus?: number };

/** The web process dispatches checks; GitHub CI owns their execution and result. */
export async function queuePlatformQa(): Promise<QaDispatch> {
  try {
    const token = await getGitHubToken();
    if (!token) return { status: 'failed', error: 'GitHub CI dispatch is not configured', httpStatus: 503 };
    const response = await fetch(`https://api.github.com/repos/${repository}/actions/workflows/${workflow}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (response.status !== 204) return { status: 'failed', error: 'GitHub rejected the QA dispatch', httpStatus: 502, providerStatus: response.status };
    return { status: 'queued', workflow, ref: 'main', reportUrl: `https://github.com/${repository}/actions/workflows/${workflow}` };
  } catch {
    return { status: 'failed', error: 'Unable to queue the QA workflow', httpStatus: 503 };
  }
}
