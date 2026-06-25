import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createAdminClient } from '@/lib/supabase/admin';
import SiteStatsClient from './SiteStatsClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: `Site Stats | Admin | ${process.env.NEXT_PUBLIC_ORG_NAME ?? PLATFORM_DEFAULTS.orgName}`,
  description: 'Edit public-facing site statistics shown on the homepage and program pages.',
  robots: { index: false, follow: false },
};

const STAT_KEYS = [
  'stat_job_placement_rate',
  'stat_programs_offered',
  'stat_credentials_issued',
  'stat_employer_partners',
  'stat_funding_secured_usd',
  'stat_students_display',
] as const;

async function getCurrentStats(): Promise<Record<string, string>> {
  try {
    const db = await getAdminClient();
    const { data } = await db
      .from('platform_settings')
      .select('key, value')
      .in('key', [...STAT_KEYS]);

    const map: Record<string, string> = {};
    for (const row of data ?? []) {
      map[row.key] = row.value ?? '';
    }
    return map;
  } catch {
    return {};
  }
}

export default async function SiteStatsPage() {
  await requireRole(['admin']);
  const current = await getCurrentStats();
  return <SiteStatsClient current={current} statKeys={[...STAT_KEYS]} />;
}
