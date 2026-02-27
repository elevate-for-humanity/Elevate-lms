import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Career Pathways & Workforce Infrastructure | Elevate for Humanity',
  description:
    'Elevate for Humanity operates a structured career pathway system: eligibility screening, credentialed training, apprenticeship, employer placement, and advancement tracking across healthcare, trades, CDL, barbering, and technology.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/pathways' },
  openGraph: {
    title: 'Career Pathways & Workforce Infrastructure | Elevate for Humanity',
    description: 'Structured workforce pathways: screening, training, credentialing, apprenticeship, placement, and advancement.',
    url: 'https://www.elevateforhumanity.org/pathways',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/heroes-hq/programs-hero.jpg', width: 1200, height: 630, alt: 'Elevate career pathways' }],
    type: 'website',
  },
};

/* ── 5 stages with real photos and links ── */
const STAGES = [
  {
    num: 1,
    title: 'Eligibility & Barrier Removal',
    image: '/images/heroes-hq/funding-hero.jpg',
    href: '/how-it-works',
    what: 'You register at Indiana Career Connect, schedule a WorkOne appointment, and meet with a case manager. They review your situation — income, employment history, barriers — and determine which funding you qualify for.',
    who: 'Anyone in Indiana looking for career training. Priority for unemployed, underemployed, veterans, justice-impacted individuals, and youth ages 16–24.',
    funding: 'WIOA (Workforce Innovation and Opportunity Act), WRG (Workforce Ready Grant), JRI (Justice Reinvestment Initiative). Eligibility is determined through WorkOne. Qualifying participants pay nothing.',
    timeline: '1–2 weeks from first contact to enrollment.',
  },
  {
    num: 2,
    title: 'Cohort Training',
    image: '/images/programs-hq/training-classroom.jpg',
    href: '/pathways/training-model',
    what: 'You join a training cohort — a group of students who start and finish together. Training combines classroom instruction, hands-on lab work, and online coursework. Trades students work with real tools and equipment. Healthcare students do clinical rotations. CDL students get 160+ hours behind the wheel.',
    who: 'Enrolled participants who have completed eligibility screening and funding confirmation.',
    funding: 'Tuition covered by your funding source. Materials, tools, uniforms, and certification exam fees are typically included.',
    timeline: '4–16 weeks depending on your program. Barber apprenticeship runs approximately 18 months.',
  },
  {
    num: 3,
    title: 'Industry Credential',
    image: '/images/heroes-hq/success-hero.jpg',
    href: '/credentials',
    what: 'At the end of training, you sit for a certification exam issued by a recognized third-party organization — not by Elevate. You earn a credential that employers across the country recognize and require for hiring.',
    who: 'Students who have completed their training program and met all requirements.',
    funding: 'Exam fees are typically covered by your funding source or included in program tuition.',
    timeline: 'Exam day is scheduled at the end of your program. Results are usually available within days.',
  },
  {
    num: 4,
    title: 'Apprenticeship & Job Placement',
    image: '/images/heroes-hq/employer-hero.jpg',
    href: '/career-services/job-placement',
    what: 'Our career services team helps you build your resume, practice interviews, and connects you directly with employers who are hiring. For apprenticeship tracks (barber, building trades), you are placed with a host employer and earn wages while completing on-the-job training hours.',
    who: 'Graduates who have earned their credential. Apprentices who are completing on-the-job training hours.',
    funding: 'Career services are free. Apprentices are paid by their host employer during training.',
    timeline: 'Career services begin before you graduate. Many students have job offers before their last day of class.',
  },
  {
    num: 5,
    title: 'Advancement & Upskilling',
    image: '/images/heroes-hq/career-services-hero.jpg',
    href: '/career-services',
    what: 'After placement, you are not on your own. We track your employment at 6 months and 12 months. You keep access to the learning platform for continued education. Many graduates come back to stack additional credentials — for example, CNA to Medical Assistant to LPN to RN.',
    who: 'All program graduates. Ongoing support is included at no additional cost.',
    funding: 'Additional credentials may qualify for new rounds of WIOA or employer-sponsored funding.',
    timeline: 'Ongoing. There is no expiration on career services support.',
  },
];

/* ── Individual programs with real data from program pages ── */
const PROGRAMS = [
  {
    name: 'CNA Certification',
    image: '/images/programs-hq/cna-training.jpg',
    href: '/programs/cna-certification',
    duration: '4–6 weeks',
    credential: 'Certified Nursing Assistant (CNA)',
    issuer: 'Indiana State Dept. of Health',
    salary: '$30K–$42K/year',
    jobs: 'Hospitals, nursing homes, home health, assisted living, rehab centers',
    funding: 'No cost for eligible WIOA participants',
    desc: 'Classroom instruction and clinical rotation at a healthcare facility. You learn patient care, vital signs, infection control, mobility techniques, and medical documentation. You take the Indiana state CNA exam at the end.',
  },
  {
    name: 'CDL Commercial Driving',
    image: '/images/programs-hq/cdl-trucking.jpg',
    href: '/programs/cdl',
    duration: '4–6 weeks (160+ hours)',
    credential: 'CDL Class A or Class B',
    issuer: 'Indiana Bureau of Motor Vehicles',
    salary: '$50K+ first year (OTR)',
    jobs: 'Schneider National, Werner, Swift, J.B. Hunt, FedEx Freight, UPS Freight, XPO Logistics',
    funding: 'No cost for eligible WIOA participants (includes DOT physical, drug screen, permit fees, BMV test)',
    desc: 'Classroom instruction plus behind-the-wheel training on automatic and manual transmission trucks. You learn pre-trip inspections, backing maneuvers, road driving, and BMV test prep. Many employers offer $5K–$15K sign-on bonuses.',
  },
  {
    name: 'Barber Apprenticeship',
    image: '/images/programs-hq/barber-training.jpg',
    href: '/programs/barber-apprenticeship',
    duration: '~18 months (1,500 hours)',
    credential: 'Indiana Barber License',
    issuer: 'Indiana Professional Licensing Agency + USDOL',
    salary: '$30K–$60K+ (shop owners earn more)',
    jobs: 'Licensed barber, shop employee, shop owner, instructor',
    funding: 'Earn while you learn — apprentices are paid during training',
    desc: 'DOL Registered Apprenticeship. You train at a real barbershop under a licensed instructor. You learn fades, tapers, lineups, shaving, beard grooming, sanitation, client consultation, and business management. Elevate coordinates apprenticeship registration and compliance paperwork.',
  },
  {
    name: 'Building Technician with HVAC Fundamentals',
    image: '/images/programs-hq/hvac-technician.jpg',
    href: '/programs/hvac-technician',
    duration: '12–16 weeks',
    credential: 'EPA 608 + OSHA 30',
    issuer: 'EPA + OSHA',
    salary: '$48K average starting ($60K–$80K+ experienced)',
    jobs: 'HVAC contractors, property management, commercial maintenance — 50+ employer partners',
    funding: 'No cost for eligible WIOA participants (includes tools, materials, certifications)',
    desc: 'You learn heating, ventilation, air conditioning, and refrigeration. Hands-on lab work with real equipment. Flexible morning, afternoon, and evening classes. All tools and safety gear provided. Graduates receive a starter tool kit.',
  },
  {
    name: 'Electrical',
    image: '/images/programs-hq/electrical.jpg',
    href: '/programs/electrical',
    duration: '12–16 weeks',
    credential: 'OSHA 10 + NCCER Electrical Level 1',
    issuer: 'OSHA + NCCER',
    salary: '$56K average starting ($55K–$75K journeyman, $100K+ master)',
    jobs: 'Electrical contractors, construction companies, property management, self-employment',
    funding: 'No cost for eligible WIOA participants',
    desc: 'Electrical theory, National Electrical Code, residential and commercial wiring, conduit bending, troubleshooting, and safety. No prior experience needed. This program prepares you to start a 4-year electrical apprenticeship leading to journeyman licensure.',
  },
  {
    name: 'Welding',
    image: '/images/programs-hq/welding.jpg',
    href: '/programs/welding',
    duration: '12–16 weeks (400+ hours hands-on)',
    credential: 'AWS Welding Certifications + OSHA 10',
    issuer: 'American Welding Society + OSHA',
    salary: '$54K average starting ($80K–$150K+ specialized)',
    jobs: 'Manufacturing, fabrication shops, construction, aerospace, energy, shipbuilding',
    funding: 'No cost for eligible WIOA participants (all safety equipment provided)',
    desc: 'You master four welding processes: Stick (SMAW), MIG (GMAW), TIG (GTAW), and Flux-Core (FCAW). Plus oxy-fuel cutting, plasma cutting, blueprint reading, welding symbols, and metallurgy. Day and evening classes available.',
  },
  {
    name: 'IT Support',
    image: '/images/programs-hq/it-support.jpg',
    href: '/programs/it-help-desk',
    duration: '8–12 weeks',
    credential: 'IT Specialist — Device Configuration & Management',
    issuer: 'Certiport',
    salary: '$35K–$60K (remote work available)',
    jobs: 'Help desk, desktop support, IT support specialist, field technician',
    funding: 'No cost for eligible WIOA/JRI participants',
    desc: 'Hardware and software troubleshooting, network configuration, Windows/Linux/macOS, and cloud computing basics. Includes Certiport IT Specialist exam prep and practice tests.',
  },
  {
    name: 'Cybersecurity',
    image: '/images/programs-hq/cybersecurity.jpg',
    href: '/programs/cybersecurity-analyst',
    duration: '12–16 weeks',
    credential: 'IT Specialist — Cybersecurity',
    issuer: 'Certiport',
    salary: '$55K–$85K entry ($100K+ penetration testing)',
    jobs: 'Security analyst, SOC analyst, penetration tester, security engineer',
    funding: 'No cost for eligible WIOA/JRI participants',
    desc: 'Network security, threat analysis, vulnerability assessment, incident response, cryptography, and compliance frameworks. Includes Certiport IT Specialist — Cybersecurity exam prep.',
  },
];

export default function PathwaysPage() {
  return (
    <div className="bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Pathways' }]} />
        </div>
      </div>

      {/* ── Visual Hero (no text overlay) ── */}
      <section className="relative h-[300px] sm:h-[400px]">
        <Image
          src="/images/heroes-hq/programs-hero.jpg"
          alt="Workforce training students in a classroom and lab setting"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </section>

      {/* ── Who We Are / What This Is ── */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Career Pathways &amp; Workforce Infrastructure
          </h1>
          <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
            <p>
              Elevate for Humanity Career &amp; Technical Institute is a centralized apprenticeship sponsor and workforce training provider based in Indianapolis, Indiana, operating under 2Exclusive LLC-S.
              The institute coordinates related technical instruction, apprenticeship sponsorship, and licensed employer training sites under a unified governance structure.
            </p>
            <p>
              Programs follow a five-stage pathway: eligibility screening, cohort-based training, industry
              credentialing, apprenticeship or job placement, and ongoing advancement support. Whether you are training to become a CNA, a
              CDL driver, a licensed barber, an HVAC technician, or a cybersecurity analyst — the
              pathway structure is the same.
            </p>
            <p>
              Many of our programs are available at no cost to eligible participants through
              WIOA (Workforce Innovation and Opportunity Act) funding administered by Indiana&apos;s
              Department of Workforce Development. Eligibility is determined through WorkOne
              career centers. For those who qualify, tuition, materials, certification exams,
              and career services may be covered.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/apply" className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-7 py-3.5 rounded-lg font-bold transition inline-flex items-center">
              Check Your Eligibility <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/how-it-works" className="bg-white hover:bg-gray-50 text-brand-blue-700 border-2 border-brand-blue-200 px-7 py-3.5 rounded-lg font-bold transition">
              See How It Works Step by Step
            </Link>
          </div>
        </div>
      </section>

      {/* ── The 5 Stages (photo + deep description each) ── */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">How the Pathway Works</h2>
          <p className="text-gray-600 mb-10 max-w-3xl">
            Every participant moves through these five stages in order. You do not skip stages.
            Each stage has a clear purpose, a defined timeline, and a specific outcome.
          </p>

          <div className="space-y-10">
            {STAGES.map((s) => (
              <div key={s.num} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="relative h-64 lg:h-auto lg:w-96 flex-shrink-0">
                    <Image src={s.image} alt={s.title} fill sizes="(max-width: 1024px) 100vw, 384px" className="object-cover" />
                    <div className="absolute top-4 left-4 w-10 h-10 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {s.num}
                    </div>
                  </div>
                  <div className="p-6 lg:p-8 flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Stage {s.num}: {s.title}</h3>
                    <div className="space-y-4 text-sm text-gray-700">
                      <div>
                        <span className="font-bold text-gray-900 block mb-1">What happens:</span>
                        {s.what}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block mb-1">Who this is for:</span>
                        {s.who}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block mb-1">Funding:</span>
                        {s.funding}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 block mb-1">Timeline:</span>
                        {s.timeline}
                      </div>
                    </div>
                    <Link href={s.href} className="mt-4 text-brand-blue-600 font-semibold text-sm inline-flex items-center hover:text-brand-blue-700">
                      Learn more about this stage <ArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Every Program (individual cards with full detail) ── */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Training Programs</h2>
          <p className="text-gray-600 mb-10 max-w-3xl">
            Each program follows the 5-stage pathway above. Click any program to see the full
            curriculum, schedule, and enrollment details.
          </p>

          <div className="space-y-8">
            {PROGRAMS.map((p) => (
              <div key={p.name} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
                <div className="flex flex-col lg:flex-row">
                  <div className="relative h-56 lg:h-auto lg:w-80 flex-shrink-0">
                    <Image src={p.image} alt={`${p.name} training`} fill sizes="(max-width: 1024px) 100vw, 320px" className="object-cover" />
                  </div>
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                      <span className="text-sm bg-brand-green-50 text-brand-green-700 px-3 py-1 rounded-full font-semibold whitespace-nowrap ml-3">{p.funding}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">{p.desc}</p>

                    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
                      <div><span className="font-bold text-gray-900">Duration:</span> <span className="text-gray-600">{p.duration}</span></div>
                      <div><span className="font-bold text-gray-900">Credential:</span> <span className="text-gray-600">{p.credential}</span></div>
                      <div><span className="font-bold text-gray-900">Issued by:</span> <span className="text-gray-600">{p.issuer}</span></div>
                      <div><span className="font-bold text-gray-900">Salary range:</span> <span className="text-gray-600">{p.salary}</span></div>
                      <div className="sm:col-span-2"><span className="font-bold text-gray-900">Who hires you:</span> <span className="text-gray-600">{p.jobs}</span></div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link href={p.href} className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition inline-flex items-center">
                        Full Program Details <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                      <Link href="/apply" className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition">
                        Apply Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How Programs Are Delivered ── */}
      <section className="py-10 bg-slate-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How Programs Are Delivered</h2>
          <div className="text-sm text-gray-700 space-y-3">
            <p>
              Elevate for Humanity operates as a Hybrid Workforce Training Provider and
              Registered Apprenticeship Sponsor. Training is delivered through licensed credential
              partners and approved program holders under centralized institutional oversight,
              with employer partners providing structured on-the-job training. Elevate manages enrollment, funding
              navigation, progress tracking, and career services.
            </p>
            <p>
              In all cases, credentials are issued by recognized third-party authorities (Indiana
              ISDH, Indiana BMV, EPA, OSHA, Certiport, AWS, NCCER, Indiana PLA) — not by Elevate.
              Elevate prepares participants for certification exams. The credential itself comes
              from the issuing authority.
            </p>
            <p>
              Apprenticeship programs (Barber, Building Technician) are DOL Registered
              Apprenticeships with Elevate as the registered sponsor. Apprentices train at
              approved host employer sites under licensed instructors.
            </p>
          </div>
          <Link href="/pathways/training-model" className="mt-3 text-brand-blue-600 font-semibold text-sm inline-flex items-center hover:text-brand-blue-700">
            See full training delivery model <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Who Is This For ── */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Who Is This For?</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: 'Career changers', desc: 'You are working a job that does not pay enough or does not have a future. You want a credential that leads to a real career with benefits and growth.' },
              { title: 'Unemployed or underemployed', desc: 'You are out of work or working part-time. You may qualify for WIOA funding that covers 100% of your training, including materials and certification exams.' },
              { title: 'Justice-impacted individuals', desc: 'You have a record and need a fresh start. JRI (Justice Reinvestment Initiative) funding may cover your training. Many of our employer partners hire regardless of background.' },
              { title: 'Young adults (16–24)', desc: 'You are not sure what to do after high school. WIOA Youth funding can cover career training that leads to a credential and a job in weeks, not years.' },
              { title: 'Veterans', desc: 'You have skills from military service. Our programs help you translate those skills into civilian credentials that employers recognize.' },
              { title: 'Employers and workforce partners', desc: 'You need trained, credentialed workers. We run custom training cohorts for your hiring needs and handle all the funding paperwork.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What Makes This Different ── */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What Makes This Different</h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex gap-4 items-start">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <Image src="/images/heroes-hq/funding-hero.jpg" alt="Funding navigation" fill sizes="80px" className="object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">We navigate funding for you</h3>
                <p className="text-sm">Most people do not know they qualify for free training. We walk you through federal and state workforce funding eligibility and handle the paperwork with your local WorkOne career center.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <Image src="/images/heroes-hq/success-hero.jpg" alt="Credentials" fill sizes="80px" className="object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Your credential is issued by a recognized authority — not by us</h3>
                <p className="text-sm">CNA from Indiana ISDH. CDL from Indiana BMV. EPA 608 from the EPA. IT Specialist from Certiport. Barber license from Indiana PLA. These credentials are recognized nationwide.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <Image src="/images/heroes-hq/employer-hero.jpg" alt="Employer connections" fill sizes="80px" className="object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">We connect you to employers who are actually hiring</h3>
                <p className="text-sm">Not job boards. Direct introductions to hiring managers at companies like Schneider National, FedEx Freight, local HVAC contractors, hospitals, and barbershops across Central Indiana.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <Image src="/images/heroes-hq/career-services-hero.jpg" alt="Ongoing support" fill sizes="80px" className="object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Support does not end when you graduate</h3>
                <p className="text-sm">We track your employment at 6 and 12 months. You keep access to the learning platform. Career services — resume help, interview coaching, job leads — are available as long as you need them.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Explore More ── */}
      <section className="py-10 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore the Pathway System</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/pathways/outcomes" className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition">
              <h3 className="font-bold text-gray-900 mb-1">Outcomes &amp; Metrics</h3>
              <p className="text-sm text-gray-600">What each credential means, what jobs pay, and how we measure success.</p>
            </Link>
            <Link href="/pathways/partners" className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition">
              <h3 className="font-bold text-gray-900 mb-1">Partners &amp; Cohorts</h3>
              <p className="text-sm text-gray-600">How workforce boards, employers, and community organizations work with us.</p>
            </Link>
            <Link href="/pathways/training-model" className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition">
              <h3 className="font-bold text-gray-900 mb-1">Training Delivery</h3>
              <p className="text-sm text-gray-600">What a student day looks like, how classes work, and how we track progress.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 bg-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-lg text-brand-blue-100 mb-8 max-w-2xl mx-auto">
            The first step is checking your eligibility. It takes about 5 minutes online.
            If you qualify for funding, your entire training can be free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply" className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition">
              Check Eligibility &amp; Apply
            </Link>
            <Link href="/contact" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-bold transition border-2 border-white/30">
              Talk to Someone First
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
