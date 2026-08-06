import { Metadata } from 'next';
import Link from 'next/link';
import { Settings, GitBranch, Container, Zap, BarChart3, Shield, Code2, Rocket, Layers } from 'lucide-react';
import { getAdminUrl } from '@/lib/config/admin-url';

export const metadata: Metadata = {
  title: 'Dev Studio | AI-Powered Development Platform',
  description: 'Enterprise-grade development environment for managing AI workflows, deployments, integrations, and operations. Built for workforce technology teams.',
};

const features = [
  {
    icon: Container,
    title: 'Container Management',
    description: 'Deploy and manage Docker containers with Northflank integration. Monitor health, scale resources, and manage configurations.',
  },
  {
    icon: GitBranch,
    title: 'Git Integration',
    description: 'Connect GitHub repositories, trigger builds on push, manage branches and deployments from a unified interface.',
  },
  {
    icon: Rocket,
    title: 'One-Click Deployments',
    description: 'Deploy marketing, admin, and LMS applications with single clicks. Track deployment status and rollback history.',
  },
  {
    icon: Zap,
    title: 'AI Workflow Automation',
    description: 'Orchestrate AI agents, prompts, and memory systems. Build complex workflows with visual tools.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Monitoring',
    description: 'Track build logs, container health, API performance, and system metrics in real-time.',
  },
  {
    icon: Shield,
    title: 'Secrets Management',
    description: 'Securely store and manage API keys, tokens, and environment variables. Never expose credentials.',
  },
];

const capabilities = [
  'Northflank container orchestration',
  'GitHub Actions integration',
  'Multi-environment deployments',
  'Build log streaming',
  'Health check monitoring',
  'Environment variable management',
  'AI agent orchestration',
  'Workflow designer',
];

export default function DevStudioPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full text-sm mb-6">
              <Code2 className="w-4 h-4" />
              Enterprise Development Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Dev Studio
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              AI-powered development environment for workforce technology teams. Manage containers, 
              deployments, AI workflows, and system operations from a unified platform.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href={getAdminUrl("/studio")} className="px-8 py-4 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition">
                Access Dev Studio
              </a>
              <Link href="/contact" className="px-8 py-4 bg-white/10 border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition">
                Schedule Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Enterprise Development Tools</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Everything your development team needs to build, deploy, and manage workforce technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="group p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Complete Development Suite</h2>
              <p className="text-slate-600 mb-8">
                Dev Studio provides your team with professional-grade tools for managing the entire 
                development lifecycle—from code to production.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {capabilities.map((cap) => (
                  <div key={cap} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Layers className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-slate-700">{cap}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm">
              <div className="text-slate-500 mb-2">// Deploy with one click</div>
              <div className="text-green-400">$ elevate deploy --env production</div>
              <div className="text-slate-400 mt-4">Building marketing...</div>
              <div className="text-slate-400">Building admin...</div>
              <div className="text-slate-400">Building lms...</div>
              <div className="text-green-400 mt-4">✓ Deployed to Northflank</div>
              <div className="text-blue-400 mt-2">https://elevate.work</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Accelerate Development?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Give your team the development platform they deserve.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href={getAdminUrl("/studio")} className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition">
              Access Dev Studio
            </a>
            <Link href="/platform/enterprise" className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition">
              Enterprise Solutions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
