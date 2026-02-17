import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import {
  Shield, BarChart3, Lock, FileCheck, Users, Globe,
} from 'lucide-react';

const CAPABILITIES = [
  {
    icon: Shield,
    title: 'WIOA / WRG / JRI Compliant',
    desc: 'Every enrollment, credential, and outcome tracked to federal and state reporting standards.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Outcome Tracking',
    desc: 'Enrollment, completion, credential attainment, employment, and wage gains — all auditable.',
  },
  {
    icon: Lock,
    title: 'FERPA-Compliant Data Handling',
    desc: 'Role-based access, encrypted PII, audit logs on every record access.',
  },
  {
    icon: FileCheck,
    title: 'Audit-Ready Documentation',
    desc: 'Exportable reports, compliance dashboards, and automated alert systems.',
  },
  {
    icon: Users,
    title: 'Multi-Tenant Architecture',
    desc: 'Partner portals, employer dashboards, and workforce board views — each with scoped access.',
  },
  {
    icon: Globe,
    title: 'ETPL-Approved Provider',
    desc: 'Listed on Indiana\'s Eligible Training Provider List. Programs aligned with state demand occupations.',
  },
];

export default function InfrastructureAuthority() {
  return (
    <section className="py-20 sm:py-28 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: positioning */}
          <ScrollReveal direction="left">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Workforce Infrastructure
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                Not a training center.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
                  A workforce delivery system.
                </span>
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Secure, trackable, compliant workforce training infrastructure. Multi-tenant portals for students, employers, and government partners — each with role-based access and real-time reporting.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/platform"
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-bold px-8 py-4 rounded-xl hover:bg-slate-800 transition-all"
                >
                  Platform Overview
                </Link>
                <Link
                  href="/compliance"
                  className="inline-flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-700 font-semibold px-8 py-4 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Compliance Details
                </Link>
              </div>

              {/* Partner logos */}
              <div className="mt-12 pt-8 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Approved & Recognized By
                </p>
                <div className="flex items-center gap-8 flex-wrap">
                  {[
                    { src: '/images/partners/usdol.webp', alt: 'U.S. Department of Labor' },
                    { src: '/images/partners/dwd.webp', alt: 'Indiana DWD' },
                    { src: '/images/partners/workone.webp', alt: 'WorkOne Indiana' },
                    { src: '/images/partners/nextleveljobs.webp', alt: 'Next Level Jobs' },
                  ].map((logo) => (
                    <Image
                      key={logo.alt}
                      src={logo.src}
                      alt={logo.alt}
                      width={120}
                      height={48}
                      className="object-contain h-10 w-auto opacity-60 hover:opacity-100 transition-opacity"
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Right: capability grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {CAPABILITIES.map((cap, i) => {
              const Icon = cap.icon;
              return (
                <ScrollReveal key={i} delay={i * 80} direction="right">
                  <div className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all bg-white group">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center mb-3 transition-colors">
                      <Icon className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{cap.title}</h3>
                    <p className="text-sm text-slate-500">{cap.desc}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
