'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  ArrowRight,
  Shield,
  Server,
  Users,
  BookOpen,
  Settings,
  Lock,
  Clock,
  Headphones,
  Globe,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

const MANAGED_LICENSE = {
  name: 'Managed Enterprise LMS Platform',
  setupFee: { min: 7500, max: 15000 },
  monthlyFee: { min: 1500, max: 3500 },
  description: 'Subscription-based enterprise LMS operated by Elevate for Humanity.',
  includes: [
    'Enterprise LMS (courses, assessments, certificates)',
    'Multi-tenant organization setup',
    'Custom domain and branding',
    'Fully managed hosting and infrastructure',
    'Security updates and maintenance',
    'Compliance-ready infrastructure',
    'Role-based access control',
    'Dedicated support',
  ],
  youManage: [
    'Your organization settings',
    'Users and permissions',
    'Courses and content',
    'Student enrollments',
    'Certificates and credentials',
  ],
  weManage: [
    'Platform hosting and uptime',
    'Security and backups',
    'Software updates',
    'Infrastructure scaling',
    'Compliance maintenance',
    'Technical support',
  ],
};

const ENFORCEMENT_NOTICE = `An active subscription is required for continued platform operation. 
Non-payment results in automatic platform lockout. This is not negotiable.`;

const MASTER_STATEMENT = `All platform products are licensed access to systems operated by Elevate for Humanity. 
Ownership of software, infrastructure, and intellectual property is not transferred.`;

// Upgrade banner messages based on reason
const UPGRADE_MESSAGES: Record<string, { title: string; description: string; icon: typeof AlertTriangle }> = {
  expired: {
    title: 'Your Trial Has Ended',
    description: 'Subscribe now to continue using the platform. Your data and settings are preserved.',
    icon: Clock,
  },
  suspended: {
    title: 'License Suspended',
    description: 'Please resolve billing issues to restore access to your account.',
    icon: XCircle,
  },
  missing: {
    title: 'License Required',
    description: 'Purchase a license to access the platform features.',
    icon: Shield,
  },
};

// Inner component that uses searchParams
function ManagedLicenseContent() {
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium'>('standard');
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const [licenseId, setLicenseId] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState<string | null>(null);

  useEffect(() => {
    const reason = searchParams.get('reason');
    const license = searchParams.get('license_id');
    const message = searchParams.get('message');
    
    if (reason) {
      setUpgradeReason(reason);
      setShowUpgradeBanner(true);
    }
    if (license) setLicenseId(license);
    if (message) setCustomMessage(message);
  }, [searchParams]);

  const bannerInfo = upgradeReason ? UPGRADE_MESSAGES[upgradeReason] : null;
  const BannerIcon = bannerInfo?.icon || AlertTriangle;
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (tierId: string) => {
    if (!licenseId) {
      // No existing license - redirect to new license checkout
      window.location.href = `/store/licenses/checkout/managed?tier=${tierId}`;
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/license/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId,
          licenseId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to start checkout. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Managed" }]} />
      </div>
{/* Upgrade Banner - shown when redirected from expired/suspended license */}
      {showUpgradeBanner && bannerInfo && (
        <div className="bg-amber-50 border-b-2 border-amber-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <BannerIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-900">{bannerInfo.title}</h3>
                <p className="text-amber-800 mt-1">
                  {customMessage || bannerInfo.description}
                </p>
                {licenseId && (
                  <p className="text-sm text-amber-700 mt-2">
                    License ID: <code className="bg-amber-100 px-1 rounded">{licenseId}</code>
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowUpgradeBanner(false)}
                className="flex-shrink-0 text-amber-600 hover:text-amber-800"
                aria-label="Dismiss"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 flex gap-3">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-700 transition-colors"
              >
                Subscribe Now
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/support/contact"
                className="inline-flex items-center gap-2 bg-white text-amber-800 border border-amber-300 px-4 py-2 rounded-lg font-medium hover:bg-amber-50 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="bg-slate-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue-600 text-white rounded-full text-sm font-bold mb-4">
              <Shield className="w-4 h-4" />
              Managed Platform
            </div>
            <h1 className="text-4xl lg:text-5xl font-black mb-4">
              {MANAGED_LICENSE.name}
            </h1>
            <p className="text-xl text-slate-300 mb-6">
              {MANAGED_LICENSE.description} You manage your organization, users, and programs. 
              We manage the platform, infrastructure, security, and enforcement.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/store/demo"
                className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-slate-100 transition-colors"
              >
                Watch Demo
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-700 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 mb-8 text-center">
            What's Included
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MANAGED_LICENSE.includes.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* You Manage vs We Manage */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 mb-12 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* You Manage */}
            <div className="bg-brand-blue-50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-brand-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">You Manage</h3>
              </div>
              <ul className="space-y-3">
                {MANAGED_LICENSE.youManage.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-brand-blue-600" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* We Manage */}
            <div className="bg-green-50 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Server className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">We Manage</h3>
              </div>
              <ul className="space-y-3">
                {MANAGED_LICENSE.weManage.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black mb-4 text-center">Pricing</h2>
          <p className="text-slate-400 text-center mb-8">
            Choose the plan that fits your organization. Cancel anytime.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-slate-800 p-1 rounded-lg inline-flex">
              <button
                onClick={() => setSelectedPlan('standard')}
                className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                  selectedPlan === 'standard'
                    ? 'bg-brand-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPlan('premium')}
                className={`px-6 py-2 rounded-md font-semibold transition-colors flex items-center gap-2 ${
                  selectedPlan === 'premium'
                    ? 'bg-brand-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Annual
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Schools & Training Providers */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="text-brand-blue-400 font-semibold text-sm mb-2">FOR SCHOOLS & TRAINING PROVIDERS</div>
              <h3 className="text-2xl font-bold text-white mb-2">School Plan</h3>
              <p className="text-slate-400 text-sm mb-4">
                Full LMS for training providers, schools, and educational organizations.
              </p>
              <div className="mb-6">
                <span className="text-4xl font-black text-white">
                  ${selectedPlan === 'premium' ? '1,200' : '1,500'}
                </span>
                <span className="text-slate-400">/{selectedPlan === 'premium' ? 'month, billed annually' : 'month'}</span>
                {selectedPlan === 'premium' && (
                  <div className="text-green-400 text-sm mt-1">Save $3,600/year</div>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                {['Up to 100 learners', 'Unlimited courses', 'Certificates & credentials', 'Progress tracking', 'Email support'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(selectedPlan === 'premium' ? 'school_annual' : 'school_monthly')}
                className="w-full bg-brand-blue-600 text-white py-3 rounded-lg font-bold hover:bg-brand-blue-700 transition-colors"
              >
                Start {selectedPlan === 'premium' ? 'Annual' : 'Monthly'} Plan
              </button>
            </div>

            {/* Organizations / Managed */}
            <div className="bg-slate-800 rounded-2xl p-6 border-2 border-brand-blue-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="text-brand-blue-400 font-semibold text-sm mb-2">FOR ORGANIZATIONS</div>
              <h3 className="text-2xl font-bold text-white mb-2">Managed License</h3>
              <p className="text-slate-400 text-sm mb-4">
                Full platform with domain isolation, role-based access, and priority support.
              </p>
              <div className="mb-6">
                <span className="text-4xl font-black text-white">
                  ${selectedPlan === 'premium' ? '2,000' : '2,500'}
                </span>
                <span className="text-slate-400">/{selectedPlan === 'premium' ? 'month, billed annually' : 'month'}</span>
                {selectedPlan === 'premium' && (
                  <div className="text-green-400 text-sm mt-1">Save $6,000/year</div>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                {['Up to 50 users', 'Domain isolation', 'Role-based access control', 'Custom branding', 'Priority support', 'Dedicated onboarding'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(selectedPlan === 'premium' ? 'managed_annual' : 'managed_monthly')}
                className="w-full bg-brand-blue-600 text-white py-3 rounded-lg font-bold hover:bg-brand-blue-700 transition-colors"
              >
                Start {selectedPlan === 'premium' ? 'Annual' : 'Monthly'} Plan
              </button>
            </div>
          </div>

          {/* Enterprise / Contact Sales */}
          <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">Need a custom solution?</h3>
            <p className="text-slate-400 mb-4">
              For larger organizations, custom integrations, or special requirements.
            </p>
            <Link
              href="/support/contact?subject=enterprise"
              className="inline-flex items-center gap-2 bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-600 transition-colors"
            >
              Contact Sales
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Enforcement Notice */}
          <div className="mt-8 bg-amber-900/30 border border-amber-600/50 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-400 mb-2">Payment Enforcement</h4>
                <p className="text-amber-200/80 text-sm">
                  {ENFORCEMENT_NOTICE}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 mb-12 text-center">
            Getting Started
          </h2>
          <div className="space-y-6">
            {[
              { step: 1, title: 'Complete Checkout', desc: 'Pay setup fee and first month subscription.' },
              { step: 2, title: 'Tenant Provisioning', desc: 'We create your dedicated organization space within 24 hours.' },
              { step: 3, title: 'Domain Setup (Optional)', desc: 'Connect your custom domain or use our subdomain.' },
              { step: 4, title: 'Onboarding Call', desc: 'Walk through admin setup, branding, and first courses.' },
              { step: 5, title: 'Go Live', desc: 'Start enrolling students and delivering training.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Master Statement */}
      <section className="py-8 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-600 italic">
            {MASTER_STATEMENT}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Launch your managed LMS platform today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store/demo"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-blue-50 transition-colors"
            >
              Watch Demo First
            </Link>
            <Link
              href="/store/licenses/checkout/managed"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-blue-900 transition-colors"
            >
              Start License Setup
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Main export wrapped in Suspense for useSearchParams
export default function ManagedLicensePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ManagedLicenseContent />
    </Suspense>
  );
}
