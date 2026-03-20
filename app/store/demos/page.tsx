
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Shield, GraduationCap, Briefcase, BarChart3, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import DemoTabs from './DemoTabs';

export const metadata: Metadata = {
  title: 'Platform Demos | Elevate for Humanity',
  description: 'Try the Elevate platform yourself. Interactive demos of the admin dashboard, student portal, and employer tools — no signup required.',
};

const demos = [
  {
    id: 'admin',
    title: 'Admin Dashboard',
    icon: Shield,
    image: '/images/pages/career-counseling.jpg',
    alt: 'Training program administrator reviewing enrollment data',
    href: '/demo/admin',
    description: 'This is what your staff sees every day. Search students, review applications, track compliance, and generate WIOA reports. Everything clicks through — try it.',
    highlights: ['Search and filter students by program or status', 'Track enrollment and completion in real time', 'Generate compliance reports for your workforce board', 'Review applications and manage the intake pipeline'],
  },
  {
    id: 'employer',
    title: 'Employer Portal',
    icon: Briefcase,
    image: '/images/pages/employer-handshake.jpg',
    alt: 'Employer reviewing candidate profiles from training programs',
    href: '/demo/employer',
    description: 'Your employer partners use this to find trained candidates, track their apprentices, and see what hiring incentives they\'ve earned. OJT reimbursements, WOTC credits — it\'s all here.',
    highlights: ['Browse pre-screened candidates with verified credentials', 'Track apprenticeship hours and wage progression', 'Manage OJT contracts and hiring incentives', 'Sign MOUs and compliance documents'],
  },
  {
    id: 'learner',
    title: 'Student Experience',
    icon: GraduationCap,
    image: '/images/pages/wioa-meeting.jpg',
    alt: 'Students in a training classroom working on coursework',
    href: '/demo/learner',
    description: 'What your students see when they log in. Their courses, progress bars, apprenticeship hours logged, and certificates earned. This is the experience that keeps them showing up.',
    highlights: ['Course modules with progress tracking', 'Log apprenticeship hours from their phone', 'View earned certificates and credentials', 'Access career services and job placement tools'],
  },
  {
    id: 'workforce',
    title: 'Workforce Board View',
    icon: BarChart3,
    image: '/images/pages/wioa-meeting.jpg',
    alt: 'Workforce board staff reviewing program outcomes and funding data',
    href: '/demo/admin/wioa',
    description: 'Built for workforce boards and state agencies. WIOA eligibility, ITA tracking, PIRL reporting, and partner network management. The same admin dashboard, filtered for what matters to you.',
    highlights: ['WIOA eligibility screening with document verification', 'Track WIOA, state, employer, and grant funding together', 'Automated PIRL reporting and quarterly performance', 'Manage your network of training providers and employers'],
  },
];

export default function StoreDemosPage() {

  return (
    <div className="min-h-screen bg-white">      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Platform', href: '/store' }, { label: 'Demos' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="py-14 sm:py-18">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-6">
            Try It Before You Buy It
          </h1>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto mb-3">
            These are live, interactive demos with sample data. Click through every screen — search students, generate reports, review candidates. No signup required.
          </p>
          <p className="text-sm text-slate-500 mb-8">
            Each demo uses sample data from a fictional training organization. Nothing you do here affects any real system.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/demo/admin" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-red-700 transition">
              <Play className="w-5 h-5" /> Open Admin Demo
            </Link>
            <Link href="/store/trial" className="inline-flex items-center gap-2 border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-white transition">
              Start 14-Day Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Demo cards */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-16">
            {demos.map((demo, i) => (
              <div key={demo.id} id={demo.id} className={`flex flex-col animate-fade-in-up ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}>
                {/* Image */}
                <div className="w-full md:w-1/2 relative rounded-2xl overflow-hidden shadow-lg aspect-video">
                  <Image src={demo.image} alt={demo.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" quality={90} />
                  <Link href={demo.href} className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                      <Play className="w-7 h-7 text-brand-red-600 ml-1" />
                    </div>
                  </Link>
                </div>

                {/* Content */}
                <div className="w-full md:w-1/2">
                  <div className="flex items-center gap-3 mb-2">
                    <demo.icon className="w-6 h-6 text-brand-red-600" />
                    <h2 className="text-2xl font-bold text-slate-900">{demo.title}</h2>
                  </div>
                  <p className="text-slate-700 mb-5">{demo.description}</p>
                  <ul className="space-y-2 mb-6">
                    {demo.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-slate-700 text-sm">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                  <Link href={demo.href} className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-red-700 transition-colors">
                    Open Live Demo <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Ready to set up your own?</h2>
          <p className="text-slate-700 mb-6">
            Start a 14-day trial and get your own branded instance with your real programs and students. No credit card required.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link href="/store/trial" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-red-700 transition">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="flex gap-4 text-sm text-slate-500">
              <Link href="/store/licensing" className="hover:underline">Compare licenses</Link>
              <span>·</span>
              <Link href="/contact" className="hover:underline">Questions?</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
