import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  Building2,
  Users,
  FileText,
  Shield,
  DollarSign,
  Clock,
  Award,
  AlertTriangle,
  Download,
  HelpCircle,
  Briefcase,
  ClipboardCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Barbershop Partner Program | Indiana Barber Apprenticeship | Elevate for Humanity',
  description:
    'Become a worksite partner for the Indiana Barber Apprenticeship program. Host apprentices, develop talent, and grow your team with structured training support.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partners/barbershop-apprenticeship',
  },
  openGraph: {
    title: 'Barbershop Partner Program | Indiana Barber Apprenticeship',
    description: 'Host apprentices and develop talent for your barbershop with structured training support.',
    url: 'https://www.elevateforhumanity.org/partners/barbershop-apprenticeship',
  },
};

const eligibilityItems = [
  'Indiana-licensed barbershop in good standing',
  'At least one supervising barber with active Indiana license',
  'Minimum 2 years licensed experience for supervising barber',
  'Workers\' compensation insurance coverage',
  'Physical shop location in Indiana',
  'Willingness to sign Memorandum of Understanding (MOU)',
  'Commitment to verify hours and competencies',
];

const shopResponsibilities = [
  'Provide direct supervision during all productive work hours',
  'Pay apprentice according to agreed compensation model (must meet minimum wage)',
  'Verify and sign off on hours worked and competencies demonstrated',
  'Maintain a safe, professional workplace environment',
  'Cooperate with sponsor for documentation and compliance',
  'Notify sponsor promptly of any issues or concerns',
  'Allow sponsor site visits for quality assurance',
];

const sponsorResponsibilities = [
  'Handle all USDOL/RAPIDS registration and compliance',
  'Coordinate required related instruction (classroom training)',
  'Maintain official apprenticeship records and documentation',
  'Provide ongoing support and troubleshooting',
  'Conduct periodic check-ins and site visits',
  'Issue completion certificates upon program finish',
  'Serve as liaison with state apprenticeship office',
];

const processSteps = [
  {
    step: 1,
    title: 'Submit Application',
    description: 'Complete the online partner application with shop and supervisor information.',
  },
  {
    step: 2,
    title: 'Verification',
    description: 'We verify your shop license, supervisor credentials, and insurance coverage.',
  },
  {
    step: 3,
    title: 'Sign MOU',
    description: 'Review and sign the Memorandum of Understanding outlining roles and responsibilities.',
  },
  {
    step: 4,
    title: 'Site Approval',
    description: 'Your shop is approved as an official apprenticeship worksite.',
  },
  {
    step: 5,
    title: 'Matching & Placement',
    description: 'We match qualified apprentice candidates with your shop based on fit and availability.',
  },
  {
    step: 6,
    title: 'Training Begins',
    description: 'Apprentice starts on-the-job training under your supervision.',
  },
];

const faqs = [
  {
    q: 'Do I have to pay the apprentice?',
    a: 'Yes. Apprentices are paid employees. You must compensate them according to your agreed model (hourly, commission, or hybrid), and all compensation must meet or exceed minimum wage requirements.',
  },
  {
    q: 'What is the difference between a Sponsor and a Worksite?',
    a: 'Elevate for Humanity is the Sponsor of Record—we handle registration, compliance, and related instruction. Your shop is the Worksite where the apprentice gains hands-on experience under your supervision.',
  },
  {
    q: 'How long is the apprenticeship?',
    a: 'The program requires 2,000 hours of on-the-job training plus related instruction. Duration depends on hours worked per week, typically 12-24 months.',
  },
  {
    q: 'Can I hire the apprentice after completion?',
    a: 'Absolutely. Many shops hire their apprentices as full barbers upon completion. There is no obligation, but it\'s a common and encouraged outcome.',
  },
  {
    q: 'What if the apprentice isn\'t working out?',
    a: 'Contact us immediately. We work with both parties to resolve issues. If necessary, the apprentice can be reassigned or the placement ended according to MOU terms.',
  },
  {
    q: 'Is there funding available to offset wages?',
    a: 'Wage subsidies or OJT funding may be available through workforce programs depending on apprentice eligibility and current funding cycles. We can help identify potential opportunities, but funding is never guaranteed.',
  },
  {
    q: 'Do I need to provide classroom training?',
    a: 'No. Related instruction is coordinated by the sponsor. Your role is providing supervised practical experience in the shop.',
  },
];

export default function BarbershopPartnerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Partners", href: "/partners" }, { label: "Barbershop Apprenticeship" }]} />
      </div>
{/* Hero */}
      <section className="bg-slate-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 text-slate-300 mb-4">
            <Building2 className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Indiana Barbershop Partners</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">
            Become a Barbershop Partner
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl">
            Host apprentices at your Indiana barbershop and help develop the next generation of
            licensed barbers. We handle the paperwork and compliance—you provide the hands-on
            training and mentorship.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/partners/barbershop-apprenticeship/apply"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg font-bold transition-colors"
            >
              Apply to Become a Partner
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/docs/Indiana-Barbershop-Apprenticeship-MOU"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg text-lg font-bold transition-colors"
            >
              <Download className="mr-2 w-5 h-5" />
              View MOU Template
            </Link>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Who This Is For</h2>
          <p className="text-gray-600 mb-8 max-w-3xl">
            This program is designed for established Indiana barbershops that want to train and
            develop apprentice barbers through a structured, USDOL-registered apprenticeship.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {eligibilityItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600 mb-12 max-w-3xl">
            The apprenticeship model separates responsibilities between the <strong>Sponsor</strong>{' '}
            (Elevate for Humanity) and the <strong>Worksite</strong> (your barbershop).
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Sponsor (Elevate for Humanity)</h3>
                  <p className="text-sm text-gray-500">Compliance & Administration</p>
                </div>
              </div>
              <ul className="space-y-3">
                {sponsorResponsibilities.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Worksite (Your Shop)</h3>
                  <p className="text-sm text-gray-500">Training & Supervision</p>
                </div>
              </div>
              <ul className="space-y-3">
                {shopResponsibilities.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Program Duration</h4>
                <p className="text-gray-700">
                  Apprentices complete <strong>2,000 hours</strong> of on-the-job training plus
                  required related instruction. Hours are tracked and verified by both the shop and
                  sponsor. The sponsor handles all reporting to RAPIDS.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compensation Models */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Compensation Models</h2>
          <p className="text-gray-600 mb-8 max-w-3xl">
            Apprentices are <strong>paid employees</strong> who earn while they learn. Choose the
            compensation model that works best for your shop.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Hourly Wage</h3>
              <p className="text-sm text-gray-600 mb-3">
                Pay a set hourly rate for all hours worked. Most common for early-stage apprentices.
              </p>
              <span className="text-xs text-green-700 font-medium">Recommended for beginners</span>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Commission</h3>
              <p className="text-sm text-gray-600 mb-3">
                Pay based on services performed. Must meet minimum wage when averaged over pay period.
              </p>
              <span className="text-xs text-blue-700 font-medium">For advanced apprentices</span>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border-2 border-purple-300 bg-blue-50">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Hybrid</h3>
              <p className="text-sm text-gray-600 mb-3">
                Base hourly rate plus commission on services. Balances stability with incentive.
              </p>
              <span className="text-xs text-blue-700 font-medium">Most flexible option</span>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Funding Support</h3>
              <p className="text-sm text-gray-600 mb-3">
                OJT subsidies may offset wages if apprentice qualifies through workforce programs.
              </p>
              <span className="text-xs text-orange-700 font-medium">Subject to availability</span>
            </div>
          </div>

          {/* Important Compliance Notice */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Important Compliance Notice</h4>
                <p className="text-gray-700 text-sm mb-3">
                  All compensation structures must comply with applicable federal and Indiana wage
                  and labor laws. Commission-based models must ensure the apprentice earns at least
                  minimum wage when averaged over the pay period.
                </p>
                <p className="text-gray-700 text-sm">
                  <strong>This is NOT unpaid labor.</strong> Apprentices performing productive work
                  must be compensated. The "earn while you learn" model means apprentices are paid
                  employees from day one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do NOT Do */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <XCircle className="w-7 h-7 text-red-400" />
            What This Program Does NOT Provide
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Free or unpaid labor for your shop',
              'Guaranteed funding or wage subsidies',
              'Apprentices who work without compensation',
              'Exemption from labor law requirements',
              'Guaranteed apprentice placement',
              'Legal or tax advice',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Step by Step Process */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            How to Become a Partner
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processSteps.map((step) => (
              <div key={step.step} className="relative">
                <div className="bg-gray-50 p-6 rounded-xl h-full">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOU Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Memorandum of Understanding (MOU)</h2>
                <p className="text-gray-600">
                  All partner shops must sign an MOU before hosting apprentices. This document
                  outlines roles, responsibilities, and expectations for both parties.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="font-bold text-gray-900 mb-3">The MOU Covers:</h3>
              <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Supervision requirements
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Compensation obligations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Hour verification process
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Safety and workplace standards
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Communication protocols
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Termination procedures
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/docs/Indiana-Barbershop-Apprenticeship-MOU"
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                View MOU Template
              </Link>
              <p className="text-sm text-gray-500 self-center">
                Review before applying. Signing is required to participate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-700">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Host an Apprentice?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join Indiana barbershops developing the next generation of licensed barbers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/partners/barbershop-apprenticeship/apply"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
            >
              <ClipboardCheck className="w-5 h-5 mr-2" />
              Apply Now
            </Link>
            <Link
              href="/programs/barber-apprenticeship"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 text-white rounded-lg text-lg font-bold hover:bg-blue-400 transition-colors"
            >
              Learn About the Program
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
