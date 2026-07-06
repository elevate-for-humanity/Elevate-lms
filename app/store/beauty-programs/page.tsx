export const dynamic = 'force-static';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BeautyDashboardCloneSection } from '@/components/store/BeautyDashboardCloneSection';
import { BEAUTY_DASHBOARD_CLONE_META } from '@/lib/store/beauty-dashboard-clone';
import { ArrowRight, LayoutDashboard, Users, Scissors } from 'lucide-react';

export const metadata: Metadata = {
  title: BEAUTY_DASHBOARD_CLONE_META.title,
  description: BEAUTY_DASHBOARD_CLONE_META.description,
  alternates: { canonical: BEAUTY_DASHBOARD_CLONE_META.canonical },
  openGraph: {
    title: BEAUTY_DASHBOARD_CLONE_META.title,
    description: BEAUTY_DASHBOARD_CLONE_META.description,
    images: ['/images/pages/barber-gallery-1.webp'],
  },
};

export default function BeautyProgramsStorePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Store', href: '/store' },
            { label: 'Beauty Programs', href: '/store/beauty-programs' },
          ]}
        />
      </div>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-brand-red-100 text-brand-red-800 text-xs font-bold px-3 py-1 rounded-full mb-4">
              <Scissors className="w-3.5 h-3.5" />
              For outside organizations
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Beauty program dashboard clone
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              License a white-label admin dashboard for barber, cosmetology, esthetician, and nail
              schools. Run enrollments, OJT hours, host shops, and compliance from your own branded
              tenant — without building software from scratch.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/store/trial?vertical=beauty"
                className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-lg font-bold text-lg"
              >
                Start 14-day org trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/store/demo/admin"
                className="inline-flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-lg font-bold text-lg"
              >
                <LayoutDashboard className="w-5 h-5" />
                Open dashboard demo
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-slate-200">
            <Image
              src="/images/pages/barber-gallery-1.webp"
              alt="Beauty school training environment"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
          {[
            {
              icon: LayoutDashboard,
              title: 'Admin dashboard clone',
              desc: 'Same operational shell as Elevate — enrollment, reporting, instructors, credentials.',
            },
            {
              icon: Users,
              title: 'Your brand & subdomain',
              desc: 'Students and partners see your school name, not ours.',
            },
            {
              icon: Scissors,
              title: 'Beauty program templates',
              desc: 'Barber, cosmo, esthetician, nail, and educator tracks ready to configure.',
            },
          ].map((item) => (
            <div key={item.title}>
              <item.icon className="w-10 h-10 text-brand-red-400 mx-auto mb-3" />
              <h2 className="font-bold text-lg mb-2">{item.title}</h2>
              <p className="text-slate-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <BeautyDashboardCloneSection />

      <section className="py-14 px-4 border-t border-slate-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Need source code instead?</h2>
          <p className="text-slate-600 mb-6">
            Self-host the full platform with a clone license, or stay on managed hosting with the
            dashboard clone above.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/store/licenses#clone"
              className="text-brand-blue-600 font-semibold hover:underline"
            >
              View clone licenses
            </Link>
            <Link
              href="/store/licenses/managed-platform"
              className="text-brand-blue-600 font-semibold hover:underline"
            >
              Managed platform overview
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
