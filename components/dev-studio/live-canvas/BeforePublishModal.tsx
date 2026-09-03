'use client';

import { useState } from 'react';
import { 
  X, 
  Eye, 
  GitCompare,
  Code,
  Database,
  Link2,
  Gauge,
  Accessibility,
  Search,
  Shield,
  Clock,
  AlertTriangle,
  Check,
  ChevronRight,
  Download,
  Rocket
} from 'lucide-react';
import type { BeforePublishReport } from './types';

interface BeforePublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
  report?: BeforePublishReport;
  isPublishing?: boolean;
}

export function BeforePublishModal({
  isOpen,
  onClose,
  onPublish,
  report,
  isPublishing = false,
}: BeforePublishModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'code' | 'database' | 'security'>('overview');

  if (!isOpen) return null;

  // Mock report data if none provided
  const mockReport: BeforePublishReport = report || {
    preview: {
      url: '/preview',
      screenshot: undefined,
    },
    comparison: {
      current: 'Production (Live)',
      proposed: 'Development Build #42',
      changes: [
        'Added Student Dashboard page',
        'Updated Hero component',
        'New Stripe integration',
        'Fixed navigation bug',
      ],
    },
    codeChanges: [
      { id: '1', file: 'pages/student-dashboard.tsx', type: 'added', linesAdded: 245, linesRemoved: 0 },
      { id: '2', file: 'components/Hero.tsx', type: 'modified', linesAdded: 12, linesRemoved: 3 },
      { id: '3', file: 'lib/stripe.ts', type: 'modified', linesAdded: 89, linesRemoved: 12 },
      { id: '4', file: 'app/nav.tsx', type: 'modified', linesAdded: 5, linesRemoved: 8 },
    ],
    databaseChanges: [
      { id: '1', type: 'table', name: 'student_credentials', sql: 'CREATE TABLE student_credentials (...)' },
      { id: '2', type: 'column', name: 'students.avatar_url', sql: 'ALTER TABLE students ADD COLUMN avatar_url TEXT' },
    ],
    newIntegrations: ['Stripe', 'Adzuna Jobs API'],
    metrics: {
      performanceScore: 87,
      accessibilityScore: 92,
      seoScore: 85,
      securityScore: 94,
      deploymentTime: '~3 minutes',
    },
    risks: [
      { severity: 'low', description: 'New dependencies added (Stripe SDK)' },
      { severity: 'low', description: 'Database migration will lock table briefly' },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-brand-red-600" />
              Ready to Publish
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Review changes before deploying to production
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {[
            { id: 'overview' as const, label: 'Overview', icon: Eye },
            { id: 'code' as const, label: 'Code Changes', icon: Code },
            { id: 'database' as const, label: 'Database', icon: Database },
            { id: 'security' as const, label: 'Security', icon: Shield },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-brand-red-600 border-brand-red-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <OverviewTab report={mockReport} />
          )}
          {activeTab === 'code' && (
            <CodeTab changes={mockReport.codeChanges} />
          )}
          {activeTab === 'database' && (
            <DatabaseTab changes={mockReport.databaseChanges} />
          )}
          {activeTab === 'security' && (
            <SecurityTab report={mockReport} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-emerald-600">
              <Check className="w-4 h-4" />
              All checks passed
            </div>
            <span className="text-sm text-slate-500">
              {mockReport.metrics.deploymentTime} estimated deployment
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onPublish}
              disabled={isPublishing}
              className="flex items-center gap-2 px-6 py-2 bg-brand-red-600 text-white font-bold rounded-lg hover:bg-brand-red-700 disabled:opacity-50 transition-colors"
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Publish Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ report }: { report: BeforePublishReport }) {
  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard 
          icon={<Gauge className="w-5 h-5" />}
          label="Performance"
          value={report.metrics.performanceScore}
          color="blue"
        />
        <MetricCard 
          icon={<Accessibility className="w-5 h-5" />}
          label="Accessibility"
          value={report.metrics.accessibilityScore}
          color="emerald"
        />
        <MetricCard 
          icon={<Search className="w-5 h-5" />}
          label="SEO"
          value={report.metrics.seoScore}
          color="purple"
        />
        <MetricCard 
          icon={<Shield className="w-5 h-5" />}
          label="Security"
          value={report.metrics.securityScore}
          color="amber"
        />
      </div>

      {/* Comparison */}
      <div className="bg-slate-50 rounded-xl p-4">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <GitCompare className="w-4 h-4" />
          What&apos;s Changing
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex-1 p-3 bg-white rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Current</p>
            <p className="font-medium text-slate-700">{report.comparison.current}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
          <div className="flex-1 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-xs text-emerald-600 mb-1">Proposed</p>
            <p className="font-medium text-emerald-700">{report.comparison.proposed}</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {report.comparison.changes.map((change, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
              <Check className="w-4 h-4 text-emerald-500" />
              {change}
            </li>
          ))}
        </ul>
      </div>

      {/* New Integrations */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          New Integrations
        </h3>
        <div className="flex gap-2">
          {report.newIntegrations.map(integration => (
            <span 
              key={integration}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg"
            >
              {integration}
            </span>
          ))}
        </div>
      </div>

      {/* Risks */}
      {report.risks.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Attention Needed
          </h3>
          <ul className="space-y-2">
            {report.risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                  risk.severity === 'low' ? 'bg-yellow-100 text-yellow-700' :
                  risk.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {risk.severity}
                </span>
                {risk.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Metric Card
function MetricCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: string;
}) {
  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-500' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: 'text-emerald-500' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-500' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-600', icon: 'text-amber-500' },
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.icon}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

// Code Tab
function CodeTab({ changes }: { changes: BeforePublishReport['codeChanges'] }) {
  return (
    <div className="space-y-3">
      {changes.map(change => (
        <div key={change.id} className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
              change.type === 'added' ? 'bg-emerald-100 text-emerald-700' :
              change.type === 'modified' ? 'bg-blue-100 text-blue-700' :
              'bg-red-100 text-red-700'
            }`}>
              {change.type}
            </span>
            <code className="text-sm text-slate-700">{change.file}</code>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-emerald-600">+{change.linesAdded}</span>
            {change.linesRemoved > 0 && (
              <span className="text-red-600">-{change.linesRemoved}</span>
            )}
          </div>
        </div>
      ))}
      <div className="pt-4 flex justify-end">
        <button className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          Download Diff
        </button>
      </div>
    </div>
  );
}

// Database Tab
function DatabaseTab({ changes }: { changes: BeforePublishReport['databaseChanges'] }) {
  return (
    <div className="space-y-4">
      {changes.map(change => (
        <div key={change.id} className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
              change.type === 'table' ? 'bg-purple-100 text-purple-700' :
              change.type === 'column' ? 'bg-blue-100 text-blue-700' :
              'bg-slate-200 text-slate-700'
            }`}>
              {change.type}
            </span>
            <span className="font-medium text-slate-700">{change.name}</span>
          </div>
          <code className="text-xs text-slate-500 block bg-white p-2 rounded border">
            {change.sql}
          </code>
        </div>
      ))}
    </div>
  );
}

// Security Tab
function SecurityTab({ report }: { report: BeforePublishReport }) {
  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              strokeWidth="8"
              stroke="currentColor"
              className="text-slate-200"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              strokeWidth="8"
              stroke="currentColor"
              className="text-emerald-500"
              fill="none"
              strokeDasharray={`${report.metrics.securityScore * 3.52} 352`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-slate-900">{report.metrics.securityScore}</span>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Security Score</h3>
          <p className="text-slate-500">
            {report.metrics.securityScore >= 90 ? 'Excellent' : 
             report.metrics.securityScore >= 70 ? 'Good' : 'Needs Improvement'}
          </p>
        </div>
      </div>

      {/* Security Checks */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'HTTPS Enabled', status: true },
          { label: 'SQL Injection Protected', status: true },
          { label: 'XSS Protection', status: true },
          { label: 'CSRF Tokens', status: true },
          { label: 'Secure Headers', status: true },
          { label: 'API Authentication', status: true },
          { label: 'Rate Limiting', status: true },
          { label: 'Input Validation', status: true },
        ].map((check, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            {check.status ? (
              <Check className="w-5 h-5 text-emerald-500" />
            ) : (
              <X className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm text-slate-700">{check.label}</span>
          </div>
        ))}
      </div>

      {/* Risks */}
      {report.risks.length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-900 mb-3">Potential Issues</h4>
          <ul className="space-y-2">
            {report.risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                    risk.severity === 'low' ? 'bg-yellow-100 text-yellow-700' :
                    risk.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {risk.severity}
                  </span>
                  <span className="ml-2 text-sm text-slate-700">{risk.description}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default BeforePublishModal;
