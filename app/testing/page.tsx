import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Testing & Credential Exams | Elevate for Humanity',
  description:
    'Workforce credential exams and proctor-supervised certification testing. Certiport, EPA 608, OSHA, Rise Up, and CareerSafe exams available through authorized testing partnerships.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/testing',
  },
};

const examCategories = [
  {
    id: 'certiport',
    name: 'Certiport Authorized Testing',
    provider: 'Certiport (Pearson VUE)',
    image: '/images/pages/testing-page-1.jpg',
    description: 'Proctor-supervised exams administered on-site through our Certiport Authorized Testing Center designation.',
    exams: [
      'Microsoft Office Specialist (Word, Excel, PowerPoint, Outlook, Access)',
      'IC3 Digital Literacy (Computing Fundamentals, Key Applications, Living Online)',
      'Entrepreneurship and Small Business (ESB)',
      'IT Specialist (Python, Java, HTML/CSS, JavaScript, Networking, Cybersecurity)',
      'Intuit QuickBooks Certified User (Desktop, Online)',
    ],
    access: 'On-site proctored',
    bookable: true,
  },
  {
    id: 'epa-608',
    name: 'EPA Section 608 Certification',
    provider: 'ESCO Institute (Authorized Proctor Site)',
    image: '/images/pages/hvac-technician.jpg',
    description: 'Elevate for Humanity is an authorized EPA 608 proctor testing site through the ESCO Institute. Universal certification covering Core, Type I, II, and III refrigerant handling — required by federal law for HVAC technicians. All sections available on-site.',
    exams: [
      'EPA 608 Core',
      'EPA 608 Type I — Small Appliances',
      'EPA 608 Type II — High-Pressure Systems',
      'EPA 608 Type III — Low-Pressure Systems',
      'EPA 608 Universal (all types)',
    ],
    access: 'Proctored on-site — ESCO Authorized',
    bookable: true,
  },
  {
    id: 'osha',
    name: 'OSHA Safety Certifications',
    provider: 'CareerSafe / OSHA',
    image: '/images/pages/apprenticeships-hero.jpg',
    description: 'OSHA-authorized safety training and certification through our CareerSafe partnership.',
    exams: [
      'OSHA 10-Hour General Industry',
      'OSHA 10-Hour Construction',
      'OSHA 30-Hour General Industry',
      'OSHA 30-Hour Construction',
    ],
    access: 'Online with proctor verification',
    bookable: false,
  },
  {
    id: 'rise-up',
    name: 'Rise Up — National Retail Federation',
    provider: 'NRF Foundation',
    image: '/images/pages/apply-employer-hero.jpg',
    description: 'Workforce credentials in customer service, retail, and business fundamentals. Stackable credentials recognized by national employers.',
    exams: [
      'Customer Service & Sales Credential',
      'Business of Retail Credential',
      'Retail Industry Fundamentals',
    ],
    access: 'Hybrid coursework with proctored assessment',
    bookable: true,
  },
  {
    id: 'careersafe',
    name: 'CareerSafe Safety Training',
    provider: 'CareerSafe',
    image: '/images/pages/hvac-technician.jpg',
    description: 'Online safety training courses with certification upon completion. Accepted by employers in construction, manufacturing, and general industry.',
    exams: [
      'Bloodborne Pathogens',
      'Hazard Communication',
      'Personal Protective Equipment',
      'Fire Safety',
    ],
    access: 'Online self-paced with assessment',
    bookable: false,
  },
];

export default function TestingPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Testing & Credential Exams' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-48 md:h-64 flex items-center overflow-hidden">
        <Image
          src="/images/pages/testing-page-1.jpg"
          alt="Workforce credential testing"
          fill sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      {/* Disclosure */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Credential Disclosure:</strong> Credentials and licenses are issued by external credential bodies, exam providers, and state agencies — not by Elevate for Humanity. Elevate coordinates instruction through licensed credential partners, provides exam preparation support, and facilitates access to authorized testing. The credentialing authority makes the final determination.
              {' '}<Link href="/compliance" className="text-brand-blue-600 hover:underline font-medium">View full compliance disclosure &rarr;</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Exam Categories */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 mb-10">Available Credential Exams</h2>
          <div className="space-y-8">
            {examCategories.map((cat) => (
              <div key={cat.name} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid lg:grid-cols-3">
                  <div className="relative h-48 lg:h-auto overflow-hidden">
                    <Image src={cat.image} alt={cat.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
                  </div>
                  <div className="lg:col-span-2 p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{cat.name}</h3>
                        <p className="text-sm text-slate-500">Provider: {cat.provider}</p>
                      </div>
                      <span className="text-xs font-medium bg-white text-slate-600 px-3 py-1 rounded-full whitespace-nowrap">
                        {cat.access}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-4">{cat.description}</p>
                    <div className="space-y-1 mb-5">
                      {cat.exams.map((exam) => (
                        <div key={exam} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="w-1.5 h-1.5 bg-brand-red-600 rounded-full flex-shrink-0 mt-1.5" />
                          {exam}
                        </div>
                      ))}
                    </div>
                    {cat.bookable && (
                      <Link
                        href={`/testing/book?exam=${cat.id}`}
                        className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        <CalendarDays className="w-4 h-4" />
                        Book a Seat
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">How Testing Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Complete Training', desc: 'Finish your program coursework and exam preparation modules.' },
              { step: '2', title: 'Schedule Exam', desc: 'Your program coordinator schedules your exam at an authorized testing site.' },
              { step: '3', title: 'Take Exam', desc: 'Exams are proctor-supervised. Bring valid photo ID and any required materials.' },
              { step: '4', title: 'Receive Credential', desc: 'Credentials are issued by the certifying body upon passing. Results are recorded in your student record.' },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3">{s.step}</div>
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{s.title}</h3>
                <p className="text-slate-600 text-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Workforce Partners */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 mb-4">For Workforce Partners</h2>
          <p className="text-slate-600 mb-6">
            Credential exam results are documented and available for workforce partner reporting. All testing follows authorized proctoring protocols.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">Reporting</h3>
              <ul className="space-y-1 text-sm text-slate-700">
                <li>Exam pass/fail results per participant</li>
                <li>Credential attainment dates</li>
                <li>Cohort-level credential rates</li>
                <li>PIRL-compatible outcome data</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">Testing Protocols</h3>
              <ul className="space-y-1 text-sm text-slate-700">
                <li>Photo ID verification required</li>
                <li>Proctor-supervised environment</li>
                <li>Authorized testing center or approved proctoring</li>
                <li>Results issued by credentialing authority</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* EPA 608 Proctor Information */}
      <section className="py-14 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-slate-900 rounded-2xl p-8 sm:p-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-brand-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">EPA 608 Authorized Proctor Site</h2>
                <p className="text-slate-400 text-sm">ESCO Institute — Authorized Testing Center</p>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed mb-4">
              Elevate for Humanity is an authorized EPA Section 608 proctor testing site through the <strong className="text-white">ESCO Institute</strong>. We administer EPA 608 Universal certification exams on-site for HVAC technicians and students. The EPA 608 credential is required by federal law to purchase and handle refrigerants.
            </p>
            <p className="text-slate-300 leading-relaxed mb-6">
              ESCO continuously adds new features and content to the proctor login area and eLearning network to enhance the proctor experience and aid with training. Proctors should log in periodically to check for updates.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-bold text-white mb-3">Proctor Portal</h3>
                <p className="text-slate-400 text-sm mb-4">Access the ESCO proctor login to manage exam sessions, review candidate records, and check for new features.</p>
                <a
                  href="https://www.escogroupinc.com/proctor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
                >
                  ESCO Proctor Login →
                </a>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <h3 className="font-bold text-white mb-3">eLearning Center</h3>
                <p className="text-slate-400 text-sm mb-4">Visit the ESCO eLearning center for proctor training resources, new content, and continuing education materials.</p>
                <a
                  href="https://elearning.escogroup.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg font-semibold text-sm border border-white/20 transition-colors"
                >
                  ESCO eLearning Center →
                </a>
              </div>
            </div>
            <div className="border-t border-white/10 pt-6">
              <h3 className="font-bold text-white mb-3">What We Proctor</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  'EPA 608 Core',
                  'EPA 608 Type I — Small Appliances',
                  'EPA 608 Type II — High-Pressure Systems',
                  'EPA 608 Type III — Low-Pressure Systems',
                  'EPA 608 Universal (all types)',
                  'Retesting for any section',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 bg-brand-red-500 rounded-full flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Ready to Earn Your Credential?</h2>
          <p className="text-slate-300 mb-8">Enroll in a training program to access exam preparation and proctored testing.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/programs" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors">
              View Programs
            </Link>
            <Link href="/contact" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold text-lg border border-white/30 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
