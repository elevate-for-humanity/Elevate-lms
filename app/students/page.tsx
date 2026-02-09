import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { 
  GraduationCap, 
  DollarSign, 
  Briefcase, 
  Users, 
  Circle,
  ArrowRight,
  Clock,
  Award,
  TrendingUp
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'For Students | Free Career Training | Elevate for Humanity',
  description: 'Funded career training with job placement. No cost, no debt. Get certified and start earning in weeks.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/students',
  },
};

export default async function StudentsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch student stats
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs
        items={[
          { label: 'Students' },
        ]}
      />
      {/* Hero Section */}
      <section className="relative bg-slate-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 mb-6">
              <GraduationCap className="w-5 h-5" />
              <span className="text-sm font-semibold">For Students</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black mb-6">
              Launch Your Career
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-4">
              Real certifications. Job placement included.
            </p>
            <p className="text-sm text-white/70 mb-8">
              Free training available for eligible participants. Some licensure programs are self-pay or employer-paid.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/apply"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 shadow-xl inline-flex items-center justify-center gap-2"
              >
                Apply Now <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/programs"
                className="bg-white/10 backdrop-blur-sm border-2 border-white hover:bg-white hover:text-blue-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all inline-flex items-center justify-center gap-2"
              >
                View Programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">
            How Our Programs Work
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-gray-100">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Funding Available</h3>
              <p className="text-black mb-4">
                Many programs are free through WIOA, WRG, and JRI funding. Some licensure programs offer self-pay or employer-paid options.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">Free training</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">Free materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">Free certification</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Fast Track</h3>
              <p className="text-black mb-4">
                Get certified and start earning in weeks, not years. Programs designed for quick entry into the workforce.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">4-16 week programs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">Flexible schedules</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">Online & in-person</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Job Placement</h3>
              <p className="text-black mb-4">
                Career services and job placement support. We connect you with employers actively hiring in your field.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">Resume building</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">Interview prep</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black">Employer connections</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Apply</h3>
              <p className="text-black">
                Fill out our simple application. Takes 5 minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Get Approved</h3>
              <p className="text-black">
                We verify your eligibility for free funding.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Train</h3>
              <p className="text-black">
                Complete your program and complete your training.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-xl font-bold mb-2">Get Hired</h3>
              <p className="text-black">
                Start your new career with job placement support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
            Popular Programs
          </h2>
          <p className="text-xl text-black text-center mb-12">
            Choose from 20+ career training programs
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <Link href="/programs/cna" className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100 hover:border-blue-500 transition group">
              <Award className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600">CNA Training</h3>
              <p className="text-black mb-4">6-8 weeks • $16-20/hr starting</p>
              <div className="flex items-center text-blue-600 font-semibold">
                Learn More <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

            <Link href="/programs/barber-apprenticeship" className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100 hover:border-blue-500 transition group">
              <Award className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600">Barber Apprenticeship</h3>
              <p className="text-black mb-4">12 months • Earn while you learn</p>
              <div className="flex items-center text-blue-600 font-semibold">
                Learn More <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

            <Link href="/programs/cdl-transportation" className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-100 hover:border-blue-500 transition group">
              <Award className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600">CDL Training</h3>
              <p className="text-black mb-4">4-6 weeks • $50k+ annually</p>
              <div className="flex items-center text-blue-600 font-semibold">
                Learn More <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>
          </div>

          <div className="text-center">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition"
            >
              View All Programs <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Ready to Start Your Career?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Apply today and take the first step toward a better future.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 shadow-xl"
          >
            Apply Now <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
