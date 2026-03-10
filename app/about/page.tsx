import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { TEAM } from '@/data/team';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'About Us | Elevate for Humanity',
  description: 'Elevate for Humanity is a workforce development institute in Indianapolis providing funded career training in healthcare, trades, CDL, technology, and barbering. Founded by Elizabeth Greene.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'About Elevate for Humanity',
    description: 'A workforce development institute providing funded career training in Indianapolis, Indiana. Founded by Elizabeth Greene.',
    url: `${SITE_URL}/about`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/pages/about-hero.jpg', width: 1200, height: 630, alt: 'About Elevate for Humanity' }],
    type: 'website',
  },
};

export default function AboutPage() {
  const founder = TEAM[0];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'About Us' }]} />
        </div>
      </div>

      {/* Video hero */}
      <section className="relative h-[60vh] sm:h-[70vh] md:h-[78vh] min-h-[380px] overflow-hidden bg-slate-900">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          poster="/images/team/elizabeth-greene.jpg"
        >
          <source src="/videos/about-mission.mp4" type="video/mp4" />
        </video>

        {/* Founder identity — shows while video loads and on the poster frame */}
        <div className="absolute bottom-8 left-6 sm:left-10">
          <p className="text-brand-red-400 font-bold text-xs uppercase tracking-widest mb-1">Founder & CEO</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">Elizabeth Greene</h1>
          <p className="text-slate-300 text-sm mt-1">Elevate for Humanity · Indianapolis, Indiana</p>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <Image src="/logo.png" alt="Elevate for Humanity" width={64} height={64} />
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Elevate for Humanity</h1>
          </div>
          <div className="text-gray-700 space-y-4">
            <p>
              Elevate for Humanity is a workforce development institute based in
              Indianapolis, Indiana. We provide funded career training to people who need it most —
              justice-involved individuals, low-income families, veterans, dislocated workers,
              individuals with disabilities, and anyone facing barriers to employment.
            </p>
            <p>
              We are operated by 2Exclusive LLC-S in partnership with Rise Forward Foundation.
              Founded in 2019 by Elizabeth Greene, we have grown from a single training program
              into a structured career pathway system covering healthcare, skilled trades, CDL
              trucking, technology, and barbering.
            </p>
            <p>
              Many of our programs are available at no cost to eligible participants through
              WIOA (Workforce Innovation and Opportunity Act), the Workforce Ready Grant, and
              JRI (Justice Reinvestment Initiative) funding. Eligibility is determined through
              Indiana WorkOne career centers. We assist with the screening and paperwork —
              participants focus on training.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/pathways" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-6 py-3 rounded-lg font-bold transition inline-flex items-center">
              See Our Career Pathways <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link href="/apply" className="bg-white hover:bg-gray-50 text-brand-red-600 border-2 border-brand-red-200 px-6 py-3 rounded-lg font-bold transition">
              Check Eligibility &amp; Apply
            </Link>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-12 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-lg text-brand-red-100 leading-relaxed max-w-3xl mx-auto">
            To create pathways out of poverty and into prosperity by connecting justice-involved
            individuals, low-income families, veterans, individuals with disabilities, and anyone
            facing barriers to employment with high-quality, funded career training, individualized
            employment support, and direct employer placement.
          </p>
          <div className="mt-6">
            <Link href="/about/mission" className="inline-flex items-center text-white/80 hover:text-white text-sm font-semibold underline underline-offset-4">
              Full mission statement &amp; values <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* What We Actually Do — with images */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">What We Do</h2>

          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative h-48 sm:h-auto sm:w-56 flex-shrink-0 rounded-lg overflow-hidden">
                <Image src="/images/pages/training-cohort.jpg" alt="Career training programs" fill sizes="(max-width: 640px) 100vw, 224px" quality={90} className="object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Career Training Programs</h3>
                <p className="text-sm text-gray-700 mb-2">
                  We run certification programs in healthcare (CNA, Medical Assistant, Phlebotomy),
                  skilled trades (HVAC, Electrical, Welding, Plumbing), CDL trucking (Class A and B),
                  IT and cybersecurity (Certiport IT Specialist, Cisco CCST), barbering (DOL Registered Apprenticeship),
                  and CPR/First Aid. Most programs run 4 to 16 weeks and include hands-on training,
                  certification exam preparation, and job placement assistance.
                </p>
                <Link href="/programs" className="text-brand-red-600 font-semibold text-sm inline-flex items-center hover:text-brand-red-700">
                  Browse All Programs <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative h-48 sm:h-auto sm:w-56 flex-shrink-0 rounded-lg overflow-hidden">
                <Image src="/images/pages/about-funding-nav.jpg" alt="Workforce funding options" fill sizes="(max-width: 640px) 100vw, 224px" quality={90} className="object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Funding Navigation</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Most people do not know they may qualify for funded training. We walk every participant
                  through the eligibility process for WIOA (covers tuition, books, supplies, and
                  sometimes transportation and childcare), the Workforce Ready Grant (covers
                  high-demand certifications regardless of income), and JRI (covers training for
                  justice-involved individuals). We handle the paperwork with WorkOne and DWD.
                </p>
                <Link href="/funding" className="text-brand-red-600 font-semibold text-sm inline-flex items-center hover:text-brand-red-700">
                  See Funding Options <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative h-48 sm:h-auto sm:w-56 flex-shrink-0 rounded-lg overflow-hidden">
                <Image src="/images/pages/about-employer-partners.jpg" alt="Employer partnerships" fill sizes="(max-width: 640px) 100vw, 224px" quality={90} className="object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Job Placement &amp; Employer Partnerships</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Our career services team helps every graduate with resume building, interview
                  preparation, and direct introductions to employers who are hiring. We partner
                  with HVAC contractors, hospitals, trucking companies, barbershops, IT firms, and
                  construction companies across Central Indiana. We track employment outcomes at
                  6 and 12 months after graduation.
                </p>
                <Link href="/career-services/job-placement" className="text-brand-red-600 font-semibold text-sm inline-flex items-center hover:text-brand-red-700">
                  Career Services &amp; Placement <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative h-48 sm:h-auto sm:w-56 flex-shrink-0 rounded-lg overflow-hidden">
                <Image src="/images/pages/about-supportive-services.jpg" alt="Supportive services" fill sizes="(max-width: 640px) 100vw, 224px" quality={90} className="object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Supportive Services</h3>
                <p className="text-sm text-gray-700">
                  Training alone is not enough if someone cannot get to class or keep the lights on.
                  We provide career counseling, mental health support (through our board-certified
                  Psychiatric Mental Health Nurse Practitioner), housing assistance, transportation
                  help, and connections to community resources. Our goal is to remove every barrier
                  between a participant and a stable career.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Training Delivery Model */}
      <section className="py-10 bg-slate-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Training Delivery Model</h2>
          <p className="text-sm text-gray-600 mb-4">
            Elevate for Humanity is a hybrid workforce training hub and DOL Registered Apprenticeship
            Sponsor (RAPIDS: 2025-IN-132301). We coordinate employer-based hands-on instruction with
            online didactic learning — not a traditional campus model.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-slate-900 text-sm mb-2">Didactic Instruction</h3>
              <p className="text-xs text-gray-600">Delivered online via the Elevate LMS platform. Curriculum, assessments, and progress tracking are managed digitally.</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-slate-900 text-sm mb-2">Hands-On / OJT Training</h3>
              <p className="text-xs text-gray-600">Conducted at approved employer partner sites, licensed shops, clinical facilities, and OJT placements. Training sites vary by program.</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-slate-900 text-sm mb-2">Support Services</h3>
              <p className="text-xs text-gray-600">Career counseling, case management, and advising available virtually and in-person by appointment.</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-slate-900 text-sm mb-2">Administrative Office</h3>
              <p className="text-xs text-gray-600">8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240. Administrative and enrollment support — not an instructional facility.</p>
            </div>
          </div>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>Training sites by program:</strong> Barber and cosmetology apprentices train at
              licensed partner barbershops. Healthcare students complete clinicals at partner medical
              facilities. CDL students train at partner driving schools. Skilled trades apprentices
              work at employer worksites. IT and business programs are delivered online with instructor oversight and scheduled progress reviews.
            </p>
            <p>
              All credentials are issued by recognized third-party authorities (Indiana PLA, ISDH,
              BMV, EPA, OSHA, Certiport, AWS, NCCER) — not by Elevate. Apprenticeship programs are
              DOL Registered Apprenticeships with Elevate as the registered sponsor.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Link href="/partners/training-sites" className="text-brand-red-600 font-semibold text-sm inline-flex items-center hover:text-brand-red-700">
              Employer partners &amp; training sites <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
            <Link href="/disclosures/training-delivery" className="text-brand-red-600 font-semibold text-sm inline-flex items-center hover:text-brand-red-700">
              Full training delivery disclosure <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
            <Link href="/accreditation" className="text-brand-red-600 font-semibold text-sm inline-flex items-center hover:text-brand-red-700">
              Approvals and credentials <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Institutional Governance */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Centralized Workforce Development &amp; Apprenticeship Sponsor</h2>
          <p className="text-sm text-gray-700 mb-4">
            Elevate for Humanity Career &amp; Technical Institute, a program of 2Exclusive LLC-S, operates as a centralized workforce development and Registered Apprenticeship sponsor organization. The institute provides related technical instruction (RTI), apprenticeship sponsorship, workforce-funded career pathway enrollment, and coordination with licensed employer training sites under a unified governance and compliance structure.
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Apprentices receive structured instruction through the institute while completing supervised on-the-job training at sponsor-approved licensed partner locations in accordance with state and federal apprenticeship standards.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-slate-900 text-sm mb-2">Related Technical Instruction</h3>
              <p className="text-xs text-gray-600">Delivered by the institute through structured curriculum and learning systems.</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-slate-900 text-sm mb-2">On-the-Job Training</h3>
              <p className="text-xs text-gray-600">Delivered at licensed employer partner locations operating under formal training agreements.</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-slate-900 text-sm mb-2">Oversight &amp; Compliance</h3>
              <p className="text-xs text-gray-600">Managed by the Sponsor including standards, hour tracking, apprentice registration, and regulatory reporting.</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/governance" className="text-brand-red-600 font-semibold text-sm inline-flex items-center hover:text-brand-red-700">
              View Governance &amp; Program Structure <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Who We Serve — with images */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Who We Serve</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Justice-Involved Individuals',
                image: '/images/pages/funding-page-2.jpg',
                desc: 'People on probation, parole, or recently released. JRI funding covers training, supplies, and supportive services at no cost. We work directly with community corrections and reentry programs across Central Indiana.',
              },
              {
                title: 'Low-Income Adults & Dislocated Workers',
                image: '/images/pages/wioa-meeting.jpg',
                desc: 'Indiana residents who meet WIOA income guidelines or receive public assistance (SNAP, TANF, Medicaid). WIOA funding covers tuition, books, supplies, and in some cases transportation and childcare.',
              },
              {
                title: 'Veterans',
                image: '/images/pages/career-counseling.jpg',
                desc: 'Military veterans transitioning to civilian careers. Veterans receive priority enrollment and may qualify for additional funding through VA education benefits combined with WIOA.',
              },
              {
                title: 'Young Adults (16–24)',
                image: '/images/pages/career-services-page-2.jpg',
                desc: 'Young people who are not sure what to do after high school. WIOA Youth funding covers career training that leads to a credential and a job in weeks, not years.',
              },
              {
                title: 'Career Changers',
                image: '/images/pages/workforce-training.jpg',
                desc: 'Anyone looking to enter a new field. The Workforce Ready Grant covers high-demand certification programs for Indiana residents regardless of income level.',
              },
              {
                title: 'Employers & Workforce Partners',
                image: '/images/pages/for-employers-page-1.jpg',
                desc: 'Organizations that need trained, credentialed workers. We run custom training cohorts for your hiring needs and handle all the funding paperwork.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="relative h-40 overflow-hidden">
                  <Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 100vw, 50vw" quality={90} className="object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-6 py-3 rounded-lg font-bold transition inline-flex items-center">
              Check Your Eligibility <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Our Credentials */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 text-center">Our Credentials</h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            These are the government agencies and workforce organizations that have approved,
            registered, or partnered with Elevate for Humanity.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { logo: '/images/partners/usdol.webp', name: 'U.S. Department of Labor', role: 'Registered Apprenticeship Sponsor', desc: 'Our barber apprenticeship program is registered with USDOL and tracked in the RAPIDS system.' },
              { logo: '/images/partners/dwd.webp', name: 'Indiana DWD', role: 'Listed Training Provider', desc: 'Listed on the Eligible Training Provider List (ETPL). Eligible students may use WIOA and Workforce Ready Grant funding.' },
              { logo: '/images/partners/workone.webp', name: 'WorkOne', role: 'Workforce Partner', desc: 'We work with WorkOne career centers across Central Indiana for participant referrals and eligibility screening.' },
              { logo: '/images/partners/nextleveljobs.webp', name: 'Next Level Jobs', role: 'Workforce Ready Grant Provider', desc: 'Our high-demand certification programs qualify for the Workforce Ready Grant through Next Level Jobs.' },
            ].map((cred) => (
              <div key={cred.name} className="bg-slate-50 rounded-lg border border-gray-200 p-5 text-center">
                <div className="relative w-16 h-16 mx-auto mb-3 overflow-hidden">
                  <Image src={cred.logo} alt={cred.name} fill sizes="64px" className="object-contain" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{cred.name}</h3>
                <p className="text-brand-red-600 text-xs font-semibold mb-2">{cred.role}</p>
                <p className="text-xs text-gray-600">{cred.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {[
              { name: 'WIOA', role: 'Eligible Training Provider', desc: 'Programs approved for WIOA Adult, Dislocated Worker, and Youth funding.' },
              { name: 'JRI', role: 'Approved Provider', desc: 'Approved for Justice Reinvestment Initiative funding for justice-involved participants.' },
              { name: 'EmployIndy', role: 'Workforce Partner', desc: 'Partner with EmployIndy for workforce development in Marion County.' },
              { name: 'Indiana State Board', role: 'Cosmetology & Barber Examiners', desc: 'Barber apprenticeship aligned with Indiana State Board licensing requirements.' },
            ].map((cred) => (
              <div key={cred.name} className="bg-slate-50 rounded-lg border border-gray-200 p-5 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                  <span className="text-slate-700 font-bold text-xs">{cred.name}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{cred.name}</h3>
                <p className="text-brand-red-600 text-xs font-semibold mb-2">{cred.role}</p>
                <p className="text-xs text-gray-600">{cred.desc}</p>
              </div>
            ))}
          </div>

          {/* Verification Links */}
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-bold text-slate-900 text-sm mb-3 uppercase tracking-wider">Verify Our Credentials</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <a href="https://intraining.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-800 hover:underline">
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                INTraining — ETPL Provider Lookup (search &quot;2Exclusive&quot;)
              </a>
              <a href="https://www.apprenticeship.gov/partner-finder" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-800 hover:underline">
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                Apprenticeship.gov — Registered Sponsor Finder
              </a>
              <a href="https://www.in.gov/dwd/job-seekers/training-opportunities/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-800 hover:underline">
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                Indiana DWD — Training Opportunities
              </a>
              <Link href="/cert/verify" className="flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-800 hover:underline">
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                Verify a Student Certificate
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Our Founder</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="relative w-full sm:w-72 flex-shrink-0 overflow-hidden" style={{ aspectRatio: '3/4' }}>
                <Image
                  src="/images/team/elizabeth-greene-headshot.jpg"
                  alt="Elizabeth Greene, Founder & CEO of Elevate for Humanity"
                  fill
                  sizes="(max-width: 640px) 100vw, 288px"
                  quality={95}
                  className="object-cover object-center"
                />
              </div>
              <div className="p-6 flex-1">
                <h3 className="text-xl font-bold text-slate-900">{founder.name}</h3>
                <p className="text-brand-red-600 font-semibold text-sm mb-4">{founder.title}</p>
                <p className="text-sm text-gray-700 mb-4">{founder.bio}</p>
                <p className="text-sm text-gray-700 mb-4">
                  Elizabeth is a U.S. military veteran, IRS Enrolled Agent (EA) with an EFIN 
                  and PTIN, and EPA 608 Certified Proctor through Mainstream Engineering. She 
                  is authorized to represent taxpayers before the IRS and to proctor EPA Section 
                  608 refrigerant handling exams. She also operates SupersonicFastCash, a tax 
                  preparation software company.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/about/team" className="text-brand-red-600 font-semibold text-sm inline-flex items-center hover:text-brand-red-700">
                    Meet the Full Team <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                  {founder.email && (
                    <a href={`mailto:${founder.email}`} className="text-gray-500 text-sm hover:text-gray-700">
                      {founder.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Our Team</h2>
            <p className="text-gray-600">
              The people behind the mission — workforce professionals, healthcare specialists,
              financial experts, and community advocates.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {TEAM.filter((member) => member.id !== '1').map((member) => (
              <Link
                key={member.id}
                href={`/about/team#member-${member.id}`}
                className="group text-center"
              >
                <div className="relative w-full aspect-[3/4] max-w-[240px] mx-auto rounded-xl overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-shadow">
                  <Image
                    src={member.headshotSrc || '/images/pages/about-hero.jpg'}
                    alt={member.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    quality={90} className="object-cover object-center"
                  />
                </div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">{member.name}</h3>
                <p className="text-gray-500 text-xs sm:text-sm mt-1 leading-snug">{member.title}</p>
                <span className="inline-flex items-center gap-1 text-brand-red-600 text-sm font-semibold mt-2 group-hover:gap-2 transition-all">
                  View Bio <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Programs at a glance */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Programs at a Glance</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'CNA Certification', duration: '4–6 weeks', image: '/images/pages/about-hero.jpg', href: '/programs/cna' },
              { name: 'CDL Training', duration: '4–6 weeks', image: '/images/pages/about-hero.jpg', href: '/programs/cdl-training' },
              { name: 'Building Technician with HVAC Fundamentals', duration: '12–16 weeks', image: '/images/pages/about-hero.jpg', href: '/programs/hvac-technician' },
              { name: 'Electrical', duration: '12–16 weeks', image: '/images/pages/about-hero.jpg', href: '/programs/electrical' },
              { name: 'Barber Apprenticeship', duration: '~18 months', image: '/images/pages/about-hero.jpg', href: '/programs/barber-apprenticeship' },
              { name: 'IT & Cybersecurity', duration: '8–16 weeks', image: '/images/pages/about-hero.jpg', href: '/programs/technology' },
            ].map((p) => (
              <Link key={p.name} href={p.href} className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition">
                <div className="relative h-36 overflow-hidden">
                  <Image src={p.image} alt={p.name} fill sizes="(max-width: 640px) 100vw, 33vw" quality={90} className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                  <p className="text-xs text-gray-500">{p.duration}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/programs" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-6 py-3 rounded-lg font-bold transition inline-flex items-center">
              View All Programs <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* For Partners */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">For Organizations &amp; Partners</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <Link href="/pathways/partners" className="bg-slate-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition">
              <div className="relative h-40 overflow-hidden">
                <Image src="/images/pages/about-partner-cta.jpg" alt="Partner with Elevate" fill sizes="(max-width: 640px) 100vw, 33vw" quality={90} className="object-cover" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 mb-2">Partner With Us</h3>
                <p className="text-sm text-gray-600 mb-2">Workforce boards, community organizations, and employers — see how custom cohort training works.</p>
                <span className="text-brand-red-600 text-sm font-semibold inline-flex items-center">
                  Partnership Details <ArrowRight className="ml-1 w-4 h-4" />
                </span>
              </div>
            </Link>
            <Link href="/about/partners" className="bg-slate-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition">
              <div className="relative h-40 overflow-hidden">
                <Image src="/images/pages/about-employer-partners.jpg" alt="Employer and community partners" fill sizes="(max-width: 640px) 100vw, 33vw" quality={90} className="object-cover" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 mb-2">Our Partners</h3>
                <p className="text-sm text-gray-600 mb-2">Employers, workforce boards, and community organizations we work with across Central Indiana.</p>
                <span className="text-brand-red-600 text-sm font-semibold inline-flex items-center">
                  View Partners <ArrowRight className="ml-1 w-4 h-4" />
                </span>
              </div>
            </Link>
            <Link href="/pathways" className="bg-slate-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition">
              <div className="relative h-40 overflow-hidden">
                <Image src="/images/pages/job-placement.jpg" alt="Career pathways" fill sizes="(max-width: 640px) 100vw, 33vw" quality={90} className="object-cover" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 mb-2">Career Pathways Framework</h3>
                <p className="text-sm text-gray-600 mb-2">See our structured 5-stage pathway model: eligibility, training, credentialing, placement, and advancement.</p>
                <span className="text-brand-red-600 text-sm font-semibold inline-flex items-center">
                  View Pathways <ArrowRight className="ml-1 w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-brand-red-100 mb-8 max-w-2xl mx-auto">
            Check your eligibility in about 5 minutes. If you qualify for funding,
            your entire training can be free — tuition, materials, certifications, and career services.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply" className="bg-white text-brand-red-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-red-50 transition inline-flex items-center">
              Check Eligibility &amp; Apply <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/contact" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-bold text-lg transition border-2 border-white/30">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
