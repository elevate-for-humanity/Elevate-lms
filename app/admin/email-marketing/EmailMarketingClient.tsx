"use client";
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {

  Mail,
  Send,
  Users,
  BarChart3,
  Calendar,
  Plus,
  Eye,
} from 'lucide-react';

interface EmailMarketingPageProps {
  stats?: {
    totalSubscribers: number;
    emailsSentThisMonth: number;
    deliveredThisMonth: number;
    openRateThisMonth: number | null;
    clickRateThisMonth: number | null;
    openRateLastMonth: number | null;
    clickRateLastMonth: number | null;
    bouncesThisMonth: number;
  };
}

function rateTrend(current: number | null, previous: number | null): string | null {
  if (current === null || previous === null || previous === 0) return null;
  const diff = current - previous;
  return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs last month`;
}

export default function EmailMarketingPage({ stats }: EmailMarketingPageProps) {
  const router = useRouter();
  

  const [activeTab, setActiveTab] = useState<
    'campaigns' | 'templates' | 'analytics'
  >('campaigns');

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Email Marketing" }]} />
      </div>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/admin-email-marketing-d1.jpg"
          alt="Email Marketing"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Email Marketing
          </h1>
          <p className="text-black">
            Send campaigns to students, employers, and partners. Powered by
            Resend.
          </p>
        </div>

        {/* Stats Cards — live from SendGrid + Supabase */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Mail className="h-11 w-11 text-brand-blue-600" />
              <span className="text-xs font-semibold text-slate-500">THIS MONTH</span>
            </div>
            <div className="text-2xl font-bold text-black">
              {stats?.emailsSentThisMonth?.toLocaleString() ?? '—'}
            </div>
            <div className="text-sm text-black">Emails Sent</div>
            {stats?.deliveredThisMonth != null && stats.deliveredThisMonth > 0 && (
              <div className="text-xs text-slate-400 mt-1">{stats.deliveredThisMonth.toLocaleString()} delivered</div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-11 w-11 text-brand-green-600" />
              <span className="text-xs font-semibold text-slate-500">OPEN RATE</span>
            </div>
            <div className="text-2xl font-bold text-black">
              {stats?.openRateThisMonth != null ? `${stats.openRateThisMonth}%` : '—'}
            </div>
            <div className="text-sm text-black">Unique Opens</div>
            {rateTrend(stats?.openRateThisMonth ?? null, stats?.openRateLastMonth ?? null) && (
              <div className="text-xs text-slate-400 mt-1">{rateTrend(stats?.openRateThisMonth ?? null, stats?.openRateLastMonth ?? null)}</div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-11 w-11 text-brand-blue-600" />
              <span className="text-xs font-semibold text-slate-500">CONTACTS</span>
            </div>
            <div className="text-2xl font-bold text-black">
              {stats?.totalSubscribers?.toLocaleString() ?? '—'}
            </div>
            <div className="text-sm text-black">Total Subscribers</div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-11 w-11 text-brand-orange-600" />
              <span className="text-xs font-semibold text-slate-500">CLICK RATE</span>
            </div>
            <div className="text-2xl font-bold text-black">
              {stats?.clickRateThisMonth != null ? `${stats.clickRateThisMonth}%` : '—'}
            </div>
            <div className="text-sm text-black">Unique Clicks</div>
            {rateTrend(stats?.clickRateThisMonth ?? null, stats?.clickRateLastMonth ?? null) && (
              <div className="text-xs text-slate-400 mt-1">{rateTrend(stats?.clickRateThisMonth ?? null, stats?.clickRateLastMonth ?? null)}</div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition ${
                activeTab === 'campaigns'
                  ? 'border-brand-orange-600 text-brand-orange-600'
                  : 'border-transparent text-black hover:text-black'
              }`}
            >
              Campaigns
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`pb-3 px-1 text-sm font-semibold border-b-2 transition ${
                activeTab === 'templates'
                  ? 'border-brand-orange-600 text-brand-orange-600'
                  : 'border-transparent text-black hover:text-black'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => router.push('/admin/email-marketing/analytics')}
              className="pb-3 px-1 text-sm font-semibold border-b-2 border-transparent text-black hover:text-black transition"
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-black">
                Email Campaigns
              </h2>
              <button
                onClick={() =>
                  router.push('/admin/email-marketing/campaigns/new')
                }
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange-700 transition"
              >
                <Plus className="h-4 w-4" />
                New Campaign
              </button>
            </div>

            {/* Campaign List — populated from DB when campaigns are created */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-10 text-center">
              <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 mb-1">No campaigns yet</p>
              <p className="text-sm text-slate-500">
                Create your first campaign using the button above. Sent, scheduled, and draft campaigns will appear here.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-black">
                Email Templates
              </h2>
              <button className="inline-flex items-center gap-2 rounded-xl bg-brand-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-orange-700 transition" aria-label="Action button">
                <Plus className="h-4 w-4" />
                New Template
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                'Program Enrollment',
                'Welcome Email',
                'Course Reminder',
                'Certificate Ready',
                'Event Invitation',
                'Partner Outreach',
              ].map((template, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 hover:border-slate-300 transition cursor-pointer"
                >
                  <div className="aspect-video bg-slate-100 rounded-lg mb-4 flex items-center justify-center">
                    <Mail className="h-12 w-12 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-black mb-2">
                    {template}
                  </h3>
                  <p className="text-sm text-black mb-4">
                    Professional email template for {template.toLowerCase()}
                  </p>
                  <div className="flex gap-2">
                    <button className="flex-1 text-sm font-semibold text-brand-orange-600 hover:text-brand-orange-700" aria-label="Action button">
                      Edit
                    </button>
                    <button className="flex-1 text-sm font-semibold text-black hover:text-black" aria-label="Action button">
                      Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-black">Email Analytics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="font-semibold text-black mb-4">This Month</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Sent',        value: stats?.emailsSentThisMonth?.toLocaleString() ?? '—' },
                    { label: 'Delivered',   value: stats?.deliveredThisMonth?.toLocaleString() ?? '—' },
                    { label: 'Open Rate',   value: stats?.openRateThisMonth != null ? `${stats.openRateThisMonth}%` : '—' },
                    { label: 'Click Rate',  value: stats?.clickRateThisMonth != null ? `${stats.clickRateThisMonth}%` : '—' },
                    { label: 'Bounces',     value: stats?.bouncesThisMonth?.toLocaleString() ?? '—' },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">{row.label}</span>
                      <span className="text-sm font-semibold text-black">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="font-semibold text-black mb-4">Last Month</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Open Rate',  value: stats?.openRateLastMonth != null ? `${stats.openRateLastMonth}%` : '—' },
                    { label: 'Click Rate', value: stats?.clickRateLastMonth != null ? `${stats.clickRateLastMonth}%` : '—' },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">{row.label}</span>
                      <span className="text-sm font-semibold text-black">{row.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-4">Source: SendGrid Stats API</p>
              </div>
            </div>
          </div>
        )}

        {/* Storytelling Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
                    Your Journey Starts Here
                  </h2>
                  <p className="text-lg text-black mb-6 leading-relaxed">
                    Every great career begins with a single step. Whether you're
                    looking to change careers, upgrade your skills, or enter the
                    workforce for the first time, we're here to help you
                    succeed. Our programs are Funded, government-funded, and
                    designed to get you hired fast.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-black">
                        Funded training - no tuition, no hidden costs
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-black">
                        Industry-recognized certifications that employers value
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-black">
                        Job placement assistance and career support
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-black">
                        Flexible scheduling for working adults
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="relative h-[60vh] min-h-[400px] max-h-[720px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/pages/admin-email-marketing-d2.jpg"
                    alt="Students learning"
                    fill
                    className="object-cover"
                    quality={100}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
