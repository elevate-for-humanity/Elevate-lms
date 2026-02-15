import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Play, Shield, Plug } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Platform & Store | Elevate for Humanity',
  description: 'The Elevate Workforce Operating System. Licenses, demos, add-ons, compliance tools, guides, and integrations.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store' },
};

export default function StorePage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Platform & Store' }]} />
        </div>
      </div>

      {/* HERO */}
      <section className="relative h-[50vh] min-h-[400px]">
        <Image src="/images/store/platform-hero.jpg" alt="Elevate Workforce Platform" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-6 w-full">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4">Workforce Operating System</h1>
            <p className="text-xl text-white/90 max-w-2xl mb-8">Licenses, tools, and compliance — everything to run funded training pathways.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="#licenses" className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-lg transition-colors">View Licenses</Link>
              <Link href="/store/demo" className="flex items-center gap-2 bg-white/20 backdrop-blur text-white font-bold px-8 py-4 rounded-lg hover:bg-white/30 transition-colors">
                <Play className="w-5 h-5" /> Platform Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LICENSES */}
      <section id="licenses" className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 text-center mb-4">Platform Licenses</h2>
          <p className="text-lg text-slate-600 text-center mb-12">Choose how you want to run the platform</p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/store/licenses/managed-platform" className="group rounded-2xl overflow-hidden border-2 border-red-600 hover:shadow-xl transition-all">
              <div className="relative h-48">
                <Image src="/images/heroes/lms-dashboard.jpg" alt="Managed Platform" fill className="object-cover" />
                <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">Managed Platform</h3>
                <p className="text-slate-500 mb-2">We operate it. You use it.</p>
                <p className="text-3xl font-black text-slate-900 mb-3">From $1,500<span className="text-lg font-normal text-slate-500">/mo</span></p>
                <p className="text-sm text-slate-600 mb-4">Full platform access, hosting, compliance reporting, 99.9% uptime SLA, dedicated support.</p>
                <span className="inline-flex items-center gap-1 text-red-600 font-bold group-hover:gap-2 transition-all">Get Started <ArrowRight className="w-4 h-4" /></span>
              </div>
            </Link>
            <Link href="/contact?topic=enterprise" className="group rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-red-600 hover:shadow-xl transition-all">
              <div className="relative h-48">
                <Image src="/images/homepage/licensable-platform.jpg" alt="Enterprise Source-Use" fill className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-1">Enterprise Source-Use</h3>
                <p className="text-slate-500 mb-2">You deploy. You operate. We support.</p>
                <p className="text-3xl font-black text-slate-900 mb-3">Custom<span className="text-lg font-normal text-slate-500"> pricing</span></p>
                <p className="text-sm text-slate-600 mb-4">Full source code access, deployment docs, 40 hours implementation support, annual security updates.</p>
                <span className="inline-flex items-center gap-1 text-red-600 font-bold group-hover:gap-2 transition-all">Talk to Licensing <ArrowRight className="w-4 h-4" /></span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* DEMOS */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 text-center mb-4">See It in Action</h2>
          <p className="text-lg text-slate-600 text-center mb-12">Guided tours of every portal</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Admin Dashboard', desc: 'Enrollment, compliance, reporting.', href: '/store/demo/admin', image: '/images/demos/admin-dashboard-thumb.jpg' },
              { title: 'Student Experience', desc: 'Courses, progress, certificates.', href: '/store/demo/student', image: '/images/heroes/student-dashboard.jpg' },
              { title: 'Employer Portal', desc: 'Job postings, candidate matching.', href: '/store/demo/employer', image: '/images/demos/employer-portal-thumb.jpg' },
              { title: 'Full Platform Tour', desc: 'End-to-end walkthrough.', href: '/store/demo', image: '/images/demos/lms-overview-thumb.jpg' },
            ].map((demo) => (
              <Link key={demo.title} href={demo.href} className="group rounded-xl overflow-hidden border border-slate-200 hover:border-red-600 hover:shadow-lg transition-all bg-white">
                <div className="relative h-40">
                  <Image src={demo.image} alt={demo.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 mb-1">{demo.title}</h3>
                  <p className="text-sm text-slate-600 mb-2">{demo.desc}</p>
                  <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-sm group-hover:gap-2 transition-all">View Demo <ArrowRight className="w-4 h-4" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ADD-ONS */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 text-center mb-4">Add-Ons & Tools</h2>
          <p className="text-lg text-slate-600 text-center mb-12">Extend the platform</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'AI Studio', desc: 'Content creation, tutoring, grant writing.', href: '/store/ai-studio', image: '/images/programs-hq/technology-hero.jpg' },
              { title: 'Analytics Pro', desc: 'Dashboards and outcome tracking.', href: '/store/add-ons/analytics-pro', image: '/images/programs-hq/business-office.jpg' },
              { title: 'Community Hub', desc: 'Forums, study groups, peer mentoring.', href: '/store/add-ons/community-hub', image: '/images/programs-hq/students-learning.jpg' },
              { title: 'Compliance Automation', desc: 'Automated WIOA/FERPA reporting.', href: '/store/add-ons/compliance-automation', image: '/images/heroes-hq/funding-hero.jpg' },
            ].map((addon) => (
              <Link key={addon.title} href={addon.href} className="group rounded-xl overflow-hidden border border-slate-200 hover:border-red-600 hover:shadow-lg transition-all bg-white">
                <div className="relative h-40">
                  <Image src={addon.image} alt={addon.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 mb-1">{addon.title}</h3>
                  <p className="text-sm text-slate-600 mb-2">{addon.desc}</p>
                  <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-sm group-hover:gap-2 transition-all">Learn More <ArrowRight className="w-4 h-4" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* COMPLIANCE */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative h-[200px] rounded-2xl overflow-hidden mb-12">
            <Image src="/images/heroes-hq/how-it-works-hero.jpg" alt="Compliance and Trust" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Compliance & Trust</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'WIOA', desc: 'Workforce Innovation and Opportunity Act.', href: '/store/compliance/wioa' },
              { title: 'FERPA', desc: 'Student data privacy and education records.', href: '/store/compliance/ferpa' },
              { title: 'WCAG 2.1 AA', desc: 'Accessibility for all users.', href: '/store/compliance/wcag' },
              { title: 'Grant Reporting', desc: 'Automated reports for funders.', href: '/store/compliance/grant-reporting' },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="group text-center p-6 rounded-xl bg-white border border-slate-200 hover:border-red-600 hover:shadow-lg transition-all">
                <Shield className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* GUIDES */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 text-center mb-4">Guides & Resources</h2>
          <p className="text-lg text-slate-600 text-center mb-12">Toolkits, templates, and professional guides</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: 'Capital Readiness Guide', desc: 'Build institutional trust and funding readiness.', href: '/store/guides/capital-readiness', image: '/images/programs-hq/business-training.jpg' },
              { title: 'Licensing Guide', desc: 'Understand platform licensing options.', href: '/store/guides/licensing', image: '/images/programs-hq/it-support.jpg' },
              { title: 'Grant Writing Toolkit', desc: 'Templates and strategies for grants.', href: '/store/digital/grant-guide', image: '/images/heroes-hq/funding-hero.jpg' },
            ].map((guide) => (
              <Link key={guide.title} href={guide.href} className="group rounded-xl overflow-hidden border border-slate-200 hover:border-red-600 hover:shadow-lg transition-all bg-white">
                <div className="relative h-44">
                  <Image src={guide.image} alt={guide.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 mb-1">{guide.title}</h3>
                  <p className="text-sm text-slate-600 mb-3">{guide.desc}</p>
                  <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-sm group-hover:gap-2 transition-all">Get Guide <ArrowRight className="w-4 h-4" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Integrations</h2>
          <p className="text-lg text-slate-600 mb-12">Connect to your existing systems</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-8">
            {['Stripe', 'Supabase', 'Zapier', 'SAM.gov', 'Salesforce', 'REST API'].map((name) => (
              <div key={name} className="p-4 rounded-xl border border-slate-200 bg-white">
                <Plug className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">{name}</p>
              </div>
            ))}
          </div>
          <Link href="/store/integrations" className="text-red-600 font-semibold hover:underline">View All Integrations →</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-red-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-8">Talk to our team about the right license for your organization.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact?topic=licensing" className="bg-white text-red-600 font-bold px-10 py-4 rounded-lg hover:bg-slate-50 transition-colors">Contact Sales</Link>
            <Link href="/store/demo" className="border-2 border-white text-white font-bold px-10 py-4 rounded-lg hover:bg-white/10 transition-colors">See Platform Demo</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
