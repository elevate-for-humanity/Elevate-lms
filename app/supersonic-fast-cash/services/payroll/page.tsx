import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  DollarSign,
  FileText,
  Shield,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  AlertCircle,
  Zap,
  ArrowRight,
  Phone,
  Mail,
  Calculator,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Professional Payroll Services | Supersonic Fast Cash',
  description:
    'Expert payroll processing for small businesses. Direct deposit, tax calculations, W-2/1099 preparation, quarterly reports, and full compliance support.',
  keywords: ['payroll services', 'payroll processing', 'direct deposit', 'payroll taxes', 'W-2 preparation', '1099 filing', 'payroll compliance'],
};

export default async function PayrollPage() {
  let dbServices = null;
  
  try {
    const supabase = await createClient();
    if (supabase) {
      const { data } = await supabase
        .from('tax_services')
        .select('*')
        .eq('type', 'payroll');
      dbServices = data;
    }
  } catch (error) {
    console.error('Error fetching payroll services:', error);
  }

  const services = [
    {
      icon: DollarSign,
      title: 'Payroll Processing',
      description:
        'Accurate calculation of wages, overtime, bonuses, and deductions for all employees',
      features: [
        'Hourly & salaried employees',
        'Overtime calculations',
        'Bonus & commission tracking',
        'Multiple pay schedules',
      ],
    },
    {
      icon: Users,
      title: 'Direct Deposit',
      description:
        'Fast, secure electronic payments directly to employee bank accounts',
      features: [
        'Same-day processing',
        'Multiple accounts per employee',
        'Paper check backup',
        'Payment confirmations',
      ],
    },
    {
      icon: Calculator,
      title: 'Tax Calculations',
      description:
        'Automatic calculation and withholding of federal, state, and local taxes',
      features: [
        'Federal income tax',
        'State & local taxes',
        'FICA (Social Security & Medicare)',
        'Unemployment taxes',
      ],
    },
    {
      icon: FileText,
      title: 'Tax Filing',
      description:
        'Timely filing of all required payroll tax forms and payments',
      features: [
        'Form 941 (quarterly)',
        'Form 940 (annual)',
        'State tax returns',
        'Local tax filings',
      ],
    },
    {
      icon: Shield,
      title: 'Compliance Management',
      description:
        'Stay compliant with federal, state, and local payroll regulations',
      features: [
        'New hire reporting',
        'Garnishment processing',
        'Labor law compliance',
        'Audit support',
      ],
    },
    {
      icon: FileText,
      title: 'Year-End Reporting',
      description:
        'W-2 and 1099 preparation and distribution for employees and contractors',
      features: [
        'W-2 preparation',
        '1099-NEC for contractors',
        'Electronic filing',
        'Employee distribution',
      ],
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Save Time',
      description:
        'Payroll processing takes 5-10 hours per pay period. Let us handle it while you focus on your business.',
    },
    {
      icon: Shield,
      title: 'Ensure Compliance',
      description:
        'Avoid costly penalties from missed deadlines or incorrect filings. We stay current on all regulations.',
    },
    {
      icon: DollarSign,
      title: 'Reduce Errors',
      description:
        'Manual payroll calculations lead to mistakes. Our automated system ensures accuracy every time.',
    },
    {
      icon: Zap,
      title: 'Employee Satisfaction',
      description:
        'Employees get paid accurately and on time, with easy access to pay stubs and tax documents.',
    },
  ];

  const pricing = [
    {
      name: 'Basic',
      price: '$49',
      period: '/month + $5/employee',
      description: 'Essential payroll for small teams',
      features: [
        'Up to 10 employees',
        'Monthly payroll processing',
        'Direct deposit',
        'Tax calculations',
        'W-2 preparation',
        'Email support',
      ],
      cta: 'Get Started',
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month + $4/employee',
      description: 'Full-service payroll for growing businesses',
      features: [
        'Unlimited employees',
        'Weekly/bi-weekly/monthly payroll',
        'All Basic features',
        'Tax filing & payments',
        '1099 preparation',
        'Garnishment processing',
        'Phone support',
      ],
      cta: 'Get Started',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Advanced payroll for complex needs',
      features: [
        'All Professional features',
        'Multi-state payroll',
        'Union payroll',
        'Certified payroll',
        'Custom reporting',
        'Dedicated specialist',
        'Priority support',
      ],
      cta: 'Contact Us',
    },
  ];

  const process = [
    {
      step: 1,
      title: 'Setup',
      description:
        'We gather employee information, tax details, and set up your payroll system.',
    },
    {
      step: 2,
      title: 'Submit Hours',
      description:
        'Send us hours worked, PTO, bonuses, or other pay adjustments before each pay period.',
    },
    {
      step: 3,
      title: 'We Process',
      description:
        'We calculate wages, taxes, and deductions, then process direct deposits or checks.',
    },
    {
      step: 4,
      title: 'You Review',
      description:
        'Review payroll reports and approve. We handle all tax filings and payments.',
    },
  ];

  const complianceItems = [
    {
      title: 'Federal Compliance',
      items: [
        'FLSA (Fair Labor Standards Act)',
        'FMLA (Family Medical Leave Act)',
        'ACA (Affordable Care Act)',
        'FICA tax withholding',
      ],
    },
    {
      title: 'State Compliance',
      items: [
        'State income tax withholding',
        'State unemployment insurance',
        'Workers\' compensation',
        'State-specific labor laws',
      ],
    },
    {
      title: 'Local Compliance',
      items: [
        'Local income taxes',
        'City/county regulations',
        'Living wage ordinances',
        'Local reporting requirements',
      ],
    },
  ];

  const faqs = [
    {
      question: 'How quickly can you start processing our payroll?',
      answer:
        'Most businesses are set up and running within 1-2 weeks. We need employee information, tax details, and banking information to get started.',
    },
    {
      question: 'What if we have employees in multiple states?',
      answer:
        'Our Professional and Enterprise plans support multi-state payroll. We handle the different tax rates, regulations, and filing requirements for each state.',
    },
    {
      question: 'Do you handle payroll taxes?',
      answer:
        'Yes! Our Professional and Enterprise plans include calculating, filing, and paying all federal, state, and local payroll taxes on your behalf.',
    },
    {
      question: 'What information do you need from us each pay period?',
      answer:
        'Just send us hours worked for hourly employees, any PTO used, bonuses, commissions, or other pay adjustments. We handle the rest.',
    },
    {
      question: 'Can employees access their pay stubs online?',
      answer:
        'Yes! Employees get secure online access to view and download pay stubs, W-2s, and other payroll documents anytime.',
    },
    {
      question: 'What happens if there\'s a payroll error?',
      answer:
        'While rare, if we make an error, we correct it immediately at no charge and handle any resulting tax adjustments or employee communications.',
    },
    {
      question: 'Do you handle garnishments and child support?',
      answer:
        'Yes, our Professional and Enterprise plans include garnishment processing, child support withholding, and all required reporting.',
    },
    {
      question: 'What if we get audited?',
      answer:
        'We provide full audit support, including documentation, explanations, and assistance responding to IRS or state inquiries.',
    },
  ];

  const commonMistakes = [
    {
      mistake: 'Misclassifying Employees',
      consequence: 'Back taxes, penalties, and legal issues',
      solution: 'We ensure proper classification of employees vs. contractors',
    },
    {
      mistake: 'Missing Tax Deadlines',
      consequence: 'Penalties of 2-15% of taxes owed',
      solution: 'We file all taxes on time, every time',
    },
    {
      mistake: 'Incorrect Tax Calculations',
      consequence: 'IRS penalties and employee frustration',
      solution: 'Automated calculations ensure accuracy',
    },
    {
      mistake: 'Poor Record Keeping',
      consequence: 'Audit problems and compliance issues',
      solution: 'We maintain complete, organized records',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Payroll" }]} />
      </div>
{/* Hero */}
      <section className="relative h-[400px] w-full overflow-hidden">
        <Image
          src="/images/success-new/success-11.jpg"
          alt="Payroll"
          fill
          className="object-cover"
          quality={85}
          priority
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-6 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Professional Payroll Services
            </h1>
            <p className="text-xl mb-6">
              Accurate, compliant payroll processing so you can focus on your
              business
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Direct Deposit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Tax Filing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Full Compliance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4">
            Payroll Services
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Complete payroll management from processing to compliance
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-orange-600 transition"
              >
                <service.icon className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-xl font-bold text-black mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
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
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-12 text-center">
            Why Outsource Payroll?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <benefit.icon className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-black mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4 text-center">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center">
            Choose the plan that fits your business size
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {pricing.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 ${
                  plan.popular
                    ? 'border-4 border-orange-600 shadow-xl'
                    : 'border-2 border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-full inline-block mb-4">
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
                  <span className="text-gray-600 text-sm block">
                    {plan.period}
                  </span>
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/supersonic-fast-cash/contact"
                  className={`block text-center px-6 py-3 rounded-xl font-bold transition ${
                    plan.popular
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
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
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 mb-12">
            Simple payroll processing in four steps
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                  <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-bold text-black mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
                {index < process.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 w-8 h-8 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4 text-center">
            Full Compliance Coverage
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center">
            We handle all federal, state, and local requirements
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {complianceItems.map((category, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-2xl p-6"
              >
                <Shield className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-xl font-bold text-black mb-4">
                  {category.title}
                </h3>
                <ul className="space-y-2">
                  {category.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common Mistakes */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-black text-black mb-4 text-center">
            Avoid Costly Payroll Mistakes
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center">
            Common errors that cost businesses thousands
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {commonMistakes.map((item, index) => (
              <div
                key={index}
                className="bg-white border-2 border-gray-200 rounded-xl p-6"
              >
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-black mb-2">
                      {item.mistake}
                    </h3>
                    <p className="text-red-600 text-sm mb-3">
                      <strong>Risk:</strong> {item.consequence}
                    </p>
                    <p className="text-green-600 text-sm">
                      <strong>Our Solution:</strong> {item.solution}
                    </p>
                  </div>
                </div>
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
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-700 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to Simplify Your Payroll?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Get a free quote and see how much time and money you can save
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-orange-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition"
            >
              Get Free Quote
              <Calendar className="w-5 h-5" />
            </Link>
            <Link
              href="/supersonic-fast-cash"
              className="inline-flex items-center justify-center gap-2 bg-orange-700 text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-800 transition border-2 border-white"
            >
              All Services
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Phone className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-bold text-black mb-2">Contact Us</h3>
              <p className="text-gray-600">(317) 653-5046</p>
            </div>
            <div>
              <Mail className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-bold text-black mb-2">Email Us</h3>
              <p className="text-gray-600">payroll@supersonicfastcash.com</p>
            </div>
            <div>
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-bold text-black mb-2">Business Hours</h3>
              <p className="text-gray-600">Mon-Fri: 9AM-6PM EST</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
