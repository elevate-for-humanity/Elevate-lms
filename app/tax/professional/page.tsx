
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';

export const metadata = {
  title: 'Professional Tax Services | Supersonic Fast Cash',
  description: 'Professional paid tax preparation services for complex returns.',
};

export default function ProfessionalTaxPage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Tax", href: "/tax" }, { label: "Professional" }]} />
      </div>
{/* Hero */}
      <section className="relative h-[400px] w-full overflow-hidden">
        <Image src="/images/pathways/business-hero.jpg" alt="Professional Tax Services" fill className="object-cover" quality={85} loading="lazy" />
        
        
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h2 className="text-2xl font-bold mb-6">Professional Tax Preparation</h2>
            <p className="text-black mb-6">
              For returns that don't qualify for free VITA services, we offer professional tax preparation through Supersonic Fast Cash.
            </p>
            <div className="bg-brand-orange-50 rounded-lg p-6 border border-brand-orange-200 mb-6">
              <h3 className="text-xl font-semibold mb-3">Services Include</h3>
              <ul className="list-disc list-inside space-y-2 text-black">
                <li>Individual and business tax returns</li>
                <li>Self-employment income</li>
                <li>Rental property income</li>
                <li>Investment income and capital gains</li>
                <li>Multi-state returns</li>
                <li>Amended returns</li>
                <li>Tax planning and consultation</li>
              </ul>
            </div>
            <div className="flex gap-4">
              <Link
                href="/supersonic-fast-cash"
                className="inline-block bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Visit Supersonic Fast Cash
              </Link>
              <Link
                href="/supersonic-fast-cash/book-appointment"
                className="inline-block bg-gray-200 hover:bg-gray-300 text-black px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
