import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getHostShopBoard } from '@/lib/partner/board';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Clock, FileText, TrendingUp, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PartnerBoardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/partner/board');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['partner', 'admin', 'staff'].includes(profile.role)) redirect('/unauthorized');

  const board = await getHostShopBoard(user.id);

  return (
    <div className="space-y-6">
      {/* Shop Identity Header */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {board.partner?.name || board.shops[0]?.name || 'Host Shop Board'}
            </h1>
            <p className="text-slate-600 mt-1">{board.tradeInfo.label} · Host Shop</p>
            {board.shops[0]?.city && (
              <p className="text-sm text-slate-500 mt-0.5">{board.shops[0].city}, {board.shops[0].state}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${board.partner?.mou_signed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              MOU {board.partner?.mou_signed ? 'Signed' : 'Pending'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${board.partner?.approval_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
              {board.partner?.approval_status === 'approved' ? 'Approved Partner' : board.partner?.approval_status || 'Pending Approval'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <Users className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{board.apprentices.length}</p>
          <p className="text-sm text-slate-600">Active Apprentices</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <Clock className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{board.pendingHoursCount}</p>
          <p className="text-sm text-slate-600">Hours Pending Review</p>
          {board.pendingHoursCount > 0 && (
            <Link href="/partner/hours/pending" className="text-xs text-orange-600 hover:underline mt-1 block">Review now →</Link>
          )}
        </div>
        <div className="bg-white rounded-xl border p-5">
          <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{board.tradeInfo.hours.toLocaleString()}h</p>
          <p className="text-sm text-slate-600">OJT Target ({board.tradeInfo.label.split(' ')[0]})</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <FileText className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold">
            {board.requiredDocumentCount
              ? `${board.acceptedDocumentCount}/${board.requiredDocumentCount}`
              : board.partner?.documents_verified
                ? '✓'
                : '—'}
          </p>
          <p className="text-sm text-slate-600">Required Docs Accepted</p>
        </div>
      </div>

      {(board.missingDocuments.length > 0 || board.pendingDocuments.length > 0 || !board.partner?.onboarding_completed) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <h2 className="font-semibold text-amber-950">Finish host-site onboarding</h2>
                <p className="mt-1 text-sm text-amber-900">
                  Your host shop is approved for portal access. Finish onboarding and upload the
                  required documents before apprentices can be fully placed at your site.
                </p>
                <div className="mt-3 grid gap-2 text-sm text-amber-950 md:grid-cols-3">
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="font-medium">MOU</p>
                    <p className="mt-1 flex items-center gap-1 text-xs">
                      {board.partner?.mou_signed ? (
                        <CheckCircle className="h-3.5 w-3.5 text-brand-green-600" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      {board.partner?.mou_signed ? 'Signed' : 'Needs signature'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="font-medium">Onboarding forms</p>
                    <p className="mt-1 flex items-center gap-1 text-xs">
                      {board.partner?.onboarding_completed ? (
                        <CheckCircle className="h-3.5 w-3.5 text-brand-green-600" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      )}
                      {board.partner?.onboarding_completed ? 'Complete' : 'Needs completion'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="font-medium">Documents</p>
                    <p className="mt-1 text-xs">
                      {board.missingDocuments.length} missing · {board.pendingDocuments.length} in review
                    </p>
                  </div>
                </div>
                {board.missingDocuments.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                      Missing uploads
                    </p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-amber-950">
                      {board.missingDocuments.slice(0, 5).map((doc: any) => (
                        <li key={doc.document_type}>{doc.document_name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-wrap gap-2 md:justify-end">
              {!board.partner?.mou_signed && (
                <Link
                  href={board.onboardingPaths.signMou}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  Sign MOU
                </Link>
              )}
              {!board.partner?.onboarding_completed && (
                <Link
                  href={board.onboardingPaths.forms}
                  className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                >
                  Finish onboarding
                </Link>
              )}
              <Link
                href={board.onboardingPaths.documents}
                className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
              >
                Upload documents
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Apprentice OJT Progress */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Apprentice OJT Progress</h2>
          <Link href="/partner/hours" className="text-sm text-blue-600 hover:underline">Manage Hours →</Link>
        </div>
        {board.apprentices.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p>No active apprentices yet.</p>
            <p className="text-sm mt-1">Contact Elevate to match apprentice candidates to your shop.</p>
          </div>
        ) : (
          <div className="divide-y">
            {board.apprentices.map((a) => {
              const pct = Math.min(100, Math.round((a.ojt.completed / a.ojt.required) * 100));
              return (
                <div key={a.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-900">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.email}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {a.ojt.completed.toLocaleString()} / {a.ojt.required.toLocaleString()}h
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{pct}% complete</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/partner/attendance/record" className="bg-white rounded-xl border p-5 hover:border-blue-300 hover:shadow-sm transition block">
          <h3 className="font-semibold text-slate-900">Record Attendance</h3>
          <p className="text-sm text-slate-600 mt-1">Log a training session</p>
        </Link>
        <Link href="/partner/hours/pending" className="bg-white rounded-xl border p-5 hover:border-orange-300 hover:shadow-sm transition block">
          <h3 className="font-semibold text-slate-900">Verify Hours</h3>
          <p className="text-sm text-slate-600 mt-1">{board.pendingHoursCount} pending</p>
        </Link>
        <Link href="/partner/competencies" className="bg-white rounded-xl border p-5 hover:border-purple-300 hover:shadow-sm transition block">
          <h3 className="font-semibold text-slate-900">Competency Reviews</h3>
          <p className="text-sm text-slate-600 mt-1">Approve skill reps</p>
        </Link>
      </div>
    </div>
  );
}
