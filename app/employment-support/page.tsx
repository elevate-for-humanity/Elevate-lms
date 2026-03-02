import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, Users, FileText, Mic, Handshake, Bus, HeartHandshake } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/employment-support' },
  title: 'Employment & Participant Support | Elevate for Humanity',
  description:
    'One-on-one employment support services including job readiness, applications, interview prep, employer matching, and retention support.',
};

export default function EmploymentSupportPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Support Services' }]} />
        </div>
      </div>

      {/* Hero — image only, no text overlay */}
      <section className="relative h-[240px] sm:h-[320px] md:h-[400px]">
        <Image
          src="/images/employment-support/hero-clean.jpg"
          alt="Employment support services at Elevate for Humanity"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      {/* Page heading below hero */}
      <section className="bg-white py-6 sm:py-10">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-sm font-semibold tracking-wide text-brand-blue-600 mb-1">Support Services</p>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2">
            Employment &amp; Participant Support
          </h1>
          <p className="text-sm sm:text-lg text-slate-600 max-w-xl">
            Individualized, one-on-one support to help participants prepare for and pursue
            competitive community employment. We are not training-only.
          </p>
        </div>
      </section>

      {/* What We Provide — image cards */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-2">
            What We Provide
          </h2>
          <p className="text-center text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Every participant receives individualized support from enrollment through placement and beyond.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
            {[
              {
                title: 'One-on-One Career Coaching',
                desc: 'Work directly with a career advisor to set goals, identify strengths, and build a personalized employment plan.',
                image: '/images/employment-support/career-coaching.jpg',
              },
              {
                title: 'Resume & Application Assistance',
                desc: 'Get help building a professional resume, completing job applications, and creating cover letters tailored to your target industry.',
                image: '/images/employment-support/resume-assistance.jpg',
              },
              {
                title: 'Interview Preparation',
                desc: 'Practice with mock interviews, receive feedback, and learn how to present yourself confidently to employers.',
                image: '/images/employment-support/interview-prep.jpg',
              },
              {
                title: 'Employer Connections',
                desc: 'We connect you directly with employer partners who are actively hiring in your field through our partner network.',
                image: '/images/employment-support/employer-connections.jpg',
              },
              {
                title: 'Barrier-to-Employment Support',
                desc: 'Transportation coordination, referral support, and assistance addressing challenges that impact your ability to work.',
                image: '/images/employment-support/barrier-support.jpg',
              },
              {
                title: 'Post-Placement Retention',
                desc: 'Follow-up support after you start working to help you stay employed, resolve workplace issues, and advance in your career.',
                image: '/images/employment-support/retention-support.jpg',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 sm:flex-col rounded-xl overflow-hidden border border-slate-200 bg-white">
                <div className="relative w-28 h-28 sm:w-full sm:h-[180px] flex-shrink-0 sm:flex-shrink">
                  <Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 112px, (max-width: 1024px) 50vw, 33vw" className="object-cover" loading="lazy" />
                </div>
                <div className="py-3 pr-3 sm:p-5 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1">{item.title}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Path to Employment — steps */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">
            Your Path to Employment
          </h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Enroll in Training', desc: 'Choose a program that matches your career goals and complete your enrollment.' },
              { step: '2', title: 'Receive One-on-One Support', desc: 'Meet with your career advisor to build a personalized employment plan.' },
              { step: '3', title: 'Build Your Resume', desc: 'Create a professional resume and practice completing applications.' },
              { step: '4', title: 'Prepare for Interviews', desc: 'Practice with mock interviews and get feedback from hiring professionals.' },
              { step: '5', title: 'Connect With Employers', desc: 'We introduce you to employer partners who are hiring in your field.' },
              { step: '6', title: 'Start Working & Get Follow-Up Support', desc: 'Begin your new role with continued support to help you stay employed and advance.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 bg-white rounded-lg border border-slate-200 p-4">
                <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-8 sm:py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative rounded-2xl overflow-hidden h-[300px] md:h-auto min-h-[300px]">
              <Image
                src="/images/employment-support/who-we-serve.jpg"
                alt="Participants in a training session"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                Serving Individuals With Barriers to Employment
              </h2>
              <p className="text-slate-700 mb-4">
                We routinely support individuals facing employment barriers, including individuals with
                disabilities, justice involvement, low-income status, and other factors that impact access to work.
              </p>
              <p className="text-slate-700 mb-4">
                Support is individualized based on participant needs and employment goals. We work with
                each person to identify and address the specific challenges standing between them and
                competitive community employment.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  { icon: Users, label: 'Individualized Plans' },
                  { icon: Handshake, label: 'Employer Matching' },
                  { icon: Bus, label: 'Transportation Help' },
                  { icon: HeartHandshake, label: 'Retention Support' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 text-sm text-slate-700">
                    <item.icon className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Training + Support Connection */}
      <section className="py-8 sm:py-14 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="relative h-[200px] rounded-xl overflow-hidden mb-4">
                <Image
                  src="/images/employment-support/industry-training.jpg"
                  alt="Hands-on industry training"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Industry Training</h3>
              <p className="text-slate-700 text-sm">
                Participants receive hands-on training in high-demand fields like HVAC, barbering,
                healthcare, CDL, and technology. Training builds the technical skills employers need.
              </p>
              <Link
                href="/programs"
                className="inline-flex items-center mt-4 text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-700"
              >
                View Programs <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="relative h-[200px] rounded-xl overflow-hidden mb-4">
                <Image
                  src="/images/employment-support/one-on-one-support.jpg"
                  alt="One-on-one career coaching session"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">One-on-One Support</h3>
              <p className="text-slate-700 text-sm">
                Every participant also receives individualized employment support — career coaching,
                resume help, interview prep, and direct employer connections. Training builds skills.
                Support drives placement and retention.
              </p>
              <Link
                href="/career-services"
                className="inline-flex items-center mt-4 text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-700"
              >
                Career Services <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Disclaimer */}
      <section className="py-6 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-sm text-slate-600">
              <strong>Disclosure:</strong> Elevate for Humanity provides employment assistance and employer connections.
              Job placement is not guaranteed and depends on participant readiness, local hiring demand, and employer
              selection. Support services are included with enrollment at no additional cost.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 sm:py-14 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            Ready to Start Your Career?
          </h2>
          <p className="text-white/90 mb-6 text-sm">
            Apply for training and receive one-on-one employment support at no extra cost.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/apply"
              className="bg-white text-brand-blue-600 font-bold px-6 py-3 rounded-lg text-base hover:bg-brand-blue-50 transition-colors text-center"
            >
              Apply Now <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
            <Link
              href="/employers"
              className="border-2 border-white text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center"
            >
              Employer Partnerships
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white/50 text-white font-bold px-6 py-3 rounded-lg text-base hover:bg-white/10 transition-colors text-center"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
