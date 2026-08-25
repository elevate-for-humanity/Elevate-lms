'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { runCourseFactoryPipeline } from '@/components/admin/course-builder/runCourseFactoryPipeline';

interface GenerateResult {
  ok: boolean;
  course_id?: string;
  title?: string;
  modules_inserted?: number;
  lessons_published?: number;
  curriculum_lessons_inserted?: number;
  compliance_status?: string;
  generation_attempt?: number;
  error?: string;
  errors_per_attempt?: string[][];
}

const US_STATES = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

export default function AutomaticCourseBuilder() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('');
  const [hours, setHours] = useState('');
  const [state, setState] = useState('Indiana');
  const [credential, setCredential] = useState('');
  const [deliveryFormat, setDeliveryFormat] = useState('');
  const [prompt, setPrompt] = useState('');
  const [programId, setProgramId] = useState('');

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!title.trim()) {
      setError('Course title is required.');
      return;
    }
    if (!audience.trim()) {
      setError('Target audience is required.');
      return;
    }
    if (!programId.trim()) {
      setError('Select or enter the canonical program ID so the course can use registered standards and workforce evidence.');
      return;
    }
    setError(null);
    setResult(null);
    setGenerating(true);

    try {
      const published = await runCourseFactoryPipeline({
        title: title.trim(),
        topic: prompt.trim() || `${title.trim()} workforce preparation`,
        audience: audience.trim(),
        hours: hours ? Number.parseInt(hours, 10) : undefined,
        state,
        credential: credential.trim() || undefined,
        deliveryFormat: deliveryFormat.trim() || undefined,
        additionalRequirements: prompt.trim() || undefined,
        programId: programId.trim(),
        difficulty: 'intermediate',
        moduleCount: 5,
        lessonsPerModule: 5,
        includeVideos: true,
        dryRun: false,
      });

      if (!published.courseId) throw new Error('Course Factory did not return a course ID.');

      setResult({
        ok: true,
        course_id: published.courseId,
        title: published.title || title.trim(),
        modules_inserted: published.modulesGenerated,
        lessons_published: published.lessonsGenerated,
        curriculum_lessons_inserted: published.lessonsGenerated,
        compliance_status: 'validated',
        generation_attempt: 1,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-blue-600" />
          AI Course Generator
        </h2>
        <p className="text-sm text-slate-700 mt-1">
          Runs the canonical Course Factory end to end: grounded curriculum, complete lessons,
          interactive checks, assessments, narration, visual direction, durable publication, and
          queued lesson videos.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            Course Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. CNA Certification Prep — Indiana NATCEP"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            Target Audience <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g. Adults seeking entry-level healthcare employment"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Total Hours</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 75"
              min={1}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500"
            >
              <option value="">— Any —</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            Credential or Exam
          </label>
          <input
            type="text"
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            placeholder="e.g. EPA 608, NCLEX-PN, CompTIA A+"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Delivery Format</label>
          <input
            type="text"
            value={deliveryFormat}
            onChange={(e) => setDeliveryFormat(e.target.value)}
            placeholder="e.g. Hybrid — online theory + in-person lab"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            Additional Instructions
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Specific topics, compliance requirements, or content notes..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            Canonical Program ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            placeholder="Required UUID from the program registry"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={generate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running Course Factory…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate &amp; Publish Course
            </>
          )}
        </button>
      </div>

      {result && (
        <div
          className={`mt-6 rounded-lg border p-4 ${result.ok ? 'bg-brand-green-50 border-brand-green-200' : 'bg-red-50 border-red-200'}`}
        >
          {result.ok ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-brand-green-600" />
                <span className="font-bold text-brand-green-800">Course published successfully</span>
              </div>
              <dl className="text-sm space-y-1 text-brand-green-900">
                <div className="flex justify-between">
                  <dt>Title</dt>
                  <dd className="font-medium">{result.title}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Modules</dt>
                  <dd className="font-medium">{result.modules_inserted}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Lessons published</dt>
                  <dd className="font-medium">{result.lessons_published}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Curriculum lessons archived</dt>
                  <dd className="font-medium">{result.curriculum_lessons_inserted}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Generation attempt</dt>
                  <dd className="font-medium">{result.generation_attempt} / 3</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Compliance status</dt>
                  <dd className="font-medium text-amber-700">{result.compliance_status}</dd>
                </div>
              </dl>
              <div className="mt-4 flex gap-4">
                <button
                  onClick={() => router.push(`/curriculum/${result.course_id}`)}
                  className="text-sm font-semibold text-brand-green-700 hover:text-brand-green-800"
                >
                  Review in Curriculum Builder →
                </button>
                <button
                  onClick={() => router.push(`/lms/courses/${result.course_id}`)}
                  className="flex items-center gap-1 text-sm font-semibold text-brand-green-700 hover:text-brand-green-800"
                >
                  <ExternalLink className="w-3 h-3" /> Preview in LMS
                </button>
              </div>
              <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                All AI-generated content is marked <strong>draft_for_human_review</strong>. Review
                each lesson in the Curriculum Builder before making this course visible to learners.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-bold text-red-800">Generation failed</span>
              </div>
              <p className="text-sm text-red-700 mb-2">{result.error}</p>
              {result.errors_per_attempt && (
                <details className="text-xs text-red-600">
                  <summary className="cursor-pointer font-medium">
                    Validation errors per attempt
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap bg-red-100 rounded p-2">
                    {result.errors_per_attempt
                      .map(
                        (errs, i) => `Attempt ${i + 1}:\n${errs.map((e) => `  • ${e}`).join('\n')}`,
                      )
                      .join('\n\n')}
                  </pre>
                </details>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
