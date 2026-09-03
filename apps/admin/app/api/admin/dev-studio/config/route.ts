import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getAdminUrl } from '@/lib/utils/siteUrl';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type WorkflowKey = 'deploy-all' | 'deploy-lms' | 'deploy-admin' | 'ci' | 'lint';

type ResponseShape = {
  quickCommands: string[];
  workflowButtons: { key: WorkflowKey; label: string; description: string }[];
  defaultPreviewUrl: string;
  previewTargets: { label: string; url: string }[];
  tabFiles: Record<string, string>;
};

function parse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

function normalizeAdminTarget(url: string, adminUrl: string): string {
  if (!url.startsWith(adminUrl)) return url;
  return url
    .replace(`${adminUrl}/admin/studio`, `${adminUrl}/studio`)
    .replace(`${adminUrl}/admin/course-builder`, `${adminUrl}/course-builder`)
    .replace(`${adminUrl}/admin`, `${adminUrl}/dashboard`);
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const adminUrl = getAdminUrl();
  const siteUrl = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  const fallback: ResponseShape = {
    quickCommands: [
      'Show git status','Show recent file changes','Check Dev Studio health','Show build errors',
      'List open ports','Show loaded secret names only','Open AI course builder','Run platform stabilize check',
    ],
    workflowButtons: [
      { key: 'deploy-all', label: 'Deploy All', description: 'Build and deploy LMS plus Admin on Northflank from main' },
      { key: 'deploy-lms', label: 'Deploy LMS', description: 'Build and deploy the LMS service on Northflank' },
      { key: 'deploy-admin', label: 'Deploy Admin', description: 'Build and deploy the Admin service on Northflank' },
      { key: 'ci', label: 'Run CI', description: 'Run the full validation pipeline' },
      { key: 'lint', label: 'Lint', description: 'Run the lint check' },
    ],
    defaultPreviewUrl: process.env.DEVSTUDIO_DEFAULT_PREVIEW_URL || process.env.DEVSTUDIO_PREVIEW_URL || siteUrl,
    previewTargets: [
      { label: 'Full Website', url: siteUrl },
      { label: 'Programs', url: `${siteUrl}/programs` },
      { label: 'Apply', url: `${siteUrl}/apply` },
      { label: 'Admin Dashboard', url: `${adminUrl}/dashboard` },
      { label: 'Course Builder', url: `${adminUrl}/course-builder` },
      { label: 'Dev Studio', url: `${adminUrl}/studio` },
      { label: 'LMS', url: process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org' },
    ],
    tabFiles: {
      studio: 'Studio', command: 'Studio', chat: 'Studio', ellie: 'Studio', deploy: 'Deploy',
      terminal: 'Studio', git: 'Files', services: 'Services', files: 'Files', explorer: 'Explorer',
      environments: 'Environments', website: 'Preview', preview: 'Preview', courses: 'Studio', course: 'Studio',
      container: 'Environments', docs: 'Files', documents: 'Files', secrets: 'Secrets', health: 'Health',
    },
  };

  try {
    const db = await requireAdminClient();
    const { data, error } = await db.from('platform_settings').select('key,value').in('key', [
      'DEVSTUDIO_QUICK_COMMANDS_JSON','DEVSTUDIO_WORKFLOW_BUTTONS_JSON','DEVSTUDIO_DEFAULT_PREVIEW_URL',
      'DEVSTUDIO_PREVIEW_TARGETS_JSON','DEVSTUDIO_TAB_FILES_JSON',
    ]);
    if (error) return NextResponse.json(fallback);
    const settings = new Map<string, string>((data ?? []).map((r) => [r.key, r.value ?? '']));
    const previewTargets = parse(settings.get('DEVSTUDIO_PREVIEW_TARGETS_JSON'), fallback.previewTargets)
      .map((target) => ({ ...target, url: normalizeAdminTarget(target.url, adminUrl) }));
    return NextResponse.json({
      quickCommands: parse(settings.get('DEVSTUDIO_QUICK_COMMANDS_JSON'), fallback.quickCommands),
      workflowButtons: parse(settings.get('DEVSTUDIO_WORKFLOW_BUTTONS_JSON'), fallback.workflowButtons),
      defaultPreviewUrl: settings.get('DEVSTUDIO_DEFAULT_PREVIEW_URL') || fallback.defaultPreviewUrl,
      previewTargets,
      tabFiles: parse(settings.get('DEVSTUDIO_TAB_FILES_JSON'), fallback.tabFiles),
    });
  } catch {
    return NextResponse.json(fallback);
  }
}
