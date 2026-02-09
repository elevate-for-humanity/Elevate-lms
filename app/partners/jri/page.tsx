export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import {
  ExternalLink,
  CheckCircle,
  Clock,
  Award,
  Users,
  Phone,
  Mail,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Job Ready Indy (JRI) | Partner Courses | Elevate For Humanity',
  description: 'Employability Skills and Workforce Readiness Training',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partners/jri',
  },
};

export default function JRIPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Partners", href: "/partners" }, { label: "Jri" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-[400px] w-full overflow-hidden   ">
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="max-w-4xl">
              <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-semibold mb-4">
                Partner Course
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl">
                Job Ready Indy (JRI)
              </h1>
              <p className="text-base md:text-lg text-white mb-8 drop-shadow-lg">
                Employability Skills and Workforce Readiness Training
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="https://learning.employindy.org/jri-participant-elevatehumanitycareertraining"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-blue-600 font-bold rounded-full hover:bg-slate-100 transition-all hover:scale-105 shadow-2xl gap-2"
                >
                  Enroll Now
                  <ExternalLink className="w-5 h-5" />
                </a>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-bold rounded-full hover:bg-white/30 transition-all hover:scale-105 border-2 border-white/50 shadow-2xl"
                >
                  Questions? Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8 text-center">
            What You Get
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div className="text-black">
                6 badge courses + 2 additional courses
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div className="text-black">Self-paced online learning</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div className="text-black">Industry-backed credentials</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div className="text-black">Progress tracking dashboard</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div className="text-black">
                Facilitator support available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Courses */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-2xl md:text-3xl font-bold text-black mb-12 text-center text-2xl md:text-3xl lg:text-2xl md:text-3xl">
            Available Courses
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-black">
                  Introduction to Job Ready Indy
                </h3>
                <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm font-semibold">
                  Badge 1
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-black">
                  Professional Communication
                </h3>
                <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm font-semibold">
                  Badge 2
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-black">
                  Workplace Professionalism
                </h3>
                <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm font-semibold">
                  Badge 3
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-black">
                  Problem Solving & Critical Thinking
                </h3>
                <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm font-semibold">
                  Badge 4
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-black">
                  Teamwork & Collaboration
                </h3>
                <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm font-semibold">
                  Badge 5
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-black">
                  Career Planning
                </h3>
                <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm font-semibold">
                  Badge 6
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-black">
                  Financial Literacy
                </h3>

                <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm font-semibold">
                  Bonus
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-black">
                  Digital Literacy
                </h3>

                <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm font-semibold">
                  Bonus
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-8 text-center">
            Need Help?
          </h2>
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="mb-6">
              <div className="font-bold text-black text-lg mb-2">
                Elizabeth Greene
              </div>

              <div className="space-y-2">
                <a
                  href="mailto:elevate4humanityedu@gmail.com"
                  className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700"
                >
                  <Mail className="w-4 h-4" />
                  elevate4humanityedu@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20   ">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-2xl md:text-3xl font-bold text-white mb-6 text-2xl md:text-3xl lg:text-2xl md:text-3xl">
            Ready to Get Started?
          </h2>
          <p className="text-base md:text-lg text-white mb-8">
            Enroll in Job Ready Indy (JRI) courses through Elevate for Humanity
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://learning.employindy.org/jri-participant-elevatehumanitycareertraining"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-10 py-5 bg-white text-brand-blue-600 text-xl font-bold rounded-full hover:bg-slate-100 transition-all hover:scale-105 shadow-2xl gap-2"
            >
              Get Started
              <ExternalLink className="w-6 h-6" />
            </a>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-10 py-5 bg-white/20 backdrop-blur-sm text-white text-xl font-bold rounded-full hover:bg-white/30 transition-all hover:scale-105 border-2 border-white/50 shadow-2xl"
            >
              Apply to Elevate
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
