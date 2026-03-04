import Image from 'next/image';
import { CREDENTIALS, CURRICULUM } from '../barber-program-data';

const CURRICULUM_IMAGES = [
  '/images/pages/barber-gallery-1.jpg',
  '/images/pages/barber-gallery-1.jpg',
  '/images/pages/barber-gallery-1.jpg',
  '/images/pages/barber-gallery-1.jpg',
  '/images/pages/barber-gallery-1.jpg',
  '/images/barber-highlight-1.jpg',
  '/images/barber-highlight-2.jpg',
  '/images/pages/comp-cta-training.jpg',
];

export function BarberCredentials() {
  return (
    <>
      {/* Section 5 — Credential Pathway */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Credential Pathway</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Industry-recognized credentials, where applicable, are issued by licensed credential partners. Elevate provides program coordination, competency tracking, and official completion documentation upon successful fulfillment of all training and evaluation requirements.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CREDENTIALS.map((cred, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">{i + 1}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-red-600">{cred.type}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{cred.name}</h3>
                <p className="text-slate-500 text-sm">Issued by: {cred.issuer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6 — What You'll Learn (Curriculum) */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">What You&apos;ll Learn</h2>
          <p className="text-slate-600 mb-10 max-w-3xl">
            Hands-on, competency-based training in a real barbershop environment under licensed supervision.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CURRICULUM.map((mod, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="relative h-40">
                  <Image src={CURRICULUM_IMAGES[i] || CURRICULUM_IMAGES[0]} alt={mod.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
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

      {/* Section 6.5 — Apprenticeship Workplace Training */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Workplace Training Component</h2>
          <p className="text-slate-600 mb-8 max-w-3xl">
            Participants receive hands-on training in licensed barbershops under the supervision of licensed barbers. Workplace training includes real client services, shop operations, sanitation practices, and professional skill development.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
              <div className="relative h-40">
                <Image src="/images/pages/barber-gallery-1.jpg" alt="Supervised barber training" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-900 mb-2">Supervised Training</h3>
                <p className="text-slate-600 text-sm">Training in approved employer environments under licensed barber supervisors with at least 2 years of experience. All training sites maintain active shop licensing.</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
              <div className="relative h-40">
                <Image src="/images/pages/barber-gallery-2.jpg" alt="Barber performance evaluation" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-900 mb-2">Performance Evaluations</h3>
                <p className="text-slate-600 text-sm">Monthly competency evaluations by supervising barbers, with tri-party verification (RTI instructor + Employer + Program Oversight) at key milestones.</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
              <div className="relative h-40">
                <Image src="/images/pages/barber-gallery-3.jpg" alt="Barbershop employment" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-900 mb-2">Employment Structure</h3>
                <p className="text-slate-600 text-sm">Apprentices may train under hourly paid, booth-based, or hybrid arrangements depending on the partner shop&apos;s operational policies. All models require licensed supervision and documented OJT hours.</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
              <div className="relative h-40">
                <Image src="/images/pages/barber-training.jpg" alt="OJT hour logging" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-900 mb-2">OJT Hour Logging</h3>
                <p className="text-slate-600 text-sm">All 2,000 OJT hours are documented through digital hour tracking, supervisor verification, and competency progression records maintained in the institutional LMS.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
