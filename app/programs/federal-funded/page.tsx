export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import Link from 'next/link';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
import { InView } from '@/components/ui/InView';
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Federal-Funded Training Programs | WIOA & JRI | Indianapolis',
  description: 'Free career training through WIOA, WRG, and JRI federal funding. Healthcare, Skilled Trades, Technology, and CDL programs.',
  alternates: { canonical: `${SITE_URL}/programs/federal-funded` },
};

const config: ProgramPageConfig = {
  videoSrc: '/videos/program-hero.mp4',
  title: 'Federal-Funded Programs', subtitle: 'Free career training through WIOA, WRG, and JRI. Tuition, books, supplies, and certifications covered.',
  badge: 'Free Training', badgeColor: 'green',
  duration: '3–16 weeks', cost: '$0 for eligible participants', format: 'In-person, Indianapolis', credential: 'Industry Certifications',
  overview: 'Federal workforce programs cover the full cost of training for eligible participants. WIOA (Workforce Innovation and Opportunity Act), WRG (Workforce Ready Grant), and JRI (Justice Reinvestment Initiative) fund tuition, textbooks, supplies, certification exams, and supportive services like transportation and childcare. You pay nothing out of pocket.',
  highlights: ['$0 tuition for eligible participants', 'Books, supplies, and uniforms included', 'Certification exam fees covered', 'Supportive services (transportation, childcare)', 'Career counseling and job placement', 'Available for unemployed, underemployed, and justice-involved individuals'],
  overviewImage: '/images/programs-fresh/healthcare.jpg', overviewImageAlt: 'Students in a funded training program',
  salaryNumber: 0, salaryLabel: 'Free training — you pay nothing if eligible', salaryPrefix: '',
  steps: [
    { title: 'Check Eligibility', desc: 'Take our 2-minute eligibility check or visit WorkOne.' },
    { title: 'Choose a Program', desc: 'Pick from Healthcare, Skilled Trades, Technology, or CDL.' },
    { title: 'Apply', desc: 'Complete our application and meet with an advisor.' },
    { title: 'Start Training', desc: 'Begin your program — everything is covered.' },
  ],
  faqs: [
    { question: 'Who qualifies for free training?', answer: 'You likely qualify if you are unemployed, underemployed, receiving public assistance (SNAP, TANF, Medicaid), a veteran, justice-involved, or have household income below 200% of poverty level.' },
    { question: 'What does WIOA cover?', answer: 'WIOA covers tuition, textbooks, supplies, uniforms, certification exam fees, and supportive services (transportation, childcare, work tools). You pay nothing out of pocket.' },
    { question: 'What is JRI funding?', answer: 'JRI (Justice Reinvestment Initiative) is Indiana state funding specifically for justice-involved individuals. It covers the same costs as WIOA and is available for participants with criminal records.' },
    { question: 'How do I check my eligibility?', answer: 'Take our 2-minute online eligibility check, or visit your local WorkOne office. You can also call us at (317) 314-3757 and we will help you determine your eligibility.' },
  ],
  applyHref: '/wioa-eligibility',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Federal-Funded Programs' }],
};

export default function Page() {
  return (
    <ProgramPageLayout config={config}>
      <InView animation="fade-up">
        <section className="py-14 lg:py-20 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Funded Programs</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Programs Available with Federal Funding</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Healthcare', href: '/programs/healthcare', desc: 'CNA, Medical Assistant, Phlebotomy' },
                { label: 'Skilled Trades', href: '/programs/skilled-trades', desc: 'HVAC, Electrical, Welding, Plumbing' },
                { label: 'Technology', href: '/programs/technology', desc: 'IT Support, Cybersecurity, Web Dev' },
                { label: 'CDL Training', href: '/programs/cdl-training', desc: 'Class A License in 3-6 weeks' },
              ].map((cat) => (
                <Link key={cat.label} href={cat.href} className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-brand-red-400 hover:shadow-md transition-all text-center group">
                  <h3 className="font-bold text-slate-900 group-hover:text-brand-red-600 transition-colors">{cat.label}</h3>
                  <p className="text-xs text-slate-500 mt-1">{cat.desc}</p>
                  <span className="text-brand-red-600 font-semibold text-sm mt-3 block group-hover:underline">View Programs →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </InView>
    </ProgramPageLayout>
  );
}
