import { ExternalLink, MapPin, Store } from 'lucide-react';
import { requireAdminClient } from '@/lib/supabase/admin';

const APP_ORIGIN = 'https://app.elevateforhumanity.org';

type ShopRow = {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  active: boolean | null;
  partner_id: string | null;
};

type PartnerRow = {
  id: string;
  status: string | null;
  approval_status: string | null;
  verification_status: string | null;
  is_active: boolean | null;
};

export async function HostShopPortalLauncher() {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('shops')
    .select('id, name, city, state, active, partner_id')
    .order('name', { ascending: true });

  if (error) {
    return (
      <section className="mb-8 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-950">
        <h2 className="text-xl font-black">Host Shop portals</h2>
        <p className="mt-2 text-sm font-medium">The shop directory could not be loaded. No portal access was changed.</p>
      </section>
    );
  }

  const shops = (data ?? []) as ShopRow[];
  const partnerIds = Array.from(
    new Set(shops.map((shop) => shop.partner_id).filter((id): id is string => Boolean(id))),
  );
  const { data: partnerData } = partnerIds.length
    ? await db
        .from('partners')
        .select('id, status, approval_status, verification_status, is_active')
        .in('id', partnerIds)
    : { data: [] as PartnerRow[] };

  const partners = new Map(
    ((partnerData ?? []) as PartnerRow[]).map((partner) => [partner.id, partner]),
  );

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" aria-labelledby="host-shop-launcher-title">
      <div className="border-b border-slate-100 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-100 p-2.5 text-violet-800">
            <Store className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 id="host-shop-launcher-title" className="text-xl font-black text-slate-950">Open a Host Shop portal</h2>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-700">
              Open any connected shop in the live Host Shop workspace. The selected shop is remembered for one hour and does not change ownership, permissions, or compliance status.
            </p>
          </div>
        </div>
      </div>

      {!shops.length ? (
        <p className="p-6 text-sm font-medium text-slate-700 sm:p-8">No Host Shop records are available.</p>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-8 xl:grid-cols-3">
          {shops.map((shop) => {
            const partner = shop.partner_id ? partners.get(shop.partner_id) : undefined;
            const canOpen =
              shop.active !== false &&
              Boolean(partner) &&
              partner?.status === 'active' &&
              partner?.approval_status === 'approved' &&
              partner?.is_active !== false;
            const status = shop.active === false
              ? 'Archived'
              : !shop.partner_id
                ? 'Not connected'
                : partner?.approval_status !== 'approved'
                  ? 'Approval pending'
                  : partner?.verification_status === 'verified'
                    ? 'Verified'
                    : 'Verification pending';

            return (
              <article key={shop.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 font-black text-slate-950">{shop.name || 'Unnamed shop'}</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
                    canOpen ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {status}
                  </span>
                </div>
                {(shop.city || shop.state) ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                    {[shop.city, shop.state].filter(Boolean).join(', ')}
                  </p>
                ) : null}
                <div className="mt-4">
                  {canOpen ? (
                    <a
                      href={`${APP_ORIGIN}/api/admin/select-host-shop?shop_id=${encodeURIComponent(shop.id)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800"
                    >
                      Open portal <ExternalLink className="h-4 w-4" aria-hidden />
                    </a>
                  ) : (
                    <span className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-center text-sm font-bold text-slate-500">
                      Complete connection first
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
