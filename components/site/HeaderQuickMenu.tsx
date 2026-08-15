import Link from 'next/link';
import { Menu } from 'lucide-react';
import type { NavItem } from '@/types/navigation';

export default function HeaderQuickMenu({ items }: { items: NavItem[] }) {
  return (
    <details className="relative hidden xl:block">
      <summary
        className="flex min-h-[40px] cursor-pointer list-none items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50 [&::-webkit-details-marker]:hidden"
        aria-label="Open full site menu"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
        <span className="hidden 2xl:inline">Menu</span>
      </summary>
      <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[1000] max-h-[min(75vh,44rem)] w-[min(92vw,26rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
        <div className="mb-2 rounded-xl bg-slate-950 px-4 py-3 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Full navigation</p>
          <p className="mt-1 text-sm text-slate-200">Programs, apprenticeships, funding, employers, portals, store and support.</p>
        </div>
        <nav aria-label="Full site menu" className="space-y-1">
          {items.map((item) => (
            <section key={item.id ?? item.name} className="rounded-xl border-b border-slate-100 px-2 py-2 last:border-b-0">
              {item.href ? (
                <Link href={item.href} className="block min-h-[38px] py-2 text-base font-extrabold text-slate-950 hover:text-brand-red-700">
                  {item.name}
                </Link>
              ) : (
                <p className="py-2 text-base font-extrabold text-slate-950">{item.name}</p>
              )}
              {item.subItems?.length ? (
                <div className="grid grid-cols-1 gap-0.5 pl-2">
                  {item.subItems.map((subItem) =>
                    subItem.isHeader ? (
                      subItem.href ? (
                        <Link
                          key={`${item.id}-${subItem.name}-${subItem.href}`}
                          href={subItem.href}
                          className="block pt-2 text-[11px] font-black uppercase tracking-wide text-brand-red-700 hover:underline"
                        >
                          {subItem.name}
                        </Link>
                      ) : (
                        <p key={`${item.id}-${subItem.name}`} className="pt-2 text-[11px] font-black uppercase tracking-wide text-brand-red-700">
                          {subItem.name}
                        </p>
                      )
                    ) : subItem.href ? (
                      <Link
                        key={`${item.id}-${subItem.name}-${subItem.href}`}
                        href={subItem.href}
                        className="block min-h-[34px] py-1.5 text-sm font-semibold text-slate-700 hover:text-brand-blue-700"
                      >
                        {subItem.name}
                      </Link>
                    ) : null,
                  )}
                </div>
              ) : null}
            </section>
          ))}
        </nav>
      </div>
    </details>
  );
}
