'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, ExternalLink, BookOpen, GripVertical,
  ChevronDown, ChevronUp, Save, Loader2, AlertCircle,
  CheckCircle2, Link2, Edit2, X,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InternalCourseLink {
  id: string;           // program_courses.id
  sort_order: number;
  is_required: boolean;
  course: {
    id: string;
    title: string | null;
    course_name: string | null;
    slug: string | null;
    status: string | null;
    duration_hours: number | null;
    category: string | null;
  };
}

interface ExternalItem {
  id: string;
  partner_name: string;
  title: string;
  external_url: string;
  description: string;
  duration_display: string;
  credential_type: string;
  credential_name: string;
  enrollment_instructions: string;
  opens_in_new_tab: boolean;
  is_required: boolean;
  sort_order: number;
  manual_completion_enabled: boolean;
  competency_area: string | null;
}

interface AvailableCourse {
  id: string;
  title: string | null;
  course_name: string | null;
  status: string | null;
  category: string | null;
}

interface Props {
  programId: string;
  programCode: string;
  programTitle: string;
  initialInternalLinks: InternalCourseLink[];
  initialExternalItems: ExternalItem[];
  availableCourses: AvailableCourse[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function courseLabel(c: AvailableCourse) {
  return c.title || c.course_name || c.id;
}

function Alert({ msg, type }: { msg: string; type: 'error' | 'success' }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
      type === 'error'
        ? 'bg-red-50 border border-red-200 text-red-700'
        : 'bg-green-50 border border-green-200 text-green-700'
    }`}>
      {type === 'error'
        ? <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
      <span>{msg}</span>
    </div>
  );
}

// ── External item form (blank or pre-filled for edit) ─────────────────────────

const BLANK_EXTERNAL: Omit<ExternalItem, 'id'> = {
  partner_name: '',
  title: '',
  external_url: '',
  description: '',
  duration_display: '',
  credential_type: '',
  credential_name: '',
  enrollment_instructions: '',
  opens_in_new_tab: true,
  is_required: true,
  sort_order: 0,
  manual_completion_enabled: true,
  competency_area: null,
};

// Competency areas that Elevate holds proctor authority over.
// Selecting one will trigger the guard on the API if a protected credential exists.
const COMPETENCY_AREAS = [
  { value: '', label: '— None / not applicable —' },
  { value: 'hvac_refrigeration',  label: 'HVAC / Refrigeration' },
  { value: 'construction_safety', label: 'Construction Safety' },
  { value: 'workplace_safety',    label: 'Workplace Safety' },
  { value: 'customer_service',    label: 'Customer Service' },
  { value: 'digital_skills',      label: 'Digital Skills' },
  { value: 'workforce_readiness', label: 'Workforce Readiness' },
  { value: 'workplace_assessment',label: 'Workplace Assessment (WorkKeys)' },
  { value: 'healthcare_clinical', label: 'Healthcare / Clinical' },
  { value: 'information_technology', label: 'Information Technology' },
  { value: 'business_finance',    label: 'Business / Finance' },
  { value: 'skilled_trades',      label: 'Skilled Trades' },
];

function ExternalItemForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: Omit<ExternalItem, 'id'>;
  onSave: (data: Omit<ExternalItem, 'id'>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.partner_name.trim()) return;
    if (!form.title.trim()) return;
    if (!form.external_url.trim()) return;
    onSave(form);
  };

  const field = (label: string, key: keyof typeof form, opts?: { placeholder?: string; multiline?: boolean; required?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{opts?.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {opts?.multiline ? (
        <textarea
          value={form[key] as string}
          onChange={e => set(key, e.target.value)}
          rows={2}
          placeholder={opts.placeholder}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent resize-none"
        />
      ) : (
        <input
          type="text"
          value={form[key] as string}
          onChange={e => set(key, e.target.value)}
          placeholder={opts?.placeholder}
          required={opts?.required}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent"
        />
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {field('Partner Name', 'partner_name', { placeholder: 'e.g. OSHA, Coursera, CareerSafe', required: true })}
        {field('Course / Training Title', 'title', { placeholder: 'e.g. OSHA 10-Hour General Industry', required: true })}
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          External URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          value={form.external_url}
          onChange={e => set('external_url', e.target.value)}
          placeholder="https://..."
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent"
        />
      </div>
      {field('Description', 'description', { placeholder: 'What learners will do or learn', multiline: true })}
      <div className="grid sm:grid-cols-3 gap-4">
        {field('Duration', 'duration_display', { placeholder: 'e.g. 10 hours, 2 weeks' })}
        {field('Credential Type', 'credential_type', { placeholder: 'e.g. Certificate, Badge, CEU' })}
        {field('Credential Name', 'credential_name', { placeholder: 'e.g. OSHA 10-Hour Card' })}
      </div>
      {field('Enrollment Instructions', 'enrollment_instructions', {
        placeholder: 'Steps learners must follow to register or access this training',
        multiline: true,
      })}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Competency Area
          <span className="ml-1 text-slate-400 font-normal">(used to enforce Elevate proctor authority)</span>
        </label>
        <select
          value={form.competency_area ?? ''}
          onChange={e => set('competency_area', e.target.value || null)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent bg-white"
        >
          {COMPETENCY_AREAS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-6 pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.opens_in_new_tab}
            onChange={e => set('opens_in_new_tab', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-brand-blue-600"
          />
          Opens in new tab
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.is_required}
            onChange={e => set('is_required', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-brand-blue-600"
          />
          Required for program completion
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.manual_completion_enabled}
            onChange={e => set('manual_completion_enabled', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-brand-blue-600"
          />
          Admin can mark complete manually
        </label>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Partner Training
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProgramManagerClient({
  programId,
  programCode,
  programTitle,
  initialInternalLinks,
  initialExternalItems,
  availableCourses,
}: Props) {
  const router = useRouter();

  const [internalLinks, setInternalLinks] = useState<InternalCourseLink[]>(initialInternalLinks);
  const [externalItems, setExternalItems] = useState<ExternalItem[]>(initialExternalItems);

  const [notice, setNotice] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
  const [busy, setBusy] = useState(false);

  // Internal course attach
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [attachingInternal, setAttachingInternal] = useState(false);

  // External item form state
  const [showExternalForm, setShowExternalForm] = useState(false);
  const [editingExternal, setEditingExternal] = useState<ExternalItem | null>(null);
  const [savingExternal, setSavingExternal] = useState(false);

  const flash = (msg: string, type: 'error' | 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 4000);
  };

  // ── Internal course attach ──────────────────────────────────────────────────

  const attachedCourseIds = new Set(internalLinks.map(l => l.course.id));
  const unattachedCourses = availableCourses.filter(c => !attachedCourseIds.has(c.id));

  const handleAttachInternal = useCallback(async () => {
    if (!selectedCourseId) return;
    setAttachingInternal(true);
    try {
      const res = await fetch(`/api/admin/programs/${programId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: selectedCourseId,
          is_required: true,
          order_index: internalLinks.length,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to attach course');

      // Reload to get the joined course data
      const listRes = await fetch(`/api/admin/programs/${programId}/courses`);
      const listJson = await listRes.json();
      setInternalLinks(listJson.items ?? []);
      setSelectedCourseId('');
      flash('Course attached', 'success');
    } catch (err: any) {
      flash(err.message, 'error');
    } finally {
      setAttachingInternal(false);
    }
  }, [selectedCourseId, programId, internalLinks.length]);

  const handleDetachInternal = useCallback(async (linkId: string) => {
    if (!confirm('Remove this course from the program?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/programs/${programId}/courses/${linkId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to detach');
      setInternalLinks(prev => prev.filter(l => l.id !== linkId));
      flash('Course removed', 'success');
    } catch (err: any) {
      flash(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }, [programId]);

  const handleToggleRequired = useCallback(async (link: InternalCourseLink) => {
    const res = await fetch(`/api/admin/programs/${programId}/courses/${link.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_required: !link.is_required }),
    });
    if (res.ok) {
      setInternalLinks(prev => prev.map(l => l.id === link.id ? { ...l, is_required: !l.is_required } : l));
    }
  }, [programId]);

  // ── External item CRUD ──────────────────────────────────────────────────────

  const handleSaveExternal = useCallback(async (data: Omit<ExternalItem, 'id'>) => {
    setSavingExternal(true);
    try {
      if (editingExternal) {
        // Update
        const res = await fetch(`/api/admin/programs/${programId}/external-courses/${editingExternal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Update failed');
        setExternalItems(prev => prev.map(i => i.id === editingExternal.id ? json.item : i));
        flash('Partner training updated', 'success');
      } else {
        // Create
        const res = await fetch(`/api/admin/programs/${programId}/external-courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, sort_order: externalItems.length }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Create failed');
        setExternalItems(prev => [...prev, json.item]);
        flash('Partner training added', 'success');
      }
      setShowExternalForm(false);
      setEditingExternal(null);
    } catch (err: any) {
      flash(err.message, 'error');
    } finally {
      setSavingExternal(false);
    }
  }, [programId, editingExternal, externalItems.length]);

  const handleDeleteExternal = useCallback(async (itemId: string) => {
    if (!confirm('Remove this partner training item?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/programs/${programId}/external-courses/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setExternalItems(prev => prev.filter(i => i.id !== itemId));
      flash('Partner training removed', 'success');
    } catch (err: any) {
      flash(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }, [programId]);

  const handleEditExternal = (item: ExternalItem) => {
    setEditingExternal(item);
    setShowExternalForm(true);
  };

  const handleCancelExternal = () => {
    setShowExternalForm(false);
    setEditingExternal(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {notice && <Alert msg={notice.msg} type={notice.type} />}

      {/* ── Section 1: Internal LMS Courses ─────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-blue-600" />
              Internal LMS Courses
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Courses hosted in your LMS. Learners complete lessons and quizzes here.
            </p>
          </div>
        </div>

        {/* Attach picker */}
        <div className="flex gap-3 mb-4">
          <select
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-400 focus:border-transparent bg-white"
          >
            <option value="">— Select a course to attach —</option>
            {unattachedCourses.map(c => (
              <option key={c.id} value={c.id}>
                {courseLabel(c)}{c.status === 'draft' ? ' (draft)' : ''}
                {c.category ? ` · ${c.category}` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={handleAttachInternal}
            disabled={!selectedCourseId || attachingInternal}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 disabled:opacity-40"
          >
            {attachingInternal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Attach
          </button>
        </div>

        {/* Attached list */}
        {internalLinks.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
            No internal courses attached yet. Select one above.
          </div>
        ) : (
          <div className="space-y-2">
            {internalLinks.map((link, idx) => {
              const c = link.course;
              const label = c.title || c.course_name || c.id;
              return (
                <div
                  key={link.id}
                  className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3"
                >
                  <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="w-6 h-6 rounded-full bg-brand-blue-100 text-brand-blue-700 text-xs font-semibold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{label}</p>
                    <p className="text-xs text-slate-400">
                      {c.category ?? 'No category'}
                      {c.duration_hours ? ` · ${c.duration_hours}h` : ''}
                      {' · '}
                      <span className={c.status === 'published' ? 'text-green-600' : 'text-amber-600'}>
                        {c.status ?? 'draft'}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleRequired(link)}
                    className={`text-xs px-2 py-1 rounded-full font-medium border transition-colors ${
                      link.is_required
                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                    title="Toggle required/optional"
                  >
                    {link.is_required ? 'Required' : 'Optional'}
                  </button>
                  <button
                    onClick={() => handleDetachInternal(link.id)}
                    disabled={busy}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from program"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-slate-400 mt-3">
          Need a new course?{' '}
          <a href="/admin/courses/generate" className="text-brand-blue-600 hover:underline">
            Generate one with AI →
          </a>
        </p>
      </section>

      {/* ── Section 2: External Partner Training ────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-teal-600" />
              External Partner Training
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Training hosted by partners. Learners click through to the partner site.
              No API integration required.
            </p>
          </div>
          {!showExternalForm && (
            <button
              onClick={() => { setEditingExternal(null); setShowExternalForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700"
            >
              <Plus className="w-4 h-4" />
              Add Partner Training
            </button>
          )}
        </div>

        {showExternalForm && (
          <div className="mb-4">
            <ExternalItemForm
              initial={editingExternal
                ? { ...editingExternal }
                : { ...BLANK_EXTERNAL, sort_order: externalItems.length }
              }
              onSave={handleSaveExternal}
              onCancel={handleCancelExternal}
              saving={savingExternal}
            />
          </div>
        )}

        {externalItems.length === 0 && !showExternalForm ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
            No partner training attached yet. Click "Add Partner Training" above.
          </div>
        ) : (
          <div className="space-y-2">
            {externalItems.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3"
              >
                <GripVertical className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.partner_name}
                    {item.duration_display ? ` · ${item.duration_display}` : ''}
                    {item.credential_name ? ` · ${item.credential_name}` : ''}
                  </p>
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {item.external_url.length > 60
                      ? item.external_url.slice(0, 60) + '…'
                      : item.external_url}
                  </a>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.is_required
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {item.is_required ? 'Required' : 'Optional'}
                  </span>
                  {item.manual_completion_enabled && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                      Manual completion
                    </span>
                  )}
                  <button
                    onClick={() => handleEditExternal(item)}
                    className="p-1.5 text-slate-400 hover:text-brand-blue-600 hover:bg-brand-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExternal(item.id)}
                    disabled={busy}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Footer actions ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
        <a
          href={`/programs/${programCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
        >
          <ExternalLink className="w-4 h-4" />
          Preview program page
        </a>
        <a
          href={`/admin/programs/${programCode}/dashboard`}
          className="text-sm text-brand-blue-600 hover:underline"
        >
          ← Back to program dashboard
        </a>
      </div>
    </div>
  );
}
