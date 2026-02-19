import { GraduationCap, BookOpen, ClipboardCheck } from 'lucide-react';
import { CREDENTIALS, CURRICULUM } from '../hvac-program-data';

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
                  <GraduationCap className="w-5 h-5 text-brand-blue-600" />
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

      {/* What You'll Learn */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">What You&apos;ll Learn</h2>
          <p className="text-slate-600 mb-10 max-w-3xl">
            Hands-on training covering residential and commercial HVAC systems with certification preparation.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CURRICULUM.map((mod, i) => {
              const Icon = mod.icon || BookOpen;
              return (
                <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{mod.title}</h3>
                  <p className="text-slate-600 text-sm">{mod.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why HVAC */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">Why Choose HVAC?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>Year-Round Demand:</strong> Heating systems run all winter and cooling systems run all summer. HVAC technicians work year-round with consistent demand regardless of the economy.
              </p>
              <p>
                <strong>Excellent Pay:</strong> Entry-level HVAC technicians in Indiana start around $40,000-$55,000. Experienced technicians with certifications earn $60,000-$80,000+, especially with overtime during peak seasons.
              </p>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>Job Security:</strong> Every building needs HVAC. This work cannot be outsourced or automated. The Bureau of Labor Statistics projects 6% job growth through 2032 — faster than average.
              </p>
              <p>
                <strong>Business Ownership:</strong> Many HVAC technicians start their own service companies within 5 years. With certifications and a contractor license, startup costs are relatively low.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Tracking */}
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
                <ClipboardCheck className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
