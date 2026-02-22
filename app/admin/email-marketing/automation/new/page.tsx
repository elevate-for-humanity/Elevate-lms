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
  Plus,
  Trash2,
  Mail,
  Clock,
  Users,
  Save,
  Play,
} from 'lucide-react';
import { emailTemplates } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

interface EmailStep {
  id: string;
  delay: number;
  delayUnit: 'minutes' | 'hours' | 'days';
  template: EmailTemplateKey | '';
  subject: string;
  customHtml: string;
}

export default function NewWorkflowPage() {
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

  const [workflow, setWorkflow] = useState({
    name: '',
    trigger: 'enrollment' as
      | 'enrollment'
      | 'application'
      | 'completion'
      | 'abandoned',
    targetAudience: 'all-students',
  });

  const [steps, setSteps] = useState<EmailStep[]>([
    {
      id: '1',
      delay: 0,
      delayUnit: 'minutes',
      template: '',
      subject: '',
      customHtml: '',
    },
  ]);

  const addStep = () => {
    const newStep: EmailStep = {
      id: Date.now().toString(),
      delay: 1,
      delayUnit: 'days',
      template: '',
      subject: '',
      customHtml: '',
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: string) => {
    if (steps.length === 1) return;
    setSteps(steps.filter((s) => s.id !== id));
  };

  const updateStep = (id: string, updates: Partial<EmailStep>) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const selectTemplate = (stepId: string, templateKey: EmailTemplateKey) => {
    const template = emailTemplates[templateKey];
    updateStep(stepId, {
      template: templateKey,
      subject: template.subject,
      customHtml: template.html,
    });
  };

  const saveWorkflow = async (status: 'draft' | 'active') => {
    const response = await fetch('/api/email/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...workflow,
        steps,
        status,
      }),
    });

    if (response.ok) {
      alert(
        status === 'draft' ? 'Workflow saved as draft!' : 'Workflow activated!'
      );
      router.push('/admin/email-marketing/automation');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "New" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/programs/cpr-group-training-hd.jpg"
          alt="New"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/email-marketing/automation')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  Create Drip Campaign
                </h1>
                <p className="text-sm text-black">
                  Build automated email sequences
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => saveWorkflow('draft')}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={() => saveWorkflow('active')}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
              >
                <Play className="w-4 h-4" />
                <span>Activate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workflow Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Workflow Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    value={workflow.name}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) => setWorkflow({ ...workflow, name: e.target.value })}
                    placeholder="e.g., Welcome Series"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Trigger Event
                  </label>
                  <select
                    value={workflow.trigger}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) =>
                      setWorkflow({
                        ...workflow,
                        trigger: e.target.value as
                          | 'enrollment'
                          | 'application'
                          | 'completion'
                          | 'abandoned',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  >
                    <option value="enrollment">New Student Enrollment</option>
                    <option value="application">
                      New Application Submitted
                    </option>
                    <option value="completion">Program Completion</option>
                    <option value="abandoned">
                      Abandoned Application (24 hours)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Target Audience
                  </label>
                  <select
                    value={workflow.targetAudience}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) =>
                      setWorkflow({
                        ...workflow,
                        targetAudience: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  >
                    <option value="all-students">All Students</option>
                    <option value="barber">Barber Program</option>
                    <option value="cna">CNA Program</option>
                    <option value="cdl">CDL Program</option>
                    <option value="hvac">HVAC Program</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Email Steps */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Email Sequence</h2>
                <button
                  onClick={addStep}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Email</span>
                </button>
              </div>

              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="border-2 border-gray-200 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <h3 className="font-semibold text-black">
                          Email {index + 1}
                          {index === 0 ? ' (Immediate)' : ''}
                        </h3>
                      </div>
                      {steps.length > 1 && (
                        <button
                          onClick={() => removeStep(step.id)}
                          className="p-2 text-brand-orange-600 hover:bg-brand-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {index > 0 && (
                      <div className="mb-4 flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-black" />
                        <span className="text-sm text-black">Wait</span>
                        <input
                          type="number"
                          value={step.delay}
                          onChange={(
                            e: React.ChangeEvent<
                              | HTMLInputElement
                              | HTMLSelectElement
                              | HTMLTextAreaElement
                            >
                          ) =>
                            updateStep(step.id, {
                              delay: parseInt(e.target.value),
                            })
                          }
                          min="1"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <select
                          value={step.delayUnit}
                          onChange={(
                            e: React.ChangeEvent<
                              | HTMLInputElement
                              | HTMLSelectElement
                              | HTMLTextAreaElement
                            >
                          ) =>
                            updateStep(step.id, {
                              delayUnit: e.target.value as
                                | 'minutes'
                                | 'hours'
                                | 'days',
                            })
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                        <span className="text-sm text-black">
                          after previous email
                        </span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Select Template
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(emailTemplates)
                            .slice(0, 6)
                            .map(([key, template]) => (
                              <button
                                key={key}
                                onClick={() =>
                                  selectTemplate(
                                    step.id,
                                    key as EmailTemplateKey
                                  )
                                }
                                className={`p-3 border-2 rounded-lg text-left text-sm transition-colors ${
                                  step.template === key
                                    ? 'border-brand-blue-600 bg-brand-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="font-medium text-black">
                                  {template.name}
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Subject Line
                        </label>
                        <input
                          type="text"
                          value={step.subject}
                          onChange={(
                            e: React.ChangeEvent<
                              | HTMLInputElement
                              | HTMLSelectElement
                              | HTMLTextAreaElement
                            >
                          ) => updateStep(step.id, { subject: e.target.value })}
                          placeholder="Email subject"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-2">
                          Preview
                        </label>
                        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-40 overflow-auto">
                          {step.customHtml ? (
                            <div
                              className="text-xs"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeHtml(
                                  step.customHtml.substring(0, 500) + '...'
                                ),
                              }}
                            />
                          ) : (
                            <p className="text-sm text-black italic">
                              Select a template to preview
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h3 className="font-semibold text-black mb-4">
                Workflow Summary
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="text-xs text-black mb-1">Name</div>
                  <div className="text-sm font-medium text-black">
                    {workflow.name || 'Untitled Workflow'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-black mb-1">Trigger</div>
                  <div className="text-sm text-black">
                    {workflow.trigger === 'enrollment'
                      ? 'New Student Enrollment'
                      : workflow.trigger === 'application'
                        ? 'New Application'
                        : workflow.trigger === 'completion'
                          ? 'Program Completion'
                          : 'Abandoned Application'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-black mb-1">
                    Target Audience
                  </div>
                  <div className="text-sm text-black">
                    {workflow.targetAudience
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-black mb-1">Total Emails</div>
                  <div className="text-sm font-medium text-black">
                    {steps.length}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-xs text-black mb-2">Timeline</div>
                  <div className="space-y-2">
                    {steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-start space-x-2 text-xs"
                      >
                        <Mail className="w-3 h-3 text-brand-blue-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-black">
                            Email {index + 1}
                          </div>
                          <div className="text-black">
                            {index === 0
                              ? 'Immediate'
                              : `${step.delay} ${step.delayUnit} after Email ${index}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-xs text-black mb-2">
                    Total Duration
                  </div>
                  <div className="text-sm font-medium text-black">
                    {calculateTotalDuration(steps)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/heroes/blog-post-8.jpg"
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

function calculateTotalDuration(steps: EmailStep[]): string {
  let totalMinutes = 0;

  steps.forEach((step, index) => {
    if (index === 0) return;

    const minutes =
      step.delayUnit === 'minutes'
        ? step.delay
        : step.delayUnit === 'hours'
          ? step.delay * 60
          : step.delay * 24 * 60;
    totalMinutes += minutes;
  });

  if (totalMinutes < 60) return `${totalMinutes} minutes`;
  if (totalMinutes < 1440) return `${Math.round(totalMinutes / 60)} hours`;
  return `${Math.round(totalMinutes / 1440)} days`;
}
