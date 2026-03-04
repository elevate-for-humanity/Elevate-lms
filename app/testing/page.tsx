import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
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
    name: 'Certiport Authorized Testing',
    provider: 'Certiport (Pearson VUE)',
    image: '/images/Content_PATHWAY_BUSINESS.jpg',
    description: 'Proctor-supervised exams administered on-site through our Certiport Authorized Testing Center designation.',
    exams: [
      'Microsoft Office Specialist (Word, Excel, PowerPoint, Outlook, Access)',
      'IC3 Digital Literacy (Computing Fundamentals, Key Applications, Living Online)',
      'Entrepreneurship and Small Business (ESB)',
      'IT Specialist (Python, Java, HTML/CSS, JavaScript, Networking, Cybersecurity)',
      'Intuit QuickBooks Certified User (Desktop, Online)',
    ],
    access: 'On-site proctored',
  },
  {
    name: 'EPA Section 608 Certification',
    provider: 'ESCO Institute & Mainstream Engineering',
    image: '/images/Content_PATHWAY_TRADES.jpg',
    description: 'Universal certification exam covering Core, Type I, II, and III refrigerant handling. Required by federal law for HVAC technicians. Exam fees and retesting policies vary by certifying organization.',
    exams: [
      'EPA 608 Universal Certification Exam',
    ],
    access: 'Proctored on-site through EPA-approved certifying organizations',
  },
  {
    name: 'OSHA Safety Certifications',
    provider: 'CareerSafe / OSHA',
    image: '/images/apprenticeships-card.jpg',
    description: 'OSHA-authorized safety training and certification through our CareerSafe partnership.',
    exams: [
      'OSHA 10-Hour General Industry',
      'OSHA 10-Hour Construction',
      'OSHA 30-Hour General Industry',
      'OSHA 30-Hour Construction',
    ],
    access: 'Online with proctor verification',
  },
  {
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
  },
  {
    name: 'CareerSafe Safety Training',
    provider: 'CareerSafe',
    image: '/images/Content_PATHWAY_CDL.jpg',
    description: 'Online safety training courses with certification upon completion. Accepted by employers in construction, manufacturing, and general industry.',
    exams: [
      'Bloodborne Pathogens',
      'Hazard Communication',
      'Personal Protective Equipment',
      'Fire Safety',
    ],
    access: 'Online self-paced with assessment',
  },
];

export default function TestingPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
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
        <div className="absolute inset-0 bg-slate-900/60" />
      </section>

      {/* Disclosure */}
      <section className="py-8 bg-slate-50 border-b">
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
                  <div className="relative h-48 lg:h-auto">
                    <Image src={cat.image} alt={cat.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
                  </div>
                  <div className="lg:col-span-2 p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{cat.name}</h3>
                        <p className="text-sm text-slate-500">Provider: {cat.provider}</p>
                      </div>
                      <span className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full whitespace-nowrap">
                        {cat.access}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-4">{cat.description}</p>
                    <div className="space-y-1">
                      {cat.exams.map((exam) => (
                        <div key={exam} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="w-1.5 h-1.5 bg-brand-red-600 rounded-full flex-shrink-0 mt-1.5" />
                          {exam}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 bg-slate-50">
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
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">Reporting</h3>
              <ul className="space-y-1 text-sm text-slate-700">
                <li>Exam pass/fail results per participant</li>
                <li>Credential attainment dates</li>
                <li>Cohort-level credential rates</li>
                <li>PIRL-compatible outcome data</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
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
