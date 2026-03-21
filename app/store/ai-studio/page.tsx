
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Zap,
  Video,
  Mic,
  Image as ImageIcon,
  Users,
  Check,
  ArrowRight,
  Sparkles,
  Play,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Studio | Elevate Store',
  description:
    'Generate AI videos, voiceovers, images, and virtual instructors for your courses. Powered by OpenAI, Synthesia, D-ID, and more.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/ai-studio',
  },
};

const plans = [
  {
    name: 'Starter',
    price: 99,
    billing: 'month',
    description: 'For individual creators getting started with AI content.',
    features: [
      '50 AI videos per month',
      '200 AI images per month',
      '100 voiceovers per month',
      '720p video exports',
      '6 AI instructor voices',
      'Email support',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    price: 299,
    billing: 'month',
    description: 'For training providers creating courses at scale.',
    features: [
      'Unlimited AI videos',
      'Unlimited AI images',
      'Unlimited voiceovers',
      '4K video exports',
      'Custom AI instructors',
      'API access',
      'Priority support',
      'White-label exports',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'AI Instructor Pack',
    price: 499,
    billing: 'one-time',
    description: '6 pre-built AI instructors with unique voices and personalities.',
    features: [
      '6 AI instructor avatars',
      'Unique voice for each',
      'Multiple course categories',
      'Lifetime access',
      'Commercial license',
      'Regular updates',
    ],
    cta: 'Buy Now',
    popular: false,
  },
];

const capabilities = [
  {
    icon: Video,
    title: 'AI Video Generation',
    description: 'Create professional training videos with AI avatars that speak your script.',
  },
  {
    icon: Mic,
    title: 'Voice Synthesis',
    description: 'Generate natural voiceovers in multiple voices using OpenAI TTS.',
  },
  {
    icon: ImageIcon,
    title: 'Image Generation',
    description: 'Create course thumbnails, diagrams, and illustrations with AI.',
  },
  {
    icon: Users,
    title: 'AI Instructors',
    description: 'Virtual instructors with unique personalities for different course types.',
  },
];

export default function AIStudioPage() {

  return (
    <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Ai Studio" }]} />
      </div>
{/* Hero */}
      <section className="relative min-h-[500px] flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-pink-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand-blue-500 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-slate-900 rounded-full text-sm font-bold mb-6 border border-white/20">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Powered by AI
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
                AI Studio
                <span className="block text-brand-blue-600">
                  Create Content at Scale
                </span>
              </h1>

              <p className="text-xl text-slate-600 mb-8">
                Generate videos, voiceovers, images, and AI instructors for your courses. 
                No video editing skills required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-blue-50 transition-colors shadow-lg"
                >
                  View Plans
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/store/ai-studio"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-slate-900 px-8 py-4 rounded-lg font-bold text-lg border-2 border-white/30 hover:bg-white/20 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </Link>
              </div>
            </div>

            {/* Demo Preview */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="aspect-video bg-white/50 rounded-xl flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-slate-900/80 mx-auto mb-2" />
                    <p className="text-slate-900/60 text-sm">AI-Generated Video Preview</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full" />
                  <div>
                    <p className="text-slate-900 font-semibold">Instructor</p>
                    <p className="text-brand-blue-300 text-sm">AI Healthcare Instructor</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              What You Can Create
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to produce professional training content
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div key={cap.title} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all text-center">
                  <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8 text-brand-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{cap.title}</h3>
                  <p className="text-gray-600">{cap.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing"className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Start with a 7-day free trial. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl p-8 ${
                  plan.popular
                    ? 'border-2 border-brand-blue-600 shadow-2xl scale-105 z-10'
                    : 'border border-gray-200 hover:shadow-lg'
                } transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-blue-600 text-white text-sm font-bold rounded-full">
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-black text-gray-900">${plan.price}</span>
                  {plan.billing === 'month' && (
                    <span className="text-gray-500">/month</span>
                  )}
                  {plan.billing === 'one-time' && (
                    <span className="text-gray-500 text-sm ml-2">one-time</span>
                  )}
                </div>

                <Link
                  href={`/store/ai-studio?plan=${plan.name.toLowerCase().replace(' ', '-')}`}
                  className={`block w-full text-center py-3 rounded-lg font-bold transition-colors mb-6 ${
                    plan.popular
                      ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                      : 'bg-white text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          <h2 className="text-4xl font-black text-slate-900 mb-6">
            Ready to Create with AI?
          </h2>
          <p className="text-xl text-brand-blue-200 mb-10 max-w-2xl mx-auto">
            Start your free trial today. No credit card required.
          </p>
          <Link
            href="/store/ai-studio?plan=professional"
            className="inline-flex items-center gap-2 bg-white text-brand-blue-900 px-10 py-5 rounded-lg font-bold text-lg hover:bg-brand-blue-50 transition-colors shadow-lg"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
