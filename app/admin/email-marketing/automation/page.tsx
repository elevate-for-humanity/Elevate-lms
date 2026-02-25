"use client";
import React from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

import {

  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Users,
  Mail,
  Clock,
  Zap,
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  status: 'active' | 'paused' | 'draft';
  emails: number;
  recipients: number;
  lastRun: string | null;
}

export default function AutomationPage() {
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

  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Welcome Series',
      trigger: 'New Student Enrollment',
      status: 'active',
      emails: 3,
      recipients: 142,
      lastRun: '2025-12-07T10:30:00Z',
    },
    {
      id: '2',
      name: 'Application Follow-Up',
      trigger: 'Abandoned Application',
      status: 'active',
      emails: 2,
      recipients: 67,
      lastRun: '2025-12-06T15:45:00Z',
    },
    {
      id: '3',
      name: 'Course Completion',
      trigger: 'Program Completed',
      status: 'paused',
      emails: 4,
      recipients: 0,
      lastRun: null,
    },
  ]);

  const toggleStatus = (id: string) => {
    setWorkflows(
      workflows.map((w) =>
        w.id === id
          ? { ...w, status: w.status === 'active' ? 'paused' : 'active' }
          : w
      )
    );
  };

  const deleteWorkflow = (id: string) => {
    if (confirm('Delete this workflow?')) {
      setWorkflows(workflows.filter((w) => w.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Automation" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/programs-hq/business-training.jpg"
          alt="Automation"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Marketing Automation
              </h1>
              <p className="text-black mt-1">
                Create automated email workflows and drip campaigns
              </p>
            </div>

            <button
              onClick={() =>
                router.push('/admin/email-marketing/automation/new')
              }
              className="flex items-center space-x-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Workflow</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-brand-blue-600" />
            </div>
            <div className="text-2xl font-bold text-black">
              {workflows.length}
            </div>
            <div className="text-sm text-black">Total Workflows</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Play className="w-8 h-8 text-brand-green-600" />
            </div>
            <div className="text-2xl font-bold text-black">
              {workflows.filter((w) => w.status === 'active').length}
            </div>
            <div className="text-sm text-black">Active Workflows</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Mail className="w-8 h-8 text-brand-blue-600" />
            </div>
            <div className="text-2xl font-bold text-black">
              {workflows.reduce((sum, w) => sum + w.emails, 0)}
            </div>
            <div className="text-sm text-black">Total Emails</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-brand-orange-600" />
            </div>
            <div className="text-2xl font-bold text-black">
              {workflows.reduce((sum, w) => sum + w.recipients, 0)}
            </div>
            <div className="text-sm text-black">Active Recipients</div>
          </div>
        </div>

        {/* Workflow Templates */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-black mb-4">
            Quick Start Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <WorkflowTemplate
              title="Welcome Series"
              description="Onboard new students with 3-email sequence"
              icon={Mail}
              color="blue"
              onClick={() =>
                router.push(
                  '/admin/email-marketing/automation/new?template=welcome'
                )
              }
            />
            <WorkflowTemplate
              title="Abandoned Application"
              description="Re-engage applicants who didn't complete"
              icon={Clock}
              color="orange"
              onClick={() =>
                router.push(
                  '/admin/email-marketing/automation/new?template=abandoned'
                )
              }
            />
            <WorkflowTemplate
              title="Course Reminders"
              description="Send reminders before class starts"
              icon={Zap}
              color="blue"
              onClick={() =>
                router.push(
                  '/admin/email-marketing/automation/new?template=reminder'
                )
              }
            />
          </div>
        </div>

        {/* Workflows List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-black">
              Your Workflows
            </h2>
          </div>

          {workflows.length === 0 ? (
            <div className="p-12 text-center">
              <Zap className="w-12 h-12 text-black mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">
                No workflows yet
              </h3>
              <p className="text-black mb-6">
                Create your first automated workflow to save time
              </p>
              <button
                onClick={() =>
                  router.push('/admin/email-marketing/automation/new')
                }
                className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Create Workflow</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-black">
                          {workflow.name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            workflow.status === 'active'
                              ? 'bg-brand-green-100 text-brand-green-800'
                              : workflow.status === 'paused'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-black'
                          }`}
                        >
                          {workflow.status === 'active'
                            ? '● Active'
                            : workflow.status === 'paused'
                              ? '⏸ Paused'
                              : '○ Draft'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-black">
                        <div className="flex items-center space-x-2">
                          <Zap className="w-4 h-4" />
                          <span>Trigger: {workflow.trigger}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>{workflow.emails} emails</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{workflow.recipients} recipients</span>
                        </div>
                        {workflow.lastRun && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              Last run:{' '}
                              {new Date(workflow.lastRun).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleStatus(workflow.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          workflow.status === 'active'
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-brand-green-100 text-brand-green-700 hover:bg-brand-green-200'
                        }`}
                        title={
                          workflow.status === 'active' ? 'Pause' : 'Activate'
                        }
                      >
                        {workflow.status === 'active' ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() =>
                          router.push(
                            `/admin/email-marketing/automation/${workflow.id}/edit`
                          )
                        }
                        className="p-2 bg-brand-blue-100 text-brand-blue-700 rounded-lg hover:bg-brand-blue-200 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteWorkflow(workflow.id)}
                        className="p-2 bg-brand-red-100 text-brand-red-700 rounded-lg hover:bg-brand-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                    src="/images/pathways/business-hero.jpg"
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

interface WorkflowTemplateProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'orange' | 'blue';
  onClick: () => void;
}

function WorkflowTemplate({
  title,
  description,
  icon: Icon,
  color,
  onClick,
}: WorkflowTemplateProps) {
  const colorClasses = {
    blue: 'bg-brand-blue-50 text-brand-blue-600 hover:bg-gray-100',
    orange: 'bg-brand-orange-50 text-brand-orange-600 hover:bg-brand-orange-100',
    blue: 'bg-brand-blue-50 text-brand-blue-600 hover:bg-brand-blue-100',
  };

  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all text-left ${colorClasses[color]}`}
    >
      <Icon className="w-8 h-8 mb-3" />
      <h3 className="font-semibold text-black mb-2">{title}</h3>
      <p className="text-sm text-black">{description}</p>
    </button>
  );
}
