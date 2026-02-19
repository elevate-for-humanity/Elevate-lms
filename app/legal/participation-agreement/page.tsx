import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Participation Agreement | Elevate for Humanity',
};

export default function ParticipationAgreementPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/student-portal/onboarding/agreements" className="text-brand-blue-600 hover:underline mb-6 inline-block">&larr; Back to Agreements</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Participation Agreement</h1>

        <div className="prose prose-slate max-w-none space-y-6">
          <p className="text-slate-600">Effective Date: January 1, 2025</p>

          <h2>1. Purpose</h2>
          <p>This Participation Agreement outlines the expectations and requirements for active participation in Elevate for Humanity career pathway programs.</p>

          <h2>2. Attendance Requirements</h2>
          <ul>
            <li>Students must attend a minimum of 80% of scheduled sessions</li>
            <li>Absences must be reported to the program coordinator within 24 hours</li>
            <li>Three consecutive unexcused absences may result in program probation</li>
            <li>Excessive absences may result in dismissal from the program</li>
          </ul>

          <h2>3. Academic Standards</h2>
          <ul>
            <li>Complete all assignments by their due dates</li>
            <li>Maintain satisfactory progress as defined by the program</li>
            <li>Participate actively in classroom, lab, and employer site day activities</li>
            <li>Seek help from instructors when needed</li>
          </ul>

          <h2>4. Professional Conduct</h2>
          <ul>
            <li>Treat all students, staff, instructors, and employer partners with respect</li>
            <li>Arrive on time and prepared for each session</li>
            <li>Follow all safety protocols, especially during hands-on training</li>
            <li>Dress appropriately per program dress code requirements</li>
            <li>No use of alcohol, drugs, or weapons on any training site</li>
          </ul>

          <h2>5. Technology and LMS Usage</h2>
          <ul>
            <li>Complete all online coursework through the Elevate LMS platform</li>
            <li>Do not share login credentials with others</li>
            <li>Report any technical issues to the program coordinator</li>
          </ul>

          <h2>6. Employer Site Day Expectations</h2>
          <ul>
            <li>Follow all employer site rules and safety requirements</li>
            <li>Represent Elevate for Humanity professionally</li>
            <li>Complete all required site documentation</li>
            <li>Report any incidents or concerns to the program coordinator immediately</li>
          </ul>

          <h2>7. Consequences of Non-Compliance</h2>
          <p>Failure to meet participation requirements may result in:</p>
          <ul>
            <li>Written warning</li>
            <li>Program probation</li>
            <li>Suspension from employer site days</li>
            <li>Dismissal from the program</li>
          </ul>

          <h2>8. Acknowledgment</h2>
          <p>By signing this agreement, the student acknowledges that they have read, understand, and agree to comply with all participation requirements outlined above.</p>
        </div>
      </div>
    </div>
  );
}
