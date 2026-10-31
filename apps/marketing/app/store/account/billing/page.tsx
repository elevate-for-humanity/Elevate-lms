import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { loadStoreBilling } from '@/lib/store/customer-billing';
import StoreScheduleAction from '@/components/store/StoreScheduleAction';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Store subscriptions & QuickBooks invoices | Elevate',
  robots: { index: false, follow: false },
};
const money = (cents: number, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(cents) / 100);
const date = (value: string | null) =>
  value
    ? new Date(value.includes('T') ? value : value + 'T12:00:00Z').toLocaleDateString('en-US', {
        timeZone: 'UTC',
      })
    : '—';
export default async function StoreBillingPage() {
  const session = await createClient();
  const {
    data: { user },
    error,
  } = await session.auth.getUser();
  if (error || !user) redirect('/login?redirect=%2Fstore%2Faccount%2Fbilling');
  let billing;
  try {
    billing = await loadStoreBilling(await requireAdminClient(), user.id);
  } catch {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-black">Store billing</h1>
        <p role="alert" className="mt-5">
          Your billing records could not be loaded. Refresh to retry.
        </p>
        <Link href="/store/account/billing" className="mt-5 inline-block underline">
          Retry billing
        </Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 text-slate-950">
      <Link href="/store" className="font-semibold underline">
        Back to Store
      </Link>
      <h1 className="mt-5 text-3xl font-black">Subscriptions &amp; invoices</h1>
      <p className="mt-3 max-w-3xl leading-7">
        Pay securely through QuickBooks. Monthly or annual plans generate invoices; an invoice does
        not charge your card automatically. Access activates after payment is verified.
      </p>
      <section className="mt-9" aria-labelledby="apps">
        <h2 id="apps" className="text-2xl font-bold">
          Your individual apps
        </h2>
        {billing.apps.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {billing.apps.map((app: any) => (
              <article key={app.app_slug} className="rounded-xl border p-5">
                <h3 className="font-bold">
                  {app.app_slug === 'sam-gov'
                    ? 'SAM.gov Manager'
                    : app.app_slug === 'grants'
                      ? 'Grants Discovery'
                      : 'Website Builder'}
                </h3>
                <p className="mt-2">
                  {app.plan} · {app.status}
                </p>
                <p className="mt-2 text-sm">
                  Access period ends: {date(app.current_period_end || app.trial_ends_at)}
                </p>
                <Link
                  href={`/apps/${app.app_slug}`}
                  className="mt-4 inline-block font-semibold underline"
                >
                  Open app
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3">No individual app subscriptions yet.</p>
        )}
      </section>
      <section className="mt-9" aria-labelledby="schedules">
        <h2 id="schedules" className="text-2xl font-bold">
          Your invoice schedules
        </h2>
        {!billing.schedules.length ? (
          <p className="mt-3">
            You have no Store invoice schedules.{' '}
            <Link href="/store/plans" className="underline">
              Compare plans
            </Link>
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {billing.schedules.map((s: any) => (
              <article key={s.id} className="rounded-xl border p-5">
                <h3 className="text-lg font-bold">{s.product_name}</h3>
                <p className="mt-2">
                  {money(s.amount_cents)} · {s.cadence} · {s.status}
                </p>
                <p className="mt-2 text-sm">
                  {s.status === 'active'
                    ? `Next invoice: ${date(s.next_invoice_date)}`
                    : 'Future invoices stopped. Paid access continues until its period ends.'}
                </p>
                {s.collection_mode === 'manual_invoice' && s.status === 'active' ? (
                  <StoreScheduleAction scheduleId={s.id} />
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="mt-10" aria-labelledby="invoices">
        <h2 id="invoices" className="text-2xl font-bold">
          QuickBooks invoices
        </h2>
        {!billing.invoices.length ? (
          <p className="mt-3">No Store invoices yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {billing.invoices.map((i: any) => (
              <article
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5"
              >
                <div>
                  <h3 className="font-bold">Invoice {i.invoice_number || i.id.slice(0, 8)}</h3>
                  <p className="mt-1">
                    {money(i.total_cents, i.currency)} · {i.status} · Due {date(i.due_at)}
                  </p>
                </div>
                {i.payment_url && !['paid', 'void', 'canceled'].includes(i.status) ? (
                  <a
                    href={i.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-slate-950 px-5 py-3 font-bold text-white"
                  >
                    Pay in QuickBooks
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
      <p className="mt-8 text-sm leading-6">
        Stopping future invoices does not void an issued invoice or refund a completed payment.
        Contact support about an existing invoice or a legacy payment agreement.
      </p>
    </main>
  );
}
