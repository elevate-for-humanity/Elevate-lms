export const dynamic = 'force-static';


import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Shield, GraduationCap, Briefcase, BarChart3, ArrowRight, CheckCircle, Zap, Clock, Users, Video, BookOpen, Bot, Workflow } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import DemoTabs from './DemoTabs';

export const metadata: Metadata = {
  title: 'Interactive Platform Demos | Elevate for Humanity',
  description: 'Experience the full Elevate workforce platform. Live demos of Admin, Student, Employer portals, AI assistants, and more.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/demos',
  },
};

const walkthroughVideos = [
  { title: 'Platform Overview', duration: '2:34', desc: 'Complete workforce platform walkthrough', icon: BarChart3 },
  { title: 'Student Enrollment', duration: '1:45', desc: 'Application to enrolled in minutes', icon: GraduationCap },
  { title: 'WIOA Compliance', duration: '2:12', desc: 'Automated PIRL reporting', icon: Shield },
  { title: 'Employer Setup', duration: '1:58', desc: 'Partner onboarding in 5 minutes', icon: Briefcase },
  { title: 'AI Assistants', duration: '2:05', desc: 'Lizzy & PARIS in action', icon: Bot },
  { title: 'Course Builder', duration: '1:52', desc: 'AI-powered course creation', icon: BookOpen },
];

const portalDemos = [
  {
    id: 'admin',
    title: 'Admin Dashboard',
    icon: Shield,
    image: '/images/pages/career-counseling.webp',
    alt: 'Training program administrator reviewing enrollment data',
    href: '/store/demo/admin',
    description: 'This is what your staff sees every day. Enrollment tracking, compliance reporting, and application management.',
    highlights: ['Enrollment and completion tracking', 'Compliance reporting for workforce boards', 'Application pipeline management', 'WIOA documentation and audit tools'],
    cta: 'Launch Admin Demo',
  },
  {
    id: 'employer',
    title: 'Employer Portal',
    icon: Briefcase,
    image: '/images/pages/employer-handshake.webp',
    alt: 'Employer reviewing candidate profiles',
    href: '/store/demo/employer',
    description: 'See what your employer partners see - apprentices, OJT contracts, and hiring incentives.',
    highlights: ['Apprenticeship hour tracking', 'OJT contract management', 'MOU document signing', 'WOTC credit visibility'],
    cta: 'Launch Employer Demo',
  },
  {
    id: 'learner',
    title: 'Student Portal',
    icon: GraduationCap,
    image: '/images/pages/wioa-meeting.webp',
    alt: 'Students working on coursework',
    href: '/store/demo/student',
    description: 'Mobile-first learner experience. Courses, progress tracking, credentials, and career services.',
    highlights: ['Course modules with progress', 'Log hours from phone', 'View certificates and credentials', 'Career services access'],
    cta: 'Launch Student Demo',
  },
  {
    id: 'workforce',
    title: 'Workforce Board View',
    icon: BarChart3,
    image: '/images/pages/wioa-meeting.webp',
    alt: 'Workforce board staff reviewing data',
    href: '/store/demo/admin',
    description: 'Built for workforce boards and state agencies. WIOA eligibility, ITA tracking, PIRL reporting.',
    highlights: ['WIOA eligibility screening', 'Multi-funding tracking', 'Automated PIRL reporting', 'Provider network management'],
    cta: 'Launch Board Demo',
  },
];

const demoStats = [
  { value: '3', label: 'Live Demos', icon: Zap },
  { value: '6', label: 'Video Walkthroughs', icon: Video },
  { value: '0', label: 'Signup Required', icon: Users },
  { value: '∞', label: 'Demo Access', icon: Clock },
];

export default function StoreDemosPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Demos" }]} />
      </div>

      {/* Hero - Bright & Clean */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-100 text-brand-red-700 rounded-full text-sm font-bold mb-4">
            <Play className="w-4 h-4" />
            Interactive Demos - No Signup Required
          </span>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
            Experience the Platform
          </h1>

          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Click through live demos of every module. See the complete workforce development operating system.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store/demo/admin" className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition-all hover:shadow-lg">
              Start Full Platform Tour <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#videos" className="inline-flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-8 py-4 rounded-lg transition-all">
              <Video className="w-5 h-5" /> Watch Videos
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Stats */}
      <section className="py-8 border-b border-slate-200 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {demoStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex flex-col items-center">
                  <Icon className="w-6 h-6 text-brand-red-600 mb-2" />
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portal Demo Cards */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Live Portal Demos</h2>
            <p className="text-lg text-slate-600">Click through fully functional demo accounts</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {portalDemos.map((demo) => {
              const Icon = demo.icon;
              return (
                <Link key={demo.id} href={demo.href} className="group relative overflow-hidden rounded-2xl border border-slate-200 hover:shadow-xl transition-all duration-300">
                  <div className="aspect-video relative">
                    <Image src={demo.image} alt={demo.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" quality={80} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 text-brand-red-600 ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-brand-red-600" />
                      <h3 className="font-bold text-slate-900">{demo.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{demo.description}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-red-600 group-hover:gap-2 transition-all">
                      {demo.cta} <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Walkthroughs */}
      <section id="videos" className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">2-Minute Video Walkthroughs</h2>
            <p className="text-lg text-slate-600">Quick explanations of each major feature</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {walkthroughVideos.map((video) => {
              const Icon = video.icon;
              return (
                <div key={video.title} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-brand-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-slate-900">{video.title}</h3>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{video.duration}</span>
                      </div>
                      <p className="text-sm text-slate-600">{video.desc}</p>
                      <button className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-red-600 hover:text-brand-red-700">
                        <Play className="w-4 h-4" /> Watch Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Portal Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-12">
            {portalDemos.map((demo, i) => {
              const Icon = demo.icon;
              return (
                <div key={demo.id} id={demo.id} className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}>
                  <div className="w-full md:w-1/2 relative rounded-2xl overflow-hidden shadow-lg aspect-video">
                    <Image src={demo.image} alt={demo.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" quality={90} />
                    <Link href={demo.href} className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <Play className="w-7 h-7 text-brand-red-600 ml-1" />
                      </div>
                    </Link>
                  </div>
                  <div className="w-full md:w-1/2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-brand-red-100 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-brand-red-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">{demo.title}</h2>
                    </div>
                    <p className="text-slate-700 mb-5">{demo.description}</p>
                    <ul className="space-y-2 mb-6">
                      {demo.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2 text-slate-700">
                          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <Link href={demo.href} className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-red-700 transition-all hover:-translate-y-0.5">
                      {demo.cta} <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-brand-blue-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Want a Personalized Demo?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Book 30 minutes with our team. We'll walk through the features that matter most for your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact?subject=Demo" className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5">
              Schedule Demo <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/store/trial" className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-bold px-8 py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
