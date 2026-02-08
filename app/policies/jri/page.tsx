import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Justice Reinvestment Initiative Policy | Elevate for Humanity',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/jri',
  },
};

export default function JRIPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'JRI' }]} />
        <article className="prose prose-lg max-w-none mt-6">
          <h1>Justice Reinvestment Initiative Policy</h1>
      <p className="text-black">Last Updated: December 22, 2024</p>
      <h2>Overview</h2>
      <p>JRI funding supports workforce training for justice-involved individuals.</p>
      <h2>Eligibility</h2>
      <ul>
        <li>Currently or formerly incarcerated</li>
        <li>Referred by probation/parole officer</li>
        <li>Committed to program completion</li>
      </ul>
          <h2>Contact</h2>
          <p>Email: elevate4humanityedu@gmail.com | Phone: Contact Us</p>
        </article>
      </div>
    </div>
  );
}
