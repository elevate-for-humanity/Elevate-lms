
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'WIOA Eligibility Policy | Elevate for Humanity',
  description: 'Workforce Innovation and Opportunity Act eligibility requirements',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/wioa',
  },
};

export default function WIOAPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'WIOA' }]} />
        <article className="prose prose-lg max-w-none mt-6">
      <h1>WIOA Eligibility Policy</h1>
      <p className="text-black">Last Updated: December 22, 2024</p>

      <h2>Overview</h2>
      <p>
        The Workforce Innovation and Opportunity Act (WIOA) provides funding for workforce development
        and training programs. This policy outlines eligibility requirements and our compliance procedures.
      </p>

      <h2>Eligibility Requirements</h2>
      <p>To be eligible for WIOA-funded training, you must:</p>
      <ul>
        <li>Be 18 years or older (or 16-17 with special circumstances)</li>
        <li>Be a U.S. citizen or authorized to work in the U.S.</li>
        <li>Be registered with Selective Service (if applicable)</li>
        <li>Meet income requirements (if applicable)</li>
        <li>Require training to obtain or retain employment</li>
      </ul>

      <h2>Priority of Service</h2>
      <p>WIOA gives priority to:</p>
      <ol>
        <li>Veterans and eligible spouses</li>
        <li>Recipients of public assistance</li>
        <li>Low-income individuals</li>
        <li>Individuals who are basic skills deficient</li>
      </ol>

      <h2>Documentation Required</h2>
      <p>You must provide:</p>
      <ul>
        <li>Government-issued photo ID</li>
        <li>Social Security card</li>
        <li>Proof of citizenship or work authorization</li>
        <li>Selective Service registration (males 18-25)</li>
        <li>Income verification (if applicable)</li>
        <li>High school diploma or equivalent (program-dependent)</li>
      </ul>

      <h2>Enrollment Process</h2>
      <ol>
        <li>Complete application with WorkOne Career Center</li>
        <li>Meet with career advisor for assessment</li>
        <li>Receive eligibility determination</li>
        <li>Develop Individual Employment Plan (IEP)</li>
        <li>Enroll in approved training program</li>
      </ol>

      <h2>Participant Responsibilities</h2>
      <p>As a WIOA participant, you must:</p>
      <ul>
        <li>Attend all scheduled classes and activities</li>
        <li>Maintain satisfactory academic progress</li>
        <li>Report changes in contact information</li>
        <li>Participate in follow-up services</li>
        <li>Seek employment upon completion</li>
      </ul>

      <h2>Performance Measures</h2>
      <p>WIOA tracks:</p>
      <ul>
        <li>Training completion rates</li>
        <li>Credential attainment</li>
        <li>Employment placement</li>
        <li>Median earnings</li>
        <li>Employer satisfaction</li>
      </ul>

      <h2>Supportive Services</h2>
      <p>WIOA may provide assistance with:</p>
      <ul>
        <li>Transportation</li>
        <li>Childcare</li>
        <li>Books and supplies</li>
        <li>Testing fees</li>
        <li>Work clothing</li>
      </ul>

      <h2>Grievance Procedure</h2>
      <p>If you have a complaint:</p>
      <ol>
        <li>Contact your career advisor</li>
        <li>Submit written grievance if unresolved</li>
        <li>Receive response within 30 days</li>
        <li>Appeal to state if necessary</li>
      </ol>

      <h2>Contact</h2>
      <p>
        For WIOA eligibility questions:
      </p>
      <p>
        <strong>WorkOne Career Center</strong><br />
        Email: <a href="/contact" className="text-brand-blue-600 hover:underline">Contact Us</a><br />
        Phone: (317) 314-3757
      </p>
        </article>
      </div>
    </div>
  );
}
