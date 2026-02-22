import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Award,
  Shield,
  FileCheck,
  Building2,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/accreditation',
  },
  title: 'Approvals & Credentials | Elevate for Humanity',
  description:
    'Elevate for Humanity is a workforce training provider offering industry-aligned certification programs. Learn about our approvals, credentials, and authorized testing site status.',
  keywords:
    'workforce training provider, EPA 608 testing site, WIOA eligible, Indiana workforce development, industry certification training',
};

export default function AccreditationPage() {
  const credentials = [
    {
      name: 'EPA Section 608 Approved Testing Site',
      description:
        'Authorized to administer proctored EPA Section 608 refrigerant handling certification examinations.',
      icon: Shield,
    },
    {
      name: 'WIOA Eligible Training Provider',
      description:
        'Listed on the Eligible Training Provider List (ETPL) for Workforce Innovation and Opportunity Act funding.',
      icon: FileCheck,
    },
    {
      name: 'Indiana DWD Training Provider',
      description:
        'Recognized by the Indiana Department of Workforce Development as a training provider.',
      id_number: 'INTraining Location ID: 10004621',
      icon: Building2,
    },
    {
      name: '501(c)(3) Nonprofit Organization',
      description:
        'Registered nonprofit focused on workforce development and career training access.',
      icon: Award,
    },
    {
      name: 'OSHA Safety Training',
      description:
        'Programs include OSHA safety certification preparation as part of the training curriculum.',
      icon: CheckCircle,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Approvals & Credentials' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image
            src="/images/heroes-hq/success-stories-hero.jpg"
            alt="Workforce training classroom"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-slate-900/35 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-5xl mx-auto px-4">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 drop-shadow-lg">
                Approvals &amp; Credentials
              </h1>
              <p className="text-lg text-white/85 max-w-2xl drop-shadow">
                Industry-aligned workforce training with authorized certification testing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Our Credentials
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
            Elevate for Humanity Training Center is a workforce training provider
            offering industry-recognized certification programs aligned with
            employer demand and workforce standards.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {credentials.map((cred, index) => {
              const Icon = cred.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border p-6"
                >
                  <Icon className="w-10 h-10 text-brand-blue-600 mb-4" />
                  <h3 className="font-bold text-lg mb-2">{cred.name}</h3>
                  <p className="text-gray-600 mb-2">{cred.description}</p>
                  {cred.id_number && (
                    <p className="text-sm text-brand-blue-600 font-mono">
                      {cred.id_number}
                    </p>
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
          <h2 className="text-3xl font-bold text-center mb-8">
            What This Means for Students
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <span className="w-3 h-3 rounded-full bg-brand-green-500 mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg">
                  Industry-Recognized Certifications
                </h3>
                <p className="text-gray-600">
                  Students receive preparation and authorized proctored testing
                  access for credentials including EPA Section 608 and OSHA
                  safety certifications.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="w-3 h-3 rounded-full bg-brand-green-500 mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg">Workforce Funding Access</h3>
                <p className="text-gray-600">
                  Eligible students may use WIOA, Workforce Ready Grant (WRG),
                  or other workforce funding sources to cover training costs.
                  Federal financial aid (FAFSA, Pell Grants, federal loans) is
                  not currently offered.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="w-3 h-3 rounded-full bg-brand-green-500 mt-2 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg">Employer-Aligned Training</h3>
                <p className="text-gray-600">
                  Programs are designed around real workforce pathways and
                  employer demand in facilities maintenance, building operations,
                  and technical support roles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Disclosure */}
      <section className="py-12 bg-slate-50 border-y">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold mb-4">Important Information</h2>
          <div className="space-y-3 text-gray-600 text-sm">
            <p>
              Elevate for Humanity Training Center is a workforce training
              provider offering industry-recognized certification programs.
              Programs are not institutionally accredited degree programs. They
              are aligned with industry certification standards and include
              access to authorized proctored certification examinations such as
              EPA Section 608.
            </p>
            <p>
              Certification outcomes are issued by the respective certifying
              organizations upon successful completion of required examinations.
              Elevate for Humanity Training Center provides training,
              preparation, and authorized proctored testing access but does not
              independently issue federal or state licenses.
            </p>
            <p>
              Financial aid through federal student aid (FAFSA, Pell Grants, and
              federal loans) is not currently offered. Students may utilize
              workforce funding programs, grants, employer sponsorships, or
              self-pay enrollment options where eligible.
            </p>
          </div>
        </div>
      </section>

      {/* Verification Links */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">
            Verify Our Credentials
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <a
              href="https://intraining.dwd.in.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <span>Indiana INTraining Provider Search</span>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </a>
            <a
              href="https://www.epa.gov/section608"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <span>EPA Section 608 Information</span>
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
            Explore workforce training programs and check your eligibility for
            funded training options.
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
