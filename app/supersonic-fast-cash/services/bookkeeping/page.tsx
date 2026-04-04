import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calculator,
  FileText,
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3,
  Shield,
  Users,
  Zap,
  ArrowRight,
  Calendar,
  Phone,
  Mail,
CheckCircle, } from 'lucide-react';

export const metadata = {
  title: 'Professional Bookkeeping Services | Supersonic Fast Cash',
  description:
    'Expert bookkeeping services for small businesses. Monthly financial statements, expense tracking, bank reconciliation, payroll processing, and QuickBooks support.',
  keywords: ['bookkeeping services', 'small business accounting', 'financial records', 'expense tracking', 'QuickBooks', 'payroll processing', 'bank reconciliation'],
};

export default function BookkeepingPage() {
  // Static services list
  const services = [
    {
      icon: FileText,
      title: 'Monthly Financial Statements',
      description:
        'Detailed profit & loss statements, balance sheets, and cash flow reports delivered monthly',
      features: [
        'Income statements',
        'Balance sheets',
        'Cash flow analysis',
        'Custom reporting',
      ],
    },
    {
      icon: Calculator,
      title: 'Expense Tracking',
      description:
        'Categorize and track all business expenses for tax deductions and financial planning',
      features: [
        'Receipt management',
        'Expense categorization',
        'Vendor tracking',
        'Mileage logs',
      ],
    },
    {
      icon: DollarSign,
      title: 'Bank Reconciliation',
      description:
        'Match your bank statements with your books to ensure accuracy and catch errors',
      features: [
        'Daily transaction matching',
        'Error detection',
        'Fraud prevention',
        'Multi-account support',
      ],
    },
    {
      icon: Users,
      title: 'Accounts Payable/Receivable',
      description:
        'Manage bills, invoices, and payments to maintain healthy cash flow',
      features: [
        'Invoice creation',
        'Payment tracking',
        'Aging reports',
        'Collection support',
      ],
    },
    {
      icon: TrendingUp,
      title: 'Payroll Processing',
      description:
        'Accurate payroll calculations, tax withholdings, and compliance reporting',
      features: [
        'Employee payments',
        'Tax calculations',
        'Direct deposit',
        'W-2/1099 preparation',
      ],
    },
    {
      icon: BarChart3,
      title: 'QuickBooks Support',
      description:
        'Setup, training, and ongoing support for QuickBooks Online or Desktop',
      features: [
        'Initial setup',
        'Chart of accounts',
        'User training',
        'Troubleshooting',
      ],
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Save Time',
      description:
        'Focus on growing your business while we handle the books. Most clients save 10-15 hours per month.',
    },
    {
      icon: Shield,
      title: 'Reduce Errors',
      description:
        'Professional bookkeepers catch mistakes before they become costly problems. Accuracy guaranteed.',
    },
    {
      icon: DollarSign,
      title: 'Maximize Deductions',
      description:
        'Proper categorization ensures you claim every legitimate business expense at tax time.',
    },
    {
      icon: Zap,
      title: 'Real-Time Insights',
      description:
        'Know your financial position at any time with up-to-date books and monthly reports.',
    },
  ];

  const pricing = [
    {
      name: 'Starter',
      price: '$199',
      period: '/month',
      description: 'Perfect for new businesses with simple needs',
      features: [
        'Up to 50 transactions/month',
        'Monthly financial statements',
        'Bank reconciliation',
        'Expense categorization',
        'Email support',
      ],
      cta: 'Get Started',
    },
    {
      name: 'Professional',
      price: '$399',
      period: '/month',
      description: 'Ideal for growing businesses',
      features: [
        'Up to 150 transactions/month',
        'All Starter features',
        'Accounts payable/receivable',
        'Payroll processing (up to 5 employees)',
        'QuickBooks setup',
        'Phone support',
      ],
      cta: 'Get Started',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For established businesses with complex needs',
      features: [
        'Unlimited transactions',
        'All Professional features',
        'Multi-entity support',
        'Custom reporting',
        'Dedicated bookkeeper',
        'Priority support',
      ],
      cta: 'Contact Us',
    },
  ];

  const process = [
    {
      step: 1,
      title: 'Initial Consultation',
      description:
        'We discuss your business, current bookkeeping situation, and specific needs.',
    },
    {
      step: 2,
      title: 'Setup & Onboarding',
      description:
        'Connect your bank accounts, credit cards, and accounting software. We clean up any backlog.',
    },
    {
      step: 3,
      title: 'Ongoing Management',
      description:
        'We handle daily bookkeeping tasks, categorize transactions, and maintain accurate records.',
    },
    {
      step: 4,
      title: 'Monthly Reporting',
      description:
        'Receive detailed financial statements and review them with your bookkeeper.',
    },
  ];

  const industries = [
    'Retail & E-commerce',
    'Professional Services',
    'Construction & Trades',
    'Healthcare & Medical',
    'Real Estate',
    'Restaurants & Hospitality',
    'Technology & Software',
    'Manufacturing',
    'Nonprofit Organizations',
    'Consulting & Coaching',
  ];

  const faqs = [
    {
      question: 'What\'s the difference between bookkeeping and accounting?',
      answer:
        'Bookkeeping focuses on recording daily financial transactions, while accounting involves interpreting, analyzing, and reporting that data. We provide bookkeeping services and work with your CPA for tax preparation and strategic planning.',
    },
    {
      question: 'Do I need to use QuickBooks?',
      answer:
        'QuickBooks is our preferred platform, but we can work with other accounting software like Xero, FreshBooks, or Wave. We\'ll recommend the best solution for your business size and needs.',
    },
    {
      question: 'How quickly can you get started?',
      answer:
        'Most clients are fully onboarded within 1-2 weeks. If you have backlogged books, we can catch you up as part of the setup process.',
    },
    {
      question: 'What information do you need from me?',
      answer:
        'We need access to your bank accounts, credit cards, and any existing accounting software. You\'ll also provide receipts and documentation for business expenses.',
    },
    {
      question: 'Can you handle payroll?',
      answer:
        'Yes! Our Professional and Enterprise plans include payroll processing, tax calculations, direct deposit, and all required filings.',
    },
    {
      question: 'What if I have years of unorganized records?',
      answer:
        'We specialize in cleanup projects. We can catch up your books for any time period, though there may be additional fees for extensive backlog work.',
    },
    {
      question: 'Will you work with my CPA?',
      answer:
        'Absolutely! We collaborate with your CPA to ensure seamless tax preparation. Many CPAs prefer working with professional bookkeepers because it makes their job easier.',
    },
    {
      question: 'What if I need to cancel?',
      answer:
        'Our services are month-to-month with no long-term contracts. Cancel anytime with 30 days notice. We\'ll provide all your financial records in an organized format.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Bookkeeping" }]} />
      </div>
{/* Hero */}
      <section className="relative h-[400px] w-full overflow-hidden">
        <Image
          src="/images/pages/bookkeeping.jpg"
          alt="Bookkeeping"
          fill
          className="object-cover"
          quality={85}
          priority
         sizes="100vw" />
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4">
            Bookkeeping Services
          </h2>
          <p className="text-xl text-black mb-12">
            Complete financial record management for small businesses
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-brand-orange-600 transition"
              >
                <service.icon className="w-12 h-12 text-brand-orange-600 mb-4" />
                <h3 className="text-xl font-bold text-black mb-2">
                  {service.title}
                </h3>
                <p className="text-black mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-black"
                    >
                      <span className="text-black flex-shrink-0">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-12 text-center">
            Why Professional Bookkeeping Matters
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <benefit.icon className="w-16 h-16 text-brand-orange-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-black mb-3">
                  {benefit.title}
                </h3>
                <p className="text-black">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4 text-center">
            Transparent Pricing
          </h2>
          <p className="text-xl text-black mb-12 text-center">
            Choose the plan that fits your business
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {pricing.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 ${
                  plan.popular
                    ? 'border-4 border-brand-orange-600 shadow-xl'
                    : 'border-2 border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="bg-brand-orange-600 text-white text-sm font-bold px-4 py-2 rounded-full inline-block mb-4">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold text-black mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-black text-black">
                    {plan.price}
                  </span>
                  <span className="text-black">{plan.period}</span>
                </div>
                <p className="text-black mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-black flex-shrink-0">•</span>
                      <span className="text-black">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/supersonic-fast-cash/contact"
                  className={`block text-center px-6 py-3 rounded-xl font-bold transition ${
                    plan.popular
                      ? 'bg-brand-orange-600 text-white hover:bg-brand-orange-700'
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4">How It Works</h2>
          <p className="text-xl text-black mb-12">
            Getting started is simple and straightforward
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                  <div className="w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-bold text-black mb-2">
                    {step.title}
                  </h3>
                  <p className="text-black text-sm">{step.description}</p>
                </div>
                {index < process.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 w-8 h-8 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4 text-center">
            Industries We Serve
          </h2>
          <p className="text-xl text-black mb-12 text-center">
            Specialized bookkeeping for your industry
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {industries.map((industry, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 text-center hover:border-brand-orange-600 transition"
              >
                <p className="font-semibold text-black">{industry}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-black mb-3">
                  {faq.question}
                </h3>
                <p className="text-black">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to Get Your Books in Order?
          </h2>
          <p className="text-xl text-white mb-8">
            Schedule a free consultation to discuss your bookkeeping needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-orange-600 px-8 py-4 rounded-xl font-bold hover:bg-white transition"
            >
              Schedule Consultation
              <Calendar className="w-5 h-5" />
            </Link>
            <Link
              href="/supersonic-fast-cash"
              className="inline-flex items-center justify-center gap-2 bg-brand-orange-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-orange-800 transition border-2 border-white"
            >
              All Services
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Phone className="w-8 h-8 text-brand-orange-600 mx-auto mb-3" />
              <h3 className="font-bold text-black mb-2">Contact Us</h3>
              <p className="text-black">(317) 653-5046</p>
            </div>
            <div>
              <Mail className="w-8 h-8 text-brand-orange-600 mx-auto mb-3" />
              <h3 className="font-bold text-black mb-2">Email Us</h3>
              <p className="text-black">bookkeeping@supersonicfastcash.com</p>
            </div>
            <div>
              <Clock className="w-8 h-8 text-brand-orange-600 mx-auto mb-3" />
              <h3 className="font-bold text-black mb-2">Business Hours</h3>
              <p className="text-black">Mon-Fri: 9AM-6PM EST</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
