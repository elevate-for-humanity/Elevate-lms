'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Menu, X, Phone, Mail, BookOpen, Users, TrendingUp, Clock, DollarSign, Shield, CheckCircle, BarChart2 } from 'lucide-react';

const NAV = [
  { label: 'Portals', href: '#portals' },
  { label: 'Student', href: '/student-portal' },
  { label: 'Employer', href: '/employer-portal' },
  { label: 'Staff', href: '/staff-portal' },
  { label: 'Admin', href: '/admin-login' },
];

const PORTALS = [
  {
    title: 'Student Portal',
    desc: 'Access courses, track progress, view grades, manage your schedule, and connect with instructors and career services.',
    href: '/student-portal',
    loginHref: '/login?redirect=/learner/dashboard',
    image: '/images/pages/career-services-page-1.jpg',
    Icon: BookOpen,
    features: ['Course Materials', 'Grade Tracking', 'Career Services', 'Schedule'],
    accent: 'bg-brand-blue-600 hover:bg-brand-blue-700',
    tagBg: 'bg-brand-blue-50 text-brand-blue-700',
  },
  {
    title: 'Employer Portal',
    desc: 'Manage apprentices, track training progress, access compliance documents, and connect with program coordinators.',
    href: '/employer-portal',
    loginHref: '/login?redirect=/employer/dashboard',
    image: '/images/pages/career-services-page-1.jpg',
    Icon: Users,
    features: ['Apprentice Mgmt', 'Training Progress', 'Compliance', 'Hiring Tools'],
    accent: 'bg-green-600 hover:bg-green-700',
    tagBg: 'bg-green-50 text-green-700',
  },
  {
    title: 'Partner Portal',
    desc: 'Collaborate on programs, access partnership resources, track referrals, and manage your organization\'s involvement.',
    href: '/partner-portal',
    loginHref: '/login?redirect=/partner',
    image: '/images/pages/career-services-page-1.jpg',
    Icon: TrendingUp,
    features: ['Collaboration', 'Referral Tracking', 'Resources', 'Reports'],
    accent: 'bg-purple-600 hover:bg-purple-700',
    tagBg: 'bg-purple-50 text-purple-700',
  },
  {
    title: 'Staff Portal',
    desc: 'Manage students, track enrollments, record attendance, generate reports, and access administrative tools.',
    href: '/staff-portal',
    loginHref: '/login?redirect=/staff-portal/dashboard',
    image: '/images/pages/career-services-page-1.jpg',
    Icon: Clock,
    features: ['Student Mgmt', 'Attendance', 'Reports', 'Scheduling'],
    accent: 'bg-amber-600 hover:bg-amber-700',
    tagBg: 'bg-amber-50 text-amber-700',
  },
  {
    title: 'Workforce Board',
    desc: 'Access workforce development data, program outcomes, compliance reports, and funding utilization dashboards.',
    href: '/workforce-board',
    loginHref: '/login?redirect=/workforce-board',
    image: '/images/pages/career-services-page-1.jpg',
    Icon: DollarSign,
    features: ['Outcomes Data', 'Compliance', 'Funding Reports', 'Analytics'],
    accent: 'bg-teal-600 hover:bg-teal-700',
    tagBg: 'bg-teal-50 text-teal-700',
  },
  {
    title: 'Admin Dashboard',
    desc: 'Full platform administration. Manage users, programs, enrollments, content, analytics, and system configuration.',
    href: '/admin-login',
    loginHref: '/login?redirect=/admin/dashboard',
    image: '/images/pages/career-services-page-1.jpg',
    Icon: Shield,
    features: ['User Mgmt', 'Program Admin', 'Analytics', 'System Config'],
    accent: 'bg-brand-red-600 hover:bg-brand-red-700',
    tagBg: 'bg-brand-red-50 text-brand-red-700',
  },
];

const FEATURES = [
  { Icon: TrendingUp, title: 'Personalized Dashboards', desc: 'Role-based views tailored to your needs' },
  { Icon: BarChart2, title: 'Real-Time Analytics', desc: 'Track progress, outcomes, and performance' },
  { Icon: BookOpen, title: 'Document Management', desc: 'Access forms, reports, and compliance docs' },
  { Icon: Shield, title: 'Secure Access', desc: 'Role-based permissions and data protection' },
];

export default function ConnectsLandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/connects" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Elevate Connects" width={140} height={40} className="h-9 w-auto brightness-0 invert" priority />
              <span className="hidden sm:inline text-xs font-bold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-full border border-cyan-800">Connects</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map((n) => (
                <Link key={n.label} href={n.href} className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-800 rounded-lg transition-colors">{n.label}</Link>
              ))}
              <Link href="/login" className="ml-1 px-5 py-2.5 text-sm font-bold bg-cyan-600 hover:bg-cyan-700 text-slate-900 rounded-lg transition-colors">Sign In</Link>
            </nav>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-800" aria-label="Menu">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {mobileOpen && (
            <div className="lg:hidden border-t border-slate-700 py-3 space-y-1">
              {NAV.map((n) => <Link key={n.label} href={n.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-800 rounded-lg">{n.label}</Link>)}
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-bold text-cyan-400">Sign In</Link>
            </div>
          )}
        </div>
      </header>

      {/* HERO — static image, portal directory page does not need video */}
      <section className="pt-16">
        <div className="relative w-full overflow-hidden aspect-[4/3]" style={{ minHeight: '280px', maxHeight: '360px' }}>
          <Image src="/images/pages/career-services-page-1.jpg" alt="Elevate Connects portal directory" fill sizes="100vw" className="object-cover" priority />
        </div>
        <div className="bg-white py-10 md:py-14 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <TrendingUp className="w-4 h-4" /> Elevate Connects
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Your Dashboard. Your Portal.</h1>
            <p className="text-base md:text-lg text-slate-600 mb-8 max-w-3xl mx-auto">One platform, every role. Access your personalized dashboard — whether you&apos;re a student, employer, partner, staff member, or administrator.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/login" className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-slate-900 px-7 py-3.5 rounded-lg font-bold transition-colors">Sign In to Your Portal <ArrowRight className="w-5 h-5" /></Link>
              <Link href="#portals" className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-900 px-7 py-3.5 rounded-lg font-semibold transition-colors">Browse Portals</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-8 border-b">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <f.Icon className="w-7 h-7 mt-0.5 text-brand-blue-600 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-gray-900">{f.title}</div>
                <div className="text-xs text-gray-500">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PORTAL CARDS */}
      <section id="portals" className="py-16 px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Choose Your Portal</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Each portal is tailored to your role. Sign in to access your personalized dashboard, tools, and resources.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PORTALS.map((p) => (
              <div key={p.title} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100">
                <div className="relative w-full aspect-[4/3]" style={{ aspectRatio: '16/9' }}>
                  <Image src={p.image} alt={p.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <p.Icon className="w-9 h-9 text-slate-600 flex-shrink-0" />
                    <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{p.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.features.map((f) => <span key={f} className={`text-xs px-2 py-1 rounded-full ${p.tagBg}`}>{f}</span>)}
                  </div>
                  <div className="flex gap-2">
                    <Link href={p.loginHref} className={`flex-1 inline-flex items-center justify-center gap-1.5 ${p.accent} text-slate-900 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors`}>
                      Sign In <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link href={p.href} className="inline-flex items-center justify-center gap-1 border border-gray-200 hover:bg-white text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUICK SIGN IN */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-cyan-600" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Already have an account?</h2>
          <p className="text-gray-600 mb-6">Sign in and you&apos;ll be automatically directed to your dashboard based on your role.</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-slate-900 px-8 py-3.5 rounded-lg font-bold text-lg transition-colors">
            Sign In <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="mt-4 text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/start" className="text-cyan-600 hover:underline font-semibold">Apply for a program</Link>
            {' '}or{' '}
            <Link href="/contact" className="text-cyan-600 hover:underline font-semibold">contact us</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-500 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <Image src="/logo.png" alt="Elevate for Humanity" width={120} height={36} className="h-8 w-auto brightness-0 invert mb-3" />
              <div className="text-sm">8888 Keystone Crossing, Suite 1300</div>
              <div className="text-sm">Indianapolis, IN 46240</div>
              <div className="flex items-center gap-2 mt-3 text-sm"><Phone className="w-4 h-4" /><a href="tel:+13173550500" className="hover:text-slate-900">(317) 355-0500</a></div>
              <div className="flex items-center gap-2 mt-1 text-sm"><Mail className="w-4 h-4" /><a href="mailto:info@elevateforhumanity.org" className="hover:text-slate-900">info@elevateforhumanity.org</a></div>
            </div>
            <div>
              <div className="text-slate-900 font-semibold mb-3">Portals</div>
              <div className="space-y-2 text-sm">
                {PORTALS.map((p) => <Link key={p.title} href={p.href} className="block hover:text-slate-900">{p.title}</Link>)}
              </div>
            </div>
            <div>
              <div className="text-slate-900 font-semibold mb-3">Quick Links</div>
              <div className="space-y-2 text-sm">
                <Link href="/login" className="block hover:text-slate-900">Sign In</Link>
                <Link href="/start" className="block hover:text-slate-900">Apply for a Program</Link>
                <Link href="/support" className="block hover:text-slate-900">Support</Link>
                <Link href="/contact" className="block hover:text-slate-900">Contact</Link>
                <Link href="/privacy-policy" className="block hover:text-slate-900">Privacy Policy</Link>
                <Link href="https://www.elevateforhumanity.org" className="block hover:text-slate-900">Main Site</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm">
            <div>&copy; {new Date().getFullYear()} Elevate for Humanity. All rights reserved.</div>
            <div className="flex gap-4">
              <Link href="https://www.elevateforhumanity.org" className="hover:text-slate-900">elevateforhumanity.org</Link>
              <Link href="https://www.elevateforhumanityeducation.com" className="hover:text-slate-900">Education</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
