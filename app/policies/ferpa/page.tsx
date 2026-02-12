import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// Force static generation - FERPA is a trust page that must never hang
export const dynamic = 'force-static';
export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
  title: 'FERPA Privacy Policy | Elevate for Humanity',
  description: 'Family Educational Rights and Privacy Act compliance policy',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/ferpa',
  },
};

export default function FERPAPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'FERPA' }]} />
        <article className="prose prose-lg max-w-none mt-6">
      <h1>FERPA Privacy Policy</h1>
      <p className="text-black">Last Updated: December 22, 2024</p>

      <h2>Overview</h2>
      <p>
        Elevate for Humanity complies with the Family Educational Rights and Privacy Act (FERPA),
        which protects the privacy of student education records. This policy explains your rights
        and our responsibilities under FERPA.
      </p>

      <h2>Student Rights Under FERPA</h2>
      <p>Students have the right to:</p>
      <ul>
        <li>Inspect and review their education records within 45 days of request</li>
        <li>Request amendment of records they believe are inaccurate or misleading</li>
        <li>Consent to disclosures of personally identifiable information</li>
        <li>File a complaint with the U.S. Department of Education</li>
      </ul>

      <h2>What Information We Protect</h2>
      <p>Education records include:</p>
      <ul>
        <li>Enrollment information and academic progress</li>
        <li>Grades, test scores, and assessment results</li>
        <li>Course schedules and attendance records</li>
        <li>Financial aid and funding information</li>
        <li>Disciplinary records</li>
      </ul>

      <h2>When We May Disclose Information</h2>
      <p>We may disclose education records without consent to:</p>
      <ul>
        <li>School officials with legitimate educational interest</li>
        <li>Other schools to which a student is transferring</li>
        <li>Authorized representatives for audit or evaluation</li>
        <li>Financial aid organizations</li>
        <li>Organizations conducting studies for the school</li>
        <li>Accrediting organizations</li>
        <li>Comply with judicial orders or lawfully issued subpoenas</li>
        <li>Appropriate officials in health or safety emergencies</li>
      </ul>

      <h2>Directory Information</h2>
      <p>
        We may disclose "directory information" without consent unless you opt out.
        Directory information includes: name, enrollment status, program of study,
        dates of attendance, and credentials earned.
      </p>

      <h2>How to Request Records</h2>
      <p>To inspect your education records:</p>
      <ol>
        <li>Submit a written request to the Registrar</li>
        <li>Specify the records you wish to inspect</li>
        <li>We will arrange access within 45 days</li>
      </ol>

      <h2>How to Request Amendments</h2>
      <p>If you believe a record is inaccurate:</p>
      <ol>
        <li>Submit a written request describing the issue</li>
        <li>We will decide whether to amend within 30 days</li>
        <li>If denied, you may request a hearing</li>
        <li>You may place a statement in your record</li>
      </ol>

      <h2>Data Security</h2>
      <p>
        We maintain physical, electronic, and procedural safeguards to protect education records.
        Access is limited to authorized personnel with legitimate educational interest.
      </p>

      <h2>Third-Party Services</h2>
      <p>
        We use third-party services (learning management systems, payment processors) that may
        access education records. These services are bound by contract to protect student privacy
        and use data only for authorized purposes.
      </p>

      <h2>Retention</h2>
      <p>
        We retain education records for 7 years after a student's last enrollment.
        Transcripts are maintained permanently.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about FERPA or to exercise your rights:
      </p>
      <p>
        <strong>Registrar's Office</strong><br />
        Email: elevate4humanityedu@gmail.com<br />
        Phone: (317) 314-3757
      </p>

      <h2>File a Complaint</h2>
      <p>
        You may file a complaint with the U.S. Department of Education:
      </p>
      <p>
        Family Policy Compliance Office<br />
        U.S. Department of Education<br />
        400 Maryland Avenue, SW<br />
        Washington, DC 20202-8520
      </p>
        </article>
      </div>
    </div>
  );
}
