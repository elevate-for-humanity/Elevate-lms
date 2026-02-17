export const dynamic = 'force-dynamic';

// Programs page - pulls from database with ISR caching
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Training Programs | Free Career Training',
  description: 'Explore free career training programs in healthcare, skilled trades, technology, CDL, barbering, and business. WIOA-funded programs available. Start your new career today.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs',
  },
  openGraph: {
    title: 'Free Career Training Programs | Elevate for Humanity',
    description: 'Explore free career training in healthcare, skilled trades, technology, CDL, barbering, and business. WIOA-funded programs available.',
    url: 'https://www.elevateforhumanity.org/programs',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/heroes-hq/programs-hero.jpg', width: 1200, height: 630, alt: 'Career training programs' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Career Training Programs | Elevate for Humanity',
    description: 'Explore free career training in healthcare, skilled trades, technology, CDL, barbering, and business.',
    images: ['/images/heroes-hq/programs-hero.jpg'],
  },
};
import { PathwayBlock } from '@/components/PathwayBlock';
import PathwayDisclosure from '@/components/compliance/PathwayDisclosure';
import { createPublicClient } from '@/lib/supabase/public';
import ProgramCTA from '@/components/ProgramCTA';
import ProgramOutcomesTracker from '@/components/ProgramOutcomesTracker';
import EnrollmentProcess from '@/components/EnrollmentProcess';

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
      { title: 'Skilled Trades', description: 'HVAC, Electrical, Welding, Plumbing training programs.', href: '/programs/skilled-trades', programs: ['HVAC Technician', 'Electrical', 'Welding'] },
      { title: 'Technology', description: 'IT Support, Cybersecurity, Web Development programs.', href: '/programs/technology', programs: ['IT Support', 'Cybersecurity', 'Web Dev'] },
      { title: 'CDL & Transportation', description: 'Commercial driving license training programs.', href: '/programs/cdl', programs: ['CDL Class A', 'CDL Class B'] },
      { title: 'Beauty & Barbering', description: 'Barber apprenticeship and cosmetology programs.', href: '/programs/barber-apprenticeship', programs: ['Barber Apprenticeship', 'Cosmetology'] },
      { title: 'Business & Finance', description: 'Tax preparation and business training programs.', href: '/programs/business', programs: ['Tax Preparation', 'Business Admin'] },
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
      { title: 'Skilled Trades', description: 'HVAC, Electrical, Welding, Plumbing training programs.', href: '/programs/skilled-trades', programs: ['HVAC Technician', 'Electrical', 'Welding'] },
      { title: 'Technology', description: 'IT Support, Cybersecurity, Web Development programs.', href: '/programs/technology', programs: ['IT Support', 'Cybersecurity', 'Web Dev'] },
      { title: 'CDL & Transportation', description: 'Commercial driving license training programs.', href: '/programs/cdl', programs: ['CDL Class A', 'CDL Class B'] },
      { title: 'Beauty & Barbering', description: 'Barber apprenticeship and cosmetology programs.', href: '/programs/barber-apprenticeship', programs: ['Barber Apprenticeship', 'Cosmetology'] },
      { title: 'Business & Finance', description: 'Tax preparation and business training programs.', href: '/programs/business', programs: ['Tax Preparation', 'Business Admin'] },
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
  { step: '01', title: 'Check Eligibility', desc: 'Complete a quick assessment to see if you qualify for free training through WIOA or other programs.' },
  { step: '02', title: 'Choose Your Path', desc: 'Select from healthcare, trades, technology, or other career programs based on your interests.' },
  { step: '03', title: 'Get Approved', desc: 'Our team helps you complete enrollment paperwork and get approved for funding.' },
  { step: '04', title: 'Start Training', desc: 'Begin your program with all materials, books, and supplies provided at no cost.' },
  { step: '05', title: 'Earn Credentials', desc: 'Complete industry-recognized certifications that employers are looking for.' },
  { step: '06', title: 'Launch Career', desc: 'Get job placement support including resume help, interview prep, and employer connections.' },
];

export default async function ProgramsPage() {
  const categories = await getCategories();
  
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs' }]} />
        </div>
      </div>

      {/* HERO - Full width, consistent height */}
      <section className="relative w-full h-[45vh] sm:h-[50vh] lg:h-[55vh]">
        <div className="absolute inset-0">
          <Image src="/images/programs-hero-vibrant.jpg" alt="Career training programs" fill sizes="100vw" className="object-cover" priority />
        </div>
        <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8">
          <span className="inline-block bg-brand-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">
            Career Training Programs
          </span>
        </div>
      </section>

      {/* TEXT SECTION - Below hero, consistent sizing */}
      <section className="py-10 sm:py-12 lg:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-4">
            Find Your <span className="text-brand-blue-600">Career Path.</span><br />
            <span className="text-brand-red-600">Start Free.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-6">
            If you're here, you're in the right place. This program is designed to take you from interested to enrolled, then into class with a clear next step at every stage.
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

      {/* MARQUEE */}
      <section className="py-3 bg-slate-900 overflow-hidden" aria-hidden="true">
        <div className="flex animate-marquee whitespace-nowrap will-change-transform">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 mx-4">
              {['Healthcare', 'Skilled Trades', 'Technology', 'CDL', 'Barbering', 'Business', 'Free Training'].map((text, j) => (
                <span key={j} className="text-white/80 text-base font-medium flex items-center gap-4">
                  {text}<span className="text-brand-red-500">★</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* PROGRAMS LIST - Clean text-based design */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-brand-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">Training Categories</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Choose Your Career Path</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Each program is designed to take you from beginner to job-ready.</p>
          </div>
          
          <div className="space-y-4">
            {categories.map((cat) => (
              <Link key={cat.title} href={cat.href} className="group block bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 hover:border-brand-blue-300">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-brand-blue-600 transition-colors">{cat.title}</h3>
                    <p className="text-slate-600 text-sm mb-3">{cat.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.programs.map((p, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <span className="text-brand-blue-600 font-semibold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
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
                      <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <Image src="/images/prog-roadmap.jpg" alt="Career roadmap" fill sizes="100vw" className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SCROLLING TEXT */}
      <section className="py-6 bg-brand-blue-600 overflow-hidden">
        <div className="flex animate-marquee-reverse whitespace-nowrap">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="text-4xl md:text-5xl font-black text-white/70 mx-6">
              Free Training • Real Careers • No Debt • Job Placement • 
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
                  'Free Tuition through WIOA Funding',
                  'Books & Supplies Included',
                  'Transportation Assistance Available',
                  'Job Placement Support',
                  'Industry-Recognized Certifications',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-white rounded-lg shadow-sm">
                    <svg className="w-4 h-4 text-brand-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-slate-700 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-square max-h-[320px] rounded-xl overflow-hidden shadow-lg">
                <Image src="/images/prog-why.jpg" alt="Career support" fill sizes="100vw" className="object-cover" />
              </div>
            </div>
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
              { q: 'How do I know if I qualify for free training?', a: 'You likely qualify if you are unemployed, underemployed, receiving public assistance (SNAP, TANF, Medicaid), a veteran, or have household income below 200% of poverty level. Take our 2-minute eligibility check.' },
              { q: 'How long are the programs?', a: 'Most certification programs are 4-16 weeks. CDL training is 3-6 weeks. Apprenticeships like Barber are 12-18 months but you earn while you learn.' },
              { q: 'Do I need prior experience or education?', a: 'Most programs require only a high school diploma or GED. No prior experience needed. We start from the basics and build your skills.' },
              { q: 'What if I have a criminal record?', a: 'We specialize in serving justice-involved individuals. Many programs are specifically designed for people with records. JRI funding covers training for eligible participants.' },
              { q: 'Will I get help finding a job?', a: 'Yes. Every program includes career services: resume writing, interview preparation, and direct connections to 50+ employer partners actively hiring our graduates.' },
              { q: 'What certifications will I earn?', a: 'Depends on your program. Examples: CNA, OSHA 10/30, CompTIA A+, CDL Class A, Phlebotomy, Medical Assistant, HVAC EPA 608, and more.' },
              { q: 'Where are classes held?', a: 'Training locations vary by program. Most are in the Indianapolis/Marion County area. Some programs offer hybrid or online options. Contact us for specific locations.' },
            ].map((faq, i) => (
              <details key={i} className="group bg-slate-50 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-semibold text-slate-900">
                  {faq.q}
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <section className="py-16 lg:py-24 bg-brand-blue-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Begin Your Journey Today</h2>
          <p className="text-lg text-white/90 mb-8">Whether you&apos;re starting fresh or changing careers, we&apos;re here to help.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply" className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-brand-blue-50 transition-all">
              Check Eligibility
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/support" className="inline-flex items-center gap-2 text-white border-2 border-white/50 px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all">
              Get Help Online
            </Link>
          </div>
          <p className="text-white/80 text-sm mt-4">
            Enrollment is availability- and eligibility-based. A workforce advisor will confirm your placement and start date.
          </p>
        </div>
      </section>
    </div>
  );
}
