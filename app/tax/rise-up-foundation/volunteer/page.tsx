import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import VITAPageHero from '@/components/supersonic/VITAPageHero';

export const metadata: Metadata = {
  title: 'Volunteer | Rise Up Foundation VITA',
  description: 'Become an IRS-certified VITA volunteer. No tax background required. Help your community file taxes for free.',
  alternates: { canonical: 'https://www.supersonicfastermoney.com/tax/rise-up-foundation/volunteer' },
};

const ROLES = [
  { title: 'Tax Preparer', desc: 'Prepare federal and state returns for clients using IRS-approved software. Requires Basic or Advanced certification through IRS Link & Learn.', image: '/images/pages/admin-tax-training-hero.jpg' },
  { title: 'Quality Reviewer', desc: 'Review completed returns for accuracy before filing. Requires the same certification level as preparers plus quality review training.', image: '/images/pages/admin-tax-apps-hero.jpg' },
  { title: 'Intake Specialist', desc: 'Greet clients, verify documents, and complete intake forms. No tax certification required — training provided by Rise Up Foundation.', image: '/images/pages/supersonic-page-7.jpg' },
  { title: 'Site Coordinator', desc: 'Manage volunteer schedules, client flow, and site operations. Ideal for experienced volunteers or those with organizational skills.', image: '/images/pages/admin-compliance-hero.jpg' },
];

const STEPS = [
  { number: '01', title: 'Apply Online', desc: 'Complete the volunteer application. Tell us your availability, preferred location, and any prior tax or financial experience.', image: '/images/pages/admin-documents-upload-hero.jpg' },
  { number: '02', title: 'Complete IRS Training', desc: 'Take the free IRS Link & Learn certification course online. Most volunteers complete Basic certification in 8–12 hours. Advanced certification covers more complex returns.', image: '/images/pages/admin-tax-training-hero.jpg' },
  { number: '03', title: 'Pass the Certification Exam', desc: 'Complete the IRS certification exam with a score of 80% or higher. You can retake the exam as many times as needed. Certification is valid for one tax season.', image: '/images/pages/admin-tax-apps-hero.jpg' },
  { number: '04', title: 'Start Helping Clients', desc: 'Join your assigned VITA site and begin preparing returns under the supervision of experienced volunteers. Most sites operate January through April 15.', image: '/images/pages/subpage-tax-hero.jpg' },
];

export default function VolunteerPage() {
  return (
    <div className="min-h-screen bg-white">
      <VITAPageHero
        image="/images/pages/admin-tax-training-hero.jpg"
        alt="Become a VITA volunteer with Rise Up Foundation"
        title="Volunteer With Rise Up Foundation"
        subtitle="Help your community file taxes for free. No tax background required — we provide full IRS certification training."
      />

      {/* ROLES */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Volunteer Roles</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">We have roles for every skill level — from first-time volunteers to experienced tax professionals.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROLES.map((role) => (
              <div key={role.title} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-44 flex-shrink-0">
                  <Image src={role.image} alt={role.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                </div>
                <div className="p-5 flex-1 bg-white">
                  <h3 className="font-bold text-slate-900 mb-2">{role.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{role.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW TO BECOME A VOLUNTEER */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">How to Become a Volunteer</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">Four steps from application to your first client appointment.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col">
                <div className="relative h-48 rounded-xl overflow-hidden mb-5">
                  <Image src={step.image} alt={step.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                  <div className="absolute top-3 left-3 bg-emerald-700 text-white text-sm font-black px-3 py-1 rounded-lg">{step.number}</div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMITMENT */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">Time Commitment</h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">Volunteers commit to 4–6 hours per week during tax season, which runs from late January through April 15. Sites operate on weekday evenings and weekends to accommodate volunteer schedules.</p>
              <p className="text-slate-600 mb-8 leading-relaxed">Volunteering with VITA counts toward community service hours and provides hands-on experience that supports careers in accounting, finance, social work, and community development.</p>
              <Link href="/tax/rise-up-foundation/training" className="inline-block px-8 py-4 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-colors">Start IRS Training</Link>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image src="/images/pages/admin-ferpa-training-hero.jpg" alt="VITA volunteer training" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative h-[45vh] min-h-[320px]">
        <Image src="/images/pages/rise-foundation-page-1.jpg" alt="Apply to volunteer" fill className="object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-emerald-900/75 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Ready to Make a Difference?</h2>
            <Link href="/tax/rise-up-foundation/volunteer/apply" className="px-10 py-4 bg-white text-emerald-900 font-black text-xl rounded-xl hover:bg-emerald-50 transition-colors">Apply to Volunteer</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
