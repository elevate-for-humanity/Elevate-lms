import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Outcomes & What You Can Expect | Career Pathways | Elevate for Humanity',
  description: 'What each Elevate training program leads to: credentials, salaries, employers, day-to-day training, and funding coverage. Real data from real programs.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/pathways/outcomes' },
};

const PROGRAMS = [
  {
    name: 'CNA Certification',
    image: '/images/pages/comp-cta-training.jpg',
    href: '/programs/cna',
    credential: 'Certified Nursing Assistant (CNA)',
    issuedBy: 'Indiana State Department of Health (ISDH)',
    whatItMeans: 'A CNA credential means you are legally authorized to provide direct patient care in Indiana. Hospitals, nursing homes, home health agencies, and assisted living facilities require this certification to hire you. It is a state-regulated credential — not a certificate of completion from a school.',
    training: 'You attend classroom instruction covering patient care fundamentals, vital signs monitoring (blood pressure, pulse, temperature), infection control, patient mobility and transfer techniques, nutrition assistance, and medical documentation. You then complete a clinical rotation at a healthcare facility where you work with real patients under supervision.',
    duration: '4–6 weeks',
    examDay: 'At the end of training, you take the Indiana state CNA exam — a written test plus a hands-on skills demonstration. Results come back within days. Once you pass, your name goes on the Indiana Nurse Aide Registry.',
    whoHires: [
      { employer: 'Hospitals', pay: '$34K–$42K/year' },
      { employer: 'Nursing homes', pay: '$30K–$38K/year' },
      { employer: 'Home health agencies', pay: '$28K–$36K/year' },
      { employer: 'Assisted living facilities', pay: '$30K–$37K/year' },
      { employer: 'Rehabilitation centers', pay: '$32K–$40K/year' },
    ],
    funding: 'WIOA and JRI funding available for eligible Indiana residents. If approved, funding may cover tuition, materials, clinical placement, and exam fees. Eligibility is not guaranteed.',
    nextStep: 'Many CNAs advance to Medical Assistant, LPN, or RN. Each step increases your pay and scope of practice. Additional WIOA funding may be available for the next credential for eligible Indiana residents.',
  },
  {
    name: 'CDL Commercial Driving',
    image: '/images/pages/comp-cta-training.jpg',
    href: '/programs/cdl-training',
    credential: 'Commercial Driver License (CDL) Class A or Class B',
    issuedBy: 'Indiana Bureau of Motor Vehicles (BMV)',
    whatItMeans: 'A CDL is a federal and state license that authorizes you to operate commercial vehicles — tractor-trailers, buses, tankers, and heavy trucks. Class A covers the largest vehicles (semi-trucks). Class B covers straight trucks and buses. This is not a training certificate — it is a government-issued license.',
    training: 'You spend 160+ hours in classroom instruction and behind-the-wheel training. You learn pre-trip vehicle inspections, backing maneuvers (straight, offset, alley dock), road driving on highways and city streets, and BMV test preparation. You train on Freightliner, Peterbilt, and Kenworth trucks — the same equipment used by major carriers.',
    duration: '4–6 weeks',
    examDay: 'You take the Indiana BMV CDL skills test: pre-trip inspection, basic vehicle controls, and a road test. Once you pass, your CDL is printed on your Indiana driver license.',
    whoHires: [
      { employer: 'Schneider National', pay: '$50K–$65K first year' },
      { employer: 'Werner Enterprises', pay: '$50K–$60K first year' },
      { employer: 'J.B. Hunt', pay: '$55K–$70K first year' },
      { employer: 'FedEx Freight', pay: '$50K–$65K first year' },
      { employer: 'UPS Freight', pay: '$55K–$70K first year' },
      { employer: 'XPO Logistics', pay: '$48K–$60K first year' },
    ],
    funding: 'If you qualify for WIOA funding, everything is covered: tuition, DOT physical, drug screening, permit fees, and the BMV skills test fee. Many employers also offer $5,000–$15,000 sign-on bonuses.',
    nextStep: 'After your first year, you can add endorsements (Hazmat, Tanker, Doubles/Triples) to increase your earning potential. Experienced drivers earn $60K–$75K. Owner-operators and specialized haulers can earn $100K+.',
  },
  {
    name: 'Barber Apprenticeship',
    image: '/images/pages/comp-cta-training.jpg',
    href: '/programs/barber-apprenticeship',
    credential: 'Indiana Barber License',
    issuedBy: 'Indiana Professional Licensing Agency (PLA) through a U.S. Department of Labor Registered Apprenticeship',
    whatItMeans: 'An Indiana barber license means you are legally authorized to cut hair, shave, and provide grooming services for compensation in the state of Indiana. This is a state-regulated professional license — the same license held by every working barber in the state. It is earned through a DOL Registered Apprenticeship, which means it also carries federal recognition.',
    training: 'You train at a real barbershop under a licensed barber instructor. You learn haircutting techniques (fades, tapers, lineups), clipper and shear mastery, shaving and beard grooming, sanitation and safety (Indiana State Board standards), client consultation, customer service, and business management. Elevate coordinates apprenticeship registration, compliance paperwork, classroom instruction, and completion documentation.',
    duration: 'Approximately 18 months (1,500 on-the-job training hours plus required classroom instruction)',
    examDay: 'After completing all required hours and coursework, you sit for the Indiana State Board barber exam. Elevate provides exam prep materials and practice tests. Once you pass, you receive your Indiana barber license.',
    whoHires: [
      { employer: 'Barbershops (employee)', pay: '$30K–$45K/year' },
      { employer: 'Barbershops (booth rental)', pay: '$40K–$60K+/year' },
      { employer: 'Shop ownership', pay: '$60K–$100K+/year' },
    ],
    funding: 'Apprentices are paid by their host barbershop during training — you earn while you learn. Elevate coordinates funding through state grants and employer sponsorship. There is no tuition cost to the apprentice.',
    nextStep: 'After licensure, many barbers open their own shops. Others pursue cosmetology cross-licensing, instructor certification, or build a client base at an established shop.',
  },
  {
    name: 'Building Technician with HVAC Fundamentals',
    image: '/images/pages/comp-cta-training.jpg',
    href: '/programs/hvac-technician',
    credential: 'EPA Section 608 Certification + OSHA 30-Hour Safety Certification',
    issuedBy: 'U.S. Environmental Protection Agency (EPA) + Occupational Safety and Health Administration (OSHA)',
    whatItMeans: 'EPA 608 certification is required by federal law to handle refrigerants — you cannot legally work on air conditioning or refrigeration systems without it. OSHA 30 is a workplace safety credential required by most construction and maintenance employers. Together, these credentials make you immediately employable as an HVAC technician.',
    training: 'You learn heating, ventilation, air conditioning, and refrigeration systems. Training includes hands-on lab work with real HVAC equipment — installing, diagnosing, and repairing systems. You also learn safety protocols, OSHA standards, tool operation, blueprint reading, code compliance, and customer service. All tools, safety gear, and uniforms are provided. Graduates receive a starter tool kit. Flexible morning, afternoon, and evening classes are available.',
    duration: '12–16 weeks',
    examDay: 'You take the EPA 608 exam (Universal certification covering all refrigerant types) and the OSHA 30-hour safety exam. Both are administered during the program.',
    whoHires: [
      { employer: 'HVAC contractors (50+ local partners)', pay: '$18–$22/hr starting' },
      { employer: 'Property management companies', pay: '$17–$21/hr starting' },
      { employer: 'Commercial maintenance firms', pay: '$19–$24/hr starting' },
      { employer: 'Self-employment (after experience)', pay: '$60K–$80K+/year' },
    ],
    funding: 'WIOA funding available for eligible Indiana residents. If approved, may cover tuition, tools, materials, certifications, and uniforms. Eligibility is not guaranteed.',
    nextStep: 'After entry-level work, you can pursue OSHA 30, NATE certification (North American Technician Excellence), journeyman status, or an HVAC contractor license. Experienced technicians earn $60K–$80K+.',
  },
  {
    name: 'Electrical',
    image: '/images/pages/comp-cta-training.jpg',
    href: '/programs/electrical',
    credential: 'OSHA 10-Hour Safety Certification + NCCER Electrical Level 1',
    issuedBy: 'OSHA + National Center for Construction Education and Research (NCCER)',
    whatItMeans: 'NCCER credentials are the national standard for construction trades training. Electrical Level 1 proves you understand electrical theory, the National Electrical Code, and safe wiring practices. Combined with OSHA 10, you are qualified to start work as an electrician helper or begin a formal electrical apprenticeship.',
    training: 'You learn electrical theory, the National Electrical Code (NEC), residential and commercial wiring, conduit bending, troubleshooting, diagnostics, and safety protocols. No prior experience is needed — the program teaches from the ground up. This program prepares you to start a 4-year electrical apprenticeship leading to journeyman licensure.',
    duration: '12–16 weeks',
    examDay: 'You complete the NCCER Electrical Level 1 assessment and the OSHA 10-hour safety certification during the program.',
    whoHires: [
      { employer: 'Electrical contractors', pay: '$35K–$45K starting' },
      { employer: 'Construction companies', pay: '$36K–$48K starting' },
      { employer: 'Property management', pay: '$34K–$44K starting' },
      { employer: 'Journeyman (after 4-year apprenticeship)', pay: '$55K–$75K' },
      { employer: 'Master electrician / contractor', pay: '$100K+' },
    ],
    funding: 'WIOA funding available for eligible Indiana residents — eligibility not guaranteed. Many employers sponsor apprentices and pay for continued education.',
    nextStep: 'Indiana requires 8,000 hours (about 4 years) of supervised work experience plus passing the journeyman exam. This program gives you the foundation to start that apprenticeship. Many employers sponsor apprentices and pay for continued education.',
  },
  {
    name: 'Welding',
    image: '/images/pages/comp-cta-training.jpg',
    href: '/programs/welding',
    credential: 'AWS Welding Certifications (D1.1 Structural Steel, 3G/4G Plate) + OSHA 10',
    issuedBy: 'American Welding Society (AWS) + OSHA',
    whatItMeans: 'AWS certifications are the industry standard recognized by employers worldwide. They prove you can produce welds that meet structural and safety specifications. Combined with OSHA 10, you are qualified to work in manufacturing, construction, fabrication, aerospace, and energy.',
    training: 'You master four welding processes: Stick (SMAW), MIG (GMAW), TIG (GTAW), and Flux-Core (FCAW) — these cover 95% of welding jobs. You also learn oxy-fuel cutting, plasma cutting, blueprint reading, welding symbols, and metallurgy. 400+ hours of hands-on training. All safety equipment is provided (helmets, gloves, jackets, respirators). Day and evening classes available.',
    duration: '12–16 weeks (400+ hours hands-on)',
    examDay: 'You complete AWS certification testing in multiple processes and positions during the program. OSHA 10 is completed in the first weeks.',
    whoHires: [
      { employer: 'Manufacturing plants', pay: '$40K–$55K starting' },
      { employer: 'Fabrication shops', pay: '$42K–$58K starting' },
      { employer: 'Construction firms', pay: '$44K–$60K starting' },
      { employer: 'Specialized (pipe, underwater, aerospace)', pay: '$80K–$150K+' },
    ],
    funding: 'WIOA funding available for eligible Indiana residents. If approved, may cover tuition, safety equipment, materials, and certifications. Eligibility is not guaranteed.',
    nextStep: 'After entry-level work, you can pursue AWS advanced certifications, pipe welding specialization, welding inspector certification, or journeyman status through an employer-sponsored apprenticeship.',
  },
  {
    name: 'IT Help Desk Technician',
    image: '/images/pages/comp-cta-training.jpg',
    href: '/programs/it-help-desk',
    credential: 'Certiport IT Specialist — Device Configuration & Management',
    issuedBy: 'Certiport (Pearson VUE)',
    whatItMeans: 'The IT Specialist certification validates entry-level IT skills — hardware troubleshooting, software installation, device configuration, and end-user support. Recognized by employers as proof you can handle day-one help desk responsibilities. Elevate is a Certiport Authorized Testing Center, so you take the exam on-site.',
    training: 'You learn PC hardware, Windows/macOS/Linux basics, software troubleshooting, remote support tools, networking fundamentals, and customer service. Includes hands-on labs and Certiport exam prep.',
    duration: '8 weeks',
    examDay: 'You take the Certiport IT Specialist exam on-site at our Indianapolis Training Center. Practice tests are included in the program.',
    whoHires: [
      { employer: 'Help desk / call centers', pay: '$35K–$45K' },
      { employer: 'Desktop support', pay: '$40K–$55K' },
      { employer: 'IT support specialist', pay: '$42K–$60K' },
      { employer: 'Field technician', pay: '$38K–$52K' },
    ],
    funding: 'WIOA and JRI funding available for eligible Indiana residents — eligibility not guaranteed. Remote work is available in many IT support roles.',
    nextStep: 'IT Help Desk leads to Cybersecurity Analyst, Network Support Technician, or Software Development. This is a defined career ladder: help desk → systems administrator → network engineer → cybersecurity analyst.',
  },
  {
    name: 'Cybersecurity Analyst',
    image: '/images/pages/comp-cta-training.jpg',
    href: '/programs/cybersecurity-analyst',
    credential: 'Certiport IT Specialist — Cybersecurity',
    issuedBy: 'Certiport (Pearson VUE)',
    whatItMeans: 'The IT Specialist — Cybersecurity certification validates your knowledge of threat detection, network security, incident response, and security operations. Information security analysts are a 4-star DWD Top Job in Indiana with an average salary of $91,749.',
    training: 'You learn network security, threat analysis, malware detection, firewalls, IDS/IPS, SIEM tools, encryption, access control, and compliance frameworks. Includes hands-on labs and Certiport exam prep.',
    duration: '12 weeks',
    examDay: 'You take the Certiport IT Specialist — Cybersecurity exam on-site at our Indianapolis Training Center. Practice tests are included.',
    whoHires: [
      { employer: 'Security analyst', pay: '$55K–$80K' },
      { employer: 'SOC analyst', pay: '$50K–$75K' },
      { employer: 'Cybersecurity specialist', pay: '$65K–$100K' },
      { employer: 'Network security administrator', pay: '$60K–$95K' },
    ],
    funding: 'WIOA and JRI funding available for eligible Indiana residents — eligibility not guaranteed. Remote work is standard in cybersecurity.',
    nextStep: 'Cybersecurity Analyst leads to advanced roles in penetration testing, security engineering, and security architecture. Senior cybersecurity professionals earn $100K+.',
  },
];

export default function OutcomesPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Pathways', href: '/pathways' }, { label: 'Outcomes & What You Can Expect' }]} />
        </div>
      </div>

      {/* Visual hero */}
      <section className="relative h-[280px] sm:h-[360px] overflow-hidden">
        <Image src="/images/pages/pathways-page-1.jpg" alt="Graduates celebrating credential completion" fill sizes="100vw" className="object-cover" priority />
      </section>

      {/* Intro */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Outcomes &amp; What You Can Expect</h1>
          <div className="text-gray-700 space-y-4">
            <p>
              This page explains exactly what each Elevate training program leads to — in plain English.
              What credential you earn, who issues it, who hires you, what they pay, what your training
              looks like day to day, and what funding covers.
            </p>
            <p>
              Every credential listed below is issued by a recognized third-party authority — a government
              agency, a national certification body, or a federal department. Elevate prepares you for the
              exam. The credential itself comes from the issuing authority.
            </p>
          </div>
        </div>
      </section>

      {/* Per-program deep breakdowns */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          {PROGRAMS.map((p) => (
            <div key={p.name} id={p.name.toLowerCase().replace(/\s+/g, '-')} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Program image */}
              <div className="relative h-56 sm:h-72 overflow-hidden">
                <Image src={p.image} alt={`${p.name} training`} fill sizes="100vw" className="object-cover" />
              </div>

              <div className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{p.name}</h2>
                <p className="text-sm text-gray-500 mb-6">{p.duration} · {p.credential}</p>

                {/* What this credential is */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-2">What this credential is</h3>
                  <p className="text-sm text-gray-700">{p.whatItMeans}</p>
                  <p className="text-xs text-gray-500 mt-1">Issued by: {p.issuedBy}</p>
                </div>

                {/* What training looks like */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-2">What training looks like</h3>
                  <p className="text-sm text-gray-700">{p.training}</p>
                </div>

                {/* Exam day */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-2">Exam day</h3>
                  <p className="text-sm text-gray-700">{p.examDay}</p>
                </div>

                {/* Who hires you and what they pay */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3">Who hires you and what they pay</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {p.whoHires.map((h) => (
                      <div key={h.employer} className="bg-slate-50 rounded-lg p-3 border border-gray-100">
                        <div className="font-semibold text-gray-900 text-sm">{h.employer}</div>
                        <div className="text-brand-blue-600 font-bold text-sm">{h.pay}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Funding */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-2">What funding covers</h3>
                  <p className="text-sm text-gray-700">{p.funding}</p>
                </div>

                {/* What comes next */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-2">What comes after this</h3>
                  <p className="text-sm text-gray-700">{p.nextStep}</p>
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <Link href={p.href} className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition inline-flex items-center">
                    Full Program Details <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                  <Link href="/apply" className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition">
                    Apply Now
                  </Link>
                  <Link href="/funding" className="bg-white hover:bg-gray-50 text-brand-blue-700 border-2 border-brand-blue-200 px-5 py-2.5 rounded-lg font-bold text-sm transition">
                    Check Funding Eligibility
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Which Program Is Right for You?</h2>
          <p className="text-lg text-brand-blue-100 mb-8 max-w-2xl mx-auto">
            Not sure where to start? Check your eligibility — it takes about 5 minutes.
            We will help you find the right program and the right funding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply" className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-8 py-4 rounded-lg text-lg font-bold transition">
              Check Eligibility &amp; Apply
            </Link>
            <Link href="/pathways" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg text-lg font-bold transition border-2 border-white/30">
              Back to Career Pathways
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
