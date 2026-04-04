
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  FileText, Upload, Calculator, Clock, 
  DollarSign, Shield, Phone, ArrowRight, Zap,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works | SupersonicFastCash Tax Preparation',
  description: 'Get your taxes done in 3 simple steps. Upload documents, we prepare your return, get your refund fast. Same-day refund advances available.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/how-it-works',
  },
};

const steps = [
  {
    number: 1,
    title: 'Gather Your Documents',
    description: 'Collect your W-2s, 1099s, and other tax documents. Not sure what you need? We\'ll help you figure it out.',
    icon: FileText,
    details: [
      'W-2 from each employer',
      '1099 forms (freelance, interest, etc.)',
      'Last year\'s tax return (if available)',
      'Social Security cards for you and dependents',
      'Valid photo ID',
    ],
  },
  {
    number: 2,
    title: 'Upload or Drop Off',
    description: 'Upload your documents securely online or visit one of our locations. We accept walk-ins and appointments.',
    icon: Upload,
    details: [
      'Secure online upload portal',
      'In-person drop-off at any location',
      'Mobile app document scanning',
      'Same-day processing available',
    ],
  },
  {
    number: 3,
    title: 'We Prepare Your Return',
    description: 'Our PTIN-credentialed tax professionals prepare your return, maximizing your refund while ensuring accuracy.',
    icon: Calculator,
    details: [
      'PTIN-credentialed preparers',
      'Maximum refund guarantee',
      'Accuracy guarantee',
      'Review before filing',
    ],
  },
  {
    number: 4,
    title: 'Get Your Refund',
    description: 'Choose how you want your refund: direct deposit, check, or same-day refund advance up to $7,000.',
    icon: DollarSign,
    details: [
      'Direct deposit (fastest)',
      'Paper check',
      'Refund advance (same-day cash)',
      'Prepaid card option',
    ],
  },
];

const features = [
  {
    icon: Zap,
    title: 'Same-Day Refund Advance',
    description: 'Get up to $7,000 the same day you file. No waiting for the IRS.',
  },
  {
    icon: Shield,
    title: 'Accuracy Guarantee',
    description: 'We stand behind our work. If we make an error, we\'ll pay the penalty.',
  },
  {
    icon: Clock,
    title: 'Fast Turnaround',
    description: 'Most returns completed in 30 minutes or less.',
  },
  {
    icon: CheckCircle,
    title: 'Maximum Refund',
    description: 'We find every deduction and credit you qualify for.',
  },
];

export default function HowItWorksPage() {

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'SupersonicFastCash', href: '/supersonic-fast-cash' },
            { label: 'How It Works' }
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-700 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            Tax Prep Made Simple
          </h1>
          <p className="text-xl md:text-2xl text-white mb-8 max-w-3xl mx-auto">
            Get your taxes done in 4 easy steps. Walk in, upload online, or schedule an appointment. 
            Same-day refund advances available.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/apply"
              className="inline-flex items-center gap-2 bg-white text-brand-orange-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-orange-50 transition-colors"
            >
              Start Your Return <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/supersonic-fast-cash/locations"
              className="inline-flex items-center gap-2 bg-brand-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-orange-400 transition-colors border-2 border-white/30"
            >
              Find a Location
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
            4 Simple Steps to Your Refund
          </h2>
          <p className="text-center text-black mb-16 max-w-2xl mx-auto">
            We've streamlined the tax preparation process so you can get your refund faster.
          </p>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className={`flex flex-col lg:flex-row gap-8 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Step Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-brand-orange-100 rounded-2xl flex items-center justify-center">
                      <step.icon className="w-8 h-8 text-brand-orange-600" />
                    </div>
                    <div>
                      <span className="text-brand-orange-600 font-bold text-sm">STEP {step.number}</span>
                      <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                    </div>
                  </div>
                  <p className="text-black text-lg mb-6">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="text-black flex-shrink-0">•</span>
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Step Number Visual */}
                <div className="w-48 h-48 bg-slate-700 rounded-3xl flex items-center justify-center shadow-xl">
                  <span className="text-8xl font-black text-white">{step.number}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">
            Why Choose SupersonicFastCash?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-brand-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-brand-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-black text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Refund Advance Callout */}
      <section className="py-20 bg-slate-700 text-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm font-bold mb-4">
                SAME-DAY CASH
              </span>
              <h2 className="text-3xl md:text-4xl font-black mb-6">
                Get Up to $7,000 Today
              </h2>
              <p className="text-white text-lg mb-6">
                Don't wait weeks for the IRS. With our Refund Advance program, you can get 
                cash in hand the same day you file. No credit check required.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-black flex-shrink-0">•</span>
                  <span>0% APR - No interest charges</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-black flex-shrink-0">•</span>
                  <span>No credit check required</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-black flex-shrink-0">•</span>
                  <span>Funds available same day</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-black flex-shrink-0">•</span>
                  <span>Repaid automatically from your refund</span>
                </li>
              </ul>
              <Link
                href="/supersonic-fast-cash/services/refund-advance"
                className="inline-flex items-center gap-2 bg-white text-brand-green-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-green-50 transition-colors"
              >
                Learn About Refund Advance <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="text-center">
              <div className="inline-block bg-white/10 rounded-3xl p-8">
                <DollarSign className="w-24 h-24 text-brand-green-300 mx-auto mb-4" />
                <div className="text-6xl font-black">$7,000</div>
                <div className="text-white text-xl">Maximum Advance</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            File online, visit a location, or contact us. We're here to help you get your maximum refund.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/apply"
              className="inline-flex items-center gap-2 bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors"
            >
              Start Your Return <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/supersonic-fast-cash/book-appointment"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors border border-white/30"
            >
              Book Appointment
            </Link>
            <a
              href="/support"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors border border-white/30"
            >
              <Phone className="w-5 h-5" /> Visit Support Center
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
