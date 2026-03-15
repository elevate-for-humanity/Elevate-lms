import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ShieldAlert, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Non-Disclosure Agreement | Elevate For Humanity',
  description: 'Non-Disclosure Agreement for Elevate for Humanity partners, Program Holders, and collaborating organizations.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/legal/nda',
  },
};

export default function NDAPage() {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Non-Disclosure Agreement' }]} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/legal" className="text-brand-blue-600 hover:text-brand-blue-800 mb-6 inline-block text-sm">
          ← Back to Legal
        </Link>

        {/* Header */}
        <div className="bg-white text-white rounded-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-3">
            <Lock size={40} />
            <div>
              <h1 className="text-3xl font-bold">Non-Disclosure Agreement</h1>
              <p className="text-slate-300 mt-1">Elevate for Humanity — Effective upon execution of any partnership, MOU, or Program Holder agreement</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-3">
            Last Updated: January 2025 · Governed by Indiana law · Incorporated by reference into all Elevate partner agreements
          </p>
        </div>

        {/* Non-negotiable notice */}
        <div className="bg-red-50 border-l-4 border-red-600 p-5 rounded-r-xl mb-8 flex gap-3">
          <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900 mb-1">This agreement is not up for negotiation.</p>
            <p className="text-red-800 text-sm">
              By signing any Elevate partner agreement, MOU, or Program Holder agreement, you are bound by
              this NDA. It is incorporated by reference into those documents. If you have questions about
              what is covered, ask before signing — not after a disclosure occurs.
            </p>
          </div>
        </div>

        <div className="space-y-8">

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Parties</h2>
            <p className="text-slate-700 mb-3">
              This Non-Disclosure Agreement (&quot;Agreement&quot;) is between:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mb-3">
              <li><strong>Disclosing Party:</strong> 2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Training Institute (&quot;Elevate&quot;)</li>
              <li><strong>Receiving Party:</strong> The individual or organization that has entered into a partnership, MOU, Program Holder agreement, or any other formal relationship with Elevate</li>
            </ul>
            <p className="text-sm text-slate-500">
              <strong>Plain language:</strong> If you signed an MOU, a Program Holder agreement, a barbershop
              apprenticeship agreement, or any other Elevate contract, this NDA applies to you automatically.
              You do not need to sign a separate document.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. What Is Confidential Information</h2>
            <p className="text-slate-700 mb-3">
              &quot;Confidential Information&quot; means any information disclosed by Elevate to the Receiving Party
              that is not publicly available, including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-4">
              <li><strong>Curriculum and instructional content</strong> — all lesson plans, assessments, competency frameworks, LMS content, and training materials</li>
              <li><strong>Operational procedures</strong> — enrollment processes, compliance workflows, reporting systems, and internal policies</li>
              <li><strong>Student data</strong> — all personally identifiable information (PII) about students, including names, contact information, enrollment status, attendance, and outcomes (also protected separately under FERPA)</li>
              <li><strong>Financial information</strong> — tuition structures, revenue-sharing formulas, payment schedules, cost breakdowns, and funding arrangements</li>
              <li><strong>Technology systems</strong> — LMS architecture, platform integrations, software configurations, and API relationships</li>
              <li><strong>Business relationships</strong> — employer partners, credential bodies, funding agency contacts, and referral networks</li>
              <li><strong>Strategic plans</strong> — expansion plans, new program development, grant strategies, and partnership pipeline</li>
              <li><strong>Brand and identity</strong> — unpublished marketing materials, brand guidelines, and communications strategies</li>
            </ul>
            <p className="text-sm text-slate-500">
              <strong>Plain language:</strong> If Elevate gave it to you to do your job as a partner, it is
              confidential. This includes things you learned by being inside the operation — not just
              documents handed to you.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Your Obligations</h2>
            <p className="text-slate-700 mb-3">The Receiving Party agrees to:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-4">
              <li><strong>Keep it confidential.</strong> Do not disclose Confidential Information to any person or organization that is not authorized by Elevate in writing.</li>
              <li><strong>Use it only for authorized purposes.</strong> Confidential Information may only be used to fulfill your obligations under your Elevate agreement. It may not be used to develop competing programs, apply for independent funding, or benefit any other organization.</li>
              <li><strong>Protect it.</strong> Apply at least the same level of care to Elevate&apos;s Confidential Information as you apply to your own confidential information — and no less than reasonable care.</li>
              <li><strong>Limit internal access.</strong> Only share Confidential Information with your own staff or contractors who need it to fulfill your Elevate obligations, and only after informing them of these confidentiality requirements.</li>
              <li><strong>Return or destroy it upon request.</strong> When your agreement ends or upon Elevate&apos;s written request, return all Confidential Information (including copies) or certify in writing that it has been destroyed.</li>
            </ul>
            <p className="text-sm text-slate-500">
              <strong>Plain language:</strong> Do not share it. Do not use it for anything other than your
              Elevate work. When the relationship ends, give it back or delete it.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. What Is Not Covered</h2>
            <p className="text-slate-700 mb-3">
              This Agreement does not apply to information that the Receiving Party can demonstrate:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Was already publicly available at the time of disclosure through no breach of this Agreement</li>
              <li>Was already in the Receiving Party&apos;s possession before Elevate disclosed it, with no confidentiality obligation attached</li>
              <li>Was independently developed by the Receiving Party without use of any Elevate Confidential Information</li>
              <li>Is required to be disclosed by law, court order, or government agency — in which case the Receiving Party must notify Elevate in writing as soon as possible before making the disclosure</li>
            </ul>
            <p className="text-sm text-slate-500 mt-3">
              <strong>Plain language:</strong> If it was already public, you already knew it independently,
              or a court orders you to disclose it, this Agreement does not apply. But you cannot use these
              exceptions as a loophole — the burden of proof is on you.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Student Data — Additional Obligations</h2>
            <p className="text-slate-700 mb-3">
              Student personally identifiable information (PII) is subject to additional protections under
              FERPA (Family Educational Rights and Privacy Act), 20 U.S.C. § 1232g. In addition to the
              general confidentiality obligations above:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>You may not disclose student PII to any third party without written student consent and Elevate authorization.</li>
              <li>You may not use student data for any purpose other than fulfilling your obligations under your Elevate agreement.</li>
              <li>You must report any unauthorized disclosure of student data to Elevate within 24 hours of discovery.</li>
              <li>FERPA violations carry federal penalties independent of this Agreement.</li>
            </ul>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Duration</h2>
            <p className="text-slate-700 mb-3">
              Confidentiality obligations under this Agreement begin on the date you first receive
              Confidential Information from Elevate and continue for:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li><strong>Three (3) years</strong> after the termination or expiration of your Elevate agreement for general Confidential Information.</li>
              <li><strong>Indefinitely</strong> for student PII, which remains protected under FERPA regardless of when the relationship ends.</li>
            </ul>
            <p className="text-sm text-slate-500 mt-3">
              <strong>Plain language:</strong> When your agreement with Elevate ends, you still cannot
              disclose or use Elevate&apos;s confidential information for 3 years. Student data is protected
              forever.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Remedies for Breach</h2>
            <p className="text-slate-700 mb-3">
              The Receiving Party acknowledges that a breach of this Agreement would cause irreparable
              harm to Elevate for which monetary damages alone would be inadequate. In the event of a
              breach or threatened breach, Elevate is entitled to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li><strong>Immediate injunctive relief</strong> — a court order stopping the disclosure or use of Confidential Information, without the requirement to post a bond</li>
              <li><strong>Monetary damages</strong> — compensation for actual losses caused by the breach</li>
              <li><strong>Recovery of attorney&apos;s fees and costs</strong> incurred in enforcing this Agreement</li>
              <li><strong>Immediate termination</strong> of your Elevate agreement without the standard notice period</li>
            </ul>
            <p className="text-sm text-slate-500 mt-3">
              <strong>Plain language:</strong> If you disclose Elevate&apos;s confidential information without
              authorization, Elevate can go to court immediately to stop you and sue you for damages.
              This is not a threat — it is a statement of legal rights.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Governing Law</h2>
            <p className="text-slate-700">
              This Agreement is governed by the laws of the State of Indiana. Disputes shall first be
              submitted to good-faith mediation. If unresolved within 30 days, the parties consent to
              jurisdiction in Marion County, Indiana. The prevailing party in any legal action is entitled
              to recover reasonable attorney&apos;s fees and costs.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Contact</h2>
            <div className="text-slate-700 space-y-1">
              <p><strong>Elevate for Humanity</strong></p>
              <p>8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240</p>
              <p>Email: elevate4humanityedu@gmail.com</p>
              <p>Phone: (317) 314-3757</p>
            </div>
          </section>

        </div>

        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-sm text-slate-600">
            This Non-Disclosure Agreement is incorporated by reference into all Elevate for Humanity
            partner agreements, MOUs, Program Holder agreements, and barbershop apprenticeship agreements.
            Execution of any such agreement constitutes acceptance of these terms.
          </p>
          <div className="flex gap-4 mt-4">
            <Link href="/legal/non-compete" className="text-brand-blue-600 hover:underline text-sm font-medium">
              View Non-Compete Agreement →
            </Link>
            <Link href="/legal/partner-mou" className="text-brand-blue-600 hover:underline text-sm font-medium">
              View Partner MOU →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
