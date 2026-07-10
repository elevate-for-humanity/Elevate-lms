'use client';

import { useState } from 'react';
import {
  Building2, Save, Loader2, CheckCircle2, AlertTriangle,
  Plus, Trash2, ShieldCheck, X, Users, MapPin, FileText,
  Briefcase, BarChart3,
} from 'lucide-react';
import type { ORG_PROFILE } from '@/lib/grants/org-profile';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type StaticProfile = typeof ORG_PROFILE;
type Org = Record<string, unknown> | null;
type Fact = {
  id: string; fact_key: string; fact_value_json: unknown;
  source_type: string | null; source_reference: string | null;
  status: string; approved_at: string | null; updated_at: string;
};

function factStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && 'value' in (v as Record<string, unknown>))
    return String((v as Record<string, unknown>).value);
  return String(v);
}

const SECTIONS = [
  { id: 'identity', label: 'Legal Identity', icon: Building2, fields: [
    { key: 'legal_name', label: 'Legal Name', placeholder: '2Exclusive LLC-S' },
    { key: 'dba_name', label: 'DBA Name', placeholder: PLATFORM_DEFAULTS.orgLegalName },
    { key: 'org_type', label: 'Organization Type', placeholder: 'Nonprofit / LLC' },
    { key: 'ein', label: 'EIN', placeholder: 'XX-XXXXXXX' },
    { key: 'uei', label: 'UEI (SAM.gov)', placeholder: 'VX2GK5S8SZH8' },
    { key: 'cage_code', label: 'CAGE Code', placeholder: '0QH19' },
    { key: 'sam_status', label: 'SAM Status', placeholder: 'active' },
    { key: 'sam_expiration', label: 'SAM Expiration', placeholder: 'June 29, 2026' },
    { key: 'dol_sponsor', label: 'DOL Sponsor / RAPIDS', placeholder: 'DOL Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301)' },
    { key: 'etpl_status', label: 'ETPL Status', placeholder: 'ETPL listed provider' },
    { key: 'funding_approvals', label: 'Funding Approvals', placeholder: 'WRG, WIOA, and JRI approved' },
  ]},
  { id: 'contact', label: 'Contact & Address', icon: MapPin, fields: [
    { key: 'address_line_1', label: 'Address', placeholder: '8888 Keystone Crossing, Suite 1300' },
    { key: 'city', label: 'City', placeholder: 'Indianapolis' },
    { key: 'state', label: 'State', placeholder: 'IN' },
    { key: 'zip', label: 'ZIP', placeholder: '46240' },
    { key: 'phone', label: 'Phone', placeholder: PLATFORM_DEFAULTS.supportPhone },
    { key: 'general_email', label: 'Email', placeholder: 'elevate4humanityedu@gmail.com' },
    { key: 'website', label: 'Website', placeholder: PLATFORM_DEFAULTS.siteUrl },
  ]},
  { id: 'leadership', label: 'Leadership & Signatory', icon: Users, fields: [
    { key: 'authorized_signatory_name', label: 'Authorized Signatory', placeholder: 'Elizabeth Greene' },
    { key: 'authorized_signatory_title', label: 'Signatory Title', placeholder: 'Founder & Chief Executive Officer' },
    { key: 'financial_contact', label: 'Financial Contact', placeholder: 'Dr. Carlina Wilkes, Executive Director of Financial Operations & Organizational Compliance' },
    { key: 'years_operating', label: 'Years Operating', placeholder: 'Active since 2020' },
  ]},
  { id: 'mission', label: 'Mission & Programs', icon: Briefcase, fields: [
    { key: 'mission', label: 'Mission Statement', textarea: true, placeholder: `${PLATFORM_DEFAULTS.orgName} connects Hoosiers to funded career training...` },
    { key: 'capability_statement', label: 'Capability Statement', textarea: true, placeholder: 'Full capability statement for grant applications...' },
    { key: 'statement_of_need', label: 'Statement of Need', textarea: true, placeholder: 'Problem statement for grant applications...' },
    { key: 'target_population', label: 'Target Population', textarea: true, placeholder: 'Justice-involved individuals, veterans, low-income adults...' },
    { key: 'service_area', label: 'Service Area / Counties', placeholder: 'Marion County and surrounding Central Indiana counties' },
    { key: 'programs', label: 'Programs Offered', textarea: true, placeholder: 'Barber Apprenticeship, HVAC, Healthcare (CNA/QMA)...' },
  ]},
  { id: 'compliance', label: 'Compliance & Metrics', icon: ShieldCheck, fields: [
    { key: 'compliance_statement', label: 'Compliance Statement', textarea: true, placeholder: 'All participants entered into Indiana Career Connect and RAPIDS within 30 days...' },
    { key: 'outcomes_statement', label: 'Outcomes Statement', textarea: true, placeholder: 'Program graduates achieve industry-recognized credentials...' },
    { key: 'partners', label: 'Workforce Partners', placeholder: 'WorkOne, EmployIndy, Job Ready Indy, HSI affiliate' },
    { key: 'certifications', label: 'Certifications', placeholder: 'CareerSafe OSHA provider, NRF Rise Up provider, Certiport CATC' },
    { key: 'insurance_info', label: 'Insurance Info', placeholder: 'General liability, professional liability...' },
  ]},
  { id: 'metrics', label: 'Workforce Metrics', icon: BarChart3, fields: [
    { key: 'total_enrolled', label: 'Total Enrolled (all-time)', placeholder: '0' },
    { key: 'active_participants', label: 'Active Participants', placeholder: '0' },
    { key: 'placement_rate', label: 'Placement Rate', placeholder: '0%' },
    { key: 'avg_wage_at_placement', label: 'Avg Wage at Placement', placeholder: '$0/hr' },
    { key: 'credentials_issued', label: 'Credentials Issued', placeholder: '0' },
    { key: 'apprentices_registered', label: 'DOL Apprentices Registered', placeholder: '0' },
  ]},
];

export default function OrgProfileClient({ org, facts: initialFacts, staticProfile }: { org: Org; facts: Fact[]; staticProfile: StaticProfile }) {
  const factMap = Object.fromEntries(initialFacts.map(f => [f.fact_key, factStr(f.fact_value_json)]));

  function defaultVal(key: string): string {
    if (org && org[key] !== null && org[key] !== undefined) return String(org[key]);
    if (factMap[key]) return factMap[key];
    const aliases: Record<string, string> = {
      legal_name: staticProfile.legalName, dba_name: staticProfile.dba,
      org_type: staticProfile.orgType, ein: staticProfile.ein,
      uei: staticProfile.uei, cage_code: staticProfile.cageCode,
      sam_expiration: staticProfile.samExpiration, dol_sponsor: staticProfile.dolSponsor,
      etpl_status: staticProfile.etpl, funding_approvals: staticProfile.funding,
      address_line_1: staticProfile.address, city: staticProfile.city,
      state: staticProfile.state, zip: staticProfile.zip,
      phone: staticProfile.phone, general_email: staticProfile.email,
      website: staticProfile.website,
      authorized_signatory_name: staticProfile.primaryContact,
      authorized_signatory_title: staticProfile.primaryTitle,
      financial_contact: staticProfile.financialContact,
      years_operating: staticProfile.yearsOperating,
      mission: staticProfile.mission,
      capability_statement: staticProfile.capabilityStatement,
      statement_of_need: staticProfile.statementOfNeed,
      target_population: staticProfile.targetPopulation,
      service_area: staticProfile.serviceArea,
      programs: staticProfile.programs.join('\n'),
      compliance_statement: staticProfile.complianceStatement,
      outcomes_statement: staticProfile.outcomesStatement,
      partners: staticProfile.partners,
      certifications: staticProfile.certifications,
    };
    return aliases[key] ?? '';
  }

  const allKeys = SECTIONS.flatMap(s => s.fields.map(f => f.key));
  const [form, setForm] = useState<Record<string, string>>(Object.fromEntries(allKeys.map(k => [k, defaultVal(k)])));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facts, setFacts] = useState<Fact[]>(initialFacts);
  const [newFactKey, setNewFactKey] = useState('');
  const [newFactValue, setNewFactValue] = useState('');
  const [addingFact, setAddingFact] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['identity', 'contact', 'leadership']));

  function toggleSection(id: string) {
    setOpenSections(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function saveOrg() {
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await fetch('/api/admin/settings/organization', {
        method: org ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: (org as Record<string,unknown>)?.id, ...form }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  async function addFact() {
    if (!newFactKey.trim() || !newFactValue.trim()) return;
    setAddingFact(true);
    try {
      const res = await fetch('/api/admin/settings/organization/facts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fact_key: newFactKey.trim(), fact_value_json: newFactValue.trim(), source_type: 'manual_entry', status: 'approved' }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { fact } = await res.json();
      setFacts(prev => [...prev.filter(f => f.fact_key !== fact.fact_key), fact]);
      setNewFactKey(''); setNewFactValue('');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to add fact'); }
    finally { setAddingFact(false); }
  }

  async function deleteFact(id: string) {
    try {
      const res = await fetch(`/api/admin/settings/organization/facts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setFacts(prev => prev.filter(f => f.id !== id));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Delete failed'); }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
        <p className="text-xs text-slate-500">All fields power contract and grant autofill.</p>
        <div className="flex items-center gap-2">
          {saved && <span className="flex items-center gap-1 text-sm text-green-600"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
          <button onClick={saveOrg} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save All
          </button>
        </div>
      </div>
      {SECTIONS.map(section => {
        const Icon = section.icon;
        const isOpen = openSections.has(section.id);
        return (
          <div key={section.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-slate-400" /><span className="font-semibold text-slate-900 text-sm">{section.label}</span></div>
              <span className="text-xs text-slate-400">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div className="px-6 pb-6 border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {section.fields.map((field: { key: string; label: string; placeholder?: string; textarea?: boolean }) => (
                  <div key={field.key} className={field.textarea ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
                    {field.textarea ? (
                      <textarea value={form[field.key] ?? ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder} rows={4}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y" />
                    ) : (
                      <input type="text" value={form[field.key] ?? ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> Facts Vault</h2>
            <p className="text-xs text-slate-500 mt-0.5">Approved atomic facts used for all prefill. {facts.length} on file.</p>
          </div>
        </div>
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex gap-2">
            <input type="text" value={newFactKey} onChange={e => setNewFactKey(e.target.value)} placeholder="fact_key"
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white" />
            <input type="text" value={newFactValue} onChange={e => setNewFactValue(e.target.value)} placeholder="Value"
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white" />
            <button onClick={addFact} disabled={addingFact || !newFactKey.trim() || !newFactValue.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors">
              {addingFact ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
            </button>
          </div>
        </div>
        {facts.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">No facts yet.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {facts.map(fact => (
              <div key={fact.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50">
                <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded w-44 shrink-0 truncate">{fact.fact_key}</code>
                <span className="flex-1 text-sm text-slate-800 truncate">{factStr(fact.fact_value_json)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${fact.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{fact.status}</span>
                <button onClick={() => deleteFact(fact.id)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
