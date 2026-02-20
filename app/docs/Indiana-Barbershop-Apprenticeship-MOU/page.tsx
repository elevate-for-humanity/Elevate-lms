'use client';

import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';

import { createBrowserClient } from '@supabase/ssr';
export default function MOUPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('documentation').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Docs", href: "/docs" }, { label: "Indiana Barbershop Apprenticeship Mou" }]} />
      </div>
{/* Print-hidden header */}
      <div className="print:hidden bg-gray-100 py-4 border-b">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <Link href="/partners/barbershop-apprenticeship" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> Back to Partner Info
          </Link>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* MOU Content */}
      <div className="max-w-4xl mx-auto px-8 py-12 print:py-0 print:px-0">
        <div className="prose prose-sm max-w-none">
          <h1 className="text-center text-2xl font-bold mb-2">MEMORANDUM OF UNDERSTANDING</h1>
          <h2 className="text-center text-lg font-semibold mb-1">Indiana Barbershop Apprenticeship Program</h2>
          <h3 className="text-center text-base mb-8">Worksite Partner Agreement</h3>

          <hr className="my-6" />

          <p><strong>Between:</strong></p>
          <ul>
            <li><strong>Sponsor:</strong> Elevate for Humanity, Inc. (&quot;Sponsor&quot;)</li>
            <li><strong>Worksite Partner:</strong> _________________________________ (&quot;Shop&quot;)</li>
          </ul>
          <p><strong>Effective Date:</strong> _________________</p>

          <hr className="my-6" />

          <h2>1. PURPOSE</h2>
          <p>This Memorandum of Understanding (&quot;MOU&quot;) establishes the terms and conditions under which the Shop will serve as a worksite partner for the Indiana Barbershop Apprenticeship Program, a USDOL Registered Apprenticeship sponsored by Elevate for Humanity.</p>

          <h2>2. PROGRAM OVERVIEW</h2>
          <p>The Indiana Barbershop Apprenticeship Program is a structured training program that combines:</p>
          <ul>
            <li><strong>2,000 hours</strong> of on-the-job training (OJT) at the worksite</li>
            <li><strong>Related Technical Instruction (RTI)</strong> coordinated by the Sponsor</li>
            <li>Progressive skill development tracked through competency assessments</li>
          </ul>

          <h2>3. SPONSOR RESPONSIBILITIES</h2>
          <p>Elevate for Humanity, as the Sponsor of Record, agrees to:</p>
          <h3>Registration &amp; Compliance</h3>
          <ul>
            <li>Maintain USDOL/RAPIDS registration for the apprenticeship program</li>
            <li>Handle all required reporting to state and federal agencies</li>
            <li>Ensure program compliance with applicable regulations</li>
          </ul>
          <h3>Related Instruction</h3>
          <ul>
            <li>Coordinate and provide access to required classroom/online instruction</li>
            <li>Track completion of related instruction requirements</li>
            <li>Provide learning materials and resources</li>
          </ul>
          <h3>Documentation &amp; Support</h3>
          <ul>
            <li>Maintain official apprenticeship records</li>
            <li>Issue completion certificates upon program finish</li>
            <li>Provide ongoing support and troubleshooting</li>
            <li>Conduct periodic check-ins and site visits</li>
          </ul>
          <h3>Apprentice Recruitment</h3>
          <ul>
            <li>Screen and refer qualified apprentice candidates</li>
            <li>Verify apprentice eligibility for the program</li>
            <li>Facilitate matching between apprentices and worksites</li>
          </ul>

          <h2>4. WORKSITE PARTNER RESPONSIBILITIES</h2>
          <p>The Shop agrees to:</p>
          <h3>Supervision</h3>
          <ul>
            <li>Provide direct supervision by a licensed barber during all productive work hours</li>
            <li>Ensure the supervising barber has a minimum of 2 years licensed experience</li>
            <li>Maintain appropriate supervisor-to-apprentice ratios</li>
          </ul>
          <h3>Compensation</h3>
          <ul>
            <li>Pay the apprentice according to the agreed compensation model</li>
            <li>Ensure all compensation meets or exceeds applicable minimum wage requirements</li>
            <li>Maintain accurate payroll records</li>
          </ul>
          <p className="bg-yellow-50 p-3 border-l-4 border-yellow-500"><strong>Note:</strong> Apprentices are paid employees. This is NOT unpaid labor.</p>
          <h3>Training &amp; Development</h3>
          <ul>
            <li>Provide structured on-the-job training opportunities</li>
            <li>Allow apprentice to practice and develop required competencies</li>
            <li>Support apprentice attendance at related instruction</li>
          </ul>
          <h3>Hour Verification</h3>
          <ul>
            <li>Accurately track and verify hours worked</li>
            <li>Sign off on competencies demonstrated</li>
            <li>Submit hour verification reports as required by Sponsor</li>
          </ul>
          <h3>Workplace Standards</h3>
          <ul>
            <li>Maintain a safe, professional workplace environment</li>
            <li>Carry workers&apos; compensation insurance</li>
            <li>Comply with all applicable health and safety regulations</li>
            <li>Maintain required business licenses in good standing</li>
          </ul>
          <h3>Communication</h3>
          <ul>
            <li>Notify Sponsor promptly of any issues or concerns</li>
            <li>Cooperate with Sponsor for documentation and compliance</li>
            <li>Allow Sponsor site visits for quality assurance</li>
            <li>Respond to Sponsor inquiries in a timely manner</li>
          </ul>

          <h2>5. COMPENSATION MODELS</h2>
          <p>The Shop may compensate the apprentice using one of the following models:</p>
          <ul>
            <li><strong>Hourly Wage:</strong> Fixed hourly rate for all hours worked</li>
            <li><strong>Commission:</strong> Percentage of services performed (must meet minimum wage when averaged)</li>
            <li><strong>Hybrid:</strong> Base hourly rate plus commission on services</li>
          </ul>
          <p><strong>Selected Model:</strong> ☐ Hourly  ☐ Commission  ☐ Hybrid</p>
          <p><strong>Agreed Rate/Terms:</strong> _________________________________________________</p>
          <p className="bg-amber-50 p-3 border-l-4 border-amber-500"><strong>IMPORTANT:</strong> All compensation structures must comply with applicable federal and Indiana wage and labor laws. Commission-based models must ensure the apprentice earns at least minimum wage when averaged over the pay period.</p>

          <h2>6. TERM AND TERMINATION</h2>
          <p><strong>Term:</strong> This MOU is effective from the date signed until the apprentice completes the program or the agreement is terminated.</p>
          <p><strong>Termination by Either Party:</strong> Either party may terminate this MOU with 14 days written notice.</p>
          <p><strong>Immediate Termination:</strong> The Sponsor may immediately terminate this MOU if the Shop fails to pay the apprentice as agreed, violates safety or labor regulations, loses required licenses or insurance, or engages in misconduct affecting the apprentice.</p>
          <p><strong>Effect of Termination:</strong> Upon termination, the Sponsor will work to reassign the apprentice to another approved worksite if possible.</p>

          <h2>7. CONFIDENTIALITY</h2>
          <p>Both parties agree to maintain confidentiality of apprentice personal information and business proprietary information, except as required for program administration or by law.</p>

          <h2>8. INDEMNIFICATION</h2>
          <p>Each party agrees to indemnify and hold harmless the other party from claims arising from their own negligence or willful misconduct in connection with this MOU.</p>

          <h2>9. DISPUTE RESOLUTION</h2>
          <p>The parties agree to attempt to resolve any disputes through good faith negotiation. If unresolved, disputes may be submitted to mediation before pursuing other remedies.</p>

          <h2>10. AMENDMENTS</h2>
          <p>This MOU may only be amended in writing signed by both parties.</p>

          <h2>11. ENTIRE AGREEMENT</h2>
          <p>This MOU constitutes the entire agreement between the parties regarding the subject matter herein and supersedes all prior agreements and understandings.</p>

          <hr className="my-8" />

          <h2>SIGNATURES</h2>

          <div className="mt-8">
            <p><strong>SPONSOR: Elevate for Humanity, Inc.</strong></p>
            <p className="mt-4">Signature: _________________________________</p>
            <p>Printed Name: _________________________________</p>
            <p>Title: _________________________________</p>
            <p>Date: _________________________________</p>
          </div>

          <hr className="my-6" />

          <div className="mt-8">
            <p><strong>WORKSITE PARTNER:</strong></p>
            <p>Shop Name: _________________________________</p>
            <p className="mt-4">Signature: _________________________________</p>
            <p>Printed Name: _________________________________</p>
            <p>Title: _________________________________</p>
            <p>Date: _________________________________</p>
          </div>

          <hr className="my-6" />

          <div className="mt-8">
            <p><strong>SUPERVISING BARBER:</strong></p>
            <p className="mt-4">Signature: _________________________________</p>
            <p>Printed Name: _________________________________</p>
            <p>Indiana License #: _________________________________</p>
            <p>Date: _________________________________</p>
          </div>

          <hr className="my-8" />

          <p className="text-sm text-gray-600 italic">This document is a template. The official MOU will be provided for electronic signature upon application approval.</p>
          <p className="text-sm"><strong>Questions?</strong> Contact: our contact form | (317) 314-3757</p>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Elevate for Humanity, Inc.</p>
            <p>Indianapolis, Indiana</p>
            <p>www.elevateforhumanity.org</p>
          </div>
        </div>
      </div>
    </div>
  );
}
