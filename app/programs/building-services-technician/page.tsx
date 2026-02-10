export const dynamic = 'force-static';
export const revalidate = 86400;

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Building Services Technician Apprenticeship | Elevate for Humanity',
  description: 'DOL Registered Apprenticeship in building services and facility maintenance. 6000-hour program with paid OJT. Multi-story window cleaning, building maintenance, and more.',
  alternates: { canonical: `${SITE_URL}/programs/building-services-technician` },
  openGraph: {
    title: 'Building Services Technician Apprenticeship | Elevate for Humanity',
    description: 'DOL Registered Apprenticeship in building services and facility maintenance. 6000-hour program with paid OJT.',
    url: `${SITE_URL}/programs/building-services-technician`,
    siteName: 'Elevate for Humanity',
    images: [{ url: `${SITE_URL}/images/programs/building-technician-hero.jpg`, width: 1200, height: 630, alt: 'Building Services Technician' }],
    type: 'website',
  },
};

export default function BuildingServicesTechnicianPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* HERO */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[500px]">
        <Image
          src="/images/programs/efh-building-tech-hero.jpg"
          alt="Building Services Technician"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <Breadcrumbs
              items={[
                { label: 'Programs', href: '/programs' },
                { label: 'Apprenticeships', href: '/programs/apprenticeships' },
                { label: 'Building Services Technician' },
              ]}
              className="text-white/80 mb-4"
            />
            <span className="inline-block px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-full mb-4">
              DOL REGISTERED APPRENTICESHIP
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Building Services Technician
            </h1>
            <p className="text-xl text-white/90 max-w-2xl">
              Multi-story window cleaning, facility maintenance, and building services. Earn while you learn with paid on-the-job training.
            </p>
          </div>
        </div>
      </section>

      {/* CTA BUTTONS */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/programs/building-services-technician/apply"
            className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white font-bold rounded-full hover:bg-green-500 transition text-lg"
          >
            Apply Now
          </Link>
          <Link
            href="/inquiry?program=building-services-technician"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-bold rounded-full border-2 border-black hover:bg-gray-100 transition text-lg"
          >
            Request Information
          </Link>
        </div>
      </section>

      {/* PROGRAM QUICK FACTS */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-blue-600">6,000</div>
              <div className="text-slate-600">Training Hours</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-green-600">$19/hr</div>
              <div className="text-slate-600">Avg Journeyworker Wage</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-purple-600">500</div>
              <div className="text-slate-600">Probation Hours</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-3xl font-bold text-orange-600">5</div>
              <div className="text-slate-600">Journeyworkers</div>
            </div>
          </div>
        </div>
      </section>

      {/* EARN WHILE YOU LEARN */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Earn While You Learn</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-bold text-xl mb-2">Get Hired</h3>
              <p className="text-slate-600">Start working with an approved employer from day one. No waiting—you begin earning immediately.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-bold text-xl mb-2">Learn On-the-Job</h3>
              <p className="text-slate-600">Train alongside experienced journeyworkers. Learn building maintenance, window cleaning, and facility services.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-bold text-xl mb-2">Earn Credentials</h3>
              <p className="text-slate-600">Complete 6,000 hours and earn your DOL Journeyworker Certificate. Your wages increase as you progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY STRIP */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <Image src="/images/building-maintenance.jpg" alt="Building Maintenance" fill className="object-cover" />
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <Image src="/images/programs/building-maintenance-hero.jpg" alt="Facility Services" fill className="object-cover" />
          </div>
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
            <Image src="/images/facility-hero.jpg" alt="Building Services" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* WHAT IS THIS PROGRAM */}
      <section id="overview" className="max-w-7xl mx-auto px-6 py-20 scroll-mt-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-green-600 font-semibold text-sm">RAPIDS CODE: 0688CB</span>
            <h2 className="text-3xl font-bold mt-2 mb-6">What is Building Services Technician?</h2>
            <p className="text-lg text-slate-700 mb-4">
              Building Services Technicians are skilled professionals who maintain and service commercial and residential buildings. This includes multi-story window cleaning, general building maintenance, HVAC support, plumbing basics, electrical systems, and facility management.
            </p>
            <p className="text-lg text-slate-700 mb-4">
              As a DOL Registered Apprenticeship, you'll complete 6,000 hours of on-the-job training while earning wages. This is one of our most comprehensive programs, preparing you for a career in facility management and building services.
            </p>
            <p className="text-lg text-slate-700">
              Upon completion, you'll receive a nationally recognized Journeyworker Certificate from the U.S. Department of Labor.
            </p>
          </div>
          <div className="relative h-96 rounded-2xl overflow-hidden">
            <Image src="/images/programs/efh-building-tech-card.jpg" alt="Building Services Training" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* WHO SHOULD APPLY */}
      <section id="requirements" className="bg-slate-50 py-20 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Who Should Apply?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8">
              <h3 className="font-bold text-xl mb-4">This Program is For You If:</h3>
              <ul className="space-y-3 text-slate-700">
                <li>• You enjoy hands-on work and problem-solving</li>
                <li>• You're comfortable working at heights</li>
                <li>• You want a stable career in facility management</li>
                <li>• You prefer learning by doing over classroom study</li>
                <li>• You're physically fit and can handle demanding work</li>
                <li>• You want to earn while you learn</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8">
              <h3 className="font-bold text-xl mb-4">Basic Requirements:</h3>
              <ul className="space-y-3 text-slate-700">
                <li>• 18 years or older</li>
                <li>• High school diploma or GED</li>
                <li>• Valid driver's license (preferred)</li>
                <li>• Able to pass background check</li>
                <li>• Physically able to perform job duties</li>
                <li>• Committed to completing 6,000 hours</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT YOU'LL LEARN */}
      <section id="curriculum" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">What You'll Learn</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Multi-Story Window Cleaning</h3>
              <ul className="text-slate-600 space-y-2 text-sm">
                <li>• Rope descent systems (RDS)</li>
                <li>• Scaffold and lift operations</li>
                <li>• Safety harness and fall protection</li>
                <li>• High-rise cleaning techniques</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Building Maintenance</h3>
              <ul className="text-slate-600 space-y-2 text-sm">
                <li>• HVAC basics and filter changes</li>
                <li>• Plumbing repairs and maintenance</li>
                <li>• Electrical troubleshooting</li>
                <li>• Preventive maintenance schedules</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Facility Management</h3>
              <ul className="text-slate-600 space-y-2 text-sm">
                <li>• Building systems overview</li>
                <li>• Work order management</li>
                <li>• Vendor coordination</li>
                <li>• Tenant relations</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Safety & Compliance</h3>
              <ul className="text-slate-600 space-y-2 text-sm">
                <li>• OSHA 10/30 certification</li>
                <li>• Fall protection standards</li>
                <li>• Hazard communication</li>
                <li>• Emergency procedures</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Equipment Operation</h3>
              <ul className="text-slate-600 space-y-2 text-sm">
                <li>• Aerial lifts and scaffolding</li>
                <li>• Power tools and hand tools</li>
                <li>• Cleaning equipment</li>
                <li>• Testing and diagnostic tools</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">Professional Skills</h3>
              <ul className="text-slate-600 space-y-2 text-sm">
                <li>• Customer service</li>
                <li>• Time management</li>
                <li>• Documentation and reporting</li>
                <li>• Team collaboration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CREDENTIALS */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Credentials You'll Earn</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="font-bold text-lg mb-2">DOL Journeyworker Certificate</h3>
              <p className="text-slate-400 text-sm">Nationally recognized credential upon completing 6,000 hours</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="font-bold text-lg mb-2">OSHA 10/30 Safety</h3>
              <p className="text-slate-400 text-sm">Industry-standard workplace safety certification</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Competency Certificate</h3>
              <p className="text-slate-400 text-sm">Documentation of all skills and competencies mastered</p>
            </div>
          </div>
        </div>
      </section>

      {/* WAGE PROGRESSION */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Wage Progression</h2>
          <p className="text-center text-slate-600 mb-8">Your wages increase as you gain skills and complete training milestones.</p>
          <div className="bg-slate-50 rounded-xl p-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="font-semibold">Probation (0-500 hours)</span>
                <span className="text-green-600 font-bold">Starting Wage</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="font-semibold">Year 1 (500-2000 hours)</span>
                <span className="text-green-600 font-bold">Wage Increase #1</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="font-semibold">Year 2 (2000-4000 hours)</span>
                <span className="text-green-600 font-bold">Wage Increase #2</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="font-semibold">Year 3 (4000-6000 hours)</span>
                <span className="text-green-600 font-bold">Journeyworker Wage (~$19/hr)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">How long is the apprenticeship?</h3>
              <p className="text-slate-700">The program is 6,000 hours, which typically takes 3 years working full-time. This is one of our most comprehensive apprenticeships.</p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">Do I get paid during training?</h3>
              <p className="text-slate-700">Yes! You're employed from day one and earn wages throughout the entire apprenticeship. Your pay increases as you progress.</p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">Is this program free?</h3>
              <p className="text-slate-700">As a registered apprenticeship, you earn while you learn. There's no tuition—your employer sponsors your training.</p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold text-slate-900 mb-2">What's the job outlook?</h3>
              <p className="text-slate-700">Building services is a stable, in-demand field. Every commercial building needs maintenance, and skilled technicians are always needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Career?</h2>
          <p className="text-xl text-slate-300 mb-8">Join our Building Services Technician Apprenticeship and earn while you learn.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/programs/building-services-technician/apply" className="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white font-bold rounded-full hover:bg-green-400">
              Apply Now
            </Link>
            <Link href="/inquiry?program=building-services-technician" className="inline-flex items-center justify-center px-8 py-4 bg-slate-700 text-white font-bold rounded-full hover:bg-slate-600 border border-slate-600">
              Request Information
            </Link>
          </div>
          <p className="mt-8 text-sm text-slate-400">
            RAPIDS Program: 2025-IN-132301 | Occupation Code: 0688CB | Sponsor: 2Exclusive LLC
          </p>
        </div>
      </section>
    </main>
  );
}
