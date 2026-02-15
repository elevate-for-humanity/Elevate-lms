import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '2026 Program Calendar & Funding Pathways',
  description: 'Upcoming workforce training cohorts and funding options for 2026',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/updates/2026/01/program-calendar',
  },
};

export default function ProgramCalendar() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/updates" className="text-orange-600 hover:text-orange-700 mb-4 inline-block">
        ← Back to Updates
      </Link>
      
      <h1 className="text-3xl font-bold mb-4">
        2026 Program Calendar & Funding Pathways
      </h1>
      
      <time className="text-black block mb-6">January 8, 2026</time>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-black leading-relaxed mb-6">
          Elevate for Humanity will offer workforce training cohorts across healthcare, skilled trades, 
          and technology sectors throughout 2026. Programs are designed to meet industry demand and 
          prepare participants for immediate employment.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Healthcare Programs</h2>
        <ul className="list-disc pl-6 space-y-2 text-black">
          <li>Certified Nursing Assistant (CNA) - 6-8 weeks</li>
          <li>Medical Assistant - 12 weeks</li>
          <li>Phlebotomy Technician - 8 weeks</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Skilled Trades</h2>
        <ul className="list-disc pl-6 space-y-2 text-black">
          <li>HVAC Technician - 16 weeks</li>
          <li>Electrical Apprenticeship - 24 weeks</li>
          <li>Welding Certification - 12 weeks</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Technology</h2>
        <ul className="list-disc pl-6 space-y-2 text-black">
          <li>IT Support Specialist - 12 weeks</li>
          <li>Cybersecurity Fundamentals - 16 weeks</li>
          <li>Web Development - 20 weeks</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Funding Options</h2>
        <p className="text-black leading-relaxed mb-4">
          Training is available at no cost to eligible participants through:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-black">
          <li><strong>WIOA (Workforce Innovation and Opportunity Act)</strong> - Federal workforce funding</li>
          <li><strong>Next Level Jobs</strong> - Indiana state-funded training</li>
          <li><strong>Employer Sponsorship</strong> - Company-paid training for new hires</li>
          <li><strong>Veterans Benefits</strong> - GI Bill and VA vocational rehabilitation</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">How to Apply</h2>
        <p className="text-black leading-relaxed mb-4">
          Applications are accepted on a rolling basis. Cohorts start monthly based on enrollment.
        </p>
        <Link 
          href="/apply" 
          className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
        >
          Start Your Application
        </Link>
      </div>
    </article>
  );
}
