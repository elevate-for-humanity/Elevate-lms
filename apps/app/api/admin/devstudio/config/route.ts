import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { getAdminUrl } from '@/lib/utils/siteUrl';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type WorkflowKey = 'deploy-all' | 'deploy-lms' | 'deploy-admin' | 'ci' | 'lint';

interface DevStudioConfigResponse {
  quickCommands: string[];
  workflowButtons: { key: WorkflowKey; label: string; description: string }[];
  defaultPreviewUrl: string;
  previewTargets: { label: string; url: string }[];
  tabFiles: Record<string, string>;
}

function parseJsonSetting<T>(
  value: string | null | undefined,
  fallback: T,
  key: string,
  validate?: (parsed: unknown) => parsed is T,
): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (validate && !validate(parsed)) {
      logger.warn(`[devstudio/config] invalid shape for ${key}, using fallback`);
      return fallback;
    }
    return parsed as T;
  } catch (error) {
    logger.warn(`[devstudio/config] failed to parse ${key}, using fallback`, error);
    return fallback;
  }
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item) => typeof item === 'string');
}

function isWorkflowButtons(
  v: unknown,
): v is { key: WorkflowKey; label: string; description: string }[] {
  const validKeys: WorkflowKey[] = ['deploy-all', 'deploy-lms', 'deploy-admin', 'ci', 'lint'];
  return (
    Array.isArray(v) &&
    v.every((item): item is { key: WorkflowKey; label: string; description: string } => {
      if (!item || typeof item !== 'object') return false;
      if (!('key' in item) || !('label' in item) || !('description' in item)) return false;
      const key = item.key;
      const label = item.label;
      const description = item.description;
      return (
        typeof key === 'string' &&
        validKeys.includes(key as WorkflowKey) &&
        typeof label === 'string' &&
        typeof description === 'string'
      );
    })
  );
}

function isPreviewTargets(v: unknown): v is { label: string; url: string }[] {
  return (
    Array.isArray(v) &&
    v.every((item): item is { label: string; url: string } => {
      if (!item || typeof item !== 'object') return false;
      if (!('label' in item) || !('url' in item)) return false;
      return typeof item.label === 'string' && typeof item.url === 'string';
    })
  );
}

function isRecordString(v: unknown): v is Record<string, string> {
  return !!v && typeof v === 'object' && Object.values(v).every((val) => typeof val === 'string');
}

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const adminUrl = getAdminUrl();
  const publicSiteUrl = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  const configuredPreviewUrl =
    process.env.DEVSTUDIO_DEFAULT_PREVIEW_URL || process.env.DEVSTUDIO_PREVIEW_URL;

  const fallback: DevStudioConfigResponse = {
    quickCommands: [
      'Show git status',
      'Show recent file changes',
      'Check Dev Studio health',
      'Show build errors',
      'List open ports',
      'Show loaded secret names only',
      'Open AI course builder',
      'Run platform stabilize check',
    ],
    workflowButtons: [
      { key: 'deploy-all', label: 'Deploy All', description: 'Build and deploy LMS plus Admin on Northflank from main' },
      { key: 'deploy-lms', label: 'Deploy Website', description: 'Build and deploy the public website service on Northflank' },
      { key: 'deploy-admin', label: 'Deploy Admin', description: 'Build and deploy the admin service on Northflank' },
      {
        key: 'deploy-all',
        label: 'Deploy All',
        description: 'Build and deploy LMS plus Admin on Northflank from main',
      },
      {
        key: 'deploy-lms',
        label: 'Deploy Website',
        description: 'Build and deploy the public website service on Northflank',
      },
      {
        key: 'deploy-admin',
        label: 'Deploy Admin',
        description: 'Build and deploy the admin service on Northflank',
      },
      { key: 'ci', label: 'Run CI', description: 'Run the full validation pipeline' },
      { key: 'lint', label: 'Lint', description: 'Run the lint check' },
    ],
    defaultPreviewUrl: configuredPreviewUrl || publicSiteUrl,
    previewTargets: [
      ...(process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SITE_URL
        ? [
            { label: 'Local Website', url: process.env.NEXT_PUBLIC_SITE_URL },
            { label: 'Local Admin', url: process.env.NEXT_PUBLIC_ADMIN_URL || adminUrl },
          ]
        : []),
      { label: 'Full Website', url: publicSiteUrl },
      { label: 'Homepage', url: `${publicSiteUrl}/` },
      { label: 'Programs', url: `${publicSiteUrl}/programs` },
      { label: 'CNA Program', url: `${publicSiteUrl}/programs/cna` },
      { label: 'Store', url: `${publicSiteUrl}/store` },
      { label: 'Apply', url: `${publicSiteUrl}/apply` },
      { label: 'Admin Dashboard', url: `${adminUrl}/admin` },
      { label: 'Course Builder', url: `${adminUrl}/admin/courses/create` },
      { label: 'Admin Applications', url: `${adminUrl}/admin/applications` },
      { label: 'Dev Studio', url: `${adminUrl}/admin/dev-studio` },
    ],
    tabFiles: {
      studio: 'Studio',
      command: 'Studio',
      chat: 'Studio',
      ellie: 'Studio',
      deploy: 'Deploy',
      terminal: 'Studio',
      git: 'Files',
      services: 'Services',
      files: 'Files',
      explorer: 'Explorer',
      environments: 'Environments',
      website: 'Preview',
      preview: 'Preview',
      courses: 'Studio',
      course: 'Studio',
      container: 'Environments',
      docs: 'Files',
      documents: 'Files',
      secrets: 'Secrets',
      health: 'Health',
    },
  };

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('platform_settings')
      .select('key, value')
      .in('key', [
        'DEVSTUDIO_QUICK_COMMANDS_JSON',
        'DEVSTUDIO_WORKFLOW_BUTTONS_JSON',
        'DEVSTUDIO_DEFAULT_PREVIEW_URL',
        'DEVSTUDIO_PREVIEW_TARGETS_JSON',
        'DEVSTUDIO_TAB_FILES_JSON',
      ]);

    if (error) throw error;

    const settings = new Map<string, string>((data ?? []).map((r) => [r.key, r.value ?? '']));

    const response: DevStudioConfigResponse = {
      quickCommands: parseJsonSetting<string[]>(
        settings.get('DEVSTUDIO_QUICK_COMMANDS_JSON'),
        fallback.quickCommands,
        'DEVSTUDIO_QUICK_COMMANDS_JSON',
        isStringArray,
      ),
      workflowButtons: parseJsonSetting<DevStudioConfigResponse['workflowButtons']>(
        settings.get('DEVSTUDIO_WORKFLOW_BUTTONS_JSON'),
        fallback.workflowButtons,
        'DEVSTUDIO_WORKFLOW_BUTTONS_JSON',
        isWorkflowButtons,
      ),
      defaultPreviewUrl:
        settings.get('DEVSTUDIO_DEFAULT_PREVIEW_URL') || fallback.defaultPreviewUrl,
      previewTargets: parseJsonSetting<DevStudioConfigResponse['previewTargets']>(
        settings.get('DEVSTUDIO_PREVIEW_TARGETS_JSON'),
        fallback.previewTargets,
        'DEVSTUDIO_PREVIEW_TARGETS_JSON',
        isPreviewTargets,
      ),
      tabFiles: parseJsonSetting<Record<string, string>>(
        settings.get('DEVSTUDIO_TAB_FILES_JSON'),
        fallback.tabFiles,
        'DEVSTUDIO_TAB_FILES_JSON',
        isRecordString,
      ),
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.warn('[devstudio/config] falling back to defaults', error);
    return NextResponse.json(fallback);
  }
}
