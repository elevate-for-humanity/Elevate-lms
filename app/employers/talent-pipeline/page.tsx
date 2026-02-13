import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Users, Target, Clock, DollarSign, Award, CheckCircle, ArrowRight, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Talent Pipeline Program | Employers | Elevate for Humanity',
  description: 'Build your workforce with pre-trained, certified candidates. Our talent pipeline program connects Indianapolis employers with job-ready graduates at no cost.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/employers/talent-pipeline',
  },
};

const pipelineSteps = [
  {
    step: 1,
    title: 'Define Your Needs',
    description: 'Tell us about your hiring requirements, skills needed, and timeline. We customize training to match your specifications.',
  },
  {
    step: 2,
    title: 'We Train Candidates',
    description: 'Students receive industry-specific training, certifications, and soft skills development tailored to your requirements.',
  },
  {
    step: 3,
    title: 'Screen & Interview',
    description: 'Review pre-screened candidates who meet your criteria. Conduct interviews with job-ready graduates.',
  },
  {
    step: 4,
    title: 'Hire & Onboard',
    description: 'Hire qualified candidates with confidence. We provide ongoing support during the transition period.',
  },
];

const industries = [
  {
    name: 'Healthcare',
    roles: ['CNA', 'Medical Assistant', 'Phlebotomist', 'Patient Care Tech'],
    icon: '🏥',
  },
  {
    name: 'Skilled Trades',
    roles: ['HVAC Technician', 'Electrician', 'Plumber', 'Welder'],
    icon: '🔧',
  },
  {
    name: 'Beauty & Wellness',
    roles: ['Barber', 'Cosmetologist', 'Esthetician', 'Nail Technician'],
    icon: '💇',
  },
  {
    name: 'Business & Technology',
    roles: ['IT Support', 'Office Admin', 'Customer Service', 'Data Entry'],
    icon: '💼',
  },
];

const benefits = [
  {
    icon: DollarSign,
    title: 'Zero Recruitment Costs',
    description: 'No fees for candidate sourcing, screening, or placement. Our services are funded through workforce grants.',
  },
  {
    icon: Award,
    title: 'Pre-Certified Candidates',
    description: 'Graduates come with industry certifications, reducing your training time and costs.',
  },
  {
    icon: Clock,
    title: 'Faster Time-to-Hire',
    description: 'Access a pool of pre-screened, job-ready candidates. Fill positions in weeks, not months.',
  },
  {
    icon: Target,
    title: 'Custom Training',
    description: 'We can customize curriculum to include your specific processes, tools, and requirements.',
  },
  {
    icon: Users,
    title: 'Diverse Talent Pool',
    description: 'Access candidates from underrepresented communities, supporting your DEI initiatives.',
  },
  {
    icon: CheckCircle,
    title: 'Retention Support',
    description: 'We provide ongoing support to help new hires succeed and stay with your organization.',
  },
];

export default async function TalentPipelinePage() {
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
  
  // Fetch pipeline stats
  const { count: candidateCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'job_ready');

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Employers", href: "/employers" }, { label: "Talent Pipeline" }]} />
      </div>
{/* Hero Section */}
      <section className="relative bg-slate-800 text-white py-20 md:py-28">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/images/hero/hero-career-services.jpg"
            alt="Talent pipeline"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Build Your Talent Pipeline
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8">
              Access pre-trained, certified candidates ready to work. No recruitment fees, 
              no hassle—just qualified talent for your open positions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="px-8 py-4 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-700 transition-all text-center"
              >
                Start Building Your Pipeline
              </Link>
              <Link
                href="/employers/post-job"
                className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-slate-900 transition-all text-center"
              >
                Post a Job Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-orange-600 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold">85%</div>
              <div className="text-orange-200">Job Placement Rate</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold">1,000+</div>
              <div className="text-orange-200">Graduates Placed</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold">$0</div>
              <div className="text-orange-200">Recruitment Cost</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold">90%</div>
              <div className="text-orange-200">6-Month Retention</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How the Talent Pipeline Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A simple, streamlined process to connect you with qualified candidates
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pipelineSteps.map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-orange-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
                {item.step < 4 && (
                  <ArrowRight className="hidden lg:block absolute top-6 -right-4 w-8 h-8 text-orange-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Partner With Us
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Reduce hiring costs and time while accessing a diverse pool of qualified candidates
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-white p-8 rounded-xl shadow-sm">
                <benefit.icon className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Industries We Serve
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We train candidates for high-demand roles across multiple industries
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {industries.map((industry) => (
              <div key={industry.name} className="bg-gray-50 p-6 rounded-xl">
                <div className="text-4xl mb-4">{industry.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{industry.name}</h3>
                <ul className="space-y-2">
                  {industry.roles.map((role) => (
                    <li key={role} className="text-gray-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-600" />
                      {role}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding Info */}
      <section className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Building2 className="w-16 h-16 text-orange-500 mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Funded Through Workforce Grants
              </h2>
              <p className="text-xl text-slate-300 mb-6">
                Our talent pipeline program is funded through WIOA, Next Level Jobs, and other 
                workforce development grants. This means you get access to trained candidates 
                at no cost to your organization.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-orange-500" />
                  No placement fees
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-orange-500" />
                  No training costs passed to employers
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-orange-500" />
                  Eligible for employer training grants
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-orange-500" />
                  On-the-job training reimbursement available
                </li>
              </ul>
            </div>
            <div className="relative h-[400px] rounded-xl overflow-hidden">
              <Image
                src="/images/hero/hero-hands-on-training.jpg"
                alt="Training in progress"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Build Your Talent Pipeline?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Post jobs and browse pre-trained, certified candidates online.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply/employer"
              className="px-8 py-4 bg-white text-orange-600 font-bold rounded-full hover:bg-orange-50 transition-all"
            >
              Employer Application
            </Link>
            <Link
              href="/employer"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-orange-600 transition-all"
            >
              Employer Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
