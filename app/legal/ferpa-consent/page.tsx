
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FERPA Consent | Elevate for Humanity',
};

export default function FerpaConsentPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/student-portal/onboarding/agreements" className="text-brand-blue-600 hover:underline mb-6 inline-block">&larr; Back to Agreements</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-6">FERPA Consent Form</h1>

        <div className="prose prose-slate max-w-none space-y-6">
          <p className="text-slate-600">Family Educational Rights and Privacy Act (20 U.S.C. § 1232g)</p>

          <h2>1. Purpose</h2>
          <p>The Family Educational Rights and Privacy Act (FERPA) protects the privacy of student education records. This consent form authorizes Elevate for Humanity to disclose specific educational records to designated parties for the purposes described below.</p>

          <h2>2. Your Rights Under FERPA</h2>
          <p>As a student, you have the right to:</p>
          <ul>
            <li>Inspect and review your education records</li>
            <li>Request amendment of records you believe are inaccurate</li>
            <li>Consent to disclosure of personally identifiable information</li>
            <li>File a complaint with the U.S. Department of Education if you believe your rights have been violated</li>
          </ul>

          <h2>3. Records That May Be Disclosed</h2>
          <ul>
            <li>Enrollment status and program participation</li>
            <li>Attendance records</li>
            <li>Academic progress and completion status</li>
            <li>Certificates and credentials earned</li>
            <li>Financial aid and funding eligibility information</li>
          </ul>

          <h2>4. Authorized Recipients</h2>
          <p>By signing this consent, you authorize Elevate for Humanity to share the above records with:</p>
          <ul>
            <li><strong>Workforce Development Partners:</strong> WorkOne, Indiana Department of Workforce Development (DWD), and local workforce boards for WIOA compliance and funding verification</li>
            <li><strong>Funding Agencies:</strong> Organizations providing tuition assistance, grants, or sponsorship for your program</li>
            <li><strong>Employer Partners:</strong> Employers participating in employer site days or apprenticeship programs, limited to attendance and progress information</li>
            <li><strong>Accreditation and Compliance Bodies:</strong> As required for program accreditation and regulatory compliance</li>
          </ul>

          <h2>5. Duration</h2>
          <p>This consent remains in effect for the duration of your enrollment and for three (3) years following program completion or withdrawal, unless revoked in writing.</p>

          <h2>6. Revocation</h2>
          <p>You may revoke this consent at any time by submitting a written request to the Program Director. Revocation is not retroactive and does not apply to records already disclosed in reliance on this consent.</p>

          <h2>7. Directory Information</h2>
          <p>Elevate for Humanity may designate the following as directory information, which may be disclosed without consent: student name, program of study, enrollment status, dates of attendance, certificates earned, and honors received. You may opt out of directory information disclosure by notifying the Program Director in writing.</p>

          <h2>8. Contact</h2>
          <p>For questions about your FERPA rights or to submit a records request, contact:</p>
          <p>
            Elevate for Humanity — Program Director<br />
            Email: info@elevateforhumanity.org
          </p>
        </div>
      </div>
    </div>
  );
}
