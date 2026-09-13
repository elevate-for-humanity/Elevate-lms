import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  FileText,
  Image as ImageIcon,
  Megaphone,
  Radio,
  Settings,
  ShieldCheck,
  Sparkles,
  Video,
  XCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const platformLabel = (platform: string) =>
  platform === 'google_business'
    ? 'Google Business Profile'
    : platform === 'youtube'
      ? 'YouTube'
      : platform.charAt(0).toUpperCase() + platform.slice(1);

export default async function SocialMediaPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  const [postsResult, campaignsResult, accountsResult, blogsResult] = await Promise.all([
    db
      .from('social_media_posts')
      .select(
        'id,title,platform,destination_type,post_type,status,approval_state,scheduled_at,created_at,media_url,thumbnail_url,error_message',
      )
      .order('created_at', { ascending: false })
      .limit(18),
    db
      .from('social_campaigns')
      .select('id,name,status,platform,created_at,metadata')
      .order('created_at', { ascending: false })
      .limit(6),
    db
      .from('social_media_settings')
      .select(
        'platform,profile_data,enabled,expires_at,organization_id,connection_status,last_verified_at,dry_run',
      ),
    db
      .from('blog_posts')
      .select('id,title,slug,excerpt,featured_image,published_at,social_posted_at')
      .eq('published', true)
      .eq('share_to_social', true)
      .order('published_at', { ascending: false })
      .limit(8),
  ]);

  const posts = postsResult.data ?? [];
  const campaigns = campaignsResult.data ?? [];
  const blogs = blogsResult.data ?? [];
  const supportedPlatforms = [
    'facebook',
    'instagram',
    'google_business',
    'linkedin',
    'youtube',
  ] as const;
  const accountByPlatform = new Map(
    (accountsResult.data ?? []).map((account) => [account.platform, account]),
  );
  const accounts = supportedPlatforms.map((platform) => ({
    platform,
    account: accountByPlatform.get(platform),
  }));
  const connected = accounts.filter(
    ({ account }) =>
      account?.enabled === true &&
      account.connection_status === 'verified_read_only' &&
      (!account.expires_at || new Date(account.expires_at) > new Date()),
  );
  const pendingApproval = posts.filter((post) => post.approval_state === 'pending').length;
  const reelDrafts = posts.filter(
    (post) => post.destination_type?.includes('reel') || post.post_type?.includes('reel'),
  ).length;
  const scheduled = posts.filter((post) => ['scheduled', 'queued'].includes(post.status)).length;
  const published = posts.filter((post) => ['published', 'posted'].includes(post.status)).length;

  const stats = [
    {
      label: 'Approval queue',
      value: pendingApproval,
      icon: ShieldCheck,
      accent: 'bg-amber-100 text-amber-800',
    },
    {
      label: 'Reel packages',
      value: reelDrafts,
      icon: Video,
      accent: 'bg-violet-100 text-violet-800',
    },
    {
      label: 'Scheduled',
      value: scheduled,
      icon: CalendarClock,
      accent: 'bg-blue-100 text-blue-800',
    },
    {
      label: 'Published',
      value: published,
      icon: Radio,
      accent: 'bg-emerald-100 text-emerald-800',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="overflow-hidden border-b border-slate-800 bg-[radial-gradient(circle_at_80%_20%,_rgba(59,130,246,.35),_transparent_30%),linear-gradient(135deg,#020617,#111827)] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[.28em] text-blue-300">
                Owned marketing operations
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
                One newsroom for Elevate blogs, social posts, Reels and local visibility.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
                Published Elevate articles flow into deterministic caption and Reel packages.
                Administrators review every public destination, while disconnected platforms stay
                visibly blocked instead of reporting false success.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/social-media/campaigns/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black hover:bg-blue-500"
                >
                  <Sparkles className="h-4 w-4" /> Build from approved blogs
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black hover:bg-white/15"
                >
                  <FileText className="h-4 w-4" /> Manage blog library
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <p className="text-3xl font-black">{blogs.length}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-300">
                  Recent source articles
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <p className="text-3xl font-black">{connected.length}/5</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-300">
                  Verified connections
                </p>
              </div>
              <div className="col-span-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <div className="flex items-center gap-2 text-sm font-black text-emerald-200">
                  <ShieldCheck className="h-4 w-4" /> Public writes remain approval-gated
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-300">
                  Content preparation uses no paid AI or GPU. Provider publishing runs only for
                  approved, scheduled records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className={`inline-flex rounded-xl p-2.5 ${accent}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-3xl font-black tabular-nums text-slate-950">{value}</p>
              <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[.2em] text-blue-700">
                  Editorial feed
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Approved blog source library
                </h2>
              </div>
              <Link href="/blog" className="text-sm font-black text-blue-700 hover:text-blue-900">
                View all articles
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {blogs.length ? (
                blogs.map((blog) => (
                  <article
                    key={blog.id}
                    className="grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[84px_1fr_auto] sm:items-center"
                  >
                    <div className="flex h-16 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100 sm:w-[84px]">
                      {blog.featured_image ? (
                        <ImageIcon className="h-6 w-6 text-blue-700" />
                      ) : (
                        <FileText className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-black text-slate-900">{blog.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                        {blog.excerpt ||
                          'Published Elevate article ready for an editorial package.'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">
                          Published
                        </span>
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-800">
                          Social enabled
                        </span>
                        {blog.featured_image && (
                          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-800">
                            Media ready
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/blog/management/${blog.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-black text-blue-700"
                    >
                      Open <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                  <FileText className="mx-auto h-8 w-8" />
                  <p className="mt-3 font-bold">No social-enabled articles were found.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-blue-700" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">
                    Production queue
                  </p>
                  <h2 className="text-xl font-black text-slate-950">Recent content packages</h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {posts.slice(0, 8).map((post) => (
                  <div key={post.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">
                          {post.title || 'Elevate content package'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {platformLabel(post.platform || '')} ·{' '}
                          {(post.destination_type || post.post_type || 'draft').replaceAll(
                            '_',
                            ' ',
                          )}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${post.approval_state === 'approved' ? 'bg-emerald-100 text-emerald-800' : post.status === 'configuration_required' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}
                      >
                        {post.status.replaceAll('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
                {!posts.length && (
                  <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                    The queue is empty.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">
                    Connections
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Publishing destinations
                  </h2>
                </div>
                <Settings className="h-5 w-5 text-slate-500" />
              </div>
              <div className="mt-5 divide-y divide-slate-100">
                {accounts.map(({ platform, account }) => {
                  const isConnected =
                    account?.enabled === true &&
                    account.connection_status === 'verified_read_only' &&
                    (!account.expires_at || new Date(account.expires_at) > new Date());
                  return (
                    <div key={platform} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {platformLabel(platform)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {isConnected
                            ? account?.dry_run === false
                              ? 'Verified for approved publishing'
                              : 'Verified read-only'
                            : 'Authorization required'}
                        </p>
                      </div>
                      {isConnected ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                  );
                })}
              </div>
              <Link
                href="/settings/social-media"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
              >
                Manage connections <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-blue-700">
                Campaigns
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Saved editorial plans</h2>
            </div>
            <Link
              href="/social-media/campaigns/new"
              className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-800"
            >
              New campaign
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900">{campaign.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{campaign.platform}</p>
                  </div>
                  <CircleDashed className="h-5 w-5 text-blue-600" />
                </div>
                <span className="mt-5 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black capitalize text-slate-700">
                  {campaign.status}
                </span>
              </div>
            ))}
            {!campaigns.length && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No campaign plans have been saved.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
