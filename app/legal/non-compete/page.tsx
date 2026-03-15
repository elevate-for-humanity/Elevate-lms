import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ShieldAlert, Ban } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Non-Compete Agreement | Elevate For Humanity',
  description: 'Non-Compete Agreement for Elevate for Humanity partners, Program Holders, and collaborating organizations.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/legal/non-compete',
  },
};

export default function NonCompetePage() {
  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Non-Compete Agreement' }]} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/legal" className="text-brand-blue-600 hover:text-brand-blue-800 mb-6 inline-block text-sm">
          ← Back to Legal
        </Link>

        {/* Header */}
        <div className="bg-white text-white rounded-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-3">
            <Ban size={40} />
            <div>
              <h1 className="text-3xl font-bold">Non-Compete Agreement</h1>
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
              this Non-Compete Agreement. It is incorporated by reference into those documents. These
              restrictions exist to protect the Training Network, the students it serves, and the program
              model that Elevate has built. They are not punitive — they are necessary.
            </p>
          </div>
        </div>

        <div className="space-y-8">

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Parties</h2>
            <p className="text-slate-700 mb-3">This Non-Compete Agreement (&quot;Agreement&quot;) is between:</p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mb-3">
              <li><strong>Protected Party:</strong> 2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Training Institute (&quot;Elevate&quot;)</li>
              <li><strong>Restricted Party:</strong> The individual or organization that has entered into a partnership, MOU, Program Holder agreement, or any other formal relationship with Elevate</li>
            </ul>
            <p className="text-sm text-slate-500">
              <strong>Plain language:</strong> If you signed an Elevate agreement of any kind, these
              restrictions apply to you. You do not need to sign a separate document.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Why This Agreement Exists</h2>
            <p className="text-slate-700 mb-3">
              As a Program Holder, partner, or collaborating organization, you receive access to Elevate&apos;s
              proprietary training model, curriculum, operational systems, credential relationships, employer
              networks, and funding structures. This access is provided so you can deliver Elevate programs —
              not so you can replicate them independently.
            </p>
            <p className="text-slate-700">
              Without this protection, a partner could use Elevate&apos;s model, relationships, and student
              pipeline to build a competing program — directly harming the students Elevate serves and the
              Training Network that supports them. This Agreement prevents that.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Restricted Activities — During the Agreement</h2>
            <p className="text-slate-700 mb-3">
              While your Elevate agreement is active, the Restricted Party may not:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Develop, operate, or support a training program that directly competes with any Elevate program in the same geographic area</li>
              <li>Apply for ETPL (Eligible Training Provider List) status or workforce funding for a program that replicates or is substantially similar to an Elevate program</li>
              <li>Solicit Elevate&apos;s students, instructors, credential partners, or employer partners for a competing program</li>
              <li>Use Elevate&apos;s curriculum, operational procedures, or program structure to develop a competing offering</li>
              <li>Represent to any funding agency, employer, or student that you independently operate a program that is actually an Elevate program</li>
            </ul>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Restricted Activities — 3 Years After Termination</h2>
            <p className="text-slate-700 mb-3">
              For <strong>three (3) years</strong> following the termination or expiration of your Elevate
              agreement, the Restricted Party may not:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-4">
              <li><strong>Replicate the program model.</strong> You may not develop, operate, or support a training program that is substantially similar to any Elevate program using materials, systems, methods, or relationships obtained through your Elevate collaboration.</li>
              <li><strong>Redirect students or partners.</strong> You may not solicit or redirect enrolled students, instructors, credential partners, or employer partners into a competing program derived from the Elevate training model.</li>
              <li><strong>Use Elevate&apos;s credential relationships.</strong> You may not use relationships with credential bodies (EPA, PTCB, CompTIA, NCCER, Indiana SDOH, etc.) that were established or facilitated through your Elevate collaboration to independently offer competing programs.</li>
              <li><strong>Apply for competing workforce funding.</strong> You may not use Elevate&apos;s program structure, ETPL relationships, or DWD contacts to apply independently for WIOA, JRI, WRG, or other workforce funding for a competing program.</li>
            </ul>
            <p className="text-sm text-slate-500">
              <strong>Plain language:</strong> When your agreement ends, you have 3 years during which you
              cannot build a competing version of what Elevate gave you access to. After 3 years, these
              restrictions expire.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. What Is NOT Restricted</h2>
            <p className="text-slate-700 mb-3">
              This Agreement does not prevent the Restricted Party from:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Operating your existing business in your industry (barbershop, healthcare facility, trade shop, etc.)</li>
              <li>Employing staff, including instructors, in your existing business</li>
              <li>Participating in training programs that are not substantially similar to Elevate programs</li>
              <li>Referring students to other training providers for programs Elevate does not offer</li>
              <li>Applying for workforce funding for programs that are genuinely independent of the Elevate model</li>
            </ul>
            <p className="text-sm text-slate-500 mt-3">
              <strong>Plain language:</strong> You can still run your business. You can still employ people.
              You can still participate in other training programs. What you cannot do is take what Elevate
              gave you and use it to build a competing version of Elevate.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Geographic Scope</h2>
            <p className="text-slate-700">
              These restrictions apply in any geographic area where Elevate actively operates or has
              operated programs during the term of your agreement. Currently this includes Indiana and
              any other states where Elevate has expanded the Training Network. As Elevate expands,
              the geographic scope expands accordingly.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Consideration</h2>
            <p className="text-slate-700 mb-3">
              In exchange for these restrictions, the Restricted Party receives:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Access to Elevate&apos;s proprietary curriculum, LMS, and training systems</li>
              <li>Revenue-sharing compensation per the tier structure in your MOU</li>
              <li>Access to Elevate&apos;s credential body relationships and testing infrastructure</li>
              <li>Access to Elevate&apos;s employer partner network and job placement pipeline</li>
              <li>Access to Elevate&apos;s ETPL status and workforce funding relationships</li>
              <li>Marketing support, compliance guidance, and operational support</li>
            </ul>
            <p className="text-sm text-slate-500 mt-3">
              <strong>Plain language:</strong> You are getting real value — a proven program, a revenue
              stream, and access to systems that took years to build. The non-compete is the price of
              that access. It is fair consideration.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Remedies for Breach</h2>
            <p className="text-slate-700 mb-3">
              The Restricted Party acknowledges that a breach of this Agreement would cause irreparable
              harm to Elevate for which monetary damages alone would be inadequate. In the event of a
              breach or threatened breach, Elevate is entitled to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li><strong>Immediate injunctive relief</strong> — a court order stopping the competing activity, without the requirement to post a bond</li>
              <li><strong>Monetary damages</strong> — compensation for actual losses, including lost revenue and damage to the Training Network</li>
              <li><strong>Disgorgement of profits</strong> — recovery of any profits the Restricted Party earned from the competing activity</li>
              <li><strong>Recovery of attorney&apos;s fees and costs</strong> incurred in enforcing this Agreement</li>
              <li><strong>Immediate termination</strong> of any remaining Elevate agreement without the standard notice period</li>
            </ul>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Severability</h2>
            <p className="text-slate-700">
              If any provision of this Agreement is found to be unenforceable by a court, the remaining
              provisions remain in full force and effect. Any unenforceable provision will be modified
              to the minimum extent necessary to make it enforceable while preserving the original intent.
              Indiana courts have authority to blue-pencil overly broad restrictions rather than void them.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Governing Law</h2>
            <p className="text-slate-700">
              This Agreement is governed by the laws of the State of Indiana. Disputes shall first be
              submitted to good-faith mediation. If unresolved within 30 days, the parties consent to
              jurisdiction in Marion County, Indiana. The prevailing party in any legal action is entitled
              to recover reasonable attorney&apos;s fees and costs.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">11. Contact</h2>
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
            This Non-Compete Agreement is incorporated by reference into all Elevate for Humanity
            partner agreements, MOUs, Program Holder agreements, and barbershop apprenticeship agreements.
            Execution of any such agreement constitutes acceptance of these terms.
          </p>
          <div className="flex gap-4 mt-4">
            <Link href="/legal/nda" className="text-brand-blue-600 hover:underline text-sm font-medium">
              View Non-Disclosure Agreement →
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
