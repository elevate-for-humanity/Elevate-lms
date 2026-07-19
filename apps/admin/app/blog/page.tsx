import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { FileText, ChevronRight, ArrowRight, Plus, Eye, Edit } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Blog | Admin',
};

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-green-100 text-green-800',
  draft: 'bg-slate-100 text-slate-600',
  archived: 'bg-red-100 text-red-700',
};

export default async function AdminBlogPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  const [postsRes, publishedRes, draftRes] = await Promise.all([
    db
      .from('blog_posts')
      .select('id, title, slug, status, published_at, created_at, author_id, excerpt', {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
  ]);

  const posts = postsRes.data ?? [];
  const totalCount = postsRes.count ?? 0;
  const publishedCount = publishedRes.count ?? 0;
  const draftCount = draftRes.count ?? 0;

  const authorIds = [...new Set(posts.map((p: any) => p.author_id).filter(Boolean))];
  const { data: authors } = authorIds.length
    ? await db.from('profiles').select('id, full_name').in('id', authorIds)
    : { data: [] };
  const authorMap = Object.fromEntries((authors ?? []).map((a: any) => [a.id, a]));

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">
            Admin
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Blog</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Blog Posts</h1>
            <p className="text-sm text-slate-500 mt-1">
              {publishedCount} published · {draftCount} drafts
            </p>
          </div>
          <Link
            href="/admin/blog"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> New Post
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Total',
              value: totalCount,
              icon: FileText,
              color: 'text-slate-600',
              bg: 'bg-slate-100',
            },
            {
              label: 'Published',
              value: publishedCount,
              icon: Eye,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
            {
              label: 'Drafts',
              value: draftCount,
              icon: Edit,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
              >
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">All Posts</h2>
            <span className="text-xs text-slate-400">{totalCount} total</span>
          </div>
          {posts.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No blog posts yet</p>
              <Link
                href="/admin/blog"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-600 hover:underline"
              >
                Create your first post <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Title', 'Author', 'Status', 'Published', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {posts.map((p: any) => {
                  const author = authorMap[p.author_id];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900 truncate max-w-xs">
                          {p.title ?? '—'}
                        </p>
                        {p.excerpt && (
                          <p className="text-xs text-slate-400 truncate max-w-xs">{p.excerpt}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-xs">
                        {author?.full_name ?? '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[p.status] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {p.status ?? 'draft'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-xs">
                        {p.published_at ? new Date(p.published_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right flex items-center justify-end gap-3">
                        {p.slug && (
                          <Link
                            href={`/blog/${p.slug}`}
                            target="_blank"
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/blog/${p.id}/edit`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                        >
                          Edit <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
