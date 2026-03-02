import { createAdminClient } from '@/lib/supabase/admin';

// Programs page - ISR cached, revalidates every 10 minutes
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Training Programs | No-Cost Career Training for Eligible Participants',
  description: 'Career training programs in healthcare, skilled trades, technology, CDL, barbering, and business. Training may be fully funded for eligible participants through WIOA and state workforce programs. Self-pay options also available.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs',
  },
  openGraph: {
    title: 'Career Training Programs | Elevate for Humanity',
    description: 'Career training in healthcare, skilled trades, technology, CDL, barbering, and business. No cost to eligible participants through WIOA and state funding.',
    url: 'https://www.elevateforhumanity.org/programs',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/heroes-hq/programs-hero.jpg', width: 1200, height: 630, alt: 'Career training programs' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Career Training Programs | Elevate for Humanity',
    description: 'Career training in healthcare, skilled trades, technology, CDL, barbering, and business. No cost to eligible participants.',
    images: ['/images/heroes-hq/programs-hero.jpg'],
  },
};
import { PathwayBlock } from '@/components/PathwayBlock';
import PathwayDisclosure from '@/components/compliance/PathwayDisclosure';
import { createPublicClient } from '@/lib/supabase/public';
import ProgramCTA from '@/components/ProgramCTA';
import ProgramOutcomesTracker from '@/components/ProgramOutcomesTracker';
import EnrollmentProcess from '@/components/EnrollmentProcess';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';

// Cache for 10 minutes - program listings don't change frequently
export const revalidate = 600;



// Normalize category names to consolidate duplicates (fallback if DB not updated)
const categoryNormalization: Record<string, string> = {
  // Healthcare consolidation
  'Healthcare': 'Healthcare',
  'Healthcare & Wellness': 'Healthcare',
  'Social Services': 'Healthcare',
  
  // Beauty consolidation
  'Beauty & Barbering': 'Beauty & Barbering',
  'Beauty & Wellness': 'Beauty & Barbering',
  'Cosmetology': 'Beauty & Barbering',
  
  // Business consolidation
  'Business & Finance': 'Business & Finance',
  'Business': 'Business & Finance',
  'Retail': 'Business & Finance',
  'Sales': 'Business & Finance',
  'Professional': 'Business & Finance',
  
  // Transportation consolidation
  'CDL & Transportation': 'CDL & Transportation',
  'Transportation': 'CDL & Transportation',
  'transportation': 'CDL & Transportation',
  
  // Hospitality consolidation
  'Hospitality': 'Hospitality',
  'Culinary Arts': 'Hospitality',
  
  // Pass-through (no change needed)
  'Skilled Trades': 'Skilled Trades',
  'Technology': 'Technology',
};

async function getCategories() {
  const supabase = createPublicClient();
  
  // Handle missing Supabase configuration
  if (!supabase) {
    // Return default categories when database is not configured
    return [
      { title: 'Healthcare', description: 'CNA, Medical Assistant, Phlebotomy training programs.', href: '/programs/healthcare', programs: ['CNA Training', 'Medical Assistant', 'Phlebotomy'] },
      { title: 'Skilled Trades', description: 'HVAC, Electrical, Welding, Plumbing training programs.', href: '/programs/skilled-trades', programs: ['Building Technician', 'Electrical', 'Welding'] },
      { title: 'Technology', description: 'IT Support, Cybersecurity, Web Development programs.', href: '/programs/technology', programs: ['IT Support', 'Cybersecurity', 'Web Dev'] },
      { title: 'CDL & Transportation', description: 'Commercial driving license training programs.', href: '/programs/cdl', programs: ['CDL Class A', 'CDL Class B'] },
      { title: 'Beauty & Barbering', description: 'Barber apprenticeship and cosmetology programs.', href: '/programs/barber-apprenticeship', programs: ['Barber Apprenticeship', 'Cosmetology'] },
      { title: 'Business & Finance', description: 'Financial literacy and business training programs.', href: '/programs/business', programs: ['Financial Literacy', 'Business Admin'] },
    ];
  }
  
  // Get active programs grouped by category
  const { data: programs, error } = await supabase
    .from('programs')
    .select('id, name, slug, category, description')
    .eq('is_active', true)
    .order('category');

  if (error) {
    console.error('Failed to fetch programs:', error);
    return [];
  }

  if (!programs || programs.length === 0) {
    // Return default categories if no programs in database
    return [
      { title: 'Healthcare', description: 'CNA, Medical Assistant, Phlebotomy training programs.', href: '/programs/healthcare', programs: ['CNA Training', 'Medical Assistant', 'Phlebotomy'] },
      { title: 'Skilled Trades', description: 'HVAC, Electrical, Welding, Plumbing training programs.', href: '/programs/skilled-trades', programs: ['Building Technician', 'Electrical', 'Welding'] },
      { title: 'Technology', description: 'IT Support, Cybersecurity, Web Development programs.', href: '/programs/technology', programs: ['IT Support', 'Cybersecurity', 'Web Dev'] },
      { title: 'CDL & Transportation', description: 'Commercial driving license training programs.', href: '/programs/cdl', programs: ['CDL Class A', 'CDL Class B'] },
      { title: 'Beauty & Barbering', description: 'Barber apprenticeship and cosmetology programs.', href: '/programs/barber-apprenticeship', programs: ['Barber Apprenticeship', 'Cosmetology'] },
      { title: 'Business & Finance', description: 'Financial literacy and business training programs.', href: '/programs/business', programs: ['Financial Literacy', 'Business Admin'] },
    ];
  }

  // Group programs by category (with normalization to consolidate duplicates)
  const categoryMap = new Map<string, { title: string; description: string; href: string; programs: string[] }>();
  
  for (const program of programs) {
    const rawCat = program.category || 'Other';
    // Normalize category name to consolidate duplicates
    const cat = categoryNormalization[rawCat] || rawCat;
    
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, {
        title: cat,
        description: `Explore ${cat.toLowerCase()} career opportunities.`,
        href: `/programs/${cat.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '')}`,
        programs: [],
      });
    }
    categoryMap.get(cat)!.programs.push(program.name);
  }

  return Array.from(categoryMap.values());
}

const roadmap = [
  { step: '01', title: 'Assessment & Eligibility', desc: 'Individualized intake and skills assessment. We help determine eligibility for funded training through WIOA, WRG, JRI, or vocational rehabilitation.' },
  { step: '02', title: 'Choose Your Path', desc: 'Select from healthcare, trades, technology, or other career programs based on your goals, strengths, and interests.' },
  { step: '03', title: 'Get Approved & Enroll', desc: 'Our team helps you complete enrollment paperwork and get approved for funding. We coordinate with WorkOne and referral partners.' },
  { step: '04', title: 'Training & Certification', desc: 'Begin your program with instructor oversight. Earn industry-recognized credentials that employers are looking for.' },
  { step: '05', title: 'One-on-One Employment Support', desc: 'Individualized career coaching, resume development, interview preparation, and job readiness assistance throughout your program.' },
  { step: '06', title: 'Placement & Follow-Up', desc: 'Direct employer matching, interview coordination, and ongoing retention support at 30, 60, 90, and 180 days post-placement.' },
];

export default async function ProgramsPage() {
  const categories = await getCategories();
  
  return (
    <div className="min-h-screen bg-white">
      {/* Now Enrolling Banner */}
      <div className="bg-brand-green-600 text-white py-2.5 text-center text-sm font-semibold tracking-wide">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-3 flex-wrap">
          <span>Now Enrolling — Grant-Funded Programs Available</span>
          <Link href="/apply" className="inline-flex items-center gap-1 bg-white text-brand-green-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-brand-green-50 transition-colors">
            Apply Today →
          </Link>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs' }]} />
        </div>
      </div>

      {/* HERO - Video banner with auto-play */}
      <ProgramHeroBanner videoSrc="/videos/training-providers-hero.mp4" voiceoverSrc="/audio/heroes/programs.mp3" />

      {/* TEXT SECTION - Below hero, consistent sizing */}
      <section className="py-10 sm:py-12 lg:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-4">
            Find Your <span className="text-brand-blue-600">Career Path.</span><br />
            <span className="text-brand-red-600">Start Today.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-6">
            If you&apos;re here, you&apos;re in the right place. This program is designed to take you from interested to enrolled, then into class with a clear next step at every stage.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/apply" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-blue-700 transition-all shadow-lg">
              Start Eligibility &amp; Apply
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/wioa-eligibility" className="inline-flex items-center gap-2 border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-full font-semibold hover:border-brand-blue-600 hover:text-brand-blue-600 transition-all">
              Learn About Funding
            </Link>
          </div>
        </div>
      </section>

      {/* DELIVERY MODEL STATEMENT — Institutional positioning for workforce reviewers */}
      <section className="py-8 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center md:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600 mb-1">Classroom / RTI</p>
              <p className="text-sm text-slate-600">Didactic instruction delivered online via the Elevate LMS. Curriculum, quizzes, and assessments completed digitally.</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600 mb-1">Hands-On / OJT</p>
              <p className="text-sm text-slate-600">Practical training at approved employer partner sites: licensed shops, clinical facilities, employer worksites, and driving schools.</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600 mb-1">Credentials</p>
              <p className="text-sm text-slate-600">Industry credentials issued by certifying bodies (EPA, OSHA, Indiana PLA, state boards) — not by Elevate.</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-600 mb-1">Progress Tracking</p>
              <p className="text-sm text-slate-600">LMS-tracked module completion, OJT hour logs with supervisor approval, and competency-based evaluations.</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center md:text-left">
            Elevate for Humanity is a hybrid workforce training hub — not a traditional campus. <a href="/disclosures/training-delivery" className="text-brand-red-600 hover:underline">Full training delivery disclosure →</a>
          </p>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="py-3 bg-slate-100 border-y border-slate-200 overflow-hidden" aria-hidden="true">
        <div className="flex animate-marquee whitespace-nowrap will-change-transform">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 mx-4">
              {['Healthcare', 'Skilled Trades', 'Technology', 'CDL', 'Barbering', 'Business', 'Funded Training'].map((text, j) => (
                <span key={j} className="text-slate-600 text-base font-medium flex items-center gap-4">
                  {text}<span className="text-brand-red-500">★</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ETPL-REGISTERED PROGRAMS — Matched to INTraining registry under 2Exclusive LLC-S */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <p className="text-brand-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">INTraining Eligible Programs</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Training Programs</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">Each program is registered on Indiana&apos;s INTraining system under provider 2Exclusive LLC-S at the Elevate for Humanity Training Center. Credentials are paired with their issuing partner below.</p>
          </div>
          <p className="text-center text-xs text-slate-500 mb-10">Provider: 2Exclusive LLC-S &nbsp;|&nbsp; Location: Elevate for Humanity Training Center, Indianapolis, IN (Marion County) &nbsp;|&nbsp; <span className="font-medium">W</span> = WIOA Eligible &nbsp; <span className="font-medium">WRG</span> = Workforce Ready Grant</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'Building Technician with HVAC Fundamentals',
                image: '/images/programs-hq/hvac-technician.jpg',
                slug: 'hvac-technician',
                href: '/programs/hvac-technician',
                programId: '#10004322',
                duration: '15 weeks',
                cost: '$5,000',
                credentials: [
                  { name: 'Residential HVAC Certification 1', partner: 'Industry Certification Body' },
                  { name: 'Residential HVAC Certification 2 — Refrigeration Diagnostics', partner: 'Industry Certification Body' },
                  { name: 'OSHA 30', partner: 'OSHA / CareerSafe' },
                  { name: 'CPR', partner: 'American Heart Association / American Red Cross' },
                  { name: 'Rise Up', partner: 'National Retail Federation (NRF)' },
                ],
                funding: 'WIOA, WRG',
                category: 'Skilled Trades',
              },
              {
                name: 'Barber Apprenticeship Program',
                image: '/images/programs-hq/barber-training.jpg',
                slug: 'barber-apprenticeship',
                href: '/programs/barber-apprenticeship',
                programId: '#10004637',
                duration: '15 months',
                cost: '$4,890',
                credentials: [
                  { name: 'Registered Barber License', partner: 'Indiana Professional Licensing Agency (PLA)' },
                  { name: 'Rise Up', partner: 'National Retail Federation (NRF)' },
                ],
                funding: 'WIOA',
                category: 'Apprenticeship',
              },
              {
                name: 'Emergency Health & Safety Technician',
                image: '/images/programs-hq/healthcare-hero.jpg',
                slug: 'emergency-health-safety-tech',
                href: '/programs/healthcare',
                programId: '#10004621',
                duration: '4 weeks',
                cost: '$4,950',
                credentials: [
                  { name: 'Emergency Medical Responder (EMR)', partner: 'NREMT / State EMS Agency' },
                  { name: 'OSHA 10 — CareerSafe', partner: 'OSHA / CareerSafe' },
                  { name: 'CPR', partner: 'American Heart Association / American Red Cross' },
                ],
                funding: 'WIOA',
                category: 'Healthcare',
              },
              {
                name: 'Home Health Aide Certification',
                image: '/images/programs-hq/cna-training.jpg',
                slug: 'home-health-aide',
                href: '/programs/healthcare',
                programId: '#10004626',
                duration: '4 weeks',
                cost: '$4,700',
                credentials: [
                  { name: 'Home Health Aide (HHA) License', partner: 'Indiana State Department of Health (ISDH)' },
                  { name: 'Certified Community Healthcare Worker (CCHW)', partner: 'Indiana CCHW Certification Board' },
                  { name: 'CPR', partner: 'American Heart Association / American Red Cross' },
                  { name: 'Rise Up', partner: 'National Retail Federation (NRF)' },
                ],
                funding: 'WIOA',
                category: 'Healthcare',
              },
              {
                name: 'Medical Assistant',
                image: '/images/programs-hq/medical-assistant.jpg',
                slug: 'medical-assistant',
                href: '/programs/medical-assistant',
                programId: '#10004639',
                duration: '21 days',
                cost: '$4,325',
                credentials: [
                  { name: 'Certified Community Healthcare Worker (CCHW)', partner: 'Indiana CCHW Certification Board' },
                  { name: 'CPR', partner: 'American Heart Association / American Red Cross' },
                  { name: 'Rise Up', partner: 'National Retail Federation (NRF)' },
                ],
                funding: 'WIOA',
                category: 'Healthcare',
              },

              {
                name: 'Professional Esthetician & Client Services',
                image: '/images/programs-fresh/cosmetology.jpg',
                slug: 'professional-esthetician',
                href: '/programs/barber-apprenticeship',
                programId: '#10004628',
                duration: '5 weeks',
                cost: '$4,575',
                credentials: [
                  { name: 'Business of Retail Certified Specialist', partner: 'National Retail Federation (NRF)' },
                  { name: 'Customer Service and Sales Certified Specialist', partner: 'National Retail Federation (NRF)' },
                  { name: 'OSHA 10 — CareerSafe', partner: 'OSHA / CareerSafe' },
                ],
                funding: 'WIOA',
                category: 'Beauty & Barbering',
              },
              {
                name: 'Business Start-up & Marketing Program',
                image: '/images/programs-hq/business-training.jpg',
                slug: 'business-startup-marketing',
                href: '/programs/business',
                programId: '#10004645',
                duration: '5 weeks',
                cost: '$4,550',
                credentials: [
                  { name: 'Business of Retail Certified Specialist', partner: 'National Retail Federation (NRF)' },
                  { name: 'Retail Industry Fundamentals Specialist', partner: 'National Retail Federation (NRF)' },
                  { name: 'Certificate of Completion', partner: 'Elevate for Humanity' },
                ],
                funding: 'WIOA',
                category: 'Business',
              },
              {
                name: 'Financial Literacy Program',
                image: '/images/programs-hq/business-office.jpg',
                slug: 'tax-prep-financial-services',
                href: '/programs/tax-entrepreneurship',
                programId: '#10004627',
                duration: '10 weeks',
                cost: '$4,950',
                credentials: [
                  { name: 'Microsoft 365 Fundamentals', partner: 'Microsoft' },
                  { name: 'QuickBooks Pro Advisor', partner: 'Intuit' },
                  { name: 'Rise Up', partner: 'National Retail Federation (NRF)' },
                  { name: 'Certificate of Completion', partner: 'Elevate for Humanity' },
                ],
                funding: 'WIOA',
                category: 'Business',
              },
              {
                name: 'Public Safety Reentry Specialist',
                image: '/images/programs-hq/students-learning.jpg',
                slug: 'public-safety-reentry-specialist',
                href: '/programs/healthcare',
                programId: '#10004666',
                duration: '45 days',
                cost: '$4,750',
                credentials: [
                  { name: 'Certified Peer Support Professional', partner: 'Indiana Division of Mental Health & Addiction (DMHA)' },
                  { name: 'Certified Peer Recovery Coach (CPRC)', partner: 'Indiana DMHA' },
                  { name: 'Certified Community Healthcare Worker (CCHW)', partner: 'Indiana CCHW Certification Board' },
                  { name: 'CPR', partner: 'American Heart Association / American Red Cross' },
                  { name: 'Rise Up', partner: 'National Retail Federation (NRF)' },
                ],
                funding: 'WIOA',
                category: 'Public Safety',
              },
              {
                name: 'CPR, AED & First Aid Certification',
                image: '/images/programs-hq/phlebotomy.jpg',
                slug: 'cpr-first-aid-hsi',
                href: '/programs/healthcare',
                programId: '#10004674',
                duration: '1 day',
                cost: '$575',
                credentials: [
                  { name: 'CPR / AED / First Aid', partner: 'American Heart Association / American Red Cross' },
                ],
                funding: 'WIOA',
                category: 'Healthcare',
              },
              {
                name: 'Electrical Technology',
                image: '/images/programs-hq/electrical.jpg',
                slug: 'electrical',
                href: '/programs/electrical',
                programId: '#10004700',
                duration: '16–24 weeks',
                cost: '$2,700',
                credentials: [
                  { name: 'OSHA 10 — General Industry Safety', partner: 'OSHA / CareerSafe' },
                  { name: 'Indiana Electrical Apprentice Registration', partner: 'Indiana IDHS' },
                  { name: 'CPR / First Aid', partner: 'American Heart Association' },
                ],
                funding: 'WIOA, WRG, NLJ',
                category: 'Skilled Trades',
              },
              {
                name: 'Plumbing Technology',
                image: '/images/trades/program-plumbing-training.jpg',
                slug: 'plumbing',
                href: '/programs/plumbing',
                programId: '#10004701',
                duration: '16 weeks',
                cost: '$2,700',
                credentials: [
                  { name: 'OSHA 10 — Construction Safety', partner: 'OSHA / CareerSafe' },
                  { name: 'CPR / First Aid', partner: 'American Heart Association' },
                ],
                funding: 'WIOA, WRG, NLJ',
                category: 'Skilled Trades',
              },
              {
                name: 'Forklift Operator Certification',
                image: '/images/trades/program-construction-training.jpg',
                slug: 'forklift',
                href: '/programs/forklift',
                programId: '#10004702',
                duration: '1 day',
                cost: '$2,700',
                credentials: [
                  { name: 'OSHA-Compliant Forklift Operator Certification', partner: 'OSHA / Employer-Verified' },
                ],
                funding: 'WIOA, NLJ',
                category: 'Skilled Trades',
              },
            ].map((program) => (
              <div key={program.programId} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 overflow-hidden">
                {program.image && (
                  <div className="relative h-40 overflow-hidden">
                    <Image src={program.image} alt={program.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                  </div>
                )}
                <div className="p-6 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-blue-600">{program.category}</span>
                        <span className="text-[10px] font-mono text-slate-500">{program.programId}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{program.name}</h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-sm mb-4">
                    <div>
                      <span className="text-slate-500 text-xs block">Duration</span>
                      <span className="font-medium text-slate-800">{program.duration}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">Cost</span>
                      <span className="font-medium text-slate-800">{program.cost}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">Funding</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {program.funding.split(',').map((f: string) => (
                          <span key={f.trim()} className="inline-block bg-brand-green-100 text-brand-green-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {f.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Credentials &amp; Issuing Partners</p>
                    <div className="space-y-1.5">
                      {program.credentials.map((cred, ci) => (
                        <div key={ci} className="flex items-start gap-2 text-sm">
                          <span className="text-slate-400 flex-shrink-0 mt-0.5 font-bold">–</span>
                          <div>
                            <span className="font-medium text-slate-800">{cred.name}</span>
                            <span className="text-slate-500 ml-1 text-xs">— {cred.partner}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Action buttons */}
                <div className="px-6 pb-4 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                  <Link href={program.href} className="inline-flex items-center gap-1 bg-brand-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-brand-blue-700 transition-colors">
                    View Details
                  </Link>
                  <Link href={`/apply?program=${program.slug}`} className="inline-flex items-center gap-1 bg-brand-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-brand-red-700 transition-colors">
                    Apply Now
                  </Link>
                  <Link href={`/contact?subject=${encodeURIComponent(program.name)}`} className="inline-flex items-center gap-1 border border-slate-300 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full hover:border-brand-blue-400 hover:text-brand-blue-600 transition-colors">
                    Inquiry
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Programs — Category browsing */}
          <div className="mt-12">
            <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">Browse by Category</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <Link key={cat.title} href={cat.href} className="group flex items-center justify-between bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all border border-slate-200 hover:border-brand-blue-300">
                  <div>
                    <h4 className="font-semibold text-slate-900 group-hover:text-brand-blue-600 transition-colors text-sm">{cat.title}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cat.programs.slice(0, 3).map((p, i) => (
                        <span key={i} className="text-xs text-slate-500">{p}{i < Math.min(cat.programs.length, 3) - 1 ? ',' : ''}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-brand-blue-600 text-sm font-medium flex-shrink-0 ml-2">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP - Consistent sizing */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-brand-blue-600 font-semibold text-sm uppercase tracking-widest mb-4">How It Works</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Roadmap to Your New Career</h2>
              <p className="text-base text-slate-600 mb-6">Our structured process is designed to get you job-ready fast.</p>
              
              <div className="space-y-3">
                {roadmap.map((item, i) => (
                  <details key={i} className="group bg-slate-50 rounded-xl overflow-hidden" open={i === 0}>
                    <summary className="flex items-center gap-3 p-4 cursor-pointer list-none">
                      <span className="text-xl font-bold text-brand-blue-600">{item.step}</span>
                      <span className="font-semibold text-slate-900 flex-1 text-sm">{item.title}</span>
                      <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-4 pb-4 pt-0">
                      <p className="text-slate-600 text-sm pl-9">{item.desc}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
            
            <div className="lg:sticky lg:top-24">
              <div className="aspect-square max-h-[320px] rounded-xl overflow-hidden shadow-lg">
                <Image src="/images/prog-roadmap.jpg" alt="Career roadmap" fill sizes="100vw" quality={90} className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SCROLLING TEXT */}
      <section className="py-6 bg-brand-blue-50 border-y border-brand-blue-100 overflow-hidden" aria-hidden="true">
        <div className="flex animate-marquee-reverse whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="text-4xl md:text-5xl font-black text-brand-blue-200 mx-6">
              Funded Training for Eligible Participants • Real Careers • Job Placement Assistance • 
            </span>
          ))}
        </div>
      </section>

      {/* WHY ELEVATE - Consistent sizing */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-brand-blue-600 font-semibold text-sm uppercase tracking-widest mb-4">Why Elevate?</p>
              <h2 className="text-3xl font-bold text-slate-900 leading-tight mb-4">
                We don&apos;t just train you. <span className="text-brand-blue-600">We launch your career.</span>
              </h2>
              <p className="text-base text-slate-600 mb-5">From enrollment to employment, we support you every step of the way.</p>
              <div className="space-y-2">
                {[
                  'Funded Tuition through WIOA for Eligible Participants',
                  'Books & Supplies Included',
                  'Transportation Assistance Available',
                  'Job Placement Support',
                  'Industry-Recognized Certifications',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-white rounded-lg shadow-sm">
                    <span className="w-2 h-2 bg-brand-blue-600 rounded-full flex-shrink-0" />
                    <span className="font-medium text-slate-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-square max-h-[320px] rounded-xl overflow-hidden shadow-lg">
                <Image src="/images/prog-why.jpg" alt="Career support" fill sizes="100vw" quality={90} className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROGRESS REPORTING & COHORT CAPABILITY — Workforce partner section */}
      <section className="py-16 lg:py-24 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-brand-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">For Workforce Partners</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Progress Reporting &amp; Cohort Capability</h2>
            <p className="text-base text-slate-600 max-w-3xl mx-auto">
              Elevate for Humanity operates as a Hybrid Workforce Training Provider and Registered Apprenticeship Sponsor. All programs are tracked through our LMS with documented evaluations and reporting available to workforce partners.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            {/* Progress Reporting */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">Progress Reporting</h3>
              <ul className="space-y-2.5 text-sm text-slate-700">
                {[
                  'RTI attendance tracking (per session, per student)',
                  'OJT hour logs verified by employer supervisors',
                  'LMS module completion with timestamped records',
                  'Competency rubric evaluations (scored 0–5 per competency)',
                  'Monthly progress summaries available to referring agencies',
                  'Credential attainment documentation with issuer verification',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-brand-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cohort Setup */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">Cohort Setup Timeline</h3>
              <div className="space-y-3 text-sm">
                {[
                  { day: 'Day 1–3', action: 'Referral intake and eligibility verification' },
                  { day: 'Day 4–5', action: 'Student enrollment and LMS account provisioning' },
                  { day: 'Day 6–7', action: 'Orientation and program materials distribution' },
                  { day: 'Day 8–10', action: 'RTI schedule confirmed with credential partner' },
                  { day: 'Day 11–14', action: 'Cohort launch with first RTI session' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xs font-bold text-brand-blue-600 bg-brand-blue-50 px-2 py-1 rounded whitespace-nowrap">{step.day}</span>
                    <span className="text-slate-700">{step.action}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">Reporting cadence: weekly attendance, biweekly progress summaries, monthly competency updates. Custom reporting available for workforce board partners.</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/compliance/workforce-partnership-packet" className="inline-flex items-center gap-2 border-2 border-brand-blue-600 text-brand-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-brand-blue-600 hover:text-white transition-all text-sm">
              View Workforce Partnership Packet
            </Link>
          </div>
        </div>
      </section>

      {/* PATHWAY BLOCK */}
      <PathwayBlock variant="dark" />

      {/* FAQ */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {[
              { q: 'Is the training really free?', a: 'Yes! WIOA, WRG, and JRI programs cover tuition, books, and supplies for eligible participants. Some programs like Barber Apprenticeship are self-pay with payment plans available.' },
              { q: 'How do I know if I qualify for funded training?', a: 'Eligibility varies by program and funding source. Common qualifiers include unemployment, underemployment, receiving public assistance (SNAP, TANF, Medicaid), veteran status, or household income below 200% of poverty level. Eligibility and funding determinations are subject to program and agency guidelines. Take our 2-minute eligibility check.' },
              { q: 'How long are the programs?', a: 'Most certification programs are 4-16 weeks. CDL training is 3-6 weeks. Apprenticeships like Barber are 12-18 months but you earn while you learn.' },
              { q: 'Do I need prior experience or education?', a: 'Most programs require only a high school diploma or GED. No prior experience needed. We start from the basics and build your skills.' },
              { q: 'What if I have a criminal record?', a: 'We specialize in serving justice-involved individuals. Many programs are specifically designed for people with records. JRI funding covers training for eligible participants.' },
              { q: 'Will I get help finding a job?', a: 'Yes. Every program includes career services: resume writing, interview preparation, and direct connections to 50+ employer partners actively hiring our graduates.' },
              { q: 'What certifications will I earn?', a: 'Depends on your program. Examples: CNA, OSHA 10/30, Certiport IT Specialist, CDL Class A, Phlebotomy, Medical Assistant, HVAC EPA 608, Adobe Certified Professional, and more.' },
              { q: 'Where are classes held?', a: 'Training locations vary by program. Most are in the Indianapolis/Marion County area. Some programs offer hybrid or online options. Contact us for specific locations.' },
            ].map((faq, i) => (
              <details key={i} className="group bg-slate-50 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-slate-900">
                  {faq.q}
                  <svg className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-slate-600">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ENROLLMENT PROCESS */}
      <EnrollmentProcess />

      {/* OUTCOMES TRACKER */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <ProgramOutcomesTracker />
        </div>
      </section>

      {/* PROGRAM CTA */}
      <ProgramCTA programName="our training programs" />

      {/* DISCLOSURE */}
      <section className="py-8 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4">
          <PathwayDisclosure variant="full" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Begin Your Journey Today</h2>
          <p className="text-lg text-slate-600 mb-8">Whether you&apos;re starting fresh or changing careers, we&apos;re here to help.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-brand-blue-700 transition-all">
              Check Eligibility
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/support" className="inline-flex items-center gap-2 text-slate-700 border-2 border-slate-300 px-8 py-4 rounded-full font-semibold text-lg hover:border-brand-blue-600 hover:text-brand-blue-600 transition-all">
              Get Help Online
            </Link>
          </div>
          <p className="text-slate-500 text-sm mt-4">
            Enrollment is availability- and eligibility-based. A workforce advisor will confirm your placement and start date.
          </p>
        </div>
      </section>
    </div>
  );
}
