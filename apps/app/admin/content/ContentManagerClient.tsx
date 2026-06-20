'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Building2, Plus, Pencil, Trash2, Save,
  X, ChevronDown, ChevronUp, RefreshCw, CheckCircle, AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TeamMember = {
  id?: string;
  name: string;
  title: string;
  org_role?: string;
  bio?: string;
  headshot_url?: string;
  email?: string;
  linkedin_url?: string;
  display_order?: number;
  is_active?: boolean;
};

type TrainingPartner = {
  id?: string;
  name: string;
  category: string;
  training_role: string;
  city?: string;
  state?: string;
  contact_name?: string;
  contact_email?: string;
  logo_url?: string;
  website_url?: string;
  mou_on_file?: boolean;
  status?: string;
  programs_list?: string[];
  display_order?: number;
};

type Tab = 'team' | 'partners';

const EMPTY_MEMBER: TeamMember = { name: '', title: '', org_role: '', bio: '', email: '', display_order: 0, is_active: true };
const EMPTY_PARTNER: TrainingPartner = { name: '', category: 'employer', training_role: 'work_site', city: '', state: 'IN', status: 'active', display_order: 0 };

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-blue-500 disabled:opacity-50"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-blue-500 resize-none"
    />
  );
}

// ─── Team Member Form ─────────────────────────────────────────────────────────

function TeamMemberForm({ member, onSave, onCancel, saving }: {
  member: TeamMember;
  onSave: (m: TeamMember) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<TeamMember>(member);
  const set = (k: keyof TeamMember) => (v: string | number | boolean) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name *"><Input value={form.name} onChange={set('name')} placeholder="Jane Smith" /></Field>
        <Field label="Title *"><Input value={form.title} onChange={set('title')} placeholder="Program Director" /></Field>
        <Field label="Role"><Input value={form.org_role ?? ''} onChange={set('org_role')} placeholder="leadership" /></Field>
        <Field label="Email"><Input value={form.email ?? ''} onChange={set('email')} type="email" placeholder="jane@elevateforhumanity.org" /></Field>
        <Field label="Headshot URL"><Input value={form.headshot_url ?? ''} onChange={set('headshot_url')} placeholder="/images/team/jane.jpg" /></Field>
        <Field label="LinkedIn URL"><Input value={form.linkedin_url ?? ''} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/..." /></Field>
        <Field label="Display Order"><Input value={String(form.display_order ?? 0)} onChange={v => set('display_order')(Number(v))} type="number" /></Field>
      </div>
      <Field label="Bio"><Textarea value={form.bio ?? ''} onChange={set('bio')} placeholder="Brief bio..." rows={3} /></Field>
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_active ?? true} onChange={e => set('is_active')(e.target.checked)} className="rounded border-slate-600 bg-slate-800 text-brand-blue-600" />
          <span className="text-xs text-slate-300">Active (visible on site)</span>
        </label>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name || !form.title}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Partner Form ─────────────────────────────────────────────────────────────

function PartnerForm({ partner, onSave, onCancel, saving }: {
  partner: TrainingPartner;
  onSave: (p: TrainingPartner) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<TrainingPartner>(partner);
  const set = (k: keyof TrainingPartner) => (v: string | number | boolean | string[]) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name *"><Input value={form.name} onChange={set('name')} placeholder="Acme Corp" /></Field>
        <Field label="Category *">
          <select value={form.category} onChange={e => set('category')(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue-500">
            <option value="employer">Employer</option>
            <option value="training_provider">Training Provider</option>
            <option value="community_partner">Community Partner</option>
            <option value="government">Government</option>
            <option value="education">Education</option>
          </select>
        </Field>
        <Field label="Training Role *">
          <select value={form.training_role} onChange={e => set('training_role')(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue-500">
            <option value="work_site">Work Site</option>
            <option value="classroom">Classroom</option>
            <option value="hybrid">Hybrid</option>
            <option value="sponsor">Sponsor</option>
            <option value="referral">Referral</option>
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status ?? 'active'} onChange={e => set('status')(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue-500">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </Field>
        <Field label="City"><Input value={form.city ?? ''} onChange={set('city')} placeholder="Indianapolis" /></Field>
        <Field label="State"><Input value={form.state ?? 'IN'} onChange={set('state')} placeholder="IN" /></Field>
        <Field label="Contact Name"><Input value={form.contact_name ?? ''} onChange={set('contact_name')} placeholder="John Doe" /></Field>
        <Field label="Contact Email"><Input value={form.contact_email ?? ''} onChange={set('contact_email')} type="email" placeholder="john@acme.com" /></Field>
        <Field label="Logo URL"><Input value={form.logo_url ?? ''} onChange={set('logo_url')} placeholder="/images/partners/acme.png" /></Field>
        <Field label="Website"><Input value={form.website_url ?? ''} onChange={set('website_url')} placeholder="https://acme.com" /></Field>
        <Field label="Display Order"><Input value={String(form.display_order ?? 0)} onChange={v => set('display_order')(Number(v))} type="number" /></Field>
      </div>
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.mou_on_file ?? false} onChange={e => set('mou_on_file')(e.target.checked)} className="rounded border-slate-600 bg-slate-800 text-brand-blue-600" />
          <span className="text-xs text-slate-300">MOU on file</span>
        </label>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name || !form.category || !form.training_role}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ContentManagerClient() {
  const [tab, setTab] = useState<Tab>('team');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [partners, setPartners] = useState<TrainingPartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editingPartner, setEditingPartner] = useState<TrainingPartner | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [addingPartner, setAddingPartner] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const flash = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
    else { setError(msg); setTimeout(() => setError(''), 5000); }
  };

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content/team');
      const data = await res.json();
      setMembers(data.members ?? []);
    } catch { flash('Failed to load team', 'error'); }
    finally { setLoading(false); }
  }, []);

  const loadPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content/partners');
      const data = await res.json();
      setPartners(data.partners ?? []);
    } catch { flash('Failed to load partners', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'team') loadTeam(); else loadPartners(); }, [tab, loadTeam, loadPartners]);

  const saveMember = async (m: TeamMember) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(m) });
      if (!res.ok) throw new Error((await res.json()).error);
      flash('Team member saved', 'success');
      setEditingMember(null);
      setAddingMember(false);
      await loadTeam();
    } catch (err) { flash(err instanceof Error ? err.message : 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const deleteMember = async (id: string) => {
    if (!confirm('Deactivate this team member?')) return;
    const res = await fetch(`/api/admin/content/team?id=${id}`, { method: 'DELETE' });
    if (res.ok) { flash('Deactivated', 'success'); await loadTeam(); }
    else flash('Failed to deactivate', 'error');
  };

  const savePartner = async (p: TrainingPartner) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content/partners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
      if (!res.ok) throw new Error((await res.json()).error);
      flash('Partner saved', 'success');
      setEditingPartner(null);
      setAddingPartner(false);
      await loadPartners();
    } catch (err) { flash(err instanceof Error ? err.message : 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const deletePartner = async (id: string) => {
    if (!confirm('Deactivate this partner?')) return;
    const res = await fetch(`/api/admin/content/partners?id=${id}`, { method: 'DELETE' });
    if (res.ok) { flash('Deactivated', 'success'); await loadPartners(); }
    else flash('Failed to deactivate', 'error');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Content Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Edit site content without code changes. Changes go live immediately.</p>
        </div>
        <button onClick={() => tab === 'team' ? loadTeam() : loadPartners()} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alerts */}
      {success && <div className="bg-green-950/50 border border-green-800 text-green-300 text-sm px-4 py-3 rounded-lg flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}
      {error && <div className="bg-red-950/50 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {([['team', 'Team Members', Users], ['partners', 'Training Partners', Building2]] as const).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-brand-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Team tab */}
      {tab === 'team' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">{members.length} team member{members.length !== 1 ? 's' : ''}</p>
            <button onClick={() => { setAddingMember(true); setEditingMember(null); }} className="flex items-center gap-2 px-3 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Add Member
            </button>
          </div>

          {addingMember && (
            <TeamMemberForm member={EMPTY_MEMBER} onSave={saveMember} onCancel={() => setAddingMember(false)} saving={saving} />
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading…</div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No team members in DB yet.</p>
              <p className="text-xs mt-1">The site falls back to <code className="text-slate-400">data/team.ts</code> until records are added here.</p>
            </div>
          ) : (
            members.map(m => (
              <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {editingMember?.id === m.id ? (
                  <div className="p-4">
                    <TeamMemberForm member={editingMember} onSave={saveMember} onCancel={() => setEditingMember(null)} saving={saving} />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4">
                    {m.headshot_url && (
                      <img src={m.headshot_url} alt={m.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-slate-700" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm">{m.name}</p>
                        {!m.is_active && <span className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded">Inactive</span>}
                      </div>
                      <p className="text-slate-400 text-xs">{m.title}{m.org_role ? ` · ${m.org_role}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setEditingMember(m)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => m.id && deleteMember(m.id)} className="p-2 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Partners tab */}
      {tab === 'partners' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">{partners.length} partner{partners.length !== 1 ? 's' : ''}</p>
            <button onClick={() => { setAddingPartner(true); setEditingPartner(null); }} className="flex items-center gap-2 px-3 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Add Partner
            </button>
          </div>

          {addingPartner && (
            <PartnerForm partner={EMPTY_PARTNER} onSave={savePartner} onCancel={() => setAddingPartner(false)} saving={saving} />
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading…</div>
          ) : partners.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No training partners in DB yet.</p>
              <p className="text-xs mt-1">The site falls back to <code className="text-slate-400">data/training-partners.ts</code> until records are added here.</p>
            </div>
          ) : (
            partners.map(p => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                {editingPartner?.id === p.id ? (
                  <div className="p-4">
                    <PartnerForm partner={editingPartner} onSave={savePartner} onCancel={() => setEditingPartner(null)} saving={saving} />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm">{p.name}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${p.status === 'active' ? 'bg-green-900/40 text-green-400' : 'bg-slate-700 text-slate-400'}`}>{p.status}</span>
                        {p.mou_on_file && <span className="text-xs px-1.5 py-0.5 bg-blue-900/40 text-blue-400 rounded">MOU</span>}
                      </div>
                      <p className="text-slate-400 text-xs capitalize">{p.category.replace(/_/g, ' ')} · {p.training_role.replace(/_/g, ' ')}{p.city ? ` · ${p.city}, ${p.state}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setEditingPartner(p)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => p.id && deletePartner(p.id)} className="p-2 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
