import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, Building2, GraduationCap, Briefcase, FileCheck, Users, ClipboardCheck, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Registered Apprenticeship Sponsor | Elevate for Humanity',
  description: 'Elevate for Humanity Career & Technical Institute is a USDOL Registered Apprenticeship Sponsor providing RTI, apprenticeship governance, and coordination with licensed employer training sites.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/apprenticeship-sponsor' },
};

export default function ApprenticeshipSponsorPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-[200px] sm:h-[260px] overflow-hidden">
        <Image src="/images/pages/apprenticeship-sponsor-page-1.jpg" alt="Apprenticeship sponsor" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-white border-b border-slate-200 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">USDOL Registered</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Apprenticeship Sponsor</h1>
          <p className="text-slate-600 mt-2 max-w-2xl">Centralized apprenticeship governance, instruction, and partner training site coordination.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Apprenticeship Sponsor' }]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Sponsor Identity */}
        <section className="mb-14">
          <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-brand-red-400" />
              <h2 className="text-2xl font-bold">Sponsor of Record</h2>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed mb-6">
              Elevate for Humanity Career &amp; Technical Institute, a program of 2Exclusive LLC-S, operates as a centralized workforce development and Registered Apprenticeship sponsor organization. The institute provides related technical instruction (RTI), apprenticeship sponsorship, workforce-funded career pathway enrollment, and coordination with licensed employer training sites under a unified governance and compliance structure.
            </p>
            <dl className="grid sm:grid-cols-3 gap-6">
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Legal Entity</dt>
                <dd className="text-white font-medium mt-1">2Exclusive LLC-S</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">DBA</dt>
                <dd className="text-white font-medium mt-1">Elevate for Humanity Career &amp; Technical Institute</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">RAPIDS Program ID</dt>
                <dd className="text-white font-medium mt-1">2025-IN-132301</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* What the Sponsor Does */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <ClipboardCheck className="w-6 h-6 text-brand-red-600" />
            Sponsor Responsibilities
          </h2>
          <p className="text-slate-700 mb-6">
            As the Registered Apprenticeship Sponsor, 2Exclusive LLC-S is responsible for all aspects of program governance, compliance, and quality assurance:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Standards Registration', desc: 'Register and maintain apprenticeship standards with USDOL RAPIDS.' },
              { title: 'Curriculum Development', desc: 'Develop and deliver related technical instruction aligned to competency standards.' },
              { title: 'Partner Site Approval', desc: 'Vet, approve, and onboard licensed employer training sites under formal agreements.' },
              { title: 'Hour Tracking', desc: 'Document and verify all OJT and RTI hours through institutional tracking systems.' },
              { title: 'Competency Verification', desc: 'Assess and verify apprentice skill progression through structured evaluations.' },
              { title: 'Apprentice Registration', desc: 'Register apprentices with RAPIDS and manage all enrollment documentation.' },
              { title: 'Compliance Reporting', desc: 'Submit required reports to USDOL, Indiana DWD, and applicable state agencies.' },
              { title: 'Quality Assurance', desc: 'Conduct site visits, monitor training quality, and enforce program standards.' },
            ].map((item) => (
              <div key={item.title} className="bg-slate-50 rounded-lg p-5 border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Training Delivery Model */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-brand-red-600" />
            Training Delivery Model
          </h2>
          <p className="text-slate-700 mb-6">
            Apprentices receive structured instruction through the institute while completing supervised on-the-job training at sponsor-approved licensed partner locations in accordance with state and federal apprenticeship standards.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-brand-red-50 border border-brand-red-200 rounded-xl p-6">
              <h3 className="font-bold text-brand-red-900 text-lg mb-2">Related Technical Instruction (RTI)</h3>
              <p className="text-brand-red-800 text-sm leading-relaxed">
                Delivered by Elevate for Humanity Career &amp; Technical Institute through structured curriculum, LMS-based coursework, and supervised instructional modules. RTI covers theory, safety, regulatory knowledge, and technical competencies.
              </p>
              <p className="text-brand-red-700 text-xs mt-3 font-medium">Provided by: The Institute (Sponsor)</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-2">On-the-Job Training (OJT)</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Delivered at licensed employer partner locations operating under formal training agreements. OJT provides supervised practical experience under the direction of licensed professionals at approved training sites.
              </p>
              <p className="text-slate-500 text-xs mt-3 font-medium">Provided by: Licensed Partner Training Sites</p>
            </div>
          </div>
        </section>

        {/* Partner Training Sites */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Building2 className="w-6 h-6 text-brand-red-600" />
            Partner Training Sites
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
            <p className="text-amber-900 leading-relaxed">
              Partner barbershops and employer training sites are licensed facilities that provide supervised practical training under sponsor-approved standards. Partner locations do not function as the apprenticeship sponsor or instructional institution but operate as approved training sites within the registered program structure.
            </p>
          </div>
          <p className="text-slate-700 mb-4">All partner locations operate under formal training agreements that specify:</p>
          <ul className="space-y-2 mb-8">
            {[
              'Scope of on-the-job training to be provided',
              'Supervision requirements and licensed professional oversight',
              'Hour tracking and reporting obligations',
              'Competency verification procedures',
              'Compliance with state licensing and regulatory requirements',
              'Apprentice safety and workplace standards',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-slate-700">
                <FileCheck className="w-5 h-5 text-brand-green-600 mt-0.5 shrink-0" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>

          <div className="bg-white border-2 border-brand-red-200 rounded-xl p-6 sm:p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-red-600" />
              Become a Partner Training Site
            </h3>
            <p className="text-slate-600 mb-6">
              Licensed barbershops and employer locations can apply to become an approved partner training site. We provide training standards, curriculum support, hour tracking systems, and compliance oversight.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/partners/barbershop-apprenticeship" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2">
                Barbershop Partner Program <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/programs/barber-apprenticeship/apply?type=partner_shop" className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors">
                Apply as Partner Site
              </Link>
            </div>
          </div>
        </section>

        {/* Governance Hierarchy */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Users className="w-6 h-6 text-brand-red-600" />
            Governance Hierarchy
          </h2>
          <div className="space-y-3">
            <div className="bg-slate-900 text-white rounded-xl p-5 flex items-center gap-4">
              <span className="bg-brand-red-600 text-white text-xs font-bold px-2.5 py-1 rounded">1</span>
              <div>
                <p className="font-bold">2Exclusive LLC-S — Sponsor &amp; Governing Entity</p>
                <p className="text-slate-400 text-sm">Standards, compliance, apprentice registration, oversight</p>
              </div>
            </div>
            <div className="bg-brand-red-600 text-white rounded-xl p-5 flex items-center gap-4">
              <span className="bg-white text-brand-red-600 text-xs font-bold px-2.5 py-1 rounded">2</span>
              <div>
                <p className="font-bold">Elevate for Humanity Career &amp; Technical Institute — Training Division</p>
                <p className="text-brand-red-100 text-sm">RTI delivery, curriculum, LMS, workforce enrollment</p>
              </div>
            </div>
            <div className="bg-slate-100 rounded-xl p-5 flex items-center gap-4">
              <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded">3</span>
              <div>
                <p className="font-bold text-slate-900">Licensed Partner Training Sites — Employer Locations</p>
                <p className="text-slate-600 text-sm">Supervised OJT under formal training agreements</p>
              </div>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="flex flex-wrap gap-4">
          <Link href="/governance" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Full Governance Structure
          </Link>
          <Link href="/approvals" className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors">
            Approvals &amp; Verification
          </Link>
          <Link href="/programs/barber-apprenticeship" className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors">
            Barber Apprenticeship Program
          </Link>
        </section>
      </div>
    </div>
  );
}
