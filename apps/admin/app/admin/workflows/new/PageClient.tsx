'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { GitBranch, Save, Loader2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Trigger options ──────────────────────────────────────────────────────────

const EVENT_TRIGGERS = [
  { value: 'manual', label: 'Manual (no auto-trigger)' },
  { value: 'enrollment.created', label: 'Enrollment created' },
  { value: 'enrollment.completed', label: 'Enrollment completed' },
  { value: 'payment.succeeded', label: 'Payment succeeded' },
  { value: 'application.submitted', label: 'Application submitted' },
  { value: 'application.approved', label: 'Application approved' },
  { value: 'certificate.issued', label: 'Certificate issued' },
  { value: 'user.created', label: 'User created' },
  { value: 'checkpoint.passed', label: 'Checkpoint passed' },
  { value: 'schedule', label: 'Schedule (cron)' },
  { value: 'webhook', label: 'External webhook' },
];

const CRON_PRESETS = [
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Daily at 8 AM', value: '0 8 * * *' },
  { label: 'Weekly (Mon 9 AM)', value: '0 9 * * 1' },
  { label: 'Monthly (1st, midnight)', value: '0 0 1 * *' },
  { label: 'Custom…', value: '__custom__' },
];

// ─── Step action types ────────────────────────────────────────────────────────

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'send_sms', label: 'Send SMS' },
  { value: 'send_notification', label: 'Send In-App Notification' },
  { value: 'create_record', label: 'Create DB Record' },
  { value: 'update_record', label: 'Update DB Record' },
  { value: 'webhook_call', label: 'Call Webhook URL' },
  { value: 'ai_action', label: 'AI Action' },
  { value: 'condition', label: 'Condition (branch)' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'update_status', label: 'Update Status' },
];

// ─── Per-action config form ───────────────────────────────────────────────────

type StepConfig = Record<string, string>;

function StepConfigForm({
  action,
  config,
  onChange,
}: {
  action: string;
  config: StepConfig;
  onChange: (c: StepConfig) => void;
}) {
  const set = (k: string, v: string) => onChange({ ...config, [k]: v });
  const field = (
    key: string,
    label: string,
    placeholder = '',
    required = false,
    type: 'text' | 'textarea' | 'select' = 'text',
    options?: string[],
  ) => (
    <div key={key}>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={config[key] ?? ''}
          onChange={(e) => set(key, e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        />
      ) : type === 'select' && options ? (
        <select
          value={config[key] ?? ''}
          onChange={(e) => set(key, e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        >
          <option value="">— select —</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={config[key] ?? ''}
          onChange={(e) => set(key, e.target.value)}
          placeholder={placeholder}
          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        />
      )}
    </div>
  );

  switch (action) {
    case 'send_email':
      return (
        <div className="space-y-2 mt-2">
          {field('template', 'Email template name', 'e.g. enrollment_welcome', true)}
          {field('to', 'Recipient (variable or email)', '{{user.email}} or fixed@email.com', true)}
          {field('subject', 'Subject override', 'Leave blank to use template default')}
        </div>
      );
    case 'send_sms':
      return (
        <div className="space-y-2 mt-2">
          {field('to', 'Phone (variable or E.164)', '{{user.phone}} or +15551234567', true)}
          {field('body', 'Message body', 'Use {{variable}} for interpolation', true, 'textarea')}
        </div>
      );
    case 'send_notification':
      return (
        <div className="space-y-2 mt-2">
          {field('user_id', 'User ID (variable)', '{{user.id}}', true)}
          {field('title', 'Notification title', '', true)}
          {field('body', 'Notification body', '', false, 'textarea')}
          {field('type', 'Type', '', false, 'select', [
            'info',
            'success',
            'warning',
            'error',
            'action_required',
          ])}
        </div>
      );
    case 'create_record':
      return (
        <div className="space-y-2 mt-2">
          {field('table', 'Table name', 'e.g. tasks', true)}
          {field(
            'values',
            'Values (JSON)',
            '{"title":"{{event.name}}","status":"pending"}',
            true,
            'textarea',
          )}
        </div>
      );
    case 'update_record':
      return (
        <div className="space-y-2 mt-2">
          {field('table', 'Table name', 'e.g. enrollments', true)}
          {field('match', 'Match (JSON)', '{"id":"{{event.enrollment_id}}"}', true, 'textarea')}
          {field('values', 'Values (JSON)', '{"status":"active"}', true, 'textarea')}
        </div>
      );
    case 'webhook_call':
      return (
        <div className="space-y-2 mt-2">
          {field('url', 'Webhook URL', 'https://…', true)}
          {field('method', 'Method', '', false, 'select', ['POST', 'PUT', 'PATCH', 'GET'])}
          {field('body', 'Body (JSON)', '{"event":"{{event.type}}"}', false, 'textarea')}
          {field('secret_header', 'Auth header (optional)', 'X-Secret: {{env.WEBHOOK_SECRET}}')}
        </div>
      );
    case 'ai_action':
      return (
        <div className="space-y-2 mt-2">
          {field(
            'prompt',
            'Prompt',
            'Summarize the following enrollment: {{event.data}}',
            true,
            'textarea',
          )}
          {field('persist_table', 'Persist result to table (optional)', 'e.g. ai_summaries')}
          {field('persist_field', 'Field to write result into', 'e.g. summary')}
          {field('persist_match', 'Match row (JSON)', '{"id":"{{event.id}}"}')}
        </div>
      );
    case 'condition':
      return (
        <div className="space-y-2 mt-2">
          {field('field', 'Field to check', '{{event.status}}', true)}
          {field('operator', 'Operator', '', false, 'select', [
            'eq',
            'neq',
            'gt',
            'lt',
            'contains',
            'exists',
          ])}
          {field('value', 'Compare value', 'active')}
          {field('on_true', 'On true → step index (0-based)', '1')}
          {field('on_false', 'On false → step index (0-based)', '2')}
        </div>
      );
    case 'create_task':
      return (
        <div className="space-y-2 mt-2">
          {field('title', 'Task title', '', true)}
          {field('assigned_to', 'Assign to (user ID or variable)', '{{event.user_id}}')}
          {field('due_days', 'Due in N days', '3')}
          {field('priority', 'Priority', '', false, 'select', ['low', 'medium', 'high', 'urgent'])}
        </div>
      );
    case 'update_status':
      return (
        <div className="space-y-2 mt-2">
          {field('entity', 'Entity type', 'e.g. enrollment', true)}
          {field('entity_id', 'Entity ID (variable)', '{{event.enrollment_id}}', true)}
          {field('status', 'New status', 'e.g. active', true)}
        </div>
      );
    default:
      return null;
  }
}

// ─── Step row ─────────────────────────────────────────────────────────────────

type Step = { action: string; config: StepConfig; expanded: boolean };

function StepRow({
  step,
  index,
  total,
  onChange,
  onRemove,
}: {
  step: Step;
  index: number;
  total: number;
  onChange: (s: Step) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50">
        <span className="text-xs text-slate-400 font-mono w-5 flex-shrink-0">{index + 1}</span>
        <select
          value={step.action}
          onChange={(e) => onChange({ ...step, action: e.target.value, config: {} })}
          className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        >
          {ACTION_TYPES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => onChange({ ...step, expanded: !step.expanded })}
          className="text-slate-400 hover:text-slate-700 p-1"
          title={step.expanded ? 'Collapse' : 'Configure'}
        >
          {step.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-400 hover:text-red-600 p-1"
            title="Remove step"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {step.expanded && (
        <div className="px-4 pb-4 pt-1">
          <StepConfigForm
            action={step.action}
            config={step.config}
            onChange={(c) => onChange({ ...step, config: c })}
          />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewWorkflowPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    trigger: 'manual',
    program_filter: '',
    cron_preset: '0 0 * * *',
    cron_custom: '',
    webhook_key: '',
  });
  const [steps, setSteps] = useState<Step[]>([
    { action: 'send_email', config: {}, expanded: true },
  ]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const addStep = () =>
    setSteps((s) => [...s, { action: 'send_email', config: {}, expanded: true }]);
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i));
  const updateStep = (i: number, s: Step) =>
    setSteps((prev) => prev.map((step, idx) => (idx === i ? s : step)));

  const isCron = form.trigger === 'schedule';
  const isWebhook = form.trigger === 'webhook';
  const cronExpr =
    form.cron_preset === '__custom__' ? form.cron_custom : form.cron_preset;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        trigger: form.trigger,
        program_filter: form.program_filter || undefined,
        cron_expr: isCron ? cronExpr : undefined,
        webhook_key: isWebhook ? (form.webhook_key || undefined) : undefined,
        steps: steps.map((s) => ({ action: s.action, config: s.config })),
      };
      const res = await fetch('/api/admin/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save');
      router.push('/admin/workflows');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Breadcrumbs
        items={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Workflows', href: '/admin/workflows' },
          { label: 'New Workflow' },
        ]}
      />
      <div className="flex items-center gap-3 mt-6 mb-8">
        <GitBranch className="w-7 h-7 text-slate-600" />
        <h1 className="text-2xl font-bold text-slate-900">New Workflow</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {/* ── Basic info ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Details</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Workflow Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
        </div>

        {/* ── Trigger ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Trigger</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trigger type</label>
            <select
              value={form.trigger}
              onChange={(e) => set('trigger', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
            >
              {EVENT_TRIGGERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Event trigger: optional program filter */}
          {!isCron && !isWebhook && form.trigger !== 'manual' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Program filter (optional)
              </label>
              <input
                value={form.program_filter}
                onChange={(e) => set('program_filter', e.target.value)}
                placeholder="Leave blank to apply to all programs"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
          )}

          {/* Cron schedule */}
          {isCron && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Schedule</label>
                <select
                  value={form.cron_preset}
                  onChange={(e) => set('cron_preset', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                >
                  {CRON_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              {form.cron_preset === '__custom__' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cron expression
                  </label>
                  <input
                    value={form.cron_custom}
                    onChange={(e) => set('cron_custom', e.target.value)}
                    placeholder="0 9 * * 1-5"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
              )}
              {cronExpr && form.cron_preset !== '__custom__' && (
                <p className="text-xs text-slate-500 font-mono">Expression: {cronExpr}</p>
              )}
            </div>
          )}

          {/* Webhook key */}
          {isWebhook && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Webhook key (URL slug)
              </label>
              <input
                value={form.webhook_key}
                onChange={(e) => set('webhook_key', e.target.value)}
                placeholder="e.g. my-integration-hook (auto-generated if blank)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
              {form.webhook_key && (
                <p className="text-xs text-slate-500 mt-1">
                  POST to: <code>/api/workflows/webhook/{form.webhook_key}</code>
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Steps ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Steps</h2>
            <button
              type="button"
              onClick={addStep}
              className="flex items-center gap-1 text-xs text-brand-blue-600 hover:text-brand-blue-800 font-medium"
            >
              <Plus className="w-3 h-3" /> Add Step
            </button>
          </div>
          {steps.map((step, i) => (
            <StepRow
              key={i}
              step={step}
              index={i}
              total={steps.length}
              onChange={(s) => updateStep(i, s)}
              onRemove={() => removeStep(i)}
            />
          ))}
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Create Workflow'}
          </button>
          <Link
            href="/admin/workflows"
            className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
