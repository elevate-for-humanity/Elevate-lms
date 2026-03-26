'use client';

import { useState, useEffect } from 'react';
import { AssistantField } from '@/components/application-assistant/AssistantField';
import { generateSuggestions } from '@/lib/assistant/matchFieldToSource';
import type { SuggestedAnswer } from '@/lib/assistant/matchFieldToSource';
import { Send, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

// ── SAEF Round 2 Form Schema ──────────────────────────────────────────────────
// Add any new grant form here as a new FORM_SCHEMAS entry.

const SAEF_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdEfMQFOf50SJF4-YeUGGOGlEa0FKsWzTgeuE3v1OK6e5bZ0w/viewform';

const SAEF_FIELDS = [
  // Section 1 — Org Info
  { fieldName: 'organization_name',    fieldLabel: 'Organization Name',           type: 'text',     required: true,  section: 'Organization Information' },
  { fieldName: 'address',              fieldLabel: 'Address',                     type: 'text',     required: true,  section: 'Organization Information' },
  { fieldName: 'primary_contact',      fieldLabel: 'Primary Contact Person & Title', type: 'text', required: true,  section: 'Organization Information' },
  { fieldName: 'phone',                fieldLabel: 'Phone',                       type: 'tel',      required: true,  section: 'Organization Information' },
  { fieldName: 'email',                fieldLabel: 'Email',                       type: 'email',    required: true,  section: 'Organization Information' },
  { fieldName: 'org_type',             fieldLabel: 'Organization Type',           type: 'select',   required: true,  section: 'Organization Information',
    options: ['Nonprofit', 'Public Entity', 'Postsecondary Institution', 'Workforce Development Board', 'Group Sponsor', 'Other'] },

  // Section 2 — Eligibility
  { fieldName: 'sam_registration',     fieldLabel: 'SAM.gov Registration / CAGE Code', type: 'text', required: true, section: 'Organizational Eligibility' },
  { fieldName: 'registered_bidder',    fieldLabel: 'Registered Bidder Status',    type: 'text',     required: true,  section: 'Organizational Eligibility' },
  { fieldName: 'dol_sponsor',          fieldLabel: 'DOL Registered Apprenticeship Sponsor', type: 'text', required: true, section: 'Organizational Eligibility' },

  // Section 3 — Grant Categories
  { fieldName: 'categories',           fieldLabel: 'Grant Categories Selected',   type: 'textarea', required: true,  section: 'Grant Categories' },
  { fieldName: 'total_requested',      fieldLabel: 'Total Funding Requested',     type: 'text',     required: true,  section: 'Grant Categories' },

  // Section 4 — Employer Partner
  { fieldName: 'employer_partner',     fieldLabel: 'Employer Partner',            type: 'textarea', required: true,  section: 'Employer Partner' },

  // Section 5 — Narrative
  { fieldName: 'statement_of_need',    fieldLabel: 'Statement of Need',           type: 'textarea', required: true,  section: 'Program Narrative' },
  { fieldName: 'program_description',  fieldLabel: 'Program Description',         type: 'textarea', required: true,  section: 'Program Narrative' },
  { fieldName: 'objectives',           fieldLabel: 'Objectives',                  type: 'textarea', required: true,  section: 'Program Narrative' },
  { fieldName: 'methods',              fieldLabel: 'Methods',                     type: 'textarea', required: true,  section: 'Program Narrative' },
  { fieldName: 'outcomes',             fieldLabel: 'Expected Outcomes',           type: 'textarea', required: true,  section: 'Program Narrative' },

  // Section 6 — Budget
  { fieldName: 'budget_narrative',     fieldLabel: 'Budget Narrative',            type: 'textarea', required: true,  section: 'Budget' },

  // Section 7 — Capacity
  { fieldName: 'org_capacity',         fieldLabel: 'Organizational Capacity & Experience', type: 'textarea', required: true, section: 'Organizational Capacity' },

  // Section 8 — Commitments
  { fieldName: 'aihub_commitment',     fieldLabel: 'AiHUB Participation Commitment', type: 'text', required: true,  section: 'Commitments' },
  { fieldName: 'reporting_commitment', fieldLabel: 'Reporting Commitment',        type: 'text',     required: true,  section: 'Commitments' },
] as const;

type FieldName = typeof SAEF_FIELDS[number]['fieldName'];
type FormValues = Record<FieldName, string>;

const EMPTY_VALUES: FormValues = Object.fromEntries(
  SAEF_FIELDS.map((f) => [f.fieldName, ''])
) as FormValues;

export default function ApplicationAssistantPage() {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [suggestions, setSuggestions] = useState<Record<string, SuggestedAnswer>>({});
  const [autoFilled, setAutoFilled] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Generate suggestions on mount
  useEffect(() => {
    const fields = SAEF_FIELDS.map((f) => ({ fieldName: f.fieldName, fieldLabel: f.fieldLabel }));
    const results = generateSuggestions(fields);
    const map: Record<string, SuggestedAnswer> = {};
    results.forEach((s) => { map[s.fieldName] = s; });
    setSuggestions(map);
  }, []);

  // Auto-fill all high-confidence fields
  const autoFillAll = () => {
    const filled = { ...values };
    Object.entries(suggestions).forEach(([key, s]) => {
      if (s.confidence >= 0.9 && !filled[key as FieldName]) {
        filled[key as FieldName] = s.suggestion;
      }
    });
    setValues(filled);
    setAutoFilled(true);
  };

  const setValue = (fieldName: FieldName, value: string) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  // Build pre-filled Google Form URL
  // entry.1384283019 is the only confirmed ID — others use fieldName as placeholder
  // When DWD provides full entry IDs, replace the keys below
  const buildPrefilledUrl = () => {
    const params = new URLSearchParams();
    params.set('usp', 'pp_url');
    // Map known entry IDs — add more as they are confirmed
    const entryMap: Partial<Record<FieldName, string>> = {
      org_type: '1384283019', // confirmed from DWD pre-fill URL
    };
    Object.entries(entryMap).forEach(([field, entryId]) => {
      const val = values[field as FieldName];
      if (val) params.set(`entry.${entryId}`, val);
    });
    return `${SAEF_FORM_URL}?${params.toString()}`;
  };

  const openPrefilledForm = () => {
    window.open(buildPrefilledUrl(), '_blank');
    setSubmitted(true);
  };

  // Group fields by section
  const sections = [...new Set(SAEF_FIELDS.map((f) => f.section))];
  const filledCount = Object.values(values).filter(Boolean).length;
  const totalFields = SAEF_FIELDS.length;
  const progress = Math.round((filledCount / totalFields) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <span className="bg-brand-green-100 text-brand-green-700 text-xs font-bold px-2 py-1 rounded-full">SAEF 3 — ROUND 2</span>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">Application Assistant</h1>
              <p className="text-gray-500 text-sm">Indiana DWD · Education & Advanced Manufacturing · Up to $400,000</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-brand-blue-600">{progress}%</p>
              <p className="text-xs text-gray-400">{filledCount}/{totalFields} fields</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Auto-fill button */}
          {!autoFilled && (
            <div className="mt-4 bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-brand-blue-800">
                  Your org profile is loaded. Auto-fill all high-confidence fields instantly, then review before submitting.
                </p>
              </div>
              <button
                onClick={autoFillAll}
                className="flex-shrink-0 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                Auto-Fill All
              </button>
            </div>
          )}

          {autoFilled && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              High-confidence fields auto-filled. Review each section below.
            </div>
          )}
        </div>

        {/* Form sections */}
        {sections.map((section) => {
          const sectionFields = SAEF_FIELDS.filter((f) => f.section === section);
          return (
            <div key={section} className="bg-white rounded-2xl shadow-sm p-6 mb-4">
              <h2 className="text-base font-bold text-gray-900 mb-5 pb-2 border-b border-gray-100">
                {section}
              </h2>
              {sectionFields.map((field) => (
                <AssistantField
                  key={field.fieldName}
                  label={field.fieldLabel}
                  fieldName={field.fieldName}
                  type={field.type as any}
                  required={field.required}
                  options={'options' in field ? [...field.options] : undefined}
                  suggestion={suggestions[field.fieldName]}
                  value={values[field.fieldName]}
                  onChange={(val) => setValue(field.fieldName, val)}
                />
              ))}
            </div>
          );
        })}

        {/* Submit */}
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          {submitted ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <p className="font-semibold text-gray-900">Form opened with your answers pre-filled.</p>
              <p className="text-sm text-gray-500">Review the form in the new tab and hit <strong>Submit</strong> to send to DWD.</p>
              <button
                onClick={openPrefilledForm}
                className="flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Re-open Form
              </button>
            </div>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-4">
                Review all fields above, then open the Google Form with your answers pre-filled.
              </p>
              <button
                onClick={openPrefilledForm}
                disabled={filledCount < 6}
                className="inline-flex items-center gap-2 bg-brand-green-600 hover:bg-brand-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors"
              >
                <Send className="w-5 h-5" />
                Open Pre-Filled Form
              </button>
              {filledCount < 6 && (
                <p className="text-xs text-gray-400 mt-2">Fill at least 6 fields to continue</p>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
