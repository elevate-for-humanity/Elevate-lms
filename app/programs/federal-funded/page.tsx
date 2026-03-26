import { Metadata } from 'next';
import Link from 'next/link';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
import { InView } from '@/components/ui/InView';

export const dynamic = 'force-static';
export const revalidate = 86400;
const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Federal-Funded Training Programs | WIOA & JRI | Indianapolis',
  description: 'No-cost career training for eligible participants through WIOA, WRG, and JRI federal funding. Healthcare, Skilled Trades, Technology, and CDL programs in Indianapolis.',
  alternates: { canonical: `${SITE_URL}/programs/federal-funded` },
  openGraph: {
    title: 'Federal-Funded Training Programs | WIOA & JRI | Indianapolis',
    description: 'No-cost career training for eligible participants through WIOA, WRG, and JRI federal funding. Healthcare, Skilled Trades, Technology, and CDL programs in Indianapolis.',
    url: `${SITE_URL}/programs/federal-funded`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Federal-Funded Training Programs | WIOA & JRI | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  heroImage: '/images/pages/funding-hero.jpg',
  title: 'Federal-Funded Programs', subtitle: 'No-cost career training for eligible participants through WIOA, WRG, and JRI. Tuition, books, supplies, and certifications covered.',
  badge: 'Funded Training', badgeColor: 'green',
  duration: '3–16 weeks', cost: '$0 for eligible participants', format: 'In-person, Indianapolis', credential: 'Varies by program',
  overview: 'Federal workforce programs cover the full cost of training for eligible participants. WIOA (Workforce Innovation and Opportunity Act), WRG (Workforce Ready Grant), and JRI (Job Ready Indy) fund tuition, textbooks, supplies, certification exams, and supportive services like transportation and childcare. Eligible participants pay nothing out of pocket. Credentials earned depend on the program — some are issued by Elevate (certificates of completion), while others are administered by external certifying bodies (state licenses, national exams).',
  highlights: ['$0 tuition for eligible participants', 'Books, supplies, and uniforms included', 'Certification exam fees covered', 'Supportive services (transportation, childcare)', 'Career counseling and job placement', 'Available for unemployed, underemployed, and justice-involved individuals'],
  overviewImage: '/images/pages/funding-impact-1.jpg', overviewImageAlt: 'Students in a funded training program',
  salaryNumber: 0, salaryLabel: 'No-cost training for eligible participants', salaryPrefix: '',
  curriculum: [
    { title: 'Funding Sources', topics: ['WIOA (Workforce Innovation and Opportunity Act)', 'WRG (Workforce Ready Grant)', 'JRI (Job Ready Indy)', 'Registered Apprenticeship incentives'] },
    { title: 'What\'s Covered', topics: ['Tuition and training fees', 'Textbooks and training materials', 'Certification and licensing exam fees', 'Uniforms, tools, and required supplies'] },
    { title: 'Support Services', topics: ['Transportation assistance', 'Childcare assistance', 'Work clothing and tools', 'Emergency support funds'] },
    { title: 'Career Services', topics: ['Career counseling and assessment', 'Resume building and interview prep', 'Job placement assistance', 'Employer connections and referrals'] },
  ],
  careers: [
    { title: 'Certified Nursing Assistant (CNA)', salary: '$35,000–$42,000' },
    { title: 'Medical Assistant', salary: '$36,000–$44,000' },
    { title: 'Phlebotomy Technician', salary: '$34,000–$40,000' },
    { title: 'HVAC Technician', salary: '$42,000–$65,000' },
    { title: 'Electrician Apprentice', salary: '$38,000–$55,000' },
    { title: 'Welder', salary: '$40,000–$58,000' },
    { title: 'CDL Class A Driver', salary: '$50,000–$75,000' },
    { title: 'IT Support Specialist', salary: '$40,000–$55,000' },
    { title: 'Cybersecurity Analyst', salary: '$55,000–$80,000' },
    { title: 'Barber (Licensed)', salary: '$30,000–$60,000+' },
  ],
  credentials: [
    'CNA Certification (state-issued — IN Dept. of Health)',
    'CCMA (NHA exam)',
    'CPT Phlebotomy (NHA exam)',
    'EPA 608 (EPA-approved testing org)',
    'OSHA 10/30 Safety (DOL card)',
    'CDL Class A License (Indiana BMV)',
    'CompTIA A+ (CompTIA exam)',
    'CompTIA Security+ (CompTIA exam)',
    'Barber License (state-issued — IN PLA)',
    'ServSafe Food Handler (NRA exam)',
    'Elevate Certificates of Completion (all programs)',
  ],
  steps: [
    { title: 'Check Eligibility', desc: 'Take our 2-minute eligibility check or visit WorkOne.' },
    { title: 'Choose a Program', desc: 'Pick from Healthcare, Skilled Trades, Technology, or CDL.' },
    { title: 'Apply', desc: 'Complete our application and meet with an advisor.' },
    { title: 'Start Training', desc: 'Begin your program — everything is covered.' },
  ],
  faqs: [
    { question: 'Who qualifies for funded training?', answer: 'You may qualify if you are unemployed, underemployed, receiving public assistance (SNAP, TANF, Medicaid), a veteran, justice-involved, or have household income below 200% of the federal poverty level. Eligibility is determined by your local WorkOne office or our enrollment team.' },
    { question: 'What does WIOA cover?', answer: 'WIOA covers tuition, textbooks, supplies, uniforms, certification exam fees, and supportive services (transportation, childcare, work tools). You pay nothing out of pocket.' },
    { question: 'What is JRI funding?', answer: 'JRI (Job Ready Indy) is Indiana state funding specifically for justice-involved individuals. It covers the same costs as WIOA and is available for participants with criminal records.' },
    { question: 'How do I check my eligibility?', answer: 'Take our 2-minute online eligibility check, or visit your local WorkOne office. You can also call us at (317) 314-3757 and we will help you determine your eligibility.' },
  ],
  applyHref: '/wioa-eligibility',
  breadcrumbs: [{ label: 'Programs', href: '/programs' }, { label: 'Federal-Funded Programs' }],
};

export default function Page() {
  return (
    <ProgramPageLayout config={config}>
      <InView animation="fade-up">
        <section className="py-14 lg:py-20 border-t border-slate-100">
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
                <Link key={cat.label} href={cat.href} className="bg-white rounded-xl p-5 border border-slate-200 hover:border-brand-red-400 hover:shadow-md transition-all text-center group">
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
