import Image from 'next/image';
import { CREDENTIALS, CURRICULUM } from '../hvac-program-data';

/* One unique image per curriculum module — no repeats from other sections */
const CURRICULUM_IMAGES = [
  '/images/programs-hq/hvac-technician.jpg',           // HVAC Fundamentals
  '/images/trades/electrical-hero.jpg',                 // Electrical Systems
  '/images/trades/program-building-technology.jpg',     // Air Distribution
  '/images/programs-hq/welding.jpg',                    // Refrigeration
  '/images/hero/hero-hands-on-training.jpg',            // Safety & Codes
  '/images/programs/hvac-highlight-3.jpg',              // Troubleshooting
];

export function HvacCredentials() {
  return (
    <>
      {/* Credential Pathway */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Credential Pathway</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Industry-recognized credentials are issued by licensed credential partners. Each credential requires a test and is obtained as part of this training program. Elevate provides program coordination, competency tracking, and completion documentation.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CREDENTIALS.map((cred, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 bg-brand-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">{i + 1}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-blue-600">{cred.type}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{cred.name}</h3>
                <p className="text-slate-500 text-sm">Issued by: {cred.issuer}</p>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded">Test required</span>
                  <span className="text-xs bg-brand-blue-100 text-brand-blue-700 px-2 py-0.5 rounded">Earned in program</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Learn — image cards instead of generic icons */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">What You&apos;ll Learn</h2>
          <p className="text-slate-600 mb-10 max-w-3xl">
            Hands-on training covering residential and commercial HVAC systems with certification preparation.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CURRICULUM.map((mod, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="relative h-40">
                  <Image
                    src={CURRICULUM_IMAGES[i] || CURRICULUM_IMAGES[0]}
                    alt={mod.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{mod.title}</h3>
                  <p className="text-slate-600 text-sm">{mod.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why HVAC — with image */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Why Choose HVAC?</h2>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>Year-Round Demand:</strong> Heating systems run all winter and cooling systems run all summer. HVAC technicians work year-round with consistent demand regardless of the economy.
              </p>
              <p>
                <strong>Excellent Pay:</strong> Entry-level HVAC technicians in Indiana start around $40,000-$55,000. Experienced technicians with certifications earn $60,000-$80,000+, especially with overtime during peak seasons.
              </p>
              <p>
                <strong>Job Security:</strong> Every building needs HVAC. This work cannot be outsourced or automated. The Bureau of Labor Statistics projects 6% job growth through 2032 — faster than average.
              </p>
              <p>
                <strong>Business Ownership:</strong> Many HVAC technicians start their own service companies within 5 years. With certifications and a contractor license, startup costs are relatively low.
              </p>
            </div>
            <div className="relative h-[380px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/trades/program-hvac-overview.jpg"
                alt="HVAC technician servicing residential equipment on-site"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Progress Tracking — numbered list, no generic clipboard icons */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Progress Tracking &amp; Reporting</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            All participant progress is documented and available to workforce partners upon request.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'LMS module completion tracking',
              'RTI attendance documentation',
              'Hands-on lab performance evaluations',
              'Certification exam preparation milestones',
              'Cohort progress reporting available to partners',
              'Credential attainment records',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-slate-200">
                <span className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-slate-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
