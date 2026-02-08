import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Workforce Ready Grant Policy | Elevate for Humanity',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/wrg',
  },
};

export default function WRGPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Policies', href: '/policies' }, { label: 'WRG' }]} />
        <article className="prose prose-lg max-w-none mt-6">
      <h1>Workforce Ready Grant Policy</h1>
      <p className="text-black">Last Updated: December 22, 2024</p>
      <h2>Overview</h2>
      <p>Indiana Workforce Ready Grant provides tuition assistance for high-value certificates in high-demand fields.</p>
      <h2>Eligibility</h2>
      <ul>
        <li>Indiana resident</li>
        <li>U.S. citizen or eligible non-citizen</li>
        <li>High school diploma or equivalent</li>
        <li>Enrolled in eligible program</li>
      </ul>
      <h2>Award Amount</h2>
      <p>Up to $7,500 per year for tuition and fees.</p>
      <h2>Contact</h2>
      <p>Email: elevate4humanityedu@gmail.com | Phone: Contact Us</p>
        </article>
      </div>
    </div>
  );
}
