import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import {
  Award,
  Shield,
  FileCheck,
  Building2,
  ExternalLink,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/accreditation',
  },
  title:
    'Accreditation & Approvals | DOL, DWD, DOE Approved Training Provider | Elevate For Humanity',
  description:
    'Officially approved by U.S. Department of Labor (DOL), Indiana Department of Workforce Development (DWD), Indiana Department of Education (DOE), WIOA eligible, WRG approved, JRI partner. Registered Apprenticeship Sponsor RAPIDS ID: 2025-IN-132301. INTraining Location ID: 10004621.',
  keywords:
    'DOL approved training, DWD approved, DOE approved, WIOA eligible training provider, WRG approved programs, registered apprenticeship sponsor, Indiana workforce development, accredited training Indiana, state approved training, federal approved training',
};

export const dynamic = 'force-dynamic';

export default async function AccreditationPage() {
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

  // Get accreditations
  const { data: accreditations } = await supabase
    .from('accreditations')
    .select('*')
    .eq('is_active', true)
    .order('order', { ascending: true });

  // Get certifications
  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('type', 'organizational')
    .eq('is_active', true);

  // Get approved programs
  const { data: approvedPrograms } = await supabase
    .from('programs')
    .select('id, name, slug, accreditation_status')
    .eq('is_active', true)
    .not('accreditation_status', 'is', null)
    .limit(10);

  const defaultAccreditations = [
    {
      name: 'U.S. Department of Labor (DOL)',
      description: 'Registered Apprenticeship Sponsor',
      id_number: 'RAPIDS ID: 2025-IN-132301',
      icon: Shield,
    },
    {
      name: 'Indiana Department of Workforce Development (DWD)',
      description: 'Approved Training Provider',
      id_number: 'INTraining Location ID: 10004621',
      icon: Building2,
    },
    {
      name: 'Indiana Department of Education (DOE)',
      description: 'Approved Postsecondary Proprietary Educational Institution',
      id_number: null,
      icon: Award,
    },
    {
      name: 'WIOA Eligible',
      description: 'Workforce Innovation and Opportunity Act approved provider',
      id_number: null,
      icon: FileCheck,
    },
    {
      name: 'WRG Approved',
      description: 'Workforce Ready Grant eligible programs',
      id_number: null,
      icon: CheckCircle,
    },
    {
      name: 'JRI Partner',
      description: 'Justice Reinvestment Initiative training partner',
      id_number: null,
      icon: Shield,
    },
  ];

  const displayAccreditations = accreditations && accreditations.length > 0 
    ? accreditations 
    : defaultAccreditations;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Accreditation' }]} />
        </div>
      </div>

      {/* Hero Section */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/hero/hero-certifications.jpg" alt="Accredited Training Facility" fill className="object-cover" priority quality={90} sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Accreditation & Approvals</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Officially recognized by federal and state agencies for workforce training excellence</p>
          </div>
        </div>
      </section>

      {/* Accreditations Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Accreditations</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayAccreditations.map((accred: any, index: number) => {
              const Icon = accred.icon || Award;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
                  <Icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                  <h3 className="font-bold text-lg mb-2">{accred.name}</h3>
                  <p className="text-gray-600 mb-2">{accred.description}</p>
                  {accred.id_number && (
                    <p className="text-sm text-brand-blue-600 font-mono">{accred.id_number}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What This Means */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">What This Means for You</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <h3 className="font-bold text-lg">Quality Assurance</h3>
                <p className="text-gray-600">
                  Our programs meet rigorous federal and state standards for curriculum, 
                  instruction, and student outcomes.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <h3 className="font-bold text-lg">Funding Eligibility</h3>
                <p className="text-gray-600">
                  Eligible students may use WIOA, WRG, JRI, and other funding sources to cover 
                  training costs.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <h3 className="font-bold text-lg">Employer Recognition</h3>
                <p className="text-gray-600">
                  Employers trust credentials from accredited providers, improving your 
                  job prospects after graduation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <h3 className="font-bold text-lg">Transferable Credits</h3>
                <p className="text-gray-600">
                  Apprenticeship hours and certifications are recognized across Indiana 
                  and nationally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Approved Programs */}
      {approvedPrograms && approvedPrograms.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Approved Programs</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedPrograms.map((program: any) => (
                <Link
                  key={program.id}
                  href={`/programs/${program.slug || program.id}`}
                  className="bg-white rounded-lg p-4 border hover:shadow-md transition flex items-center justify-between"
                >
                  <span className="font-medium">{program.name}</span>
                  <span className="text-slate-400 flex-shrink-0">•</span>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/programs"
                className="text-brand-blue-600 font-medium hover:underline"
              >
                View all programs →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Verification Links */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Verify Our Credentials</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <a
              href="https://www.apprenticeship.gov/partner-finder"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <span>DOL Apprenticeship Partner Finder</span>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </a>
            <a
              href="https://intraining.dwd.in.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <span>Indiana INTraining Provider Search</span>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Training?
          </h2>
          <p className="text-brand-blue-100 mb-8">
            Enroll in an accredited program and qualify for free training through WIOA funding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <Link
              href="/programs"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-700 transition"
            >
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
