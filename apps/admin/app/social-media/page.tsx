import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { CheckCircle2, FileText, Megaphone, Radio, Send, Settings, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SocialMediaPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  const [draftsRes, queuedRes, publishedRes, campaignsRes, accountsRes, blogRes] = await Promise.all([
    db.from('social_media_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    db.from('social_media_posts').select('id', { count: 'exact', head: true }).in('status', ['queued', 'scheduled']),
    db.from('social_media_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('social_campaigns').select('id', { count: 'exact', head: true }),
    db.from('social_media_settings').select('platform,profile_data,enabled,access_token,expires_at'),
    db
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('published', true)
      .eq('share_to_social', true),
  ]);

  const supportedPlatforms = ['facebook', 'instagram', 'linkedin', 'youtube'] as const;
  const rawAccounts = accountsRes.data ?? [];
  const accountByPlatform = new Map(
    rawAccounts
      .filter((account) => supportedPlatforms.includes(account.platform as typeof supportedPlatforms[number]))
      .map((account) => [account.platform, account]),
  );
  const accounts = supportedPlatforms.map((platform) => ({
    platform,
    account: accountByPlatform.get(platform),
  }));
  const connected = accounts.filter((account) =>
    account.account?.enabled !== false && Boolean(account.account?.access_token) &&
    (!account.account?.expires_at || new Date(account.account.expires_at) > new Date()),
  );

  const stats = [
    { label: 'Blog-ready articles', value: blogRes.count ?? 0, icon: FileText },
    { label: 'Social drafts', value: draftsRes.count ?? 0, icon: Megaphone },
    { label: 'Queued / scheduled', value: queuedRes.count ?? 0, icon: Send },
    { label: 'Published', value: publishedRes.count ?? 0, icon: Radio },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue-700">Marketing operations</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Social Media</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Blog content, campaign configuration, social drafts, account connectivity, scheduling, and publishing status from the canonical Supabase tables.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/blog" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100">
              Manage Blog
            </Link>
            <Link href="/social-media/campaigns/new" className="rounded-lg bg-brand-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-800">
              New Campaign
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="h-5 w-5 text-brand-blue-700" />
              <p className="mt-4 text-3xl font-black tabular-nums text-slate-950">{value}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-slate-700" />
              <h2 className="text-lg font-bold text-slate-950">Account connectivity</h2>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Draft preparation works independently from external publishing. Publishing should remain blocked until a selected platform has an active authenticated account.
            </p>
            <div className="mt-5 divide-y divide-slate-100">
              {accounts.map(({ platform, account }) => {
                  const isConnected = account?.enabled !== false && Boolean(account?.access_token) &&
                    (!account?.expires_at || new Date(account.expires_at) > new Date());
                  const profile = account?.profile_data && typeof account.profile_data === 'object'
                    ? account.profile_data as Record<string, unknown>
                    : null;
                  const accountName = typeof profile?.name === 'string'
                    ? profile.name
                    : typeof profile?.username === 'string'
                      ? profile.username
                      : null;
                  return (
                    <div key={platform} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{platform === 'youtube' ? 'YouTube' : platform.charAt(0).toUpperCase() + platform.slice(1)}</p>
                        <p className="truncate text-sm text-slate-500">{accountName ?? (isConnected ? 'Connected account' : 'No account connected')}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${isConnected ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}>
                          {isConnected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {isConnected ? 'Connected' : 'Needs connection'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
            <Link href="/settings/social-media" className="mt-5 inline-flex rounded-lg bg-brand-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-blue-800 focus:outline-none focus:ring-2 focus:ring-brand-blue-700 focus:ring-offset-2">
              Manage account connections
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Release status</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Configured accounts</dt>
                <dd className="font-bold text-slate-900">{rawAccounts.filter((account) => supportedPlatforms.includes(account.platform as typeof supportedPlatforms[number])).length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Connected accounts</dt>
                <dd className="font-bold text-slate-900">{connected.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Campaign records</dt>
                <dd className="font-bold text-slate-900">{campaignsRes.count ?? 0}</dd>
              </div>
            </dl>
            <div className="mt-6 rounded-xl bg-slate-100 p-4 text-sm leading-relaxed text-slate-700">
              Blog-to-social draft generation is a separate stage from publishing. This prevents a published article from automatically posting to disconnected or unreviewed external accounts.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
