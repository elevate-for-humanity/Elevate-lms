'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { GitBranch, Save, Loader2, Plus, Trash2 } from 'lucide-react';

const TRIGGER_OPTIONS = [
  'enrollment.created', 'enrollment.completed', 'payment.succeeded',
  'application.submitted', 'application.approved', 'certificate.issued',
  'user.created', 'checkpoint.passed', 'manual',
];

export default function NewWorkflowPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', trigger: 'manual', program_filter: '' });
  const [steps, setSteps] = useState([{ action: 'send_email', config: '' }]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const addStep = () => setSteps(s => [...s, { action: 'send_email', config: '' }]);
  const removeStep = (i: number) => setSteps(s => s.filter((_, idx) => idx !== i));
  const setStep = (i: number, k: string, v: string) => setSteps(s => s.map((step, idx) => idx === i ? { ...step, [k]: v } : step));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, steps }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save');
      router.push('/admin/workflows');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Breadcrumbs items={[
        { label: 'Admin', href: '/admin/dashboard' },
        { label: 'Workflows', href: '/admin/workflows' },
        { label: 'New Workflow' },
      ]} />
      <div className="flex items-center gap-3 mt-6 mb-8">
        <GitBranch className="w-7 h-7 text-slate-600" />
        <h1 className="text-2xl font-bold text-slate-900">New Workflow</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-slate-200 rounded-2xl p-6">
        {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Workflow Name *</label>
          <input required value={form.name} onChange={e => set('name', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Trigger *</label>
          <select value={form.trigger} onChange={e => set('trigger', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
            {TRIGGER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Program Filter (optional)</label>
          <input value={form.program_filter} onChange={e => set('program_filter', e.target.value)}
            placeholder="Leave blank to apply to all programs"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-700">Steps</label>
            <button type="button" onClick={addStep} className="flex items-center gap-1 text-xs text-brand-blue-600 hover:text-brand-blue-800 font-medium">
              <Plus className="w-3 h-3" /> Add Step
            </button>
          </div>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-2 items-start bg-slate-50 rounded-lg p-3">
                <span className="text-xs text-slate-400 font-mono mt-2.5 w-5 flex-shrink-0">{i + 1}</span>
                <select value={step.action} onChange={e => setStep(i, 'action', e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                  <option value="send_email">Send Email</option>
                  <option value="send_sms">Send SMS</option>
                  <option value="create_task">Create Task</option>
                  <option value="update_status">Update Status</option>
                  <option value="webhook">Webhook</option>
                </select>
                <input value={step.config} onChange={e => setStep(i, 'config', e.target.value)}
                  placeholder="Config / template name"
                  className="flex-1 border border-slate-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
                {steps.length > 1 && (
                  <button type="button" onClick={() => removeStep(i)} className="text-red-400 hover:text-red-600 mt-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Create Workflow'}
          </button>
          <a href="/admin/workflows" className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 font-medium">Cancel</a>
        </div>
      </form>
    </div>
  );
}

