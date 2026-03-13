'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ArrowRight, TrendingUp, Clock, DollarSign } from 'lucide-react';

const PROGRAMS = [
  {
    title: 'CNA Certification',
    image: '/images/pages/cna-clinical.jpg',
    duration: '6 weeks',
    salary: '$35K–$42K',
    placement: '92%',
    href: '/programs/cna',
    category: 'Healthcare',
  },
  {
    title: 'CDL Class A',
    image: '/images/pages/hvac-technician.jpg',
    duration: '8 weeks',
    salary: '$55K–$72K',
    placement: '88%',
    href: '/programs/cdl',
    category: 'Transportation',
  },
  {
    title: 'HVAC Technician',
    image: '/images/pages/cdl-truck-highway.jpg',
    duration: '12 weeks',
    salary: '$45K–$65K',
    placement: '85%',
    href: '/programs/hvac-technician',
    category: 'Skilled Trades',
  },
  {
    title: 'Medical Assistant',
    image: '/images/pages/it-helpdesk-desk.jpg',
    duration: '10 weeks',
    salary: '$32K–$40K',
    placement: '87%',
    href: '/programs/medical-assistant',
    category: 'Healthcare',
  },
  {
    title: 'Welding',
    image: '/images/pages/barber-hero-main.jpg',
    duration: '14 weeks',
    salary: '$40K–$58K',
    placement: '83%',
    href: '/programs/welding',
    category: 'Skilled Trades',
  },
  {
    title: 'IT Help Desk',
    image: '/images/pages/welding-sparks.jpg',
    duration: '8 weeks',
    salary: '$38K–$60K',
    placement: '80%',
    href: '/programs/it-help-desk',
    category: 'Technology',
  },
];

export default function ProgramOutcomes() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Programs with Outcomes
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                Pick a career. See the numbers.
              </h2>
            </div>
            <Link
              href="/programs"
              className="hidden sm:inline-flex items-center gap-2 text-slate-600 font-semibold hover:text-slate-900 transition-colors"
            >
              View all programs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROGRAMS.map((program, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <Link href={program.href} className="group block">
                <div className="rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 bg-white">
                  {/* Image with zoom */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={program.image}
                      alt={`${program.title} training program`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />

                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
                      {program.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 group-hover:text-brand-blue-600 transition-colors">
                      {program.title}
                    </h3>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center gap-1 text-slate-400 mb-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="text-xs">Salary</span>
                        </div>
                        <p className="font-bold text-slate-900 text-sm">{program.salary}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-slate-400 mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs">Duration</span>
                        </div>
                        <p className="font-bold text-slate-900 text-sm">{program.duration}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-slate-400 mb-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span className="text-xs">Placed</span>
                        </div>
                        <p className="font-bold text-emerald-600 text-sm">{program.placement}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <div className="text-center mt-10 sm:hidden">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 text-slate-600 font-semibold hover:text-slate-900 transition-colors"
          >
            View all programs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
