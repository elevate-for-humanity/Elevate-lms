import { Metadata } from 'next';
import { Phone } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Enrollment Agreement | Elevate for Humanity',
  description: 'Enrollment agreement terms and conditions for students at Elevate for Humanity. Review before enrolling.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/enrollment-agreement',
  },
};

export default function EnrollmentAgreementPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Enrollment Agreement' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Enrollment Agreement</h1>
          <p className="text-xl text-gray-300">
            Terms and conditions governing your enrollment at Elevate for Humanity
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Introduction */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <p className="text-gray-700">
            This document outlines the terms of enrollment between you (the "Student") and 
            2EXCLUSIVE LLC-S, doing business as Elevate for Humanity (the "School"). 
            By enrolling in a program, you agree to these terms.
          </p>
        </div>

        {/* Section 1: Parties */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Parties to This Agreement</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 mb-4"><strong>School:</strong></p>
            <p className="text-gray-700 mb-1">2EXCLUSIVE LLC-S dba Elevate for Humanity</p>
            <p className="text-gray-700 mb-1">8888 Keystone Crossing, Suite 1300</p>
            <p className="text-gray-700 mb-1">Indianapolis, IN 46240</p>
            <p className="text-gray-700 mb-4">Contact Us</p>
            <p className="text-gray-700"><strong>Student:</strong> As identified in the enrollment application</p>
          </div>
        </section>

        {/* Section 2: Program Information */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Program Information</h2>
          <p className="text-gray-700 mb-4">
            The specific program, duration, schedule, tuition, and fees are detailed in your 
            individual enrollment form and the <Link href="/tuition-fees" className="text-orange-600 hover:underline">Tuition & Fees Schedule</Link>.
          </p>
          <p className="text-gray-700">
            Programs are delivered through <strong>hybrid instruction</strong>, combining online 
            coursework with in-person training. Specific delivery requirements are outlined in 
            your program materials.
          </p>
        </section>

        {/* Section 3: School Obligations */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. School Obligations</h2>
          <p className="text-gray-700 mb-4">Elevate for Humanity agrees to:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Provide instruction as described in the program curriculum</li>
            <li>Maintain qualified instructors for all program components</li>
            <li>Provide access to the Learning Management System (LMS) for online coursework</li>
            <li>Provide necessary training materials as specified in the program description</li>
            <li>Track and document student attendance and progress</li>
            <li>Issue a Certificate of Completion upon successful program completion</li>
            <li>Provide career services and job placement assistance</li>
            <li>Maintain student records in accordance with applicable laws</li>
          </ul>
        </section>

        {/* Section 4: Student Obligations */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Student Obligations</h2>
          <p className="text-gray-700 mb-4">The Student agrees to:</p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Attend all scheduled classes and training sessions as required</li>
            <li>Complete all online coursework and assignments by specified deadlines</li>
            <li>Maintain satisfactory academic progress as defined in the <Link href="/satisfactory-academic-progress" className="text-orange-600 hover:underline">SAP Policy</Link></li>
            <li>Comply with the <Link href="/attendance-policy" className="text-orange-600 hover:underline">Attendance Policy</Link></li>
            <li>Pay all tuition and fees according to the agreed payment schedule</li>
            <li>Conduct themselves professionally and respectfully</li>
            <li>Notify the School promptly of any changes to contact information</li>
            <li>Comply with all School policies and procedures</li>
          </ul>
        </section>

        {/* Section 5: Cancellation and Refund */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cancellation and Refund Policy</h2>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
            <h3 className="font-bold text-gray-900 mb-2">Three-Day Cancellation Right</h3>
            <p className="text-gray-700">
              You have the right to cancel this agreement within <strong>three (3) business days</strong> of 
              signing and receive a full refund of all money paid, with no penalty or obligation.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2">Before Program Start</h4>
              <p className="text-gray-700">
                If you cancel before the program start date (after the 3-day period), you will receive 
                a refund of all tuition paid minus a registration fee of $100.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2">After Program Start</h4>
              <p className="text-gray-700">
                Refunds after the program start date are calculated on a pro-rata basis according to 
                the percentage of the program completed. See the complete <Link href="/refund-policy" className="text-orange-600 hover:underline">Refund Policy</Link> for details.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: No Guarantees */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. No Guarantees</h2>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              <strong>Elevate for Humanity does NOT guarantee:</strong>
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Employment or job placement upon completion</li>
              <li>Specific salary or wage levels</li>
              <li>Passage of any third-party certification or licensing exam</li>
              <li>Transfer of credits to other educational institutions</li>
              <li>State licensure or board certification (these are issued by external bodies)</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Programs that prepare students for third-party certifications (such as EPA 608, CDL, 
              or state licensing exams) provide training aligned to exam requirements, but exam 
              passage is the responsibility of the student.
            </p>
          </div>
        </section>

        {/* Section 7: Credential Awarded */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Credential Awarded</h2>
          <p className="text-gray-700 mb-4">
            Upon successful completion of all program requirements, students will receive a 
            <strong> Certificate of Completion</strong> from Elevate for Humanity.
          </p>
          <p className="text-gray-700">
            This certificate documents that the student has completed the training program. 
            It is not a degree, diploma, or state-issued license. Any third-party certifications 
            or licenses must be obtained separately from the issuing authority.
          </p>
        </section>

        {/* Section 8: Dispute Resolution */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Dispute Resolution</h2>
          <p className="text-gray-700 mb-4">
            Any disputes arising from this agreement shall first be addressed through the 
            School's internal <Link href="/grievance" className="text-orange-600 hover:underline">Grievance Process</Link>.
          </p>
          <p className="text-gray-700">
            If the dispute cannot be resolved internally, either party may file a complaint 
            with the Indiana Commission for Higher Education or pursue other legal remedies 
            available under Indiana law.
          </p>
        </section>

        {/* Section 9: Electronic Agreement */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Electronic Agreement</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              By completing the online enrollment process and clicking "I Agree" or similar 
              acknowledgment, you confirm that:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>You have read and understand this Enrollment Agreement</li>
              <li>You have reviewed the <Link href="/tuition-fees" className="text-orange-600 hover:underline">Tuition & Fees Schedule</Link></li>
              <li>You have reviewed the <Link href="/refund-policy" className="text-orange-600 hover:underline">Refund Policy</Link></li>
              <li>You have reviewed the <Link href="/disclosures" className="text-orange-600 hover:underline">Student Consumer Information</Link></li>
              <li>You agree to be bound by the terms of this agreement</li>
              <li>Your electronic signature has the same legal effect as a handwritten signature</li>
            </ul>
          </div>
        </section>

        {/* Section 10: Amendments */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Amendments</h2>
          <p className="text-gray-700">
            This agreement may not be modified except in writing signed by both parties. 
            The School reserves the right to update policies referenced in this agreement; 
            students will be notified of material changes.
          </p>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t">
          <p className="text-gray-600 text-sm mb-4">
            <strong>Effective Date:</strong> January 2026
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Questions about this agreement? Contact us at Contact Us or elevate4humanityedu@gmail.com
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/disclosures" className="text-orange-600 hover:underline">Student Disclosures</Link>
            <Link href="/tuition-fees" className="text-orange-600 hover:underline">Tuition & Fees</Link>
            <Link href="/refund-policy" className="text-orange-600 hover:underline">Refund Policy</Link>
            <Link href="/grievance" className="text-orange-600 hover:underline">Grievance Policy</Link>
          </div>
        </div>
      {/* CTA Section */}
      <section className="bg-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-blue-100 mb-6">Apply today for free career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Contact Us
            </a>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
