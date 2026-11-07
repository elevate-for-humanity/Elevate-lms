import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getGitHubAppToken } from '@/lib/devstudio/github-app-token';
import { readGitHubBranchPolicy } from '@/lib/devstudio/github-branch-policy.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;
  const headers = { 'Cache-Control': 'no-store' };
  try {
    // Do not select the workflow token or legacy PAT: this checks the owned App.
    const result = await readGitHubBranchPolicy(await getGitHubAppToken());
    return NextResponse.json(result, { status: result.ok ? 200 : 503, headers });
  } catch {
    // Upstream errors and credential material must never reach the client.
    return NextResponse.json({ ok: false, reason: 'github_app_policy_check_unavailable' }, { status: 503, headers });
  }
}
