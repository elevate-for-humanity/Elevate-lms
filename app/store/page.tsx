
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap, Users, FileCheck, Building2, GraduationCap, BarChart3, Shield, Check } from 'lucide-react';
import { BNPL_CHECKOUT_LABEL } from '@/lib/bnpl-config';
import StoreDemoVideo from './StoreDemoVideo';
import StoreFAQ from './StoreFAQ';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';

export const metadata: Metadata = {
  title: 'License the Elevate Platform | White-Label Workforce LMS',
  description: 'License a turnkey workforce development platform. Automated enrollment, WIOA compliance, credential tracking, employer matching, and reporting.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store' },
};

export default function StorePage() {
  const hero = heroBanners.store;

  return (
    <div className="bg-white min-h-screen">

      {/* ============ HERO ============ */}
      <HeroVideo
        videoSrcDesktop={hero.videoSrcDesktop}
        videoSrcMobile={hero.videoSrcMobile}
        posterImage={hero.posterImage}
        voiceoverSrc={hero.voiceoverSrc}
        microLabel={hero.microLabel}
        transcript={hero.transcript}
        analyticsName={hero.analyticsName}
        belowHeroHeadline={hero.belowHeroHeadline}
        belowHeroSubheadline={hero.belowHeroSubheadline}
        ctas={[
          { label: 'Start 14-Day Free Trial', href: '/store/trial' },
          { label: 'Try Full Demo — No Signup', href: '/demo/admin', variant: 'secondary' },
        ]}
        trustIndicators={hero.trustIndicators}
      />

      {/* ============ TRUST METRICS ============ */}
      <section className="py-8 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '516+', label: 'Database Tables' },
              { value: '938', label: 'Platform Pages' },
              { value: '14', label: 'Program Types' },
              { value: '3', label: 'Portal Views' },
            ].map(m => (
              <div key={m.label}>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">{m.value}</div>
                <div className="text-sm text-slate-500">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHAT THE LICENSE INCLUDES ============ */}
      <section className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-3">What the license includes</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Every license includes the full platform — three portals, all compliance tools, automated reporting, and white-label branding. Nothing is extra.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Users, title: 'Automated Enrollment', desc: 'Online applications, automatic eligibility checks, document collection, and approval workflows. No paper. No re-keying.' },
              { icon: FileCheck, title: 'WIOA & Grant Compliance', desc: 'PIRL reporting, ITA tracking, eligibility documentation, and quarterly performance metrics — generated from enrollment data.' },
              { icon: GraduationCap, title: 'Credential Issuance', desc: 'When a student completes a program, credentials are issued automatically. Employers verify them with a link.' },
              { icon: Building2, title: 'Employer Portal', desc: 'Partners browse pre-screened candidates, track apprenticeship hours, manage OJT reimbursements, and sign MOUs.' },
              { icon: BarChart3, title: 'Automated Reporting', desc: 'WIOA performance, grant utilization, enrollment trends, outcome data. Generated on demand. No manual assembly.' },
              { icon: Zap, title: 'Your Brand, Your Domain', desc: 'Your logo, colors, and URL. Students and employers see your organization. The platform is invisible.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-5">
                <item.icon className="w-5 h-5 text-brand-red-600 mb-3" />
                <h3 className="font-bold text-slate-900 mb-1.5 text-sm">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FULL-ACCESS DEMO ============ */}
      <section className="py-14 sm:py-20 bg-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Try the full platform. No signup. No time limit.</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Every screen is live and clickable. Search students, run reports, review applications, browse candidates.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5 mb-8">
            {[
              { label: 'Admin Dashboard', href: '/demo/admin', desc: 'Enrollment, compliance, reporting' },
              { label: 'Employer Portal', href: '/demo/employer', desc: 'Candidates, apprenticeships, incentives' },
              { label: 'Student Portal', href: '/demo/learner', desc: 'Courses, progress, credentials' },
            ].map(d => (
              <Link key={d.href} href={d.href} className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 transition">
                <h3 className="text-white font-bold mb-1">{d.label}</h3>
                <p className="text-slate-400 text-sm mb-4">{d.desc}</p>
                <span className="text-brand-red-400 text-sm font-semibold inline-flex items-center gap-1">
                  Open Live Demo <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
          <p className="text-slate-500 text-xs text-center">Demo uses sample data. Nothing affects real systems.</p>
        </div>
      </section>

      {/* ============ WHO BUYS THIS ============ */}
      <section className="py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-3">Who this is for</h2>
          <p className="text-slate-600 text-center mb-10">
            Organizations that manage WIOA-funded training, registered apprenticeships, or employer partnerships.
          </p>
          <div className="space-y-6">
            {[
              { title: 'Workforce Boards', desc: 'WIOA eligibility determination, ITA management, PIRL reporting, provider network oversight, quarterly performance metrics. Replace your current patchwork of systems with one platform that does it all.', img: '/images/pages/wioa-meeting.jpg' },
              { title: 'Training Providers', desc: 'Student enrollment, attendance tracking, course delivery, credential issuance, outcome reporting to funders. Stop emailing spreadsheets to your workforce board.', img: '/images/pages/comp-home-highlight-health.jpg' },
              { title: 'Apprenticeship Sponsors', desc: 'DOL-registered program management. Apprentice hour logging, wage progression tracking, OJT reimbursement processing, completion documentation. All in one place.', img: '/images/pages/employer-handshake.jpg' },
            ].map((item) => (
              <div key={item.title} className="border border-slate-200 rounded-xl overflow-hidden flex flex-col md:flex-row">
                <div className="relative w-full md:w-48 h-40 md:h-auto flex-shrink-0 overflow-hidden">
                  <Image src={item.img} alt={item.title} fill quality={85} className="object-cover" sizes="(max-width: 768px) 100vw, 200px" />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMPLIANCE & TRUST ============ */}
      <section className="py-14 sm:py-20 bg-white border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3 justify-center mb-3">
            <Shield className="w-6 h-6 text-brand-red-600" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Built for compliance</h2>
          </div>
          <p className="text-slate-600 text-center mb-10">
            The platform is designed around the regulations workforce organizations already follow.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'WIOA Title I', desc: 'Eligibility determination, ITA management, PIRL reporting, quarterly performance metrics.' },
              { title: 'FERPA', desc: 'Student data privacy controls, consent tracking, role-based access, audit logs.' },
              { title: 'DOL Apprenticeship', desc: 'Registered standards, hour tracking, wage schedules, completion documentation.' },
              { title: 'Grant Reporting', desc: 'Automated reports for WIOA, state workforce grants, and institutional funders.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 p-4 bg-white rounded-lg border border-slate-200">
                <Check className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURED COURSE: HVAC TECHNICIAN ============ */}
      <section className="py-14 sm:py-20 bg-slate-900">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-brand-red-400 font-bold text-xs uppercase tracking-widest mb-2 text-center">Licensable Course Content</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center mb-3">HVAC Technician — Full Course License</h2>
          <p className="text-slate-400 text-center mb-10 max-w-2xl mx-auto">
            License our complete 640-hour HVAC Technician course for your workforce program, community college, or training center. Includes all 16 modules, interactive diagrams, EPA 608 prep, OSHA 10, and CPR/AED.
          </p>
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Video preview */}
            <div>
              <StoreDemoVideo />
              <p className="text-slate-500 text-xs text-center mt-2">Module 1, Lesson 1 — live sample from the course</p>
            </div>
            {/* Course details + CTA */}
            <div className="bg-white rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-brand-red-100 text-brand-red-700 text-xs font-bold px-3 py-1 rounded-full">16 Modules · 94 Lessons</span>
                <span className="bg-white text-slate-600 text-xs font-bold px-3 py-1 rounded-full">640 Hours</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">HVAC Technician Course</h3>
              <div className="mb-4">
                <span className="text-3xl font-black text-slate-900">$4,500</span>
                <span className="text-slate-500 text-sm ml-1">/ annual license</span>
              </div>
              <p className="text-slate-600 text-sm mb-5">Per-organization license. Minimum 10 students. Volume pricing available for workforce networks and state agencies.</p>
              <ul className="space-y-2 mb-6">
                {[
                  'EPA 608 Core, Type I, Type II, Type III prep',
                  'Interactive refrigeration cycle & wiring diagrams',
                  'OSHA 10-Hour and CPR/AED content',
                  'SCORM/xAPI export for your existing LMS',
                  'Instructor guide + 400-question assessment bank',
                  'Annual content updates included',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-brand-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/store/courses/hvac-technician-course-license"
                className="block text-center bg-brand-red-600 text-white font-bold py-3 rounded-lg hover:bg-brand-red-700 transition mb-2"
              >
                License This Course
              </Link>
              <Link
                href="/course-preview/hvac-technician"
                className="block text-center border border-slate-300 text-slate-700 font-semibold py-3 rounded-lg hover:bg-white transition text-sm"
              >
                Preview Full Course Demo →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-3">Licensing</h2>
          <p className="text-slate-600 text-center mb-10">Two deployment options. Both start with a 14-day free trial.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Managed */}
            <div className="border-2 border-brand-red-600 rounded-2xl p-8 relative">
              <span className="absolute -top-3 left-6 bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">Recommended</span>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Managed Platform</h3>
              <div className="mb-1">
                <span className="text-4xl font-black text-slate-900">$1,500</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">$18,000/year + one-time setup fee. Cancel anytime.</p>
              <p className="text-slate-600 text-sm mb-6">
                Full platform with your branding and domain. All three portals, compliance tools, reporting, and support. Onboarding included. Launch in two weeks.
              </p>
              <ul className="space-y-2 mb-6">
                {['Admin, Student & Employer portals', 'Your logo, colors, and domain', 'WIOA compliance & PIRL reporting', 'Automated credential issuance', 'Onboarding & data migration', 'Email & phone support'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-brand-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/store/trial" className="block text-center bg-brand-red-600 text-white font-bold py-3 rounded-lg hover:bg-brand-red-700 transition">
                Start 14-Day Free Trial
              </Link>
              <Link href="/store/licensing/managed" className="block text-center text-slate-600 text-sm font-medium mt-2 hover:underline">
                View plans & purchase directly →
              </Link>
              <p className="text-xs text-slate-400 mt-3 text-center">Stripe, {BNPL_CHECKOUT_LABEL} at checkout</p>
            </div>
            {/* Enterprise */}
            <div className="border border-slate-200 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Enterprise Source-Use</h3>
              <div className="mb-1">
                <span className="text-4xl font-black text-slate-900">$75,000</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">One-time license + $15,000/year maintenance. Includes source code.</p>
              <p className="text-slate-600 text-sm mb-6">
                Deploy on your infrastructure with full source access. For state agencies and large workforce networks that need complete control.
              </p>
              <ul className="space-y-2 mb-6">
                {['Everything in Managed', 'Self-hosted on your servers', 'Full source code access', '40 hours implementation support', 'Annual updates & patches', 'Volume licensing available'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-brand-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/store/licensing/enterprise" className="block text-center border border-slate-300 text-slate-700 font-bold py-3 rounded-lg hover:bg-white transition">
                View Enterprise License
              </Link>
              <p className="text-xs text-slate-400 mt-3 text-center">Stripe, {BNPL_CHECKOUT_LABEL} at checkout</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ALSO IN THE STORE ============ */}
      <section className="py-10 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Also in the Store</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/store/courses" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-red-300 hover:text-brand-red-700 transition-colors">
              Certification Courses
            </Link>
            <Link href="/store/digital" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-red-300 hover:text-brand-red-700 transition-colors">
              Digital Resources
            </Link>
            <Link href="/store/ai-studio" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-red-300 hover:text-brand-red-700 transition-colors">
              AI Studio
            </Link>
            <Link href="/store/apps/grants" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-red-300 hover:text-brand-red-700 transition-colors">
              Grants App
            </Link>
            <Link href="/store/apps/sam-gov" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-red-300 hover:text-brand-red-700 transition-colors">
              SAM.gov Assistant
            </Link>
            <Link href="/store/apps/website-builder" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-red-300 hover:text-brand-red-700 transition-colors">
              Website Builder
            </Link>
            <Link href="/creator/products" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-red-300 hover:text-brand-red-700 transition-colors">
              Creator Products
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <StoreFAQ />

      {/* ============ CTA ============ */}
      <section className="py-14 sm:py-20 bg-slate-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Try it free for 14 days.</h2>
          <p className="text-lg text-slate-400 mb-8">
            Your own branded instance, provisioned instantly. No credit card. Full platform access. Convert to a paid license when you&apos;re ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store/trial" className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold px-8 py-3.5 rounded-lg transition">
              Start 14-Day Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/demo/admin" className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-semibold px-8 py-3.5 rounded-lg hover:bg-white transition">
              Try Full Demo First
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
