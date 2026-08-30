import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PORTAL_PREVIEW_COOKIE } from '@/lib/admin/portal-preview';

export const dynamic = 'force-dynamic';

const ADMIN_ROLES = new Set(['admin', 'super_admin']);
const HOST_SHOP_ROLES = new Set(['partner', 'host_shop', 'host_shop_admin', 'program_holder']);

function previewDestination(role: unknown) {
  return HOST_SHOP_ROLES.has(String(role || '')) ? '/host-shop/dashboard' : '/apprentice';
}
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, '');

async function requirePreviewTarget(userId: string) {
  const userDb = await createClient();
  const { data: { user } } = await userDb.auth.getUser();
  if (!user) {
    redirect(`${APP_URL}/login?redirect=${encodeURIComponent(`/admin-preview?user_id=${userId}`)}`);
  }

  const db = await requireAdminClient();
  const [{ data: actor }, { data: target }] = await Promise.all([
    db.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    db.from('profiles').select('id,role,full_name').eq('id', userId).maybeSingle(),
  ]);

  if (!ADMIN_ROLES.has(String(actor?.role || ''))) redirect('/unauthorized');
  if (!target?.id || ADMIN_ROLES.has(String(target.role || ''))) redirect('/admin-preview?error=not-found');

  return target;
}

async function startPreview(formData: FormData) {
  'use server';

  const userId = String(formData.get('user_id') || '').trim();
  if (!userId) redirect('/admin-preview?error=missing-user');
  const target = await requirePreviewTarget(userId);

  (await cookies()).set(PORTAL_PREVIEW_COOKIE, target.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60,
    path: '/',
  });
  redirect(previewDestination(target.role));
}

export default async function AdminPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ user_id?: string; error?: string }>;
}) {
  const params = await searchParams;
  const userId = params.user_id?.trim() || '';

  if (!userId) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">Preview learner not found</h1>
          <p className="mt-2 text-sm text-slate-600">Return to Admin student search and select a learner.</p>
          <a className="mt-5 inline-flex rounded-lg bg-slate-950 px-4 py-2.5 font-bold text-white" href="https://admin.elevateforhumanity.org/students">
            Return to Admin
          </a>
        </div>
      </main>
    );
  }

  const target = await requirePreviewTarget(userId);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-700">Secure Admin Preview</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">{target.full_name || 'Learner dashboard'}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your Admin identity remains active. The learner account and password are not changed.
        </p>
        <form action={startPreview} className="mt-6">
          <input type="hidden" name="user_id" value={target.id} />
          <button className="w-full rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800" type="submit">
            Open apprentice dashboard
          </button>
        </form>
        <a className="mt-4 block text-center text-sm font-semibold text-slate-600 underline" href="https://admin.elevateforhumanity.org/impersonate">
          Cancel and return to Admin
        </a>
      </div>
    </main>
  );
}
