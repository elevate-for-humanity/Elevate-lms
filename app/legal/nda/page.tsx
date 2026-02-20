export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Non-Disclosure Agreement | Elevate For Humanity',
  description:
    'Non-Disclosure Agreement for Elevate for Humanity partners and stakeholders.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/legal/nda',
  },
};

export default async function NDAPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('legal_documents').select('*').limit(50);

  return (
    <div className="min-h-screen bg-white py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Nda" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-brand-blue-600 hover:text-brand-blue-800 mb-6 inline-block"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-black mb-8">
          Non-Disclosure Agreement
        </h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-sm text-black mb-8">
            Last Updated: December 15, 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              1. Purpose
            </h2>
            <p className="text-black mb-4">
              This Non-Disclosure Agreement ("Agreement") is entered into by and
              between Elevate for Humanity ("Disclosing Party") and the
              individual or entity accessing confidential information
              ("Receiving Party").
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              2. Confidential Information
            </h2>
            <p className="text-black mb-4">
              "Confidential Information" includes, but is not limited to:
            </p>
            <ul className="list-disc pl-6 text-black space-y-2 mb-4">
              <li>Proprietary training materials and curricula</li>
              <li>Business processes and operational procedures</li>
              <li>Student and partner data</li>
              <li>Financial information and pricing structures</li>
              <li>Technology systems and software</li>
              <li>Strategic plans and business strategies</li>
              <li>Partner relationships and agreements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              3. Obligations
            </h2>
            <p className="text-black mb-4">
              The Receiving Party agrees to:
            </p>
            <ul className="list-disc pl-6 text-black space-y-2 mb-4">
              <li>
                Maintain the confidentiality of all Confidential Information
              </li>
              <li>
                Use Confidential Information solely for authorized purposes
              </li>
              <li>
                Not disclose Confidential Information to third parties without
                written consent
              </li>
              <li>
                Protect Confidential Information with the same degree of care
                used for own confidential information
              </li>
              <li>
                Return or destroy all Confidential Information upon request
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              4. Exceptions
            </h2>
            <p className="text-black mb-4">
              This Agreement does not apply to information that:
            </p>
            <ul className="list-disc pl-6 text-black space-y-2 mb-4">
              <li>
                Is or becomes publicly available through no breach of this
                Agreement
              </li>
              <li>
                Was rightfully in Receiving Party's possession prior to
                disclosure
              </li>
              <li>Is independently developed by Receiving Party</li>
              <li>Is required to be disclosed by law or court order</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">5. Term</h2>
            <p className="text-black mb-4">
              This Agreement remains in effect for the duration of the
              relationship between the parties and for three (3) years
              thereafter.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              6. Remedies
            </h2>
            <p className="text-black mb-4">
              The Receiving Party acknowledges that breach of this Agreement may
              cause irreparable harm for which monetary damages may be
              inadequate. The Disclosing Party shall be entitled to seek
              injunctive relief in addition to any other remedies available at
              law or in equity.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              7. Governing Law
            </h2>
            <p className="text-black mb-4">
              This Agreement shall be governed by and construed in accordance
              with the laws of the State of Indiana, without regard to its
              conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              8. Contact Information
            </h2>
            <p className="text-black mb-4">
              For questions regarding this Non-Disclosure Agreement, please
              contact:
            </p>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-black">
                <strong>Elevate for Humanity</strong>
                <br />
                Email: our contact form
                <br />
                Phone: (317) 314-3757
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
