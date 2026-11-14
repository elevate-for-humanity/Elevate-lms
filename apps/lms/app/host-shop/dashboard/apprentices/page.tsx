import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { canonicalHostShopProgram, canonicalHostShopPrograms } from '@/lib/partners/host-shop-match-access';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Assigned Students | Host Shop Portal',
  description: 'Name and email only for students assigned to this approved Host Shop.',
  robots: { index: false, follow: false },
};

export default async function HostShopApprenticesPage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  // The board resolves the active partner membership and exact shop IDs before
  // reading active, non-revoked apprentice placements. Never fall back to a
  // global program roster or unscoped application query.
  const board = await getHostShopBoard(user.id);
  // Historical approved partners may store 'BARBER' or 'cosmetology'
  // while placements use canonical *-apprenticeship slugs. Normalize only
  // known aliases; never broaden scope by generic salon classification.
  const permittedPrograms = new Set(canonicalHostShopPrograms(board.partner.programs));
  const assigned = board.apprentices.filter(apprentice => {
    const program = canonicalHostShopProgram(apprentice.program_slug);
    return Boolean(program && permittedPrograms.has(program));
  });

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 px-3 py-5 sm:px-6 sm:py-8">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Host Shop</p>
        <h1 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
          My assigned students
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Students appear only after an approved active placement at your shop.
          You can see their name and email address here, not their full application.
        </p>
      </header>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-200 px-4 py-3 text-base font-bold text-slate-900">
          Assigned students ({assigned.length})
        </h2>
        {assigned.length === 0 ? (
          <div className="space-y-2 p-5">
            <p className="text-sm text-slate-700">There are no active placements assigned to this shop for its approved programs.</p>
            <Link href="/host-shop/dashboard/match-requests"
              className="inline-flex min-h-11 items-center font-semibold text-blue-800 underline">
              Review my shop's match requests
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {assigned.map(student => (
              <li key={student.id} className="min-w-0 space-y-1 px-4 py-4">
                <p className="break-words text-base font-bold text-slate-950">{student.name}</p>
                {student.email ? (
                  <a href={'mailto:' + student.email}
                    className="block break-all text-sm text-blue-800 underline">{student.email}</a>
                ) : <p className="text-sm text-slate-600">Email not provided</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <nav aria-label="Host Shop operational tools" className="flex flex-wrap gap-3 text-sm font-semibold">
        <Link href="/host-shop/dashboard/hours/pending" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-slate-800">
          Work-hour review
        </Link>
        <Link href="/host-shop/dashboard/practical-log" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-slate-800">
          Skills observation
        </Link>
      </nav>
    </main>
  );
}
