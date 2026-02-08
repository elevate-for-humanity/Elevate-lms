'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Zap,
  Image as ImageIcon,
  Database,
  Trash2,
  Gauge,
  Search,
  Rocket,
  BookOpen,
  RefreshCw,
  Circle,
  XCircle,
  Loader2,
} from 'lucide-react';

interface AutopilotTask {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  script: string;
  category: 'build' | 'fix' | 'optimize' | 'deploy';
}

const autopilots: AutopilotTask[] = [
  {
    id: 'build-courses',
    name: 'Build Courses',
    description: 'Generate course content from Supabase data with AI',
    icon: BookOpen,
    script: 'build-courses',
    category: 'build',
  },
  {
    id: 'fix-images',
    name: 'Fix Images',
    description: 'Pull missing hero banners and optimize images',
    icon: ImageIcon,
    script: 'fix-images',
    category: 'fix',
  },
  {
    id: 'sync-schema',
    name: 'Sync Database Schema',
    description: 'Update Supabase schema and run migrations',
    icon: Database,
    script: 'sync-schema',
    category: 'fix',
  },
  {
    id: 'clean-repo',
    name: 'Clean Repository',
    description: 'Remove obsolete files and optimize structure',
    icon: Trash2,
    script: 'clean-repo',
    category: 'optimize',
  },
  {
    id: 'performance-audit',
    name: 'Performance Audit',
    description: 'Run Lighthouse and optimize bundle size',
    icon: Gauge,
    script: 'performance-audit',
    category: 'optimize',
  },
  {
    id: 'seo-audit',
    name: 'SEO Audit',
    description: 'Check metadata, sitemaps, and SEO best practices',
    icon: Search,
    script: 'seo-audit',
    category: 'optimize',
  },
  {
    id: 'deploy',
    name: 'Deploy to Production',
    description: 'Build and deploy to Vercel with all checks',
    icon: Rocket,
    script: 'deploy',
    category: 'deploy',
  },
  {
    id: 'clone-repo',
    name: 'Clone Codebase',
    description: 'Create clean repo copy for resale',
    icon: RefreshCw,
    script: 'clone-repo',
    category: 'build',
  },
];

export default function AutopilotsPage() {
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

  const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [failedTasks, setFailedTasks] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<{ [key: string]: string[] }>({});
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const addLog = (taskId: string, message: string) => {
    setLogs((prev) => ({
      ...prev,
      [taskId]: [
        ...(prev[taskId] || []),
        `[${new Date().toLocaleTimeString()}] ${message}`,
      ],
    }));
  };

  const runAutopilot = async (task: AutopilotTask) => {
    setRunningTasks((prev) => new Set(prev).add(task.id));
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      next.delete(task.id);
      return next;
    });
    setFailedTasks((prev) => {
      const nextFailed = new Set(prev);
      nextFailed.delete(task.id);
      return nextFailed;
    });
    setSelectedTask(task.id);

    addLog(task.id, `Starting ${task.name}...`);

    try {
      const res = await fetch(`/api/autopilots/${task.script}`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();

        // Stream logs if available
        if (data.logs) {
          data.logs.forEach((log: string) => addLog(task.id, log));
        }

        addLog(
          task.id,
          `<Circle className="w-5 h-5 inline-block" /> ${task.name} completed successfully`
        );
        setCompletedTasks((prev) => new Set(prev).add(task.id));
      } else {
        const error = await res.json();
        addLog(
          task.id,
          `<XCircle className="w-5 h-5 inline-block" /> Failed: ${error.message || 'Unknown error'}`
        );
        setFailedTasks((prev) => new Set(prev).add(task.id));
      }
    } catch (error) { /* Error handled silently */ 
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      addLog(
        task.id,
        `<XCircle className="w-5 h-5 inline-block" /> Error: ${errorMessage}`
      );
      setFailedTasks((prev) => new Set(prev).add(task.id));
    } finally {
      setRunningTasks((prev) => {
        const nextRunning = new Set(prev);
        nextRunning.delete(task.id);
        return nextRunning;
      });
    }
  };

  const getTaskStatus = (taskId: string) => {
    if (runningTasks.has(taskId)) return 'running';
    if (completedTasks.has(taskId)) return 'completed';
    if (failedTasks.has(taskId)) return 'failed';
    return 'idle';
  };

  const categories = {
    build: autopilots.filter((a) => a.category === 'build'),
    fix: autopilots.filter((a) => a.category === 'fix'),
    optimize: autopilots.filter((a) => a.category === 'optimize'),
    deploy: autopilots.filter((a) => a.category === 'deploy'),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Autopilots" }]} />
      </div>
      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[500px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/business/team-2.jpg"
          alt="Hero"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Welcome</h1>
          <p className="text-base md:text-lg mb-8 text-gray-100">
            Transform your career with free training
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Autopilot Control Center
          </h1>
          <p className="text-black">
            Run automated tasks to build, fix, optimize, and deploy your
            platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Autopilot Cards */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(categories).map(([category, tasks]: any) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-black mb-3 capitalize">
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.map((task) => {
                    const Icon = task.icon;
                    const status = getTaskStatus(task.id);

                    return (
                      <div
                        key={task.id}
                        className={`bg-white rounded-lg border-2 p-6 transition-all ${
                          status === 'running'
                            ? 'border-blue-500 shadow-lg'
                            : status === 'completed'
                              ? 'border-green-500'
                              : status === 'failed'
                                ? 'border-red-500'
                                : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                status === 'running'
                                  ? 'bg-blue-100'
                                  : status === 'completed'
                                    ? 'bg-brand-blue-100'
                                    : status === 'failed'
                                      ? 'bg-red-100'
                                      : 'bg-gray-100'
                              }`}
                            >
                              <Icon
                                className={`w-5 h-5 ${
                                  status === 'running'
                                    ? 'text-brand-blue-600'
                                    : status === 'completed'
                                      ? 'text-brand-blue-600'
                                      : status === 'failed'
                                        ? 'text-brand-blue-600'
                                        : 'text-black'
                                }`}
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold text-black">
                                {task.name}
                              </h3>
                              <p className="text-sm text-black mt-1">
                                {task.description}
                              </p>
                            </div>
                          </div>

                          {status === 'running' && (
                            <Loader2 className="w-5 h-5 text-brand-blue-600 animate-spin" />
                          )}
                          {status === 'completed' && (
                            <Circle className="w-5 h-5 text-brand-blue-600" />
                          )}
                          {status === 'failed' && (
                            <XCircle className="w-5 h-5 text-brand-blue-600" />
                          )}
                        </div>

                        <button
                          onClick={() => runAutopilot(task)}
                          disabled={status === 'running'}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                            status === 'running'
                              ? 'bg-gray-300 cursor-not-allowed'
                              : 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white'
                          }`}
                        >
                          {status === 'running'
                            ? 'Running...'
                            : 'Run Autopilot'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Logs Panel */}
          <div className="lg:col-span-1">
            <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-sm h-[600px] overflow-auto sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold">Terminal Output</h3>
                {selectedTask && (
                  <button
                    onClick={() =>
                      setLogs((prev) => ({ ...prev, [selectedTask]: [] }))
                    }
                    className="text-black hover:text-white text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {selectedTask && logs[selectedTask] ? (
                <div className="space-y-1">
                  {logs[selectedTask].map((log, i) => (
                    <div key={i} className="whitespace-pre-wrap break-words">
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-black">
                  $ Select an autopilot to see output...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <section className="py-16    text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
                Ready to Improve Your Career?
              </h2>
              <p className="text-base md:text-lg mb-8 text-blue-100">
                Join thousands who have launched successful careers through our
                free training programs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="bg-white text-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                >
                  Apply Now - It's Free
                </Link>
                <Link
                  href="/programs"
                  className="bg-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                >
                  Browse All Programs
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
