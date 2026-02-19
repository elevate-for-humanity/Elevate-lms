import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FundingBadge } from '@/components/programs/FundingBadge';
import {
  Clock, DollarSign, Award, ArrowRight, Users, Calendar,
  Shield, Truck, Package, AlertTriangle, ClipboardCheck,
  Briefcase, GraduationCap, Phone, TrendingUp, Building
} from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Forklift Operator Certification | OSHA Training Indianapolis | Elevate',
  description: 'OSHA-compliant forklift operator certification in 1-2 weeks. 40 hours of training with practical evaluation at employer partner site. Immediate employability.',
  alternates: { canonical: `${SITE_URL}/programs/forklift` },
  openGraph: {
    title: 'Forklift Operator Certification | OSHA Training Indianapolis',
    description: 'OSHA-compliant forklift certification in 1-2 weeks. 40 hours. Practical eval at employer site.',
    url: `${SITE_URL}/programs/forklift`,
    siteName: 'Elevate for Humanity',
    type: 'website',
  },
};

const stats = [
  { value: '3★', label: 'Indiana Top Jobs Rating', icon: TrendingUp },
  { value: '$38K', label: 'Average Starting Salary', icon: DollarSign },
  { value: '40', label: 'Training Hours', icon: Clock },
  { value: '1–2', label: 'Weeks to Certification', icon: Calendar },
];

const curriculum = [
  { icon: Truck, title: 'Equipment Types & Controls', desc: 'Sit-down counterbalance, reach truck, order picker, pallet jack' },
  { icon: Shield, title: 'OSHA Safety Standards', desc: '29 CFR 1910.178 compliance, employer/operator responsibilities' },
  { icon: ClipboardCheck, title: 'Pre-Operation Inspection', desc: 'Daily checklist, defect reporting, documentation' },
  { icon: Package, title: 'Load Handling & Capacity', desc: 'Data plate, stability triangle, stacking procedures' },
  { icon: Building, title: 'Warehouse Operations', desc: 'Rack systems, trailer loading, WMS/RF scanners' },
  { icon: AlertTriangle, title: 'Hazard Recognition', desc: 'Tip-over response, emergency procedures, first aid' },
];

const careers = [
  { title: 'Forklift Operator', salary: '$35K–$45K', growth: 'High demand' },
  { title: 'Warehouse Associate', salary: '$32K–$40K', growth: 'Steady' },
  { title: 'Logistics Coordinator', salary: '$40K–$55K', growth: 'With experience' },
  { title: 'Warehouse Supervisor', salary: '$50K–$65K', growth: 'Advancement' },
];

const employers = [
  'Distribution centers', 'Logistics warehouses', 'Manufacturing facilities', 'Pharmaceutical plants',
  'Shipping & receiving operations', 'Third-party logistics (3PL)', 'Local industrial employers',
];

const faqs = [
  {
    question: 'Do I need experience to get forklift certified?',
    answer: 'No prior experience required. We teach everything from equipment basics to OSHA safety standards. The program is designed for complete beginners.',
  },
  {
    question: 'How long is the certification valid?',
    answer: 'OSHA forklift certification is valid for 3 years. Recertification is required after that, or sooner if there is an accident, near-miss, or change in equipment or workplace conditions.',
  },
  {
    question: 'Where does the practical evaluation happen?',
    answer: 'The driving evaluation and skills test are conducted at an employer partner warehouse facility. You train on the same equipment you will use on the job.',
  },
  {
    question: 'What schedule options are available?',
    answer: 'We offer a 1-week intensive (full-day sessions) or a 2-week evening format for working adults. Both formats total 40 hours. Final schedule is customized per cohort.',
  },
  {
    question: 'Can I get hired right after certification?',
    answer: 'Yes. Indianapolis distribution centers hire forklift operators continuously. Many of our participants receive job offers within days of certification. We provide resume support and employer introductions as part of the program.',
  },
  {
    question: 'Is this program eligible for funding?',
    answer: 'Yes. Forklift certification is eligible for WIOA funding and other workforce grants. We help you apply for funding as part of enrollment. If you qualify, the program may be available at no cost.',
  },
];

export default function ForkliftProgramPage() {
  return (
    <>
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Skilled Trades', href: '/programs/skilled-trades' },
            { label: 'Forklift Operator' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/images/programs-hq/skilled-trades-hero.jpg"
            alt="Forklift operator in warehouse"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20">
          <FundingBadge />
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-4">
            Forklift Operator<span className="text-orange-400"> OSHA Certification</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mb-6">
            Get OSHA-certified in 1–2 weeks. 40 hours of training with practical evaluation at employer partner warehouse. Immediate employability at Indianapolis distribution centers.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-8">
            <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-orange-400" /> 40 Hours • 1–2 Weeks</span>
            <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-brand-green-400" /> Funding Available</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4 text-yellow-400" /> 3-Star Indiana Top Jobs</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/apply?program=forklift"
              className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30"
            >
              Apply Now <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 hover:border-white text-white font-semibold rounded-full transition-all"
            >
              <Phone className="mr-2 w-5 h-5" /> Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-8 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Model */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">How This Program Works</h2>
          <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Classroom instruction + practical evaluation at employer warehouse. No lab facility needed — evaluation conducted on equipment at employer partner sites.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Classroom + LMS</h3>
              <p className="text-gray-600">OSHA safety standards, equipment theory, load handling principles, and warehouse operations. Evening or daytime schedule options.</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Practical Evaluation</h3>
              <p className="text-gray-600">Driving skills test, load handling, and obstacle course at employer partner warehouse. Same equipment you will use on the job.</p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">OSHA Certification</h3>
              <p className="text-gray-600">Written exam + practical evaluation. Receive your OSHA forklift operator certification card, valid for 3 years. Immediate employability.</p>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-8 max-w-3xl mx-auto">
            Final certification includes a supervised practical evaluation on powered industrial truck equipment at an approved employer or training partner site in accordance with OSHA 29 CFR 1910.178. Certification is employer-specific and must be verified by the hiring employer.
          </p>
        </div>
      </section>

      {/* Curriculum */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What You Will Learn</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculum.map((item, i) => (
              <div key={i} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                <item.icon className="w-8 h-8 text-orange-500 mb-3" />
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule & Format */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Program Format</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-sm border-2 border-orange-200">
              <h3 className="text-xl font-bold mb-4 text-orange-600">Intensive Format</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2"><Clock className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" /> 1 week, full-day sessions</li>
                <li className="flex items-start gap-2"><Clock className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" /> 40 hours total</li>
                <li className="flex items-start gap-2"><Award className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" /> Certification upon completion</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm border">
              <h3 className="text-xl font-bold mb-4 text-slate-700">Evening Format</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2"><Clock className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" /> 2 weeks, evening sessions</li>
                <li className="flex items-start gap-2"><Clock className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" /> 40 hours total</li>
                <li className="flex items-start gap-2"><Award className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" /> Designed for working adults</li>
              </ul>
            </div>
          </div>
          <p className="text-center text-gray-500 mt-6 text-sm">Bilingual (English/Spanish) instruction available for cohort groups. Final schedule customized per partner cohort.</p>
        </div>
      </section>

      {/* Careers */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Career Pathways</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {careers.map((career, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-6 text-center">
                <Briefcase className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                <h3 className="font-semibold mb-1">{career.title}</h3>
                <p className="text-orange-600 font-bold">{career.salary}</p>
                <p className="text-sm text-gray-500">{career.growth}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <h3 className="font-semibold mb-3">Indianapolis Employers Hiring Forklift Operators</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {employers.map((emp, i) => (
                <span key={i} className="bg-slate-100 px-4 py-2 rounded-full text-sm text-slate-700">{emp}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-white rounded-xl p-6 shadow-sm group">
                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                  {faq.question}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-4 text-gray-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-orange-600 to-orange-500 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Get Certified. Get Hired. Get Started.</h2>
          <p className="text-lg text-orange-100 mb-8">
            Forklift certification in as little as 1 week. Funding may be available.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/apply?program=forklift"
              className="inline-flex items-center px-8 py-4 bg-white text-orange-600 font-semibold rounded-full hover:bg-orange-50 transition-all"
            >
              Apply Now <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition-all"
            >
              <Phone className="mr-2 w-5 h-5" /> 317-314-3757
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
