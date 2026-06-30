'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save, Loader2, CheckCircle2, AlertTriangle, X,
  Sparkles, Building2, FileText, DollarSign, Users,
  Send, ChevronDown, ChevronUp,
} from 'lucide-react';
import { ORG_PROFILE } from '@/lib/grants/org-profile';

type Org = {
  id: string;
  legal_name: string | null;
  ein: string | null;
  uei: string | null;
  sam_status: string | null;
  phone: string | null;
  general_email: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  authorized_signatory_name: string | null;
  authorized_signatory_title: string | null;
} | null;

type Fact = { fact_key: string; fact_value_json: unknown };
type Opportunity = Record<string, unknown> | null;
type Application = Record<string, unknown> | null;

function factStr(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && 'value' in (v as Record<string, unknown>))
    return String((v as Record<string, unknown>).value);
  return String(v);
}

function orgAddress(org: Org): string {
  if (!org) return '';
  return [org.address_line_1, org.address_line_2, org.city, org.state, org.zip]
    .filter(Boolean).join(', ');
}

type Section = {
  id: string;
  label: string;
  icon: React.ElementType;
  fields: { key: string; label: string; type?: 'text' | 'textarea' | 'date' | 'number'; placeholder?: string; locked?: boolean }[];
};

const SECTIONS: Section[] = [
  {
    id: 'opportunity',
    label: 'Opportunity Details',
    icon: FileText,
    fields: [
      { key: 'opportunity_title', label: 'Opportunity Title', placeholder: 'Federal grant title' },
      { key: 'opportunity_number', label: 'Opportunity Number', placeholder: 'CFDA / FOA number' },
      { key: 'agency_name', label: 'Agency', placeholder: 'U.S. Department of Labor' },
      { key: 'cfda_number', label: 'CFDA Number', placeholder: '17.259' },
      { key: 'deadline', label: 'Deadline', type: 'date' },
      { key: 'opportunity_url', label: 'Opportunity URL', placeholder: 'https://grants.gov/...' },
    ],
  },
  {
    id: 'org',
    label: 'Organization Info',
    icon: Building2,
    fields: [
      { key: 'legal_name', label: 'Legal Name', locked: true },
      { key: 'ein', label: 'EIN', locked: true },
      { key: 'uei', label: 'UEI', locked: true },
      { key: 'sam_status', label: 'SAM Status', locked: true },
      { key: 'org_address', label: 'Address', locked: true },
      { key: 'contact_name', label: 'Contact Name' },
      { key: 'contact_email', label: 'Contact Email' },
      { key: 'contact_phone', label: 'Contact Phone' },
    ],
  },
  {
    id: 'narrative',
    label: 'Project Narrative',
    icon: FileText,
    fields: [
      { key: 'project_title', label: 'Project Title', placeholder: 'Workforce Development Initiative' },
      { key: 'executive_summary', label: 'Executive Summary', type: 'textarea', placeholder: 'Brief overview of the project...' },
      { key: 'problem_statement', label: 'Problem Statement', type: 'textarea', placeholder: 'Describe the problem being addressed...' },
      { key: 'project_description', label: 'Project Description', type: 'textarea', placeholder: 'Detailed description of activities...' },
      { key: 'target_population', label: 'Target Population', type: 'textarea', placeholder: 'Who will be served...' },
      { key: 'geographic_area', label: 'Geographic Area', placeholder: 'Indianapolis, IN / Statewide' },
      { key: 'goals_and_objectives', label: 'Goals & Objectives', type: 'textarea', placeholder: 'Measurable goals...' },
      { key: 'evaluation_plan', label: 'Evaluation Plan', type: 'textarea', placeholder: 'How outcomes will be measured...' },
      { key: 'sustainability_plan', label: 'Sustainability Plan', type: 'textarea', placeholder: 'How the program will continue after grant period...' },
    ],
  },
  {
    id: 'budget',
    label: 'Budget',
    icon: DollarSign,
    fields: [
      { key: 'budget_total', label: 'Total Budget Request', type: 'number', placeholder: '250000' },
      { key: 'award_ceiling', label: 'Award Ceiling', type: 'number' },
      { key: 'award_floor', label: 'Award Floor', type: 'number' },
      { key: 'budget_narrative', label: 'Budget Narrative', type: 'textarea', placeholder: 'Justification for each budget line...' },
    ],
  },
  {
    id: 'partners',
    label: 'Partners & Notes',
    icon: Users,
    fields: [
      { key: 'partner_agencies', label: 'Partner Agencies', type: 'textarea', placeholder: 'List partner organizations...' },
      { key: 'notes', label: 'Internal Notes', type: 'textarea', placeholder: 'Admin notes, reminders...' },
    ],
  },
];

export default function GrantApplicationForm({
  org,
  facts,
  opportunity,
  application,
  prefillTitle,
  mode,
}: {
  org: Org;
  facts: Fact[];
  opportunity?: Opportunity;
  application?: Application;
  prefillTitle?: string;
  mode: 'new' | 'edit';
}) {
  const router = useRouter();

  // Build initial form state — prefill priority: application > opportunity > DB org > facts > static ORG_PROFILE
  const factMap = Object.fromEntries(facts.map(f => [f.fact_key, factStr(f.fact_value_json)]));

  function initial(key: string): string {
    if (application?.[key] !== undefined && application[key] !== null) return String(application[key]);
    if (opportunity?.[key] !== undefined && opportunity[key] !== null) return String(opportunity[key]);
    // DB org row
    if (key === 'legal_name') return org?.legal_name ?? factMap['legal_name'] ?? ORG_PROFILE.legalName ?? '';
    if (key === 'ein') return org?.ein ?? factMap['ein'] ?? ORG_PROFILE.ein ?? '';
    if (key === 'uei') return org?.uei ?? factMap['uei'] ?? ORG_PROFILE.uei ?? '';
    if (key === 'sam_status') return org?.sam_status ?? factMap['sam_status'] ?? ORG_PROFILE.samStatus ?? '';
    if (key === 'org_address') return orgAddress(org) || [ORG_PROFILE.address, ORG_PROFILE.city, ORG_PROFILE.state, ORG_PROFILE.zip].filter(Boolean).join(', ');
    if (key === 'contact_name') return org?.authorized_signatory_name ?? ORG_PROFILE.primaryContact ?? '';
    if (key === 'contact_email') return org?.general_email ?? ORG_PROFILE.email ?? '';
    if (key === 'contact_phone') return org?.phone ?? ORG_PROFILE.phone ?? '';
    // Opportunity fields
    if (key === 'opportunity_title') return prefillTitle ?? '';
    if (key === 'agency_name') return String(opportunity?.['agency_name'] ?? opportunity?.['agency'] ?? '');
    if (key === 'opportunity_number') return String(opportunity?.['opportunity_number'] ?? '');
    if (key === 'close_date' || key === 'deadline') return String(opportunity?.['close_date'] ?? opportunity?.['deadline'] ?? '');
    if (key === 'award_ceiling') return String(opportunity?.['award_ceiling'] ?? '');
    if (key === 'award_floor') return String(opportunity?.['award_floor'] ?? '');
    // Narrative defaults from static profile
    if (key === 'target_population') return factMap['target_population'] ?? ORG_PROFILE.targetPopulation ?? '';
    if (key === 'geographic_area') return factMap['geographic_area'] ?? ORG_PROFILE.serviceArea ?? '';
    return '';
  }

  const allKeys = SECTIONS.flatMap(s => s.fields.map(f => f.key));
  const [form, setForm] = useState<Record<string, string>>(
    Object.fromEntries(allKeys.map(k => [k, initial(k)]))
  );
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['opportunity', 'org', 'narrative']));
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);

  function toggleSection(id: string) {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function save(status?: string) {
    const isSubmit = status === 'submitted';
    if (isSubmit) setSubmitting(true); else setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const payload: Record<string, unknown> = { ...form };
      if (status) payload.status = status;
      if (opportunity?.['id']) payload.opportunity_id = opportunity['id'];
      if (org?.id) payload.org_id = org.id;
      if (application?.['id']) payload.id = application['id'];

      const res = await fetch('/api/admin/grants/applications', {
        method: mode === 'new' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const { application: saved_app } = await res.json();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (mode === 'new') router.push(`/admin/grants/applications/${saved_app.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
      setSubmitting(false);
    }
  }

  async function generateNarrative(key: string) {
    setGeneratingKey(key);
    try {
      const res = await fetch('/api/admin/grants/generate-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: key,
          org_name: form.legal_name,
          uei: form.uei,
          opportunity_title: form.opportunity_title,
          agency: form.agency_name,
          target_population: form.target_population,
          geographic_area: form.geographic_area,
          existing: form[key],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { text } = await res.json();
      setForm(f => ({ ...f, [key]: text }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGeneratingKey(null);
    }
  }

  const NARRATIVE_KEYS = new Set(['executive_summary','problem_statement','project_description','goals_and_objectives','evaluation_plan','sustainability_plan','budget_narrative']);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Sticky save bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="text-sm text-slate-600">
          {application?.['status'] ? (
            <span className="font-medium capitalize">{String(application['status'])}</span>
          ) : (
            <span className="text-slate-400">Draft</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
          <button
            onClick={() => save()}
            disabled={saving || submitting}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button
            onClick={() => save('submitted')}
            disabled={saving || submitting}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit
          </button>
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => {
        const Icon = section.icon as React.ElementType;
        const isOpen = openSections.has(section.id);
        return (
          <div key={section.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-900 text-sm">{section.label}</span>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {isOpen && (
              <div className="px-6 pb-6 border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section.fields.map(field => {
                  const isNarrative = NARRATIVE_KEYS.has(field.key);
                  const isGenerating = generatingKey === field.key;
                  return (
                    <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-600">{field.label}</label>
                        {field.locked && (
                          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">from org profile</span>
                        )}
                        {isNarrative && !field.locked && (
                          <button
                            onClick={() => generateNarrative(field.key)}
                            disabled={isGenerating}
                            className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 disabled:opacity-50"
                          >
                            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Draft with AI
                          </button>
                        )}
                      </div>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={form[field.key] ?? ''}
                          onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          disabled={field.locked}
                          rows={5}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-slate-50 disabled:text-slate-500 resize-y"
                        />
                      ) : (
                        <input
                          type={field.type ?? 'text'}
                          value={form[field.key] ?? ''}
                          onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          disabled={field.locked}
                          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-slate-50 disabled:text-slate-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
