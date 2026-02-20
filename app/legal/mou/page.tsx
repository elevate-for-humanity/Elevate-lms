
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Memorandum of Understanding | Elevate For Humanity',
  description:
    'Memorandum of Understanding for Elevate for Humanity partnerships.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/legal/mou',
  },
};

export default function MOUPage() {

  return (
    <div className="min-h-screen bg-white py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Legal", href: "/legal" }, { label: "Mou" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-brand-blue-600 hover:text-brand-blue-800 mb-6 inline-block"
        >
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-black mb-8">
          Memorandum of Understanding
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
              This Memorandum of Understanding ("MOU") establishes a
              collaborative partnership between Elevate for Humanity ("EFH") and
              the partnering organization ("Partner") to provide apprenticeship
              training and workforce development services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              2. Parties
            </h2>
            <div className="bg-slate-50 p-4 rounded-lg mb-4">
              <p className="text-black mb-2">
                <strong>Elevate for Humanity</strong>
                <br />
                Registered Apprenticeship Sponsor
                <br />
                Indiana RAPIDS Program
              </p>
            </div>
            <p className="text-black">
              And the partnering organization as identified in the executed
              agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              3. Scope of Partnership
            </h2>
            <p className="text-black mb-4">
              The parties agree to collaborate on:
            </p>
            <ul className="list-disc pl-6 text-black space-y-2 mb-4">
              <li>Registered apprenticeship training programs</li>
              <li>Student recruitment and enrollment</li>
              <li>Training site coordination and oversight</li>
              <li>Compliance with state and federal regulations</li>
              <li>Quality assurance and program evaluation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              4. EFH Responsibilities
            </h2>
            <p className="text-black mb-4">
              Elevate for Humanity agrees to:
            </p>
            <ul className="list-disc pl-6 text-black space-y-2 mb-4">
              <li>Serve as the registered apprenticeship sponsor</li>
              <li>Provide curriculum and training materials</li>
              <li>Maintain RAPIDS registration and compliance</li>
              <li>Process student enrollments and track progress</li>
              <li>Provide technical support and platform access</li>
              <li>Coordinate with funding sources (WIOA, WRG, etc.)</li>
              <li>Issue certificates upon program completion</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              5. Partner Responsibilities
            </h2>
            <p className="text-black mb-4">The Partner agrees to:</p>
            <ul className="list-disc pl-6 text-black space-y-2 mb-4">
              <li>Provide qualified training sites and supervisors</li>
              <li>Ensure compliance with safety and licensing requirements</li>
              <li>Submit required documentation and reports</li>
              <li>Maintain appropriate insurance coverage</li>
              <li>Cooperate with program monitoring and evaluation</li>
              <li>Adhere to EFH policies and procedures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              6. Student Services
            </h2>
            <p className="text-black mb-4">
              Both parties commit to providing students with:
            </p>
            <ul className="list-disc pl-6 text-black space-y-2 mb-4">
              <li>Quality training and mentorship</li>
              <li>Safe and professional learning environments</li>
              <li>Clear expectations and progress tracking</li>
              <li>Support services and resources</li>
              <li>Preparation for state licensing examinations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              7. Compliance
            </h2>
            <p className="text-black mb-4">
              Both parties agree to comply with:
            </p>
            <ul className="list-disc pl-6 text-black space-y-2 mb-4">
              <li>Indiana Professional Licensing Agency regulations</li>
              <li>U.S. Department of Labor apprenticeship standards</li>
              <li>WIOA and workforce development requirements</li>
              <li>Equal opportunity and non-discrimination laws</li>
              <li>Data privacy and security regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              8. Term and Termination
            </h2>
            <p className="text-black mb-4">
              This MOU shall remain in effect for one (1) year from the date of
              execution and may be renewed by mutual agreement. Either party may
              terminate this MOU with thirty (30) days written notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              9. Amendments
            </h2>
            <p className="text-black mb-4">
              This MOU may be amended only by written agreement signed by
              authorized representatives of both parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-4">
              10. Contact Information
            </h2>
            <p className="text-black mb-4">
              For questions regarding this Memorandum of Understanding, please
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
