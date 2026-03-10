'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText, Mail, ClipboardList, Copy, Check, ChevronDown, ChevronRight,
  Handshake, BarChart3, Send, Users, Building2, Calendar, Save, Loader2,
} from 'lucide-react';
import {
  MOU_TEMPLATE_DEFAULT, generateMOUMarkdown,
  REPORT_TEMPLATE_DEFAULT, generateReportMarkdown,
  EMAIL_TEMPLATES,
  type MOUTemplate, type ReportTemplate,
} from '@/data/document-templates';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ─── MOU Builder ────────────────────────────────────────────────

function MOUBuilder() {
  const [mou, setMou] = useState<MOUTemplate>({
    ...MOU_TEMPLATE_DEFAULT,
    partnerOrganization: 'Partner Organization Name',
    purpose: 'This Memorandum of Understanding establishes a collaborative framework between Elevate for Humanity and [Partner] to deliver workforce training, credential preparation, and employment placement services.',
    background: 'Elevate for Humanity is an ETPL-listed workforce development organization serving Indianapolis and surrounding communities. [Partner] provides [describe partner capabilities]. Together, both organizations seek to address the growing demand for skilled workers in [industry].',
    scopeOfCollaboration: 'This partnership covers the delivery of [program name] training, including classroom instruction, hands-on lab exercises, credential testing, and employment placement support.',
    elevateSigner: { name: 'Demetrius Peoples', title: 'Executive Director' },
    partnerSigner: { name: '', title: '' },
  });
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [savedVersion, setSavedVersion] = useState<string | null>(null);

  // Load the latest saved MOU template on mount
  useEffect(() => {
    fetch('/api/admin/documents/templates?type=mou')
      .then(r => r.json())
      .then(({ template }) => {
        if (template?.content) {
          try {
            const parsed = JSON.parse(template.content) as MOUTemplate;
            setMou(parsed);
            setSavedVersion(template.version);
          } catch {
            // legacy plain-text content — leave defaults
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/documents/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'mou',
          title: `MOU Template — ${mou.partnerOrganization || 'Generic'}`,
          content: JSON.stringify(mou),
        }),
      });
      const data = await res.json();
      if (res.ok && data.version) setSavedVersion(data.version);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('idle');
    }
  };

  const update = (field: keyof MOUTemplate, value: any) => setMou(prev => ({ ...prev, [field]: value }));
  const updateList = (field: keyof MOUTemplate, index: number, value: string) => {
    const list = [...(mou[field] as string[])];
    list[index] = value;
    setMou(prev => ({ ...prev, [field]: list }));
  };
  const addToList = (field: keyof MOUTemplate) => {
    const list = [...(mou[field] as string[]), ''];
    setMou(prev => ({ ...prev, [field]: list }));
  };
  const removeFromList = (field: keyof MOUTemplate, index: number) => {
    const list = (mou[field] as string[]).filter((_, i) => i !== index);
    setMou(prev => ({ ...prev, [field]: list }));
  };

  const markdown = generateMOUMarkdown(mou);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Partner Organization</label>
          <input type="text" value={mou.partnerOrganization} onChange={e => update('partnerOrganization', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Purpose</label>
          <textarea rows={3} value={mou.purpose} onChange={e => update('purpose', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Background</label>
          <textarea rows={3} value={mou.background} onChange={e => update('background', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Scope of Collaboration</label>
          <textarea rows={2} value={mou.scopeOfCollaboration} onChange={e => update('scopeOfCollaboration', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500" />
        </div>

        <EditableList label="Elevate Responsibilities" items={mou.elevateResponsibilities}
          onChange={(i, v) => updateList('elevateResponsibilities', i, v)}
          onAdd={() => addToList('elevateResponsibilities')}
          onRemove={(i) => removeFromList('elevateResponsibilities', i)} />

        <EditableList label="Partner Responsibilities" items={mou.partnerResponsibilities}
          onChange={(i, v) => updateList('partnerResponsibilities', i, v)}
          onAdd={() => addToList('partnerResponsibilities')}
          onRemove={(i) => removeFromList('partnerResponsibilities', i)} />

        <EditableList label="Participant Outcomes" items={mou.participantOutcomes}
          onChange={(i, v) => updateList('participantOutcomes', i, v)}
          onAdd={() => addToList('participantOutcomes')}
          onRemove={(i) => removeFromList('participantOutcomes', i)} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Term Start</label>
            <input type="date" value={mou.termStart} onChange={e => update('termStart', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Term End</label>
            <input type="date" value={mou.termEnd} onChange={e => update('termEnd', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Financial Terms</label>
          <textarea rows={2} value={mou.financialTerms} onChange={e => update('financialTerms', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Elevate Signer Name</label>
            <input type="text" value={mou.elevateSigner.name} onChange={e => update('elevateSigner', { ...mou.elevateSigner, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Partner Signer Name</label>
            <input type="text" value={mou.partnerSigner.name} onChange={e => update('partnerSigner', { ...mou.partnerSigner, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Preview</h3>
            {savedVersion && (
              <p className="text-xs text-gray-400 mt-0.5">Saved v{savedVersion}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                saveStatus === 'saved'
                  ? 'bg-brand-green-600 text-white'
                  : 'bg-gray-800 text-white hover:bg-gray-900'
              } disabled:opacity-60`}
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveStatus === 'saved' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save'}
            </button>
            <button onClick={copyToClipboard}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-blue-600 text-white rounded-lg text-sm hover:bg-brand-blue-700">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
          {markdown}
        </pre>
      </div>
    </div>
  );
}

// ─── Report Builder ─────────────────────────────────────────────

function ReportBuilder() {
  const [report, setReport] = useState<ReportTemplate>({
    ...REPORT_TEMPLATE_DEFAULT,
    programName: 'HVAC Technician Training',
    programOverview: 'The HVAC Technician Training Program is a 20-week workforce development program preparing participants for entry-level HVAC technician positions. The program includes classroom instruction, hands-on lab exercises, and industry credential preparation.',
    keyActivities: ['Completed Module 1-4 classroom instruction', 'Administered EPA 608 practice exams', 'Conducted employer site visits'],
    operationalUpdates: ['Updated curriculum to include new refrigerant handling procedures'],
    challengesOrRisks: [],
    nextSteps: ['Begin Module 5-8 instruction', 'Schedule EPA 608 certification testing', 'Coordinate OJT placements'],
    summary: 'The program is on track with participant engagement and credential preparation proceeding as planned.',
  });
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [savedVersion, setSavedVersion] = useState<string | null>(null);

  // Load the latest saved report template on mount
  useEffect(() => {
    fetch('/api/admin/documents/templates?type=report')
      .then(r => r.json())
      .then(({ template }) => {
        if (template?.content) {
          try {
            const parsed = JSON.parse(template.content) as ReportTemplate;
            setReport(parsed);
            setSavedVersion(template.version);
          } catch {
            // legacy plain-text content — leave defaults
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/documents/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'report',
          title: `Report Template — ${report.programName || 'Generic'}`,
          content: JSON.stringify(report),
        }),
      });
      const data = await res.json();
      if (res.ok && data.version) setSavedVersion(data.version);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('idle');
    }
  };

  const update = (field: keyof ReportTemplate, value: any) => setReport(prev => ({ ...prev, [field]: value }));
  const updateList = (field: keyof ReportTemplate, index: number, value: string) => {
    const list = [...(report[field] as string[])];
    list[index] = value;
    setReport(prev => ({ ...prev, [field]: list }));
  };
  const addToList = (field: keyof ReportTemplate) => {
    const list = [...(report[field] as string[]), ''];
    setReport(prev => ({ ...prev, [field]: list }));
  };
  const removeFromList = (field: keyof ReportTemplate, index: number) => {
    const list = (report[field] as string[]).filter((_, i) => i !== index);
    setReport(prev => ({ ...prev, [field]: list }));
  };

  const markdown = generateReportMarkdown(report);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Program Name</label>
          <input type="text" value={report.programName} onChange={e => update('programName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Period Start</label>
            <input type="date" value={report.reportingPeriodStart} onChange={e => update('reportingPeriodStart', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Period End</label>
            <input type="date" value={report.reportingPeriodEnd} onChange={e => update('reportingPeriodEnd', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Program Overview</label>
          <textarea rows={3} value={report.programOverview} onChange={e => update('programOverview', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Enrollments</label>
            <input type="number" value={report.enrollments} onChange={e => update('enrollments', parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Completions</label>
            <input type="number" value={report.completions} onChange={e => update('completions', parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Certifications</label>
            <input type="number" value={report.certificationsEarned} onChange={e => update('certificationsEarned', parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Placements</label>
            <input type="number" value={report.employmentPlacements} onChange={e => update('employmentPlacements', parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <EditableList label="Key Activities" items={report.keyActivities}
          onChange={(i, v) => updateList('keyActivities', i, v)}
          onAdd={() => addToList('keyActivities')}
          onRemove={(i) => removeFromList('keyActivities', i)} />

        <EditableList label="Operational Updates" items={report.operationalUpdates}
          onChange={(i, v) => updateList('operationalUpdates', i, v)}
          onAdd={() => addToList('operationalUpdates')}
          onRemove={(i) => removeFromList('operationalUpdates', i)} />

        <EditableList label="Challenges or Risks" items={report.challengesOrRisks}
          onChange={(i, v) => updateList('challengesOrRisks', i, v)}
          onAdd={() => addToList('challengesOrRisks')}
          onRemove={(i) => removeFromList('challengesOrRisks', i)} />

        <EditableList label="Next Steps" items={report.nextSteps}
          onChange={(i, v) => updateList('nextSteps', i, v)}
          onAdd={() => addToList('nextSteps')}
          onRemove={(i) => removeFromList('nextSteps', i)} />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Summary</label>
          <textarea rows={2} value={report.summary} onChange={e => update('summary', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Preview</h3>
            {savedVersion && (
              <p className="text-xs text-gray-400 mt-0.5">Saved v{savedVersion}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                saveStatus === 'saved'
                  ? 'bg-brand-green-600 text-white'
                  : 'bg-gray-800 text-white hover:bg-gray-900'
              } disabled:opacity-60`}
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveStatus === 'saved' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save'}
            </button>
            <button onClick={copyToClipboard}
              className="flex items-center gap-2 px-3 py-1.5 bg-brand-blue-600 text-white rounded-lg text-sm hover:bg-brand-blue-700">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
          {markdown}
        </pre>
      </div>
    </div>
  );
}

// ─── Email Templates ────────────────────────────────────────────

function EmailTemplateViewer() {
  const [selected, setSelected] = useState(EMAIL_TEMPLATES[0]);
  const [copied, setCopied] = useState<string | null>(null);

  const iconMap: Record<string, any> = {
    'partnership-outreach': Handshake,
    'workforce-board-followup': Building2,
    'employer-recruitment': Users,
    'program-update-partners': BarChart3,
    'meeting-request': Calendar,
  };

  const copyBody = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-2">
        {EMAIL_TEMPLATES.map(t => {
          const Icon = iconMap[t.id] || Mail;
          return (
            <button key={t.id} onClick={() => setSelected(t)}
              className={`w-full text-left p-3 rounded-lg border transition ${
                selected.id === t.id
                  ? 'border-brand-blue-500 bg-brand-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}>
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${selected.id === t.id ? 'text-brand-blue-600' : 'text-gray-400'}`} />
                <div>
                  <div className="font-semibold text-sm text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-gray-900">{selected.name}</h3>
            <p className="text-sm text-gray-500 mt-1">Subject: {selected.subject}</p>
          </div>
          <button onClick={() => copyBody(selected.id, `Subject: ${selected.subject}\n\n${selected.body}`)}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-blue-600 text-white rounded-lg text-sm hover:bg-brand-blue-700">
            {copied === selected.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied === selected.id ? 'Copied' : 'Copy'}
          </button>
        </div>

        {selected.placeholders.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-800 mb-1">Replace these placeholders:</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.placeholders.map(p => (
                <span key={p} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-mono">{p}</span>
              ))}
            </div>
          </div>
        )}

        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto leading-relaxed">
          {selected.body}
        </pre>
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────────────────────

function EditableList({ label, items, onChange, onAdd, onRemove }: {
  label: string; items: string[];
  onChange: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input type="text" value={item} onChange={e => onChange(i, e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
            <button onClick={() => onRemove(i)} className="text-red-400 hover:text-red-600 text-sm px-2">×</button>
          </div>
        ))}
      </div>
      <button onClick={onAdd} className="mt-1 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium">+ Add item</button>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

type Tab = 'mou' | 'report' | 'email';

export default function DocumentTemplatesPage() {
  const [tab, setTab] = useState<Tab>('mou');

  const tabs: { id: Tab; label: string; icon: any; desc: string }[] = [
    { id: 'mou', label: 'MOU', icon: Handshake, desc: 'Memorandum of Understanding' },
    { id: 'report', label: 'Reports', icon: BarChart3, desc: 'Program Progress Reports' },
    { id: 'email', label: 'Emails', icon: Mail, desc: '5 Professional Templates' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="text-sm mb-4">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li><Link href="/admin" className="hover:text-brand-blue-600">Admin</Link></li>
            <li>/</li>
            <li><Link href="/admin/documents" className="hover:text-brand-blue-600">Documents</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Templates</li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Templates</h1>
          <p className="text-gray-600 mt-2">Standardized templates for MOUs, reports, and professional emails. Fill in the fields, copy the output.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition ${
                  tab === t.id
                    ? 'bg-brand-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                }`}>
                <Icon className="w-4 h-4" />
                {t.label}
                <span className={`text-xs ${tab === t.id ? 'text-brand-blue-200' : 'text-gray-400'}`}>
                  {t.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {tab === 'mou' && <MOUBuilder />}
        {tab === 'report' && <ReportBuilder />}
        {tab === 'email' && <EmailTemplateViewer />}
      </div>
    </div>
  );
}
