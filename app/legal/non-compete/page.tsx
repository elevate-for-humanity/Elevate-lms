import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Non-Compete Agreement | Elevate For Humanity',
  description:
    'Non-Compete Agreement for Elevate for Humanity partners and stakeholders.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/legal/non-compete',
  },
};

export default function NonCompetePage() {
  return (
    <div className="min-h-screen bg-white py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Non Compete" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-brand-blue-600 hover:text-brand-blue-800 mb-6 inline-block"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-black mb-8">
          Non-Compete Agreement
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
              This Non-Compete Agreement ("Agreement") protects the proprietary
              interests, trade secrets, and competitive position of Elevate for
              Humanity ("Company") by restricting certain competitive activities
              of partners, contractors, and stakeholders ("Restricted Party").
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              2. Restricted Activities
            </h2>
            <p className="text-black mb-4">
              During the term of engagement and for twelve (12) months
              thereafter, the Restricted Party agrees not to:
            </p>
            <ul className="list-disc pl-6 text-black space-y-2 mb-4">
              <li>
                Directly compete with Company's apprenticeship training programs
              </li>
              <li>
                Solicit Company's students, partners, or staff for competing
                purposes
              </li>
              <li>
                Use Company's proprietary methods, materials, or systems for
                competitive advantage
              </li>
              <li>
                Establish or operate a similar apprenticeship program in Indiana
              </li>
              <li>
                Disclose or use Company's confidential business information
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              3. Geographic Scope
            </h2>
            <p className="text-black mb-4">
              This Agreement applies within the State of Indiana and any other
              states where Company actively operates apprenticeship programs.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              4. Permitted Activities
            </h2>
            <p className="text-black mb-4">
              This Agreement does not restrict:
            </p>
            <ul className="list-disc pl-6 text-black space-y-2 mb-4">
              <li>
                General employment in the barbering or cosmetology industry
              </li>
              <li>
                Operating a barbershop or salon that is not a training facility
              </li>
              <li>Participation in non-competing educational programs</li>
              <li>
                Activities that do not directly compete with Company's core
                business
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              5. Consideration
            </h2>
            <p className="text-black mb-4">
              In exchange for this Agreement, the Restricted Party receives:
            </p>
            <ul className="list-disc pl-6 text-black space-y-2 mb-4">
              <li>
                Access to Company's proprietary training systems and materials
              </li>
              <li>Business relationships and partnership opportunities</li>
              <li>Confidential business information and trade secrets</li>
              <li>Ongoing support and resources</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              6. Duration
            </h2>
            <p className="text-black mb-4">
              This Agreement remains in effect during the term of the
              relationship and for twelve (12) months following termination or
              conclusion of the relationship.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              7. Remedies
            </h2>
            <p className="text-black mb-4">
              Breach of this Agreement may result in:
            </p>
            <ul className="list-disc pl-6 text-black space-y-2 mb-4">
              <li>Immediate termination of relationship with Company</li>
              <li>Injunctive relief to prevent ongoing violations</li>
              <li>Monetary damages for losses incurred</li>
              <li>Recovery of attorney's fees and costs</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              8. Severability
            </h2>
            <p className="text-black mb-4">
              If any provision of this Agreement is found to be unenforceable,
              the remaining provisions shall remain in full force and effect.
              Any unenforceable provision shall be modified to the minimum
              extent necessary to make it enforceable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              9. Governing Law
            </h2>
            <p className="text-black mb-4">
              This Agreement shall be governed by and construed in accordance
              with the laws of the State of Indiana.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              10. Contact Information
            </h2>
            <p className="text-black mb-4">
              For questions regarding this Non-Compete Agreement, please
              contact:
            </p>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-black">
                <strong>Elevate for Humanity</strong>
                <br />
                Email: elevate4humanityedu@gmail.com
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
