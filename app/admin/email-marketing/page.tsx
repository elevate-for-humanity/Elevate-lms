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

export default function EmailMarketingPage() {
  const router = useRouter();
  useEffect(() => {
    // Check admin auth
    fetch('/api/auth/check-admin')
      .then((res) => res.json())
      .then((data) => {
        if (!data.isAdmin) {
          router.push('/login?redirect=/admin');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const [activeTab, setActiveTab] = useState<
    'campaigns' | 'templates' | 'analytics'
  >('campaigns');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Email Marketing" }]} />
      </div>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/heroes/blog-post-9.jpg"
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

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Mail className="h-11 w-11 text-brand-blue-600" />
              <span className="text-xs font-semibold text-slate-500">
                THIS MONTH
              </span>
            </div>
            <div className="text-2xl font-bold text-black">2,847</div>
            <div className="text-sm text-black">Emails Sent</div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-11 w-11 text-brand-green-600" />
              <span className="text-xs font-semibold text-slate-500">
                OPEN RATE
              </span>
            </div>
            <div className="text-2xl font-bold text-black">42.3%</div>
            <div className="text-sm text-black">Average Opens</div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-11 w-11 text-brand-blue-600" />
              <span className="text-xs font-semibold text-slate-500">
                CONTACTS
              </span>
            </div>
            <div className="text-2xl font-bold text-black">1,234</div>
            <div className="text-sm text-black">Total Subscribers</div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="h-11 w-11 text-brand-orange-600" />
              <span className="text-xs font-semibold text-slate-500">
                CLICK RATE
              </span>
            </div>
            <div className="text-2xl font-bold text-black">8.7%</div>
            <div className="text-sm text-black">Average Clicks</div>
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

            {/* Campaign List */}
            <div className="space-y-3">
              {[
                {
                  name: 'New CNA Program Launch',
                  status: 'Sent',
                  sent: 'Dec 5, 2025',
                  recipients: 456,
                  opens: '45.2%',
                  clicks: '12.3%',
                },
                {
                  name: 'Barber Apprenticeship Enrollment',
                  status: 'Scheduled',
                  sent: 'Dec 10, 2025',
                  recipients: 234,
                  opens: '-',
                  clicks: '-',
                },
                {
                  name: 'HVAC Program Update',
                  status: 'Draft',
                  sent: '-',
                  recipients: 0,
                  opens: '-',
                  clicks: '-',
                },
              ].map((campaign, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-white p-6 shadow-sm border border-slate-200 hover:border-slate-300 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-black">
                          {campaign.name}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            campaign.status === 'Sent'
                              ? 'bg-brand-green-100 text-brand-green-800'
                              : campaign.status === 'Scheduled'
                                ? 'bg-brand-blue-100 text-brand-blue-800'
                                : 'bg-slate-100 text-black'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-slate-500">Sent</div>
                          <div className="font-semibold text-black">
                            {campaign.sent}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Recipients</div>
                          <div className="font-semibold text-black">
                            {campaign.recipients}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Opens</div>
                          <div className="font-semibold text-black">
                            {campaign.opens}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Clicks</div>
                          <div className="font-semibold text-black">
                            {campaign.clicks}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="ml-4 text-sm font-semibold text-brand-orange-600 hover:text-brand-orange-700" aria-label="Action button">
                      View →
                    </button>
                  </div>
                </div>
              ))}
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
            <h2 className="text-xl font-semibold text-black">
              Email Analytics
            </h2>

            <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-black mb-4">
                Performance Over Time
              </h3>
              <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                <div className="text-center text-slate-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm">Chart will be displayed here</p>
                  <p className="text-xs">
                    Showing opens, clicks, and conversions
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="font-semibold text-black mb-4">
                  Top Performing Campaigns
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'CNA Program Launch', rate: '52.3%' },
                    { name: 'HVAC Enrollment', rate: '48.1%' },
                    { name: 'Barber Apprenticeship', rate: '45.7%' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-black">
                        {item.name}
                      </span>
                      <span className="text-sm font-semibold text-brand-green-600">
                        {item.rate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
                <h3 className="font-semibold text-black mb-4">
                  Engagement by Audience
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Students', rate: '45.2%' },
                    { name: 'Employers', rate: '38.7%' },
                    { name: 'Partners', rate: '52.1%' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-black">
                        {item.name}
                      </span>
                      <span className="text-sm font-semibold text-brand-blue-600">
                        {item.rate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Storytelling Section */}
        <section className="py-16 bg-white">
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
                    src="/images/programs-hq/business-training.jpg"
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
