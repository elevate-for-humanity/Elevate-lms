import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Funding Verification Policy | Elevate for Humanity',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/funding-verification',
  },
};

export default function FundingVerificationPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'Funding Verification' }]} />
        <article className="prose prose-lg max-w-none mt-6">
      <h1>Funding Verification Policy</h1>
      <p className="text-black">Last Updated: December 22, 2024</p>
      <h2>Overview</h2>
      <p>All students must verify funding source before enrollment.</p>
      <h2>Acceptable Funding Sources</h2>
      <ul>
        <li>WIOA voucher</li>
        <li>Workforce Ready Grant</li>
        <li>JRI funding</li>
        <li>Employer sponsorship</li>
        <li>Self-pay</li>
      </ul>
      <h2>Verification Process</h2>
      <ol>
        <li>Submit funding documentation</li>
        <li>Financial aid review (2-3 business days)</li>
        <li>Approval notification</li>
        <li>Enrollment confirmation</li>
      </ol>
      <h2>Contact</h2>
      <p>Email: elevate4humanityedu@gmail.com | Phone: Contact Us</p>
        </article>
      </div>
    </div>
  );
}
