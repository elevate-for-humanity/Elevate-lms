import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ArrowRight, Users, Building2, Briefcase, CheckCircle, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: `Hire Trained Workers | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    `Partner with us to hire trained workers from our workforce development programs. Healthcare, trades, technology, and business graduates ready to work.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/employers' },
};

export default function EmployersPage() {
  const benefits = [
    {
      icon: Users,
      title: 'Pre-Screened Candidates',
      description: 'All graduates have been vetted through our comprehensive screening and training process.',
    },
    {
      icon: Building2,
      title: 'Industry Certifications',
      description: 'Workers arrive with industry-recognized credentials and hands-on experience.',
    },
    {
      icon: Briefcase,
      title: 'Customized Training',
      description: 'We can tailor training programs to meet your specific workforce needs.',
    },
    {
      icon: Award,
      title: 'Retention Support',
      description: 'We provide ongoing support to ensure successful long-term employment.',
    },
  ];

  const programs = [
    { name: 'Healthcare', workers: 'CNA, Medical Assistants, Phlebotomists, Pharmacy Techs' },
    { name: 'Skilled Trades', workers: 'HVAC, Electrical, Plumbing, Welding, CDL Drivers' },
    { name: 'Technology', workers: 'IT Help Desk, Cybersecurity, Web Development' },
    { name: 'Business', workers: 'Bookkeeping, Administrative, Project Management' },
    { name: 'Beauty', workers: 'Barbers, Cosmetologists, Estheticians' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-blue-700 via-brand-blue-800 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Build Your Workforce with Trained Professionals
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Partner with Elevate for Humanity to access a pipeline of job-ready workers 
              trained in healthcare, skilled trades, technology, and business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/employer/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-blue-700 font-bold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Partner With Us <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-500 transition-colors border-2 border-white/20"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Why Partner With Us
            </h2>
            <p className="text-lg text-slate-600">
              We connect employers with qualified, motivated workers ready to contribute on day one.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-slate-50 rounded-xl p-6 border border-slate-200"
              >
                <benefit.icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Industries We Serve
            </h2>
            <p className="text-lg text-slate-600">
              Our graduates are ready for positions across multiple industries
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Industry</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Available Workers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {programs.map((program) => (
                  <tr key={program.name} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{program.name}</td>
                    <td className="px-6 py-4 text-slate-600">{program.workers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Apprenticeship Section */}
      <section className="py-16 bg-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Registered Apprenticeship Programs
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Partner with us to sponsor registered apprenticeships. Your experienced workers 
            can earn while they learn, building skills specific to your business.
          </p>
          <Link
            href="/apprenticeship-sponsor"
            className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
          >
            Become an Apprenticeship Sponsor <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your Workforce?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Contact us today to discuss your workforce needs and hiring goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/employer/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-blue-700 font-bold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Register as Employer <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-500 transition-colors border-2 border-white/20"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
