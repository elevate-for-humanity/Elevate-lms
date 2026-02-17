import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  Phone, 
  Mail, 
  Clock, 
  HelpCircle,
  FileText,
  DollarSign,
  Shield,
  ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Support | Supersonic Fast Cash LLC',
  description: 'Get help with tax preparation, filing questions, and refund status. Contact our support team.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/support',
  },
};

const faqs = [
  {
    category: 'Tax Preparation',
    icon: FileText,
    questions: [
      {
        q: 'What documents do I need to file?',
        a: 'You\'ll need W-2s from employers, 1099 forms for other income, Social Security numbers for yourself and dependents, and bank account information for direct deposit.',
      },
      {
        q: 'How long does filing take?',
        a: 'Most returns take 15-45 minutes depending on complexity. Simple W-2 returns are faster. Self-employment or investment income takes longer.',
      },
      {
        q: 'When will I get my refund?',
        a: 'The IRS typically processes e-filed returns in 10-21 days. Direct deposit is faster than paper checks. You can track your refund status after filing.',
      },
    ],
  },
  {
    category: 'Refund Advance',
    icon: DollarSign,
    questions: [
      {
        q: 'Is the refund advance required?',
        a: 'No. The advance is completely optional. You can file your taxes and wait for your refund from the IRS without taking an advance.',
      },
      {
        q: 'Is this a loan?',
        a: 'No. The advance is based on your expected tax refund and is repaid automatically from that refund. You do not make separate payments.',
      },
      {
        q: 'How much can I get?',
        a: 'Advance amounts range from $250 to $7,500 depending on your expected refund and eligibility. The bank determines the final amount.',
      },
      {
        q: 'What if my refund is less than expected?',
        a: 'If the IRS adjusts your refund, you may owe the difference. Advance amounts are typically less than your full expected refund for this reason.',
      },
    ],
  },
  {
    category: 'Account & Security',
    icon: Shield,
    questions: [
      {
        q: 'Is my information secure?',
        a: 'Yes. We use encryption to protect your personal and financial information. Your data is never sold to third parties.',
      },
      {
        q: 'Can I access my return after filing?',
        a: 'Yes. You can download a copy of your filed return from your account at any time.',
      },
    ],
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Support" }]} />
      </div>
{/* Hero */}
      <section className="bg-brand-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            Support Center
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions or contact our team for help.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-10">
            Contact Us
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
              <Phone className="w-8 h-8 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
              <a 
                href="/support" 
                className="text-brand-blue-600 font-medium hover:text-brand-blue-700"
              >
                Get Help Online
              </a>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
              <Mail className="w-8 h-8 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <a 
                href="mailto:support@supersonicfastcash.com" 
                className="text-brand-blue-600 font-medium hover:text-brand-blue-700"
              >
                support@supersonicfastcash.com
              </a>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 text-center">
              <Clock className="w-8 h-8 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Hours</h3>
              <p className="text-gray-600 text-sm">
                Mon-Fri: 9am-6pm EST<br />
                Sat: 10am-4pm EST
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-10">
            Frequently Asked Questions
          </h2>

          <div className="space-y-12">
            {faqs.map((category) => (
              <div key={category.category}>
                <div className="flex items-center gap-3 mb-6">
                  <category.icon className="w-6 h-6 text-brand-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {category.category}
                  </h3>
                </div>

                <div className="space-y-4">
                  {category.questions.map((faq, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white border border-gray-200 rounded-xl p-6"
                    >
                      <div className="flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">{faq.q}</h4>
                          <p className="text-gray-600 text-sm">{faq.a}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-10">
            Quick Links
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <Link 
              href="/supersonic-fast-cash/how-it-works"
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900">How Tax Filing Works</span>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>

            <Link 
              href="/supersonic-fast-cash/pricing"
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900">Pricing</span>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>

            <Link 
              href="/supersonic-fast-cash/cash-advance"
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900">About Refund Advances</span>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>

            <Link 
              href="/supersonic-fast-cash/book-appointment"
              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-900">Schedule Appointment</span>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold text-white mb-4">
            Ready to file?
          </h2>
          <p className="text-brand-blue-200 mb-8">
            Start your tax return today.
          </p>
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-flex items-center justify-center px-8 py-4 bg-brand-red-600 text-white font-semibold rounded-lg hover:bg-brand-red-700 transition-colors"
          >
            Start Tax Preparation
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
