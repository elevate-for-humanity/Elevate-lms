'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { runCourseFactoryPipeline } from '@/components/admin/course-builder/runCourseFactoryPipeline';
import VoiceDictationButton from '@/components/voice/VoiceDictationButton';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

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
  videos_queued?: number;
  completion_state?: 'content_only' | 'media_pending' | 'ready_for_review';
  governance?: unknown;
}

type ProgramOption = {
  id: string;
  title: string;
  slug: string;
  status?: string;
  is_active?: boolean;
};
type StandardOption = {
  id: string;
  name: string;
  provider: string;
  registryKey: string | null;
  standardStatus: string;
  claimReady: boolean;
  gaps: string[];
};

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
  const naturalVoice = useNaturalVoice();

  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('');
  const [hours, setHours] = useState('');
  const [state, setState] = useState('Indiana');
  const [credential, setCredential] = useState('');
  const [credentialRegistryKey, setCredentialRegistryKey] = useState('');
  const [deliveryFormat, setDeliveryFormat] = useState('');
  const [prompt, setPrompt] = useState('');
  const [programId, setProgramId] = useState('');
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [standards, setStandards] = useState<StandardOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [buildScope, setBuildScope] = useState<'lesson' | 'course'>('course');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(
    'intermediate',
  );
  const [moduleCount, setModuleCount] = useState('5');
  const [lessonsPerModule, setLessonsPerModule] = useState('5');

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);

  useEffect(() => {
    fetch('/api/admin/course-builder?action=authoring-options', { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Unable to load authoring options');
        return body;
      })
      .then((body) => {
        setPrograms(Array.isArray(body.programs) ? body.programs : []);
        setStandards(Array.isArray(body.standards) ? body.standards : []);
      })
      .catch((loadError) =>
        setError(
          loadError instanceof Error ? loadError.message : 'Unable to load authoring options',
        ),
      )
      .finally(() => setOptionsLoading(false));
  }, []);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === programId) ?? null,
    [programId, programs],
  );
  const selectedStandard = useMemo(
    () => standards.find((standard) => standard.registryKey === credentialRegistryKey) ?? null,
    [credentialRegistryKey, standards],
  );

  const speak = (message: string) => {
    if (!voiceOutputEnabled) return;
    void naturalVoice.play(message, {
      voice: 'coral',
      style: 'assistant',
      rate: 0.96,
    });
  };

  const append = (current: string, transcript: string) =>
    `${current.trim()}${current.trim() ? ' ' : ''}${transcript.trim()}`;

  const requestGeneration = () => {
    const invalidCourseSize =
      buildScope === 'course' &&
      (!Number.isInteger(Number(moduleCount)) ||
        Number(moduleCount) < 1 ||
        Number(moduleCount) > 40 ||
        !Number.isInteger(Number(lessonsPerModule)) ||
        Number(lessonsPerModule) < 1 ||
        Number(lessonsPerModule) > 20);
    const validationError = !title.trim()
      ? 'Course title is required.'
      : !audience.trim()
        ? 'Target audience is required.'
        : !programId.trim()
          ? 'Select a registered program so the course can use workforce evidence.'
          : invalidCourseSize
            ? 'Choose 1–40 modules and 1–20 lessons per module.'
            : null;
    if (validationError) {
      setError(validationError);
      speak(validationError);
      return;
    }
    setError(null);
    setConfirming(true);
    speak(
      'Your course request is ready for review. Confirm generation when the details are correct.',
    );
  };

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
      setError('Select a registered program so the course can use workforce evidence.');
      return;
    }
    setError(null);
    setResult(null);
    setConfirming(false);
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
        credentialRegistryKey: credentialRegistryKey || undefined,
        difficulty,
        moduleCount: buildScope === 'lesson' ? 1 : Number.parseInt(moduleCount, 10),
        lessonsPerModule: buildScope === 'lesson' ? 1 : Number.parseInt(lessonsPerModule, 10),
        buildScope,
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
        compliance_status: published.governance ? 'governance report available' : 'draft generated',
        generation_attempt: 1,
        videos_queued: published.videosQueued,
        completion_state: published.completionState,
        governance: published.governance,
      });
      speak(
        `${published.lessonsGenerated} draft lessons were created. Human review and media completion remain visible as separate statuses.`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setError(message);
      speak(`Course generation failed. ${message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Sparkles className="h-5 w-5 text-brand-blue-600" />
            AI Course Generator
          </h2>
          <button
            type="button"
            aria-label={
              voiceOutputEnabled ? 'Turn spoken responses off' : 'Turn spoken responses on'
            }
            aria-pressed={voiceOutputEnabled}
            onClick={() => {
              setVoiceOutputEnabled((enabled) => {
                if (enabled) naturalVoice.stop();
                return !enabled;
              });
            }}
            className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700"
          >
            {voiceOutputEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {voiceOutputEnabled ? 'Voice on' : 'Voice off'}
          </button>
        </div>
        <p className="text-sm text-slate-700 mt-1">
          Runs the canonical Course Factory end to end: grounded curriculum, complete lessons,
          interactive checks, assessments, narration, visual direction, durable publication, and
          queued lesson videos.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-slate-900">
              Course Title <span className="text-red-500">*</span>
            </label>
            <VoiceDictationButton
              label="course title"
              onTranscript={setTitle}
              disabled={generating}
            />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. CNA Certification Prep — Indiana NATCEP"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-slate-900">
              Target Audience <span className="text-red-500">*</span>
            </label>
            <VoiceDictationButton
              label="target audience"
              onTranscript={setAudience}
              disabled={generating}
            />
          </div>
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
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-slate-900">Total Hours</label>
              <VoiceDictationButton
                label="total hours"
                onTranscript={(value) => setHours(value.replace(/[^0-9]/g, ''))}
                disabled={generating}
              />
            </div>
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
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-slate-900">State</label>
              <VoiceDictationButton
                label="state"
                onTranscript={(value) => {
                  const match = US_STATES.find(
                    (candidate) => candidate.toLowerCase() === value.trim().toLowerCase(),
                  );
                  if (match) setState(match);
                  else {
                    setError(`I could not match “${value}” to a state.`);
                    speak(`I could not match ${value} to a state.`);
                  }
                }}
                disabled={generating}
              />
            </div>
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
          <label className="mb-1 block text-sm font-medium text-slate-900">Delivery Format</label>
          <select
            value={deliveryFormat}
            onChange={(e) => setDeliveryFormat(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500"
          >
            <option value="">Derive from program and authority requirements</option>
            <option value="online">Online</option>
            <option value="in_person">In person</option>
            <option value="hybrid">Hybrid</option>
            <option value="work_based_learning">Work-based learning / OJT</option>
          </select>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-slate-900">Additional Instructions</label>
            <VoiceDictationButton
              label="additional instructions"
              onTranscript={(value) => setPrompt((current) => append(current, value))}
              disabled={generating}
            />
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Specific topics, compliance requirements, or content notes..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900">
            Registered Program <span className="text-red-500">*</span>
          </label>
          <select
            value={programId}
            onChange={(event) => {
              setProgramId(event.target.value);
              const program = programs.find((option) => option.id === event.target.value);
              if (program && !title.trim()) setTitle(program.title);
            }}
            disabled={generating || optionsLoading}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">
              {optionsLoading ? 'Loading registered programs…' : 'Select a program'}
            </option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.title}
                {program.is_active === false ? ' — inactive' : ''}
              </option>
            ))}
          </select>
          {selectedProgram ? (
            <p className="mt-1 text-xs text-slate-600">Registry key: {selectedProgram.slug}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900">
            Standards Framework
          </label>
          <select
            value={credentialRegistryKey}
            onChange={(event) => {
              const key = event.target.value;
              setCredentialRegistryKey(key);
              const standard = standards.find((option) => option.registryKey === key);
              if (standard) setCredential(standard.name);
            }}
            disabled={generating || optionsLoading}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Build while developing a new standard</option>
            {standards
              .filter((standard) => standard.registryKey)
              .map((standard) => (
                <option key={standard.id} value={standard.registryKey ?? ''}>
                  {standard.name} —{' '}
                  {standard.claimReady ? 'requirements loaded' : 'development needed'}
                </option>
              ))}
          </select>
          <p className="mt-1 text-xs text-slate-600">
            Drafting stays available; missing requirements become visible standards-development
            work.
          </p>
          {selectedStandard ? (
            <div
              className={`mt-2 rounded-md border p-2 text-xs ${selectedStandard.claimReady ? 'border-green-200 bg-green-50 text-green-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
            >
              <div className="font-semibold">
                {selectedStandard.provider}: {selectedStandard.standardStatus}
              </div>
              <div>
                {selectedStandard.gaps.length
                  ? `Registry gaps: ${selectedStandard.gaps.join('; ')}`
                  : 'Authority record and objectives are loaded for internal alignment review.'}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900">Build scope</label>
            <select
              value={buildScope}
              onChange={(event) => setBuildScope(event.target.value as 'lesson' | 'course')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="lesson">One complete lesson</option>
              <option value="course">Full course</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-900">Difficulty</label>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {buildScope === 'course' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900">Modules</label>
              <input
                type="number"
                min={1}
                max={40}
                value={moduleCount}
                onChange={(event) => setModuleCount(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-900">
                Lessons per module
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={lessonsPerModule}
                onChange={(event) => setLessonsPerModule(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        ) : null}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {confirming ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4" role="status">
            <p className="font-bold text-amber-950">Review before using generation credits</p>
            <p className="mt-1 text-sm text-amber-900">
              Build “{title}” for {audience} under{' '}
              {selectedProgram?.title ?? 'the selected program'}, with narration and lesson videos
              queued.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => void generate()}
                className="rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-700"
              >
                Confirm &amp; generate
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800"
              >
                Keep editing
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-amber-200 pt-3">
              <span className="text-xs font-medium text-amber-900">
                Say “confirm generation” or “keep editing.”
              </span>
              <VoiceDictationButton
                label="generation confirmation"
                onTranscript={(value) => {
                  const command = value.toLowerCase();
                  if (command.includes('confirm') || command.includes('generate')) {
                    speak('Generation confirmed. Starting the Course Factory.');
                    void generate();
                  } else if (command.includes('edit') || command.includes('cancel')) {
                    setConfirming(false);
                    speak('Generation cancelled. You can keep editing the request.');
                  } else {
                    setError('Say “confirm generation” or “keep editing.”');
                    speak('I did not run the course. Say confirm generation or keep editing.');
                  }
                }}
                disabled={generating}
              />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={requestGeneration}
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
              Review Course Request
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
                <span className="font-bold text-brand-green-800">Draft generation completed</span>
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
                  <dt>Draft lessons generated</dt>
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
                  <dt>Governance</dt>
                  <dd className="font-medium text-amber-700">{result.compliance_status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Media</dt>
                  <dd className="font-medium">
                    {result.completion_state === 'media_pending'
                      ? `${result.videos_queued ?? 0} videos queued`
                      : (result.completion_state ?? 'not requested')}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                {[
                  ['Draft generated', true],
                  ['Lessons validated', Boolean(result.governance)],
                  ['Human review completed', false],
                  ['Videos rendered', result.completion_state === 'ready_for_review'],
                  ['Package validated', false],
                  ['Course published', false],
                ].map(([label, complete]) => (
                  <div
                    key={String(label)}
                    className={`rounded border px-2 py-1.5 ${complete ? 'border-green-200 bg-green-50 text-green-900' : 'border-slate-200 bg-white text-slate-600'}`}
                  >
                    {complete ? 'Complete' : 'Pending'} — {label}
                  </div>
                ))}
              </div>
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
