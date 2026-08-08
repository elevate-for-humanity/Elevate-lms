'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import type { NavItem } from '@/lib/navigation';

export default function HeaderDesktopMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50 xl:gap-2 xl:px-3 xl:text-base"
        aria-label="Open full menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" /> <span className="hidden xl:inline">Menu</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[11000] hidden md:block">
          <button className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="absolute right-0 top-0 h-full w-[min(92vw,560px)] overflow-y-auto bg-white shadow-2xl" aria-label="Full site menu">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-brand-red-700">Elevate</p>
                <h2 className="text-2xl font-black text-slate-950">Full Menu</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-800 hover:bg-slate-100" aria-label="Close full menu"><X className="h-6 w-6" /></button>
            </div>

            <nav className="space-y-7 p-6" aria-label="Full desktop navigation">
              {items.map((item) => (
                <section key={item.id ?? item.name}>
                  {item.href ? (
                    <Link href={item.href} onClick={() => setOpen(false)} className="text-xl font-black text-slate-950 hover:text-brand-red-700">{item.name}</Link>
                  ) : (
                    <h3 className="text-xl font-black text-slate-950">{item.name}</h3>
                  )}
                  {item.subItems?.length ? (
                    <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
                      {item.subItems.filter((sub) => !sub.isHeader && sub.href).map((sub) => (
                        <Link key={`${sub.name}-${sub.href}`} href={sub.href!} onClick={() => setOpen(false)} className="text-base font-medium leading-snug text-slate-700 hover:text-brand-red-700 hover:underline">{sub.name}</Link>
                      ))}
                    </div>
                  ) : null}
                </section>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
