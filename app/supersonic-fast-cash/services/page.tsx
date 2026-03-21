import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, DollarSign, Building, Calculator, Shield, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tax Services | Supersonic Fast Cash',
  description:
    'Professional tax preparation, refund advances, business returns, and more. PTIN-credentialed preparers serving Indianapolis and all 50 states.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/services',
  },
};

const services = [
  {
    icon: FileText,
    name: 'Individual Tax Preparation',
    price: 'Contact for Pricing',
    description: 'Personal tax returns filed accurately and on time',
    href: '/supersonic-fast-cash/services/tax-preparation',
    features: [
      'W-2 and 1099 income',
      'Itemized deductions',
      'Investment income',
      'Rental property',
      'Self-employment income',
      'E-file included',
    ],
  },
  {
    icon: DollarSign,
    name: 'Tax Refund Advance',
    price: 'Up to $7,500',
    description: 'Get your refund faster with our advance program',
    href: '/supersonic-fast-cash/services/refund-advance',
    features: [
      'Same-day funding',
      'No credit check',
      'Simple approval',
      'Tax prep included',
      'Direct deposit or check',
      'Fees paid from refund',
    ],
  },
  {
    icon: Building,
    name: 'Business Tax Returns',
    price: 'Contact for Pricing',
    description: 'Complete business tax solutions for all entity types',
    href: '/supersonic-fast-cash/book-appointment',
    features: [
      'LLC, S-Corp, C-Corp',
      'Partnership returns',
      'Sole proprietor',
      'Quarterly estimates',
      'Bookkeeping services',
      'Payroll tax filing',
    ],
  },
  {
    icon: Calculator,
    name: 'Bookkeeping Services',
    price: 'Starting at $199/month',
    description: 'Professional bookkeeping to keep your business organized',
    href: '/supersonic-fast-cash/services/bookkeeping',
    features: [
      'Monthly reconciliation',
      'Financial statements',
      'Expense tracking',
      'Invoice management',
      'QuickBooks setup',
      'Year-end reports',
    ],
  },
  {
    icon: Shield,
    name: 'IRS Audit Protection',
    price: '$49/year',
    description: 'Licensed Enrolled Agent representation before the IRS',
    href: '/supersonic-fast-cash/services/audit-protection',
    features: [
      'Licensed EA representation',
      'IRS audit defense',
      'State audit support',
      'Document preparation',
      'Direct IRS communication',
      'Resolution assistance',
    ],
  },
  {
    icon: Clock,
    name: 'Prior Year Returns',
    price: 'Contact for Pricing',
    description: 'Catch up on unfiled tax returns from previous years',
    features: [
      'Any tax year',
      'Penalty reduction help',
      'Payment plan setup',
      'IRS negotiation',
      'State returns included',
      'Fast turnaround',
    ],
  },
];

export default async function ServicesPage() {
  let dbServices = null;
  
  try {
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (supabase) {
      const { data } = await db
        .from('tax_services')
        .select('*')
        .eq('company', 'supersonic');
      dbServices = data;
    }
  } catch (error) {
    console.error('Error fetching services:', error);
  }

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Services" }]} />
      </div>
{/* Hero */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
        <Image alt="Tax preparation services" 
          src="/images/pages/supersonic-fast-cash-page-1.jpg" 
          alt="Professional Tax Services" 
          fill
          className="object-cover" 
          quality={85}
          priority
        />
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <service.icon className="w-7 h-7 text-brand-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">
                  {service.name}
                </h3>
                <div className="text-2xl font-bold text-brand-blue-600 mb-4">
                  {service.price}
                </div>
                <p className="text-black mb-6">{service.description}</p>
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-black"
                    >
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={service.href || '/supersonic-fast-cash/book-appointment'}
                  className="block w-full text-center px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
                >
                  {service.href ? 'Learn More' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">
              Why Choose Supersonic Fast Cash?
            </h2>
            <p className="text-xl text-black">
              Professional service, competitive pricing, and personalized
              attention
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                PTIN-Credentialed
              </h3>
              <p className="text-black">
                All preparers are PTIN-credentialed with years of experience
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-brand-green-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                Maximum Refund
              </h3>
              <p className="text-black">
                We find every deduction and credit you deserve
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                Fast Service
              </h3>
              <p className="text-black">
                Most returns completed within 24-48 hours
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-orange-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to Get Started?</h2>
          <p className="text-lg text-white mb-8">
            Schedule your appointment today or contact us for immediate assistance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/book-appointment"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-orange-500 font-bold rounded hover:bg-white transition-colors"
            >
              Book Appointment
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-bold rounded hover:bg-brand-orange-600 transition-colors border-2 border-white"
            >
              Call (317) 314-3757
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

