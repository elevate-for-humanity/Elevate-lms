'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Palette,
  BookOpen,
  Globe,
  Headphones,
  ArrowRight,
  Loader2,
  Play,
  Settings,
CheckCircle, } from 'lucide-react';

const MASTER_STATEMENT = `All platform products are licensed access to systems operated by Elevate for Humanity. Ownership of software, infrastructure, and intellectual property is not transferred.`;

const NEXT_STEPS = [
  {
    icon: CheckCircle,
    title: 'Organization Created',
    description: 'Your tenant space has been provisioned.',
    status: 'complete',
  },
  {
    icon: Users,
    title: 'Invite Team Members',
    description: 'Add admins, instructors, and staff to your organization.',
    href: '/admin/users/invite',
    cta: 'Invite Team',
  },
  {
    icon: Palette,
    title: 'Add Logo & Branding',
    description: 'Upload your logo and customize colors.',
    href: '/admin/settings/branding',
    cta: 'Customize',
  },
  {
    icon: BookOpen,
    title: 'Import Programs & Courses',
    description: 'Create courses or import existing content.',
    href: '/admin/courses',
    cta: 'Add Content',
  },
  {
    icon: Play,
    title: 'Explore Demo Center',
    description: 'See platform features in action.',
    href: '/store/demos',
    cta: 'View Demos',
  },
  {
    icon: Globe,
    title: 'Connect Domain (Optional)',
    description: 'Use your own domain or our subdomain.',
    href: '/admin/settings/domain',
    cta: 'Configure',
  },
];

function SuccessContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [tenantData, setTenantData] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    async function fetchTenantInfo() {
      if (sessionId) {
        try {
          const res = await fetch(`/api/licenses/checkout?session_id=${sessionId}`);
          if (res.ok) {
            const data = await res.json();
            setTenantData(data);
          }
        } catch (e) {
          console.error('Failed to fetch tenant info:', e);
        }
      }
      setLoading(false);
    }
    fetchTenantInfo();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Success Header */}
      <section className="bg-slate-100 text-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h1 className="text-4xl font-black mb-4">License Activated!</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            Your managed LMS platform is being provisioned. Follow the steps below to get started.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Tenant Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 -mt-8 relative z-10">
          <h2 className="text-2xl font-bold mb-6">Your Platform Details</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-slate-600 text-sm mb-1">Organization</div>
              <div className="font-bold text-slate-900">
                {tenantData?.organizationName || 'Your Organization'}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-slate-600 text-sm mb-1">Platform URL</div>
              <div className="font-bold text-blue-600">
                {tenantData?.subdomain || 'yourorg'}.elevateforhumanity.org
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-slate-600 text-sm mb-1">Status</div>
              <div className="font-bold text-green-600 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Active
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Provisioning in progress:</strong> Your platform is being set up automatically.
              Admin login credentials will be sent to your email within minutes.
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-2">Next Steps</h2>
          <p className="text-slate-600 mb-8">Complete these steps to launch your platform.</p>

          <div className="space-y-4">
            {NEXT_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isComplete = step.status === 'complete';
              
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-4 p-4 rounded-xl border ${
                    isComplete ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isComplete ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${isComplete ? 'text-green-800' : 'text-slate-900'}`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm ${isComplete ? 'text-green-700' : 'text-slate-600'}`}>
                      {step.description}
                    </p>
                  </div>
                  {step.href && (
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      {step.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                  {isComplete && (
                    <span className="text-green-600 font-medium text-sm">Done</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Resources */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/store/guides/licensing"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <BookOpen className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Licensing Guide</h3>
            <p className="text-slate-600 mb-4">
              Step-by-step walkthrough of setup, billing, and platform management.
            </p>
            <span className="inline-flex items-center gap-2 text-blue-600 font-semibold">
              Read Guide <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/contact?topic=license-support"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <Headphones className="w-10 h-10 text-green-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Support</h3>
            <p className="text-slate-600 mb-4">
              Get help from our team with setup, customization, or technical issues.
            </p>
            <span className="inline-flex items-center gap-2 text-green-600 font-semibold">
              Contact Support <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Admin Dashboard CTA */}
        <div className="bg-blue-600 rounded-2xl p-8 text-white text-center">
          <Settings className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-bold mb-2">Ready to Configure?</h2>
          <p className="text-blue-100 mb-6">
            Access your admin dashboard to start setting up your platform.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors"
          >
            Open Admin Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Master Statement */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600 italic">{MASTER_STATEMENT}</p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
    </div>
  );
}

export default function LicenseSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
