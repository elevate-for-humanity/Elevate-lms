"use client";

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  Send,
  Save,
  Eye,
  Users,
  Calendar,
  Mail,
} from 'lucide-react';
import { emailTemplates } from '@/lib/email-templates';


export const dynamic = 'force-dynamic';



export default function NewCampaignPage() {
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

  const [step, setStep] = useState<
    'details' | 'content' | 'recipients' | 'schedule'
  >('details');

  const [campaign, setCampaign] = useState({
    name: '',
    subject: '',
    fromName: 'Elevate for Humanity',
    fromEmail: 'elevate4humanityedu@gmail.com',
    replyTo: 'elevateforhumanity.edu@gmail.com',
    template: '' as EmailTemplateKey | '',
    customHtml: '',
    recipientList: 'all-students',
    scheduleType: 'now' as 'now' | 'scheduled',
    scheduleDate: '',
    scheduleTime: '',
  });

  const [preview, setPreview] = useState(false);

  const handleTemplateSelect = (templateKey: EmailTemplateKey) => {
    const template = emailTemplates[templateKey];
    setCampaign({
      ...campaign,
      template: templateKey,
      subject: template.subject,
      customHtml: template.html,
    });
  };

  const handleSaveDraft = async () => {
    // Save campaign as draft
    const response = await fetch('/api/email/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...campaign, status: 'draft' }),
    });

    if (response.ok) {
      alert('Campaign saved as draft!');
      router.push('/admin/email-marketing');
    }
  };

  const handleSendNow = async () => {
    if (!confirm('Send this campaign now?')) return;

    const response = await fetch('/api/email-marketing/campaigns/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign),
    });

    if (response.ok) {
      alert('Campaign sent successfully!');
      router.push('/admin/email-marketing');
    }
  };

  const handleSchedule = async () => {
    const response = await fetch('/api/email-marketing/campaigns/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign),
    });

    if (response.ok) {
      alert('Campaign scheduled successfully!');
      router.push('/admin/email-marketing');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "New" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-[300px] md:h-[380px] lg:h-[420px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/learners/coaching-session.jpg"
          alt="New"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 drop-shadow-2xl">
            New
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100 drop-shadow-lg">
            Create and track email campaigns
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin/email-marketing"
              className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              Get Started Free
            </Link>
            <Link
              href="/admin/email-marketing/analytics"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-2xl"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/email-marketing')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  Create Campaign
                </h1>
                <p className="text-sm text-black">
                  Design and send email campaigns
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPreview(!preview)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              <button
                onClick={handleSaveDraft}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
              {campaign.scheduleType === 'now' ? (
                <button
                  onClick={handleSendNow}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Now</span>
                </button>
              ) : (
                <button
                  onClick={handleSchedule}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Schedule</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'details', label: 'Campaign Details', icon: Mail },
              { key: 'content', label: 'Email Content', icon: Mail },
              { key: 'recipients', label: 'Recipients', icon: Users },
              { key: 'schedule', label: 'Schedule', icon: Calendar },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() =>
                  setStep(
                    s.key as 'details' | 'content' | 'recipients' | 'schedule'
                  )
                }
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  step === s.key
                    ? 'border-brand-blue-600 text-brand-blue-600'
                    : 'border-transparent text-black hover:text-black'
                }`}
              >
                <s.icon className="w-4 h-4" />
                <span className="font-medium">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              {step === 'details' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Campaign Details</h2>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={campaign.name}
                      onChange={(
                        e: React.ChangeEvent<
                          | HTMLInputElement
                          | HTMLSelectElement
                          | HTMLTextAreaElement
                        >
                      ) => setCampaign({ ...campaign, name: e.target.value })}
                      placeholder="e.g., Welcome Series - January 2025"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={campaign.subject}
                      onChange={(
                        e: React.ChangeEvent<
                          | HTMLInputElement
                          | HTMLSelectElement
                          | HTMLTextAreaElement
                        >
                      ) =>
                        setCampaign({ ...campaign, subject: e.target.value })
                      }
                      placeholder="e.g., Welcome to Elevate for Humanity!"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-sm text-black">
                      Use variables like {'{{firstName}}'} for personalization
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        From Name
                      </label>
                      <input
                        type="text"
                        value={campaign.fromName}
                        onChange={(
                          e: React.ChangeEvent<
                            | HTMLInputElement
                            | HTMLSelectElement
                            | HTMLTextAreaElement
                          >
                        ) =>
                          setCampaign({ ...campaign, fromName: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        From Email
                      </label>
                      <input
                        type="email"
                        value={campaign.fromEmail}
                        onChange={(
                          e: React.ChangeEvent<
                            | HTMLInputElement
                            | HTMLSelectElement
                            | HTMLTextAreaElement
                          >
                        ) =>
                          setCampaign({
                            ...campaign,
                            fromEmail: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Reply-To Email
                    </label>
                    <input
                      type="email"
                      value={campaign.replyTo}
                      onChange={(
                        e: React.ChangeEvent<
                          | HTMLInputElement
                          | HTMLSelectElement
                          | HTMLTextAreaElement
                        >
                      ) =>
                        setCampaign({ ...campaign, replyTo: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={() => setStep('content')}
                    className="w-full bg-brand-blue-600 text-white py-2 rounded-lg hover:bg-brand-blue-700"
                  >
                    Continue to Content
                  </button>
                </div>
              )}

              {step === 'content' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Email Content</h2>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Choose Template
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(emailTemplates).map(([key, template]: any) => (
                        <button
                          key={key}
                          onClick={() =>
                            handleTemplateSelect(key as EmailTemplateKey)
                          }
                          className={`p-4 border-2 rounded-lg text-left transition-colors ${
                            campaign.template === key
                              ? 'border-brand-blue-600 bg-brand-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-black">
                            {template.name}
                          </div>
                          <div className="text-sm text-black mt-1">
                            {template.subject}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Custom HTML (Optional)
                    </label>
                    <textarea
                      value={campaign.customHtml}
                      onChange={(
                        e: React.ChangeEvent<
                          | HTMLInputElement
                          | HTMLSelectElement
                          | HTMLTextAreaElement
                        >
                      ) =>
                        setCampaign({ ...campaign, customHtml: e.target.value })
                      }
                      rows={12}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                      placeholder="Edit HTML or use template..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setStep('details')}
                      className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep('recipients')}
                      className="flex-1 bg-brand-blue-600 text-white py-2 rounded-lg hover:bg-brand-blue-700"
                    >
                      Continue to Recipients
                    </button>
                  </div>
                </div>
              )}

              {step === 'recipients' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Select Recipients</h2>

                  <div className="space-y-3">
                    {[
                      {
                        value: 'all-students',
                        label: 'All Students',
                        count: 1234,
                      },
                      {
                        value: 'active-students',
                        label: 'Active Students',
                        count: 856,
                      },
                      {
                        value: 'new-applicants',
                        label: 'New Applicants',
                        count: 142,
                      },
                      {
                        value: 'program-completers',
                        label: 'Program Completers',
                        count: 89,
                      },
                      {
                        value: 'employers',
                        label: 'Employer Partners',
                        count: 67,
                      },
                      {
                        value: 'workone',
                        label: 'WorkOne Contacts',
                        count: 23,
                      },
                    ].map((list) => (
                      <label
                        key={list.value}
                        className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          campaign.recipientList === list.value
                            ? 'border-brand-blue-600 bg-brand-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="recipientList"
                            value={list.value}
                            checked={campaign.recipientList === list.value}
                            onChange={(
                              e: React.ChangeEvent<
                                | HTMLInputElement
                                | HTMLSelectElement
                                | HTMLTextAreaElement
                              >
                            ) =>
                              setCampaign({
                                ...campaign,
                                recipientList: e.target.value,
                              })
                            }
                            className="w-4 h-4 text-brand-blue-600"
                          />
                          <div>
                            <div className="font-medium text-black">
                              {list.label}
                            </div>
                            <div className="text-sm text-black">
                              {list.count} contacts
                            </div>
                          </div>
                        </div>
                        <Users className="w-5 h-5 text-black" />
                      </label>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setStep('content')}
                      className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep('schedule')}
                      className="flex-1 bg-brand-blue-600 text-white py-2 rounded-lg hover:bg-brand-blue-700"
                    >
                      Continue to Schedule
                    </button>
                  </div>
                </div>
              )}

              {step === 'schedule' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">Schedule Campaign</h2>

                  <div className="space-y-3">
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="scheduleType"
                        value="now"
                        checked={campaign.scheduleType === 'now'}
                        onChange={(
                          e: React.ChangeEvent<
                            | HTMLInputElement
                            | HTMLSelectElement
                            | HTMLTextAreaElement
                          >
                        ) => setCampaign({ ...campaign, scheduleType: 'now' })}
                        className="w-4 h-4 text-brand-blue-600"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-black">
                          Send Now
                        </div>
                        <div className="text-sm text-black">
                          Campaign will be sent immediately
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="scheduleType"
                        value="scheduled"
                        checked={campaign.scheduleType === 'scheduled'}
                        onChange={(
                          e: React.ChangeEvent<
                            | HTMLInputElement
                            | HTMLSelectElement
                            | HTMLTextAreaElement
                          >
                        ) =>
                          setCampaign({
                            ...campaign,
                            scheduleType: 'scheduled',
                          })
                        }
                        className="w-4 h-4 text-brand-blue-600 mt-1"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-black mb-3">
                          Schedule for Later
                        </div>
                        {campaign.scheduleType === 'scheduled' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm text-black mb-1">
                                Date
                              </label>
                              <input
                                type="date"
                                value={campaign.scheduleDate}
                                onChange={(
                                  e: React.ChangeEvent<
                                    | HTMLInputElement
                                    | HTMLSelectElement
                                    | HTMLTextAreaElement
                                  >
                                ) =>
                                  setCampaign({
                                    ...campaign,
                                    scheduleDate: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-black mb-1">
                                Time
                              </label>
                              <input
                                type="time"
                                value={campaign.scheduleTime}
                                onChange={(
                                  e: React.ChangeEvent<
                                    | HTMLInputElement
                                    | HTMLSelectElement
                                    | HTMLTextAreaElement
                                  >
                                ) =>
                                  setCampaign({
                                    ...campaign,
                                    scheduleTime: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setStep('recipients')}
                      className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                    >
                      Back
                    </button>
                    {campaign.scheduleType === 'now' ? (
                      <button
                        onClick={handleSendNow}
                        className="flex-1 bg-brand-blue-600 text-white py-2 rounded-lg hover:bg-brand-blue-700"
                      >
                        Send Campaign Now
                      </button>
                    ) : (
                      <button
                        onClick={handleSchedule}
                        className="flex-1 bg-brand-blue-600 text-white py-2 rounded-lg hover:bg-brand-blue-700"
                      >
                        Schedule Campaign
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h3 className="font-semibold text-black mb-4">Preview</h3>

              <div className="space-y-4">
                <div>
                  <div className="text-xs text-black mb-1">Subject</div>
                  <div className="text-sm font-medium text-black">
                    {campaign.subject || 'No subject'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-black mb-1">From</div>
                  <div className="text-sm text-black">
                    {campaign.fromName} &lt;{campaign.fromEmail}&gt;
                  </div>
                </div>

                <div>
                  <div className="text-xs text-black mb-1">Recipients</div>
                  <div className="text-sm text-black">
                    {campaign.recipientList
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </div>
                </div>

                {campaign.scheduleType === 'scheduled' &&
                  campaign.scheduleDate && (
                    <div>
                      <div className="text-xs text-black mb-1">
                        Scheduled For
                      </div>
                      <div className="text-sm text-black">
                        {campaign.scheduleDate} at {campaign.scheduleTime}
                      </div>
                    </div>
                  )}

                <div className="border-t pt-4">
                  <div className="text-xs text-black mb-2">
                    Email Preview
                  </div>
                  <div className="border rounded-lg p-3 bg-gray-50 max-h-96 overflow-auto">
                    {campaign.customHtml ? (
                      <div
                        className="text-xs"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(campaign.customHtml),
                        }}
                      />
                    ) : (
                      <div className="text-xs text-black italic">
                        Select a template to preview
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <section className="py-16    text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Create Email Campaign
                          </h2>
              <p className="text-base md:text-lg mb-8 text-brand-blue-100">
              Design and schedule targeted email campaigns to students and partners.
                          </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/admin/email-marketing"
                  className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                >
                View Campaigns
                </Link>
                <Link
                  href="/admin/email-marketing/analytics"
                  className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                >
                View Analytics
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
