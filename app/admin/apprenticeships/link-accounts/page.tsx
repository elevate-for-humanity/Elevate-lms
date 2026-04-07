/**
 * /admin/apprenticeships/link-accounts
 *
 * Shows every apprentice record where user_id is NULL.
 * For each, attempts to find a matching auth user by email and lets staff
 * apply the fix with one click.
 *
 * This page is the repair path for the failure mode where an apprentice
 * can log in but sees "no active apprenticeship" because their record
 * was created before they had an auth account.
 */

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Link2, AlertTriangle, CheckCircle2, User } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import LinkAccountButton from './LinkAccountButton';

export const metadata: Metadata = {
  title: 'Link Apprentice Accounts | Admin',
};

export const dynamic = 'force-dynamic';

export default async function LinkAccountsPage() {
  const supabase = await createClient();
  const adminDb = createAdminClient();

  // Auth + role check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/apprenticeships/link-accounts');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/admin/dashboard');
  }

  // Fetch all apprentices missing user_id
  const { data: unlinked } = await adminDb
    .from('apprentices')
    .select('id, email, status, program_id, created_at, shop_id')
    .is('user_id', null)
    .order('created_at', { ascending: false });

  const rows = unlinked ?? [];

  // For each unlinked apprentice, look up whether a matching auth user exists
  // We use auth.admin.listUsers — available via service role
  // Supabase JS admin API: supabase.auth.admin.listUsers()
  // We'll do a targeted lookup per email using the admin client
  type MatchResult = {
    apprenticeId: string;
    email: string | null;
    status: string;
    createdAt: string;
    matchedUserId: string | null;
    matchedUserEmail: string | null;
  };

  const results: MatchResult[] = await Promise.all(
    rows.map(async (a) => {
      if (!a.email) {
        return {
          apprenticeId: a.id,
          email: null,
          status: a.status,
          createdAt: a.created_at,
          matchedUserId: null,
          matchedUserEmail: null,
        };
      }

      // Look up auth user by email via admin API
      const { data: authData } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const match = authData?.users?.find(u => u.email?.toLowerCase() === a.email?.toLowerCase());

      return {
        apprenticeId: a.id,
        email: a.email,
        status: a.status,
        createdAt: a.created_at,
        matchedUserId: match?.id ?? null,
        matchedUserEmail: match?.email ?? null,
      };
    })
  );

  const fixable = results.filter(r => r.matchedUserId);
  const noMatch = results.filter(r => !r.matchedUserId);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Apprenticeships', href: '/admin/apprenticeships' },
            { label: 'Link Accounts' },
          ]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/apprenticeships" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Link2 className="w-6 h-6 text-brand-blue-600" />
              Link Apprentice Accounts
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Apprentice records with no <code className="text-xs bg-slate-100 px-1 rounded">user_id</code> — these apprentices see &ldquo;no active apprenticeship&rdquo; when they log in.
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">All apprentice records are linked</p>
            <p className="text-sm text-slate-500 mt-1">No missing <code className="text-xs bg-slate-100 px-1 rounded">user_id</code> values found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Unlinked records</p>
              </div>
              <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{fixable.length}</p>
                <p className="text-xs text-green-600 mt-0.5">Auth match found — fixable</p>
              </div>
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">{noMatch.length}</p>
                <p className="text-xs text-amber-600 mt-0.5">No auth account yet</p>
              </div>
            </div>

            {/* Fixable rows */}
            {fixable.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Auth account found — click to link
                </h2>
                <div className="space-y-2">
                  {fixable.map(r => (
                    <div key={r.apprenticeId} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{r.email}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Apprentice ID: <span className="font-mono">{r.apprenticeId.slice(0, 8)}…</span>
                          {' · '}
                          Auth ID: <span className="font-mono">{r.matchedUserId!.slice(0, 8)}…</span>
                          {' · '}
                          Status: {r.status}
                          {' · '}
                          Created: {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <LinkAccountButton
                        apprenticeId={r.apprenticeId}
                        userId={r.matchedUserId!}
                        email={r.email!}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No-match rows */}
            {noMatch.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  No auth account found — apprentice has not signed up yet
                </h2>
                <div className="space-y-2">
                  {noMatch.map(r => (
                    <div key={r.apprenticeId} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between gap-4 opacity-70">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-700 text-sm truncate">
                          {r.email ?? <span className="text-slate-400 italic">No email on record</span>}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Apprentice ID: <span className="font-mono">{r.apprenticeId.slice(0, 8)}…</span>
                          {' · '}
                          Status: {r.status}
                          {' · '}
                          Created: {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <User className="w-3.5 h-3.5" />
                        No account yet
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Send the apprentice an invite link so they can create their account. Once they sign up with the same email, the link will appear above.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
