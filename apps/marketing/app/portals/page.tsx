import { Metadata } from 'next';
import Link from 'next/link';
import { PortalRouter, PORTAL_KEYS, PORTAL_META } from '@/lib/routing/portal-router';
import { PORTAL_MAP } from '@/lib/routing/portal-map';
import {
  ArrowRight, Briefcase, Building2, ClipboardCheck, ClipboardList, Crown,
  GraduationCap, Heart, Palette, Scissors, Shield, UserCheck, Users, Wrench,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Portals',
  description: 'Access your personalized Elevate portal for learning, apprenticeships, employers, partners, workforce services, testing, staff, and administration.',
  keywords: ['student portal', 'employer portal', 'host shop portal', 'parent portal', 'staff portal', 'dashboard', 'login'],
  alternates: { canonical: 'https://www.elevateforhumanity.org/portals' },
};

const IconMap: Record<string, React.ElementType> = {
  GraduationCap, Shield, Briefcase, Users, Building2, Crown, ClipboardList,
  ClipboardCheck, UserCheck, Palette, Scissors, Wrench, Heart,
};

const portals = PORTAL_KEYS.map((key) => {
  const meta = PORTAL_META[key];
  const portal = PORTAL_MAP[key];
  return {
    key,
    href: PortalRouter.get(key),
    icon: IconMap[meta.iconName] ?? Building2,
    title: meta.label,
    description: meta.description,
    colorClass: meta.colorClass,
    tenantScope: portal.tenantScope,
    roleCount: portal.allowedRoles.length,
  };
});

export default function PortalsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3"><Breadcrumbs items={[{ label: 'Portals' }]} /></div>
      </div>

      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">Access Your Portal</h1>
          <p className="text-lg text-blue-200">Select the secure workspace that matches your authorized role.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link key={portal.key} href={portal.href} className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg">
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${portal.colorClass} transition-transform group-hover:scale-105`}>
                    <Icon className="h-7 w-7 text-white" aria-hidden="true" />
                  </div>
                  <h2 className="mb-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-brand-blue-700">{portal.title}</h2>
                  <p className="mb-4 flex-1 text-sm leading-6 text-slate-600">{portal.description}</p>
                  <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{portal.tenantScope} scope</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{portal.roleCount} role{portal.roleCount === 1 ? '' : 's'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-brand-blue-700">Access Portal <ArrowRight className="h-4 w-4" aria-hidden="true" /></div>
                </Link>
              );
            })}
          </div>

          <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <h3 className="mb-2 text-xl font-bold text-slate-900">Need access to a portal?</h3>
            <p className="mb-6 text-slate-600">Portal access is granted by role and organization authorization. Contact support if your account is assigned to the wrong workspace.</p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-red-700">Contact Support</Link>
              <a href="tel:+13173143757" className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-200">(317) 314-3757</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
