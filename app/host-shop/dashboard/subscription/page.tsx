'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Check,
  X,
  Sparkles,
  Users,
  BarChart3,
  Calendar,
  Shield,
  Clock,
  CreditCard,
  CheckCircle,
  ArrowRight,
  GraduationCap,
  MessageSquare,
  FileText,
  Video,
  Globe,
} from 'lucide-react';

// Host Shop tier configurations mapped to store products
const plans = [
  {
    id: 'starter',
    name: 'Host Shop Starter',
    price: 177, // Solo ($29) + Apprenticeship Management ($99) + Student Management ($49)
    storeProducts: ['solo', 'apprenticeship-management', 'student-management'],
    description: 'Perfect for new host shops. Includes apprenticeship tracking, hour approvals, and basic messaging.',
    features: [
      { name: 'Up to 2 apprentices', included: true, icon: Users },
      { name: 'Apprenticeship tracking', included: true, icon: GraduationCap },
      { name: 'Hour approvals', included: true, icon: Clock },
      { name: 'Basic messaging', included: true, icon: MessageSquare },
      { name: 'Basic reports', included: true, icon: BarChart3 },
      { name: 'Competency sign-offs', included: false, icon: CheckCircle },
      { name: 'AI evaluations', included: false, icon: Sparkles },
      { name: 'Advanced reports', included: false, icon: BarChart3 },
      { name: 'Multi-location', included: false, icon: Globe },
    ],
    cta: 'Downgrade',
    current: false,
  },
  {
    id: 'professional',
    name: 'Host Shop Professional',
    price: 326, // Professional ($99) + Apprenticeship ($99) + Student Mgmt ($49) + Employer Portal ($49) + LMS ($29) + AI ($19)
    storeProducts: ['professional', 'apprenticeship-management', 'student-management', 'employer-portal', 'lms', 'ai-addon'],
    description: 'For growing shops with advanced features, competency tracking, and AI-powered tools.',
    features: [
      { name: 'Up to 10 apprentices', included: true, icon: Users },
      { name: 'Apprenticeship tracking', included: true, icon: GraduationCap },
      { name: 'Hour approvals', included: true, icon: Clock },
      { name: 'Competency sign-offs', included: true, icon: CheckCircle },
      { name: 'Evaluations', included: true, icon: FileText },
      { name: 'Scheduling', included: true, icon: Calendar },
      { name: 'AI evaluations', included: true, icon: Sparkles },
      { name: 'Advanced reports', included: true, icon: BarChart3 },
      { name: 'Compliance exports', included: true, icon: Shield },
    ],
    cta: 'Current Plan',
    recommended: true,
    current: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Partner',
    price: 1524, // Enterprise ($999) + Apprenticeship ($99) + Student Mgmt ($49) + Employer Portal ($49) + LMS ($29) + White Label ($199) + AI ($19) + SMS ($15) + Location ($25)
    storeProducts: ['enterprise', 'apprenticeship-management', 'student-management', 'employer-portal', 'lms', 'white-label-mobile-app', 'ai-addon', 'text-messaging', 'additional-location'],
    description: 'Unlimited apprentices, multi-location, white labeling, and dedicated support.',
    features: [
      { name: 'Unlimited apprentices', included: true, icon: Users },
      { name: 'Everything in Professional', included: true, icon: CheckCircle },
      { name: 'Multi-location', included: true, icon: Globe },
      { name: 'White label app', included: true, icon: Sparkles },
      { name: 'API access', included: true, icon: Globe },
      { name: 'Dedicated support', included: true, icon: Shield },
      { name: 'Custom branding', included: true, icon: Sparkles },
      { name: 'Advanced integrations', included: true, icon: Globe },
    ],
    cta: 'Upgrade to Enterprise',
    current: false,
  },
];

const usageStats = [
  { label: 'Apprentices', used: 3, limit: 10, icon: Users },
  { label: 'AI Credits', used: 780, limit: 1000, icon: Sparkles },
  { label: 'Storage', used: 4.2, limit: 25, icon: Clock, suffix: 'GB' },
];

export default function SubscriptionPage() {
  const subscription = {
    status: 'active',
    currentPlan: 'Professional Host Shop',
    nextBilling: 'July 16, 2026',
    amount: 249,
    period: 'monthly',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/host-shop/dashboard" className="w-10 h-10 bg-gradient-to-br from-brand-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </Link>
              <div>
                <p className="font-bold text-slate-900">Elevate</p>
                <p className="text-xs text-slate-500">Host Shop</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Subscription & Plan</h1>
          <p className="text-slate-500">Manage your subscription and view available features</p>
        </div>

        {/* Current Subscription Status */}
        <div className="bg-gradient-to-br from-brand-blue-600 to-indigo-700 rounded-2xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm font-medium text-white/80">Active Subscription</span>
              </div>
              <h2 className="text-2xl font-bold mb-1">{subscription.currentPlan}</h2>
              <p className="text-white/70">
                Next billing: {subscription.nextBilling} • ${subscription.amount}/{subscription.period}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition">
                Manage Billing
              </button>
              <Link href="/host-shop/dashboard/store" className="px-6 py-3 bg-white text-brand-blue-700 rounded-xl font-semibold hover:bg-white/90 transition text-center">
                Visit Store
              </Link>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {usageStats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-100 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-lg font-bold text-slate-900">
                    {stat.used}{stat.suffix || ''} / {stat.limit === -1 ? '∞' : stat.limit}{stat.suffix || ''}
                  </p>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-blue-500 rounded-full"
                  style={{ width: stat.limit === -1 ? '0' : `${(stat.used / stat.limit) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Plan Comparison */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Choose Your Plan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`bg-white rounded-2xl border-2 overflow-hidden ${
                  plan.recommended 
                    ? 'border-brand-blue-500 shadow-lg shadow-brand-blue-100' 
                    : plan.current 
                      ? 'border-green-500' 
                      : 'border-slate-200'
                }`}
              >
                {plan.recommended && (
                  <div className="bg-gradient-to-r from-brand-blue-500 to-indigo-500 text-white text-center py-2 text-sm font-semibold">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    Recommended
                  </div>
                )}
                {plan.current && (
                  <div className="bg-green-500 text-white text-center py-2 text-sm font-semibold">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Current Plan
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                    <span className="text-slate-500">/month</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? 'text-slate-700 text-sm' : 'text-slate-400 text-sm'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    className={`w-full py-3 rounded-xl font-semibold transition ${
                      plan.current
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : plan.recommended
                          ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    disabled={plan.current}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature List */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">All Available Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Users, name: 'Apprentice Management', desc: 'Add, view, and manage apprentices', tier: 'Included' },
              { icon: Clock, name: 'Hours Approval', desc: 'Review and approve work hours', tier: 'Included' },
              { icon: Shield, name: 'Competency Sign-offs', desc: 'Verify and approve skill competencies', tier: 'Professional' },
              { icon: Sparkles, name: 'AI Evaluations', desc: 'AI-powered evaluation writing', tier: 'Professional' },
              { icon: BarChart3, name: 'Advanced Reports', desc: 'Detailed analytics and exports', tier: 'Professional' },
              { icon: Calendar, name: 'Scheduling', desc: 'Schedule apprentices and events', tier: 'Professional' },
            ].map((feature, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <feature.icon className="w-5 h-5 text-brand-blue-600" />
                  <span className="font-semibold text-slate-900">{feature.name}</span>
                </div>
                <p className="text-sm text-slate-500 mb-2">{feature.desc}</p>
                <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                  feature.tier === 'Included' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-brand-blue-100 text-brand-blue-700'
                }`}>
                  {feature.tier}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Payment History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Description</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: 'Jun 16, 2026', desc: 'Professional Host Shop - Monthly', amount: '$249.00', status: 'Paid' },
                  { date: 'May 16, 2026', desc: 'Professional Host Shop - Monthly', amount: '$249.00', status: 'Paid' },
                  { date: 'Apr 16, 2026', desc: 'Professional Host Shop - Monthly', amount: '$249.00', status: 'Paid' },
                ].map((payment, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-3 px-4 text-sm text-slate-700">{payment.date}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{payment.desc}</td>
                    <td className="py-3 px-4 text-sm text-slate-700">{payment.amount}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{payment.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
