import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Plus, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export const metadata: Metadata = { title: 'Content Library | Submissions OS | Admin' };
export const dynamic = 'force-dynamic';

const STATUS_CLS: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  pending_review: 'bg-amber-100 text-amber-800',
  draft: 'bg-slate-100 text-slate-600',
  archived: 'bg-slate-100 text-slate-400',
};

export default async function ContentLibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const db = await getAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin','staff'].includes(profile.role)) redirect('/admin');

  const { data: org } = await db.from('sos_organizations').select('id')
    .order('created_at', { ascending: true }).limit(1).maybeSingle();

  const { data: blocks, error } = org
    ? await db.from('sos_content_blocks').select('*')
        .eq('organization_id', org.id).order('block_type').order('title')
    : { data: null, error: null };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/admin/submissions" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Submissions OS
        </Link>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Content Library</h1>
              <p className="text-slate-500 text-sm">Approved prose blocks — mission, org overview, program summaries, equity statement</p>
            </div>
          </div>
          <Link href="/admin/submissions/content" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
            <Plus className="w-4 h-4" /> New Block
          </Link>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            Content blocks table not yet applied. Run migrations in Supabase Dashboard.
          </div>
        )}

        {!blocks || blocks.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 mb-1">No content blocks yet</p>
            <p className="text-sm text-slate-500 mb-4">Add approved prose for mission statements, program summaries, and more.</p>
            <Link href="/admin/submissions/content" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
              <Plus className="w-4 h-4" /> Add First Block
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(blocks as any[]).map(block => (
              <div key={block.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-blue-200 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">{block.title}</p>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono">{block.block_type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CLS[block.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {block.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{block.content}</p>
                    <p className="text-xs text-slate-400 mt-1">{block.word_count ?? '—'} words</p>
                  </div>
                  <Link href={`/admin/submissions/content/${block.id}`}
                    className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition flex-shrink-0">
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
