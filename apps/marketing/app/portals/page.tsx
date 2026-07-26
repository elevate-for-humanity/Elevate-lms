import { Metadata } from 'next';
import Link from 'next/link';
import { PortalRouter, PORTAL_META, type PortalKey } from '@/lib/routing/portal-router';
import {
  GraduationCap, Shield, Handshake, Briefcase, Users,
  Building2, Crown, ClipboardList, UserCheck, Home,
  Palette, Scissors, Wrench, Heart,
} from 'lucide-react';
import {
  GraduationCap as GradCap,
  Shield as ShieldAlt,
  Handshake as HandShake,
  Briefcase as Brief,
  Users as UsersAlt,
  Building2 as BuildingAlt,
  Crown as CrownAlt,
  ClipboardList as Clip,
  UserCheck as User,
  Palette as PaletteAlt,
  Scissors as ScissorsAlt,
  Wrench as WrenchAlt,
  Heart as HeartAlt,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Portals',
  description: 'Access your personalized portal based on your role.',
};

// Portal keys shown on the hub page (in display order)
const PORTAL_KEYS: PortalKey[] = [
  'lms',
  'admin',
  'employer',
  'apprentice',
  'hostshop',
  'cosmetology',
  'instructor',
  'staff',
  'workforceboard',
  'casemanager',
  'provider',
  'partner',
  'programholder',
  'workforce',
  'parent',
];

// Icon map (server components can't use dynamic icon components easily)
const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap: GraduationCap,
  Shield: Shield,
  Handshake: Handshake,
  Briefcase: Brief,
  Users: UsersAlt,
  Building2: BuildingAlt,
  Crown: CrownAlt,
  ClipboardList: Clip,
  UserCheck: User,
  Palette: PaletteAlt,
  Scissors: ScissorsAlt,
  Wrench: WrenchAlt,
  Heart: HeartAlt,
};

const portals = PORTAL_KEYS.map((key) => {
  const meta = PORTAL_META[key];
  const Icon = ICON_MAP[meta.iconName] ?? BuildingAlt;
  return {
    key,
    href: PortalRouter.get(key),
    icon: Icon,
    title: meta.label,
    desc: meta.description,
    color: meta.colorClass,
  };
});

export default function PortalsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Access Your Portal</h1>
          <p className="text-blue-200 text-lg">Select the portal that matches your role.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link
                  key={portal.key}
                  href={portal.href}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all group"
                >
                  <div className={`w-14 h-14 rounded-xl ${portal.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-brand-blue-600 transition-colors">
                    {portal.title}
                  </h2>
                  <p className="text-sm text-slate-500">{portal.desc}</p>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-500 mb-4">Need access to a portal?</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 font-semibold py-3 px-6 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <Home className="w-4 h-4" />
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

