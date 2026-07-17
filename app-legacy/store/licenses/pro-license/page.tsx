'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ArrowRight,
  Play,
  Monitor,
  Smartphone,
  Users,
  BookOpen,
  Settings,
  CreditCard,
  RefreshCw,
  ExternalLink,
  Briefcase,
  Code,
} from 'lucide-react';

const LICENSE_DATA = {
  name: 'Elevate LMS Pro License',
  price: 999,
  description: 'Multi-site license with lifetime updates and Dev Studio.',
  longDescription:
    'Deploy on multiple sites with lifetime updates, priority support, and access to the Dev Studio for customization. Perfect for agencies building for clients or training providers with multiple brands.',
  features: [
    'Complete Next.js codebase',
    'Multi-site deployment',
    'Lifetime updates',
    'Priority support',
    'Dev Studio included',
    'API documentation',
    'LMS with courses & certifications',
    'Student enrollment system',
    'Admin dashboard',
    'Payment processing (Stripe)',
    'Partner dashboard',
    'Mobile-responsive PWA',
  ],
  idealFor: [
    'Agencies building for clients',
    'Training providers with multiple brands',
    'Development teams',
    'Growing organizations',
  ],
  appsIncluded: [
    { name: 'Learning Management System', icon: BookOpen, description: 'Courses, SCORM, certifications' },
    { name: 'Enrollment & Intake', icon: Users, description: 'Applications and student onboarding' },
    { name: 'Admin Dashboard', icon: Settings, description: 'User management and reporting' },
    { name: 'Payments & Billing', icon: CreditCard, description: 'Stripe integration' },
    { name: 'Partner Dashboard', icon: Briefcase, description: 'For instructors and partners' },
    { name: 'Mobile PWA', icon: Smartphone, description: 'iOS and Android support' },
  ],
};

const DEMO_PAGES = [
  { name: 'Homepage', path: '/', description: 'Main landing page' },
  { name: 'Programs', path: '/programs', description: 'Training programs catalog' },
  { name: 'Courses', path: '/courses', description: 'Course listings' },
  { name: 'Apply', path: '/apply', description: 'Student application' },
  { name: 'LMS Dashboard', path: '/lms/dashboard', description: 'Student portal' },
  { name: 'Admin', path: '/admin', description: 'Admin dashboard' },
  { name: 'Partner Portal', path: '/program-holder/dashboard', description: 'Partner management' },
];

export default function ProLicensePage() {
  const [activeDemo, setActiveDemo] = useState('/programs');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-purple-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-bold mb-4">
                Most Popular
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green-500 text-white rounded-full text-sm font-bold mb-4 ml-2">
                14-Day Free Trial
              </div>
              <h1 className="text-4xl lg:text-5xl font-black mb-4">
                {LICENSE_DATA.name}
              </h1>
              <p className="text-xl text-purple-200 max-w-2xl">
                {LICENSE_DATA.longDescription}
              </p>
            </div>
            <div className="bg-white text-slate-900 rounded-2xl p-8 min-w-[300px]">
              <div className="text-5xl font-black text-purple-600 mb-2">
                ${LICENSE_DATA.price}
              </div>
              <p className="text-slate-600 mb-6">One-time payment</p>
              <div className="space-y-3">
                <Link
                  href="/store/licenses/pro-license/trial"
                  className="block w-full text-center bg-brand-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-brand-green-700 transition-colors"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/store/licenses/checkout/pro-license"
                  className="block w-full text-center bg-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-purple-700 transition-colors"
                >
                  Purchase Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white mb-4">
              Try the Live Demo
            </h2>
            <p className="text-slate-400">
              Explore the platform before you buy. No login required.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Demo Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-slate-800 rounded-xl p-4">
                <h3 className="text-white font-bold mb-4">Demo Pages</h3>
                <div className="space-y-2">
                  {DEMO_PAGES.map((page) => (
                    <button
                      key={page.path}
                      onClick={() => {
                        setActiveDemo(page.path);
                        setIsLoading(true);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        activeDemo === page.path
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <div className="font-medium">{page.name}</div>
                      <div className="text-xs opacity-75">{page.description}</div>
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle */}
                <div className="mt-6 pt-4 border-t border-slate-700">
                  <div className="flex bg-slate-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('desktop')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded ${
                        viewMode === 'desktop' ? 'bg-purple-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      Desktop
                    </button>
                    <button
                      onClick={() => setViewMode('mobile')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded ${
                        viewMode === 'mobile' ? 'bg-purple-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      Mobile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Preview */}
            <div className="flex-1">
              <div className="bg-slate-800 rounded-t-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-brand-green-500" />
                </div>
                <div className="bg-slate-700 px-4 py-1 rounded text-slate-300 text-sm font-mono">
                  {activeDemo}
                </div>
                <a
                  href={activeDemo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-sm"
                >
                  Open <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div
                className={`bg-white rounded-b-xl overflow-hidden ${
                  viewMode === 'mobile' ? 'max-w-7xl mx-auto' : ''
                }`}
                style={{ height: viewMode === 'mobile' ? '667px' : '600px' }}
              >
                {isLoading && (
                  <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                      <p className="text-slate-600">Loading preview...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={activeDemo}
                  className="w-full h-full border-0"
                  title="Demo Preview"
                  onLoad={() => setIsLoading(false)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 mb-12 text-center">
            What's Included
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {LICENSE_DATA.appsIncluded.map((app) => {
              const Icon = app.icon;
              return (
                <div key={app.name} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{app.name}</h3>
                  <p className="text-slate-600 text-sm">{app.description}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">All Features</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {LICENSE_DATA.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-brand-green-600 flex-shrink-0" />
                  <span className="text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ideal For */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {LICENSE_DATA.idealFor.map((item, idx) => (
              <div
                key={idx}
                className="bg-purple-50 p-6 rounded-xl text-center"
              >
                <div className="text-lg font-bold text-purple-900">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-purple-200 mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store/licenses/pro-license/trial"
              className="inline-flex items-center justify-center gap-2 bg-brand-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-green-700 transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Free Trial
            </Link>
            <Link
              href="/store/licenses/checkout/pro-license"
              className="inline-flex items-center justify-center gap-2 bg-white text-purple-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-purple-50 transition-colors"
            >
              Purchase Now - ${LICENSE_DATA.price}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
