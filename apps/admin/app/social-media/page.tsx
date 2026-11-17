import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { hasAnyRole } from '@/lib/rbac/role-matrix';
import {
  postPublishingReadinessError,
  publishingReadinessError,
  reviewablePostStatuses,
} from '@/lib/social/publishing-readiness';
import { approveSocialPost, enableApprovedPublishing } from './actions';
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

const PAGE_SIZE = 8;

const platformLabel = (platform: string) =>
  platform === 'google_business'
    ? 'Google Business Profile'
    : platform === 'youtube'
      ? 'YouTube'
      : platform.charAt(0).toUpperCase() + platform.slice(1);

export default async function SocialMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; page?: string; queue?: string }>;
}) {
  const params = await searchParams;
  const { effectiveRoles } = await requireRole(['admin', 'staff']);
  const canApprove = hasAnyRole(effectiveRoles, ['admin', 'super_admin']);
  const requestedPage = Number(params.page ?? '1');
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 100000
      ? requestedPage
      : 1;
  const offset = (page - 1) * PAGE_SIZE;
  const legacyQueue = params.queue === 'legacy';
  const queueHref = (targetPage: number) =>
    `/social-media?page=${targetPage}${legacyQueue ? '&queue=legacy' : ''}`;
  const db = await requireAdminClient();

  const postsQuery = db
    .from('social_media_posts')
    .select(
      'id,title,caption,content,platform,destination_type,post_type,status,approval_state,updated_at,media_url,thumbnail_url,video_url,error_message,source_id',
      { count: 'exact' },
    );
  const [
    postsResult,
    campaignsResult,
    accountsResult,
    blogsResult,
    approvals,
    reels,
    scheduledPosts,
    publishedPosts,
  ] = await Promise.all([
    (legacyQueue
      ? postsQuery.is('source_id', null).in('status', reviewablePostStatuses)
      : postsQuery.or(`source_id.not.is.null,status.not.in.(${reviewablePostStatuses.join(',')})`)
    )
      .order('created_at', { ascending: false })
      .order('id')
      .range(offset, offset + PAGE_SIZE - 1),
    db
      .from('social_campaigns')
      .select('id,name,status,platform,created_at,metadata')
      .order('created_at', { ascending: false })
      .limit(6),
    db
      .from('social_media_settings')
      .select(
        'platform,profile_data,enabled,expires_at,organization_id,connection_status,last_verified_at,dry_run,granted_scopes',
      ),
    db
      .from('blog_posts')
      .select('id,title,slug,excerpt,featured_image,published_at,social_posted_at')
      .eq('published', true)
      .eq('share_to_social', true)
      .order('published_at', { ascending: false })
      .limit(8),
    db
      .from('social_media_posts')
      .select('id', { count: 'exact', head: true })
      .eq('approval_state', 'pending')
      .in('status', reviewablePostStatuses)
      .not('source_id', 'is', null),
    db
      .from('social_media_posts')
      .select('id', { count: 'exact', head: true })
      .or('destination_type.ilike.*reel*,post_type.ilike.*reel*'),
    db
      .from('social_media_posts')
      .select('id', { count: 'exact', head: true })
      .in('status', ['scheduled', 'queued']),
    db
      .from('social_media_posts')
      .select('id', { count: 'exact', head: true })
      .in('status', ['published', 'posted']),
  ]);

  const posts = postsResult.data ?? [];
  const sourceIds = [...new Set(posts.map((post) => post.source_id).filter(Boolean))];
  const sourcesResult = sourceIds.length
    ? await db
        .from('blog_posts')
        .select('id')
        .in('id', sourceIds)
        .eq('published', true)
        .eq('share_to_social', true)
    : { data: [], error: null };
  const approvedSourceIds = new Set((sourcesResult.data ?? []).map((blog) => blog.id));
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
  const stats = [
    {
      label: 'Approval queue',
      value: approvals.count,
      icon: ShieldCheck,
      accent: 'bg-amber-100 text-amber-800',
    },
    {
      label: 'Reel packages',
      value: reels.count,
      icon: Video,
      accent: 'bg-violet-100 text-violet-800',
    },
    {
      label: 'Scheduled',
      value: scheduledPosts.count,
      icon: CalendarClock,
      accent: 'bg-blue-100 text-blue-800',
    },
    {
      label: 'Published',
      value: publishedPosts.count,
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
                <p className="text-3xl font-black">
                  {blogsResult.error ? 'Unavailable' : blogs.length}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-300">
                  Recent source articles
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
                <p className="text-3xl font-black">
                  {accountsResult.error
                    ? 'Unavailable'
                    : `${connected.length}/${supportedPlatforms.length}`}
                </p>
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
        {params.error && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">
            {params.error}
          </p>
        )}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, accent }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className={`inline-flex rounded-xl p-2.5 ${accent}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-3xl font-black tabular-nums text-slate-950">
                {value ?? 'Unavailable'}
              </p>
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
              {blogsResult.error ? (
                <p role="alert" className="text-sm text-red-700">
                  The blog library could not be loaded.
                </p>
              ) : blogs.length ? (
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
              <nav
                aria-label="Content queues"
                className="mt-4 flex gap-4 text-sm font-bold text-blue-700"
              >
                <Link href="/social-media" aria-current={!legacyQueue ? 'page' : undefined}>
                  Content packages
                </Link>
                <Link
                  href="/social-media?queue=legacy"
                  aria-current={legacyQueue ? 'page' : undefined}
                >
                  Legacy drafts
                </Link>
              </nav>
              <div className="mt-5 space-y-3">
                {posts.map((post) => {
                  const reviewable = reviewablePostStatuses.includes(post.status);
                  const blocked =
                    sourcesResult.error || accountsResult.error
                      ? 'Unable to verify the source article or publishing account.'
                      : postPublishingReadinessError(
                          post,
                          approvedSourceIds.has(post.source_id),
                          accountByPlatform.get(post.platform) ?? null,
                        );
                  return (
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
                      {reviewable && blocked && (
                        <p className="mt-2 text-xs text-amber-800">{blocked}</p>
                      )}
                      {reviewable &&
                        !approvedSourceIds.has(post.source_id) &&
                        !sourcesResult.error && (
                          <Link
                            href="/social-media/campaigns/new"
                            className="mt-2 block text-xs font-bold text-blue-700"
                          >
                            Build a replacement from an approved blog
                          </Link>
                        )}
                      {reviewable && approvedSourceIds.has(post.source_id) && (
                        <form action={approveSocialPost} className="mt-3 space-y-2">
                          <input type="hidden" name="id" value={post.id} />
                          <input type="hidden" name="updated_at" value={post.updated_at} />
                          <label className="block text-xs font-bold" htmlFor={`caption-${post.id}`}>
                            Review the final caption
                          </label>
                          <textarea
                            id={`caption-${post.id}`}
                            name="caption"
                            readOnly={Boolean(blocked) || !canApprove}
                            required
                            maxLength={2200}
                            defaultValue={post.caption || post.content || ''}
                            rows={5}
                            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                          />
                          {(post.video_url || post.media_url || post.thumbnail_url) && (
                            <a
                              href={post.video_url || post.media_url || post.thumbnail_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-blue-700"
                            >
                              Review attached media
                            </a>
                          )}
                          {!blocked && canApprove && (
                            <button
                              type="submit"
                              className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white"
                            >
                              Approve and queue publication
                            </button>
                          )}
                        </form>
                      )}
                      {post.error_message && (
                        <p className="mt-2 text-xs text-red-700">{post.error_message}</p>
                      )}
                    </div>
                  );
                })}
                {postsResult.error && (
                  <p role="alert" className="text-sm text-red-700">
                    The production queue could not be loaded.
                  </p>
                )}
                {!postsResult.error && !posts.length && (
                  <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                    The queue is empty.
                  </p>
                )}
              </div>
              {(page > 1 || (postsResult.count ?? 0) > offset + PAGE_SIZE) && (
                <nav
                  aria-label="Content package pages"
                  className="mt-4 flex gap-4 text-sm font-bold text-blue-700"
                >
                  {page > 1 && <Link href={queueHref(page - 1)}>Previous page</Link>}
                  {(postsResult.count ?? 0) > offset + PAGE_SIZE && (
                    <Link href={queueHref(page + 1)}>Next page</Link>
                  )}
                </nav>
              )}
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
                  const readiness = publishingReadinessError(platform, account ?? null);
                  return (
                    <div key={platform} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {platformLabel(platform)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {accountsResult.error
                            ? 'Connection status unavailable'
                            : isConnected
                              ? !readiness && account?.dry_run === false
                                ? 'Verified for approved publishing'
                                : 'Verified read-only'
                              : 'Authorization required'}
                        </p>
                      </div>
                      {isConnected ? (
                        canApprove && !readiness && account?.dry_run !== false ? (
                          <form action={enableApprovedPublishing}>
                            <input type="hidden" name="platform" value={platform} />
                            <button className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white">
                              Enable approved publishing
                            </button>
                          </form>
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        )
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
            {campaignsResult.error && (
              <p role="alert" className="text-sm text-red-700">
                Saved campaigns could not be loaded.
              </p>
            )}
            {!campaignsResult.error && !campaigns.length && (
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
