'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap,
  ArrowRight,
  DollarSign,
  Clock,
  Award,
CheckCircle, } from 'lucide-react';

interface Program {
  title: string;
  duration: string;
  pay: string;
  href: string;
}

export default function StudentsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch('/api/programs');
        const data = await res.json();
        if (data.status === 'success' && data.programs) {
          setPrograms(data.programs.slice(0, 6).map((p: any) => ({
            title: p.name || p.title,
            duration: p.estimated_weeks ? `${p.estimated_weeks} weeks` : 'Flexible',
            pay: p.is_free ? 'Free' : 'Funded',
            href: `/programs/${p.slug}`,
          })));
        }
      } catch (error) {
        console.error('Failed to fetch programs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPrograms();
  }, []);

  const benefits = [
    'Funded Training',
    'No Student Debt',
    'Get Paid While You Learn',
    'Job Placement Assistance',
    'Industry Certifications',
    'Flexible Schedules',
  ];

  // Programs are now fetched from database via useEffect above

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "For", href: "/for" }, { label: "Students" }]} />
      </div>
{/* Hero */}
      <section className="relative h-[600px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/courses/medical-assistant-10002419-cover.jpg"
          alt="Students in training"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-green-600 px-4 py-2 rounded-full mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <span className="font-semibold">Funded Training</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Start Your Career Journey
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            No student debt. Get certified. Get hired.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-orange-600 text-white font-bold rounded-lg hover:bg-brand-orange-700 transition text-lg"
            >
              Apply Now
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-bold rounded-lg hover:bg-slate-100 transition text-lg"
            >
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-black mb-12">
            Why Choose Us
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-3 bg-white p-6 rounded-lg border border-slate-200"
              >
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="font-semibold text-black">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-black mb-12">
            Popular Programs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.map((program: any) => (
              <Link
                key={program.href}
                href={program.href}
                className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition group"
              >
                <h3 className="text-xl font-bold text-black mb-4 group-hover:text-brand-blue-600">
                  {program.title}
                </h3>
                <div className="space-y-2 text-sm text-black mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{program.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>{program.pay}</span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold group-hover:gap-3 transition-all">
                  Learn More
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
            >
              View All 20 Programs
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-black mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Apply',
                desc: 'Fill out a simple application',
              },
              {
                step: '2',
                title: 'Get Approved',
                desc: 'We help with funding approval',
              },
              {
                step: '3',
                title: 'Start Training',
                desc: 'Begin your program',
              },
              {
                step: '4',
                title: 'Get Hired',
                desc: 'Job placement assistance',
              },
            ].map((item: any) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-blue-600 text-white text-2xl font-bold rounded-full mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-black mb-2">
                  {item.title}
                </h3>
                <p className="text-black">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-zinc-900   text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start?</h2>
          <p className="text-xl mb-8">
            Apply now and start your career journey today.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-blue-600 font-bold rounded-lg hover:bg-gray-50 transition text-lg"
          >
            Apply Now
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
