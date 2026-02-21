import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Clock, Award, DollarSign, MapPin, CheckCircle, ArrowRight, Phone } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Esthetician Apprenticeship Program | Elevate for Humanity',
  description: 'Earn your esthetician license through a hands-on apprenticeship. 700 hours of training in skincare, facials, waxing, and body treatments. Funding may be available through WIOA.',
  alternates: { canonical: `${SITE_URL}/programs/esthetician-apprenticeship` },
};

const curriculum = [
  'Skin analysis and consultation techniques',
  'Facial treatments and protocols',
  'Chemical peels and microdermabrasion',
  'Waxing and hair removal',
  'Body treatments and wraps',
  'Makeup application and color theory',
  'Sanitation, safety, and infection control',
  'Business practices and client management',
  'Indiana state board exam preparation',
];

const credentials = [
  { name: 'Indiana Esthetician License', issuer: 'Indiana Professional Licensing Agency' },
  { name: 'OSHA 10 Safety Certification', issuer: 'OSHA' },
  { name: 'CPR/First Aid', issuer: 'American Red Cross' },
];

export default function EstheticianApprenticeshipPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Esthetician Apprenticeship' },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[320px] w-full overflow-hidden">
        <Image
          src="/images/beauty/esthetician.jpg"
          alt="Esthetician student performing a facial treatment"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-slate-900/50" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Esthetician Apprenticeship
            </h1>
            <p className="text-xl text-slate-200 max-w-2xl">
              Hands-on skincare training leading to your Indiana esthetician license.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <Clock className="w-8 h-8 text-brand-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">700</p>
              <p className="text-sm text-slate-600">Training Hours</p>
            </div>
            <div className="text-center">
              <Award className="w-8 h-8 text-brand-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">3</p>
              <p className="text-sm text-slate-600">Credentials Earned</p>
            </div>
            <div className="text-center">
              <DollarSign className="w-8 h-8 text-brand-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">WIOA</p>
              <p className="text-sm text-slate-600">Funding Eligible</p>
            </div>
            <div className="text-center">
              <MapPin className="w-8 h-8 text-brand-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">Indy</p>
              <p className="text-sm text-slate-600">Indianapolis, IN</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Program Overview</h2>
              <p className="text-slate-600 mb-4">
                The Esthetician Apprenticeship program prepares students for licensure through
                700 hours of combined classroom instruction and hands-on clinical training.
                Students learn skincare science, facial treatments, hair removal, body treatments,
                and business practices under the supervision of licensed estheticians.
              </p>
              <p className="text-slate-600">
                This program is delivered in partnership with Curvature Body Sculpting, providing
                students with real-world experience in a professional spa environment. Graduates
                are prepared to sit for the Indiana state board examination.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Curriculum</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {curriculum.map((item) => (
                  <div key={item} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Credentials Earned</h2>
              <div className="space-y-4">
                {credentials.map((cred) => (
                  <div key={cred.name} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Award className="w-8 h-8 text-brand-red-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">{cred.name}</p>
                      <p className="text-sm text-slate-500">{cred.issuer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Training Partner</h2>
              <div className="p-6 bg-slate-50 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Curvature Body Sculpting</h3>
                <p className="text-slate-600 mb-3">
                  Students complete clinical hours at Curvature Body Sculpting, a professional
                  spa and body sculpting studio in Indianapolis. This partnership provides
                  hands-on experience with real clients in a licensed facility.
                </p>
                <Link href="/curvature-body-sculpting" className="text-brand-blue-600 hover:underline text-sm font-semibold inline-flex items-center gap-1">
                  Learn about our partner <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Eligibility</h2>
              <ul className="list-disc pl-6 text-slate-600 space-y-2">
                <li>Must be at least 18 years old (or 16 with parental consent)</li>
                <li>High school diploma or GED (or currently enrolled)</li>
                <li>Must pass a background check</li>
                <li>Indiana resident or willing to relocate to the Indianapolis area</li>
                <li>Must be able to stand for extended periods and perform physical tasks</li>
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-brand-red-600 text-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3">Apply Now</h3>
              <p className="text-red-100 mb-4 text-sm">
                Start your esthetician career. Applications are accepted on a rolling basis.
              </p>
              <Link
                href="/apply?program=esthetician-apprenticeship"
                className="block w-full text-center bg-white text-brand-red-600 font-bold py-3 rounded-lg hover:bg-red-50 transition"
              >
                Start Application
              </Link>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Funding Options</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>WIOA Individual Training Accounts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Workforce Ready Grant (WRG)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Justice Reinvestment Initiative (JRI)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Payment plans available</span>
                </li>
              </ul>
              <Link href="/funding" className="text-brand-blue-600 hover:underline text-sm font-semibold mt-4 inline-flex items-center gap-1">
                Explore funding <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Questions?</h3>
              <p className="text-sm text-slate-600 mb-4">
                Talk to an advisor about the esthetician program.
              </p>
              <a
                href="tel:3172968560"
                className="flex items-center gap-2 text-brand-blue-600 font-semibold text-sm"
              >
                <Phone className="w-4 h-4" />
                (317) 296-8560
              </a>
              <Link href="/inquiry" className="text-brand-blue-600 hover:underline text-sm font-semibold mt-3 inline-flex items-center gap-1">
                Send an inquiry <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
