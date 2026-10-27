import 'server-only';
import policy from '@/config/google-runtime-policy.json';

export type GoogleServiceKey = 'marketing' | 'lms' | 'admin' | 'store';
export type GoogleServiceSummary = {
  id: string;
  key: GoogleServiceKey;
  label: string;
  url: string;
  healthPath: string;
};

export function getGoogleServices(): GoogleServiceSummary[] {
  return [
    {
      key: 'marketing',
      id: policy.components.marketing.service,
      label: 'Marketing / Public Site',
      url: process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
      healthPath: '/api/health',
    },
    {
      key: 'lms',
      id: policy.components.lms.service,
      label: 'LMS / Student App',
      url:
        process.env.NEXT_PUBLIC_LMS_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'https://app.elevateforhumanity.org',
      healthPath: '/api/health',
    },
    {
      key: 'admin',
      id: policy.components.admin.service,
      label: 'Admin Dashboard',
      url: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org',
      healthPath: '/api/health',
    },
    {
      key: 'store',
      id: policy.components.store.service,
      label: 'Store',
      url: process.env.NEXT_PUBLIC_STORE_URL || 'https://store.elevateforhumanity.org',
      healthPath: '/api/health',
    },
  ];
}

export function googleProjectId() {
  return policy.project;
}
export function googleRegion() {
  return policy.region;
}
export function isGoogleRuntimeReady() {
  return Boolean(
    process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || process.env.K_SERVICE,
  );
}

export async function getGoogleService(service: GoogleServiceSummary) {
  const url = new URL(service.healthPath, service.url);
  const hostname = url.hostname.toLowerCase();
  if (
    ['northflank.app', 'northflank.com', 'code.run'].some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    )
  ) {
    throw new Error('Retired hosting URL: configure the Google service URL');
  }
  const response = await fetch(url.toString(), {
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(8000),
  });
  const body = await response.json().catch(() => null);
  const ready = body?.ready === true;
  const healthy =
    response.ok &&
    ready &&
    body?.service === service.key &&
    body?.healthy === true &&
    body?.configuration?.ok === true &&
    body?.dependencies?.supabase?.ok === true;
  return {
    status: healthy ? 'healthy' : 'unhealthy',
    httpStatus: response.status,
    commit: body?.commit || body?.commitSha || null,
    ready,
    healthy,
  };
}
