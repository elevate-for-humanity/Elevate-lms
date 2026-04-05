'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState, useEffect } from 'react';
import { 
  
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  Building2,
  DollarSign,
  FileText,
  Signature,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';

// Funding pathway labels
const PATHWAY_LABELS = {
  workforce_funded: 'Workforce-Funded',
  employer_sponsored: 'Employer-Sponsored',
  structured_tuition: 'Structured Tuition (Bridge)',
};

const STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-600',
  identity_pending: 'bg-yellow-100 text-yellow-700',
  workforce_screening: 'bg-brand-blue-100 text-brand-blue-700',
  employer_screening: 'bg-brand-blue-100 text-brand-blue-700',
  financial_readiness: 'bg-brand-orange-100 text-brand-orange-700',
  program_readiness: 'bg-cyan-100 text-cyan-700',
  pending_signature: 'bg-amber-100 text-amber-700',
  completed: 'bg-brand-green-100 text-brand-green-700',
  rejected: 'bg-brand-red-100 text-brand-red-700',
};



export default function AdminIntakePage() {
  const [intakes, setIntakes] = useState<any[]>([]);
  const [selectedIntake, setSelectedIntake] = useState<any>(null);
  const [scriptAcknowledged, setScriptAcknowledged] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchIntakes();
  }, [filter]);

  async function fetchIntakes() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/intakes');
      const data = await res.json();
      setIntakes(data.intakes || []);
    } catch (error) {
      console.error('Failed to fetch intakes:', error);
    }
    setLoading(false);
  }

  const filteredIntakes = intakes.filter(intake => {
    if (filter !== 'all' && intake.status !== filter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        intake.user_name?.toLowerCase().includes(searchLower) ||
        intake.user_email?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white p-6">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Intake" }]} />
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admissions Intake Management</h1>
          <p className="text-gray-600 mt-1">
            Process intake workflows and assign funding pathways
          </p>
        </div>

        {/* Script Acknowledgment Banner */}
        {!scriptAcknowledged && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800">Script Acknowledgment Required</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Before processing intakes, you must acknowledge the admissions script.
                  All conversations must follow the approved script exactly.
                </p>
                <button
                  onClick={() => setShowScript(true)}
                  className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700"
                >
                  Review & Acknowledge Script
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Script Modal */}
        {showScript && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Admissions Funding Script</h2>
                <p className="text-sm text-gray-600 mt-1">Required reading before processing intakes</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Opening */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Opening Statement</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm">
                    <p className="italic">
                      "Thank you for your interest in [Program Name]. Before we discuss enrollment, 
                      I need to walk you through our funding pathways to determine the best fit for your situation."
                    </p>
                  </div>
                </div>

                {/* Pathways */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Funding Pathways (In Order)</h3>
                  <div className="space-y-3">
                    <div className="bg-brand-green-50 p-4 rounded-lg">
                      <p className="font-medium text-brand-green-800">1. Workforce-Funded</p>
                      <p className="text-sm text-brand-green-700 mt-1">
                        "Many students qualify for workforce funding that covers all or most of the program cost. 
                        Let me ask a few questions to see if you might be eligible."
                      </p>
                    </div>
                    <div className="bg-brand-blue-50 p-4 rounded-lg">
                      <p className="font-medium text-brand-blue-800">2. Employer-Sponsored</p>
                      <p className="text-sm text-brand-blue-700 mt-1">
                        "Some students enroll through employer partnerships. Does your employer offer 
                        tuition reimbursement or training support?"
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="font-medium text-slate-800">3. Structured Student Tuition</p>
                      <p className="text-sm text-slate-700 mt-1">
                        "For students who don't qualify for workforce funding or employer sponsorship, 
                        we offer a structured bridge plan: $500 down payment, $200 per month, 
                        maximum three months. This is a short-term bridge, not a long-term payment plan."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prohibited Language */}
                <div>
                  <h3 className="font-semibold text-brand-red-800 mb-2">Prohibited Language</h3>
                  <div className="bg-brand-red-50 p-4 rounded-lg">
                    <ul className="text-sm text-brand-red-700 space-y-1">
                      <li>❌ "We'll figure it out later"</li>
                      <li>❌ "Don't worry about the details"</li>
                      <li>❌ "We can probably make something work"</li>
                      <li>❌ "Let's just get you started"</li>
                      <li>❌ "We'll sort out payment after"</li>
                    </ul>
                  </div>
                </div>

                {/* Objection Handling */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Objection Handling (Exact Responses)</h3>
                  <div className="space-y-3 text-sm">
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="font-medium">"I can only do $100 a month."</p>
                      <p className="text-gray-600 mt-1">
                        → "At that level, a long-term payor is required. We would need to explore 
                        workforce funding, employer sponsorship, or external financing."
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="font-medium">"Other schools let me pay less."</p>
                      <p className="text-gray-600 mt-1">
                        → "Each institution structures tuition differently. Our model is designed 
                        to support completion and stability."
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                      <p className="font-medium">"Can you make an exception?"</p>
                      <p className="text-gray-600 mt-1">
                        → "Our funding pathways are standardized. Exceptions are not handled 
                        at the admissions level."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded border-gray-300"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setScriptAcknowledged(true);
                        setShowScript(false);
                        // Log acknowledgment
                        fetch('/api/admin/script-acknowledgment', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ acknowledged: true }),
                        });
                      }
                    }}
                  />
                  <span className="text-sm text-gray-700">
                    I have read and understand the admissions script. I will follow it exactly 
                    and will not deviate from approved language or make unauthorized promises.
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white"
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="identity_pending">Identity Pending</option>
            <option value="workforce_screening">Workforce Screening</option>
            <option value="employer_screening">Employer Screening</option>
            <option value="financial_readiness">Financial Readiness</option>
            <option value="program_readiness">Program Readiness</option>
            <option value="pending_signature">Pending Signature</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Intake List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Student</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Program</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Pathway</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Started</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Loading intakes...
                  </td>
                </tr>
              ) : filteredIntakes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No intakes found
                  </td>
                </tr>
              ) : (
                filteredIntakes.map((intake) => (
                  <tr key={intake.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{intake.user_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{intake.user_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {intake.program_name || 'Not selected'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[intake.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}`}>
                        {intake.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {intake.funding_pathway ? (
                        <span className="font-medium text-gray-900">
                          {PATHWAY_LABELS[intake.funding_pathway as keyof typeof PATHWAY_LABELS]}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(intake.intake_started_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedIntake(intake)}
                        disabled={!scriptAcknowledged}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Process
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Intake Detail Modal */}
        {selectedIntake && (
          <IntakeDetailModal
            intake={selectedIntake}
            onClose={() => setSelectedIntake(null)}
            onUpdate={fetchIntakes}
          />
        )}
      </div>
    </div>
  );
}

// Intake Detail Modal Component
function IntakeDetailModal({ 
  intake, 
  onClose, 
  onUpdate 
}: { 
  intake: any; 
  onClose: () => void; 
  onUpdate: () => void;
}) {
  const [activeStep, setActiveStep] = useState(intake.status);
  const [saving, setSaving] = useState(false);
  const [deviationNote, setDeviationNote] = useState('');

  const steps = [
    { id: 'identity_pending', label: 'Identity', icon: User, completed: intake.identity_verified },
    { id: 'workforce_screening', label: 'Workforce', icon: Building2, completed: intake.workforce_screening_completed },
    { id: 'employer_screening', label: 'Employer', icon: Building2, completed: intake.employer_screening_completed },
    { id: 'financial_readiness', label: 'Financial', icon: DollarSign, completed: intake.financial_readiness_completed },
    { id: 'program_readiness', label: 'Program', icon: FileText, completed: intake.program_readiness_completed },
    { id: 'pending_signature', label: 'Signature', icon: Signature, completed: intake.acknowledgment_signed },
  ];

  async function updateStep(step: string, data: any) {
    setSaving(true);
    try {
      const res = await fetch('/api/intake/workflow', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId: intake.id,
          step,
          data,
        }),
      });
      
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update step:', error);
    }
    setSaving(false);
  }

  async function assignPathway(pathway: string) {
    setSaving(true);
    try {
      const res = await fetch('/api/intake/workflow', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId: intake.id,
          step: 'funding_pathway',
          data: { pathway },
        }),
      });
      
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to assign pathway:', error);
    }
    setSaving(false);
  }

  async function logDeviation() {
    if (!deviationNote.trim()) return;
    
    try {
      await fetch('/api/admin/script-deviation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeId: intake.id,
          description: deviationNote,
        }),
      });
      setDeviationNote('');
    } catch (error) {
      console.error('Failed to log deviation:', error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Process Intake</h2>
            <p className="text-sm text-gray-600">{intake.user_name} - {intake.program_name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step.completed 
                    ? 'bg-brand-green-100 text-brand-green-600' 
                    : activeStep === step.id 
                    ? 'bg-brand-blue-100 text-brand-blue-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.completed ? (
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step.completed ? 'bg-brand-green-200' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <span key={step.id} className="text-xs text-gray-500 w-10 text-center">
                {step.label}
              </span>
            ))}
          </div>
        </div>

        {/* Funding Pathway Assignment */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Assign Funding Pathway</h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => assignPathway('workforce_funded')}
              disabled={saving || intake.funding_pathway === 'workforce_funded'}
              className={`p-4 rounded-lg border-2 text-left transition ${
                intake.funding_pathway === 'workforce_funded'
                  ? 'border-brand-green-500 bg-brand-green-50'
                  : 'border-gray-200 hover:border-brand-green-300'
              }`}
            >
              <Building2 className="w-6 h-6 text-brand-green-600 mb-2" />
              <p className="font-medium text-gray-900">Workforce-Funded</p>
              <p className="text-xs text-gray-500 mt-1">WIOA, VR, Job Ready Indy, etc.</p>
            </button>
            
            <button
              onClick={() => assignPathway('employer_sponsored')}
              disabled={saving || intake.funding_pathway === 'employer_sponsored'}
              className={`p-4 rounded-lg border-2 text-left transition ${
                intake.funding_pathway === 'employer_sponsored'
                  ? 'border-brand-blue-500 bg-brand-blue-50'
                  : 'border-gray-200 hover:border-brand-blue-300'
              }`}
            >
              <Building2 className="w-6 h-6 text-brand-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Employer-Sponsored</p>
              <p className="text-xs text-gray-500 mt-1">Post-hire reimbursement</p>
            </button>
            
            <button
              onClick={() => assignPathway('structured_tuition')}
              disabled={saving || intake.funding_pathway === 'structured_tuition'}
              className={`p-4 rounded-lg border-2 text-left transition ${
                intake.funding_pathway === 'structured_tuition'
                  ? 'border-slate-500 bg-slate-50'
                  : 'border-gray-200 hover:border-slate-300'
              }`}
            >
              <DollarSign className="w-6 h-6 text-slate-600 mb-2" />
              <p className="font-medium text-gray-900">Structured Tuition</p>
              <p className="text-xs text-gray-500 mt-1">$500 down, $200/mo, 3 mo max</p>
            </button>
          </div>
        </div>

        {/* Script Deviation Log (Admin Only) */}
        <div className="p-6 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-2">Script Deviation Log</h3>
          <p className="text-xs text-gray-500 mb-3">
            Document any deviations from the approved script for audit purposes.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={deviationNote}
              onChange={(e) => setDeviationNote(e.target.value)}
              placeholder="Describe any script deviation..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <button
              onClick={logDeviation}
              disabled={!deviationNote.trim()}
              className="px-4 py-2 bg-brand-red-600 text-white rounded-lg text-sm font-medium hover:bg-brand-red-700 disabled:opacity-50"
            >
              Log Deviation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
