'use client';

import { useActionState, useRef, useState } from 'react';
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  MessageSquareText,
  Mic,
  PhoneForwarded,
  Route,
  Sparkles,
  Square,
  Voicemail,
} from 'lucide-react';
import { WEEKDAYS, type BusinessHours } from '@/lib/phone/config';
import {
  addExternalNumber,
  saveExtensionVoicemailGreetingSettings,
  saveMenuOption,
  savePhoneSettings,
  saveSmsAutoReplySettings,
  saveVoicemailGreetingSettings,
  type PhoneActionState,
} from './actions';
import {
  VOICEMAIL_GREETING_MAX_CHARS,
  type VoicemailGreetingMode,
} from '@/lib/phone/voicemail-greeting';

const initial: PhoneActionState = { ok: false, message: '' };
const field =
  'mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950';
const button =
  'mt-4 min-h-11 min-w-11 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50';

function Result({ state }: { state: PhoneActionState }) {
  return state.message ? (
    <p
      role="status"
      className={`mt-3 text-sm font-semibold ${state.ok ? 'text-emerald-700' : 'text-rose-700'}`}
    >
      {state.message}
    </p>
  ) : null;
}

function Toggle({
  name,
  label,
  defaultChecked = false,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-700">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-11 w-11 shrink-0 rounded border-slate-300"
      />
      {label}
    </label>
  );
}

export type DestinationOption = {
  id: string;
  name: string;
  destination: string | null;
  enabled: boolean;
};
export type PhoneSettings = {
  greeting: string;
  afterHours: string;
  routingMode: string;
  timezone: string;
  businessHours: BusinessHours;
  voicemailEnabled: boolean;
  voicemailTranscriptionEnabled: boolean;
  callRecordingEnabled: boolean;
  recordingDisclosure: string;
  maxQueueSeconds: number;
  aiEnabled: boolean;
  aiName: string;
  aiVoice: string;
  aiLanguage: string;
  aiInstructions: string;
  aiAllowInterruptions: boolean;
  aiHumanHandoffEnabled: boolean;
  smsAutoReplyEnabled: boolean;
  smsAutoReplyMessage: string;
  voicemailGreetingText: string;
  voicemailGreetingMode: VoicemailGreetingMode;
  voicemailGreetingRecordingPath: string;
  voicemailGreetingRecordingUrl: string | null;
};

export type ExtensionGreetingOption = {
  id: string;
  extension: string;
  name: string;
  enabled: boolean;
  text: string;
  mode: VoicemailGreetingMode;
  recordingPath: string;
  recordingUrl: string | null;
};

export type PhoneSetupStep = { label: string; complete: boolean };

export function NewSystemNotice({
  dismissAction,
  steps,
}: {
  dismissAction: () => Promise<void>;
  steps: PhoneSetupStep[];
}) {
  return (
    <section className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="rounded-xl bg-indigo-700 p-2 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-700">
              New phone and meetings system
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              Welcome to Elevate Communications
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Give your organization a business number, ring staff through the installed PWA, assign
              extensions, route callers, hold browser video meetings, share your screen, and keep
              communications connected to the dashboard.
            </p>
          </div>
        </div>
        <form action={dismissAction}>
          <button className="min-h-11 min-w-11 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-bold text-indigo-800 sm:w-auto sm:py-1.5 sm:text-xs">
            Dismiss
          </button>
        </form>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {steps.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm font-semibold text-slate-800"
          >
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-xs font-black ${
                item.complete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
              }`}
            >
              {item.complete ? '✓' : index + 1}
            </span>
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}


/**
 * The two ways to set a voicemail greeting, shared by the system-default
 * form and the per-extension form: type it (the phone system speaks it) or
 * record it here with the microphone (the recording is played as-is).
 * Field names match the save actions in ./actions.
 */
function VoicemailGreetingFields({
  scope,
  extension,
  text,
  mode: initialMode,
  recordingPath: initialRecordingPath,
  recordingUrl,
}: {
  scope: string;
  extension: string;
  text: string;
  mode: VoicemailGreetingMode;
  recordingPath: string;
  recordingUrl: string | null;
}) {
  const [mode, setMode] = useState<VoicemailGreetingMode>(initialMode);
  const [recordingPath, setRecordingPath] = useState(initialRecordingPath);
  const [previewUrl, setPreviewUrl] = useState<string | null>(recordingUrl);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recorderError, setRecorderError] = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function uploadRecording(blob: Blob) {
    setUploading(true);
    setRecorderError('');
    try {
      const body = new FormData();
      body.set('audio', blob, 'voicemail-greeting');
      body.set('scope', scope);
      body.set('extension', extension);
      const response = await fetch('/api/phone/voicemail-greeting/recording', {
        method: 'POST',
        body,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.path)
        throw new Error(result.error || 'The recording could not be stored. Try again.');
      setRecordingPath(result.path as string);
    } catch (error) {
      setRecorderError(
        error instanceof Error ? error.message : 'The recording could not be stored. Try again.',
      );
    } finally {
      setUploading(false);
    }
  }

  async function startRecording() {
    setRecorderError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        setPreviewUrl(URL.createObjectURL(blob));
        void uploadRecording(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecorderError(
        'The microphone is unavailable. Allow microphone access in this browser, or type the greeting instead.',
      );
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="How the greeting is provided">
        {(
          [
            ['text', 'Type it — the phone system reads it aloud'],
            ['recording', 'Record my voice'],
          ] as Array<[VoicemailGreetingMode, string]>
        ).map(([value, label]) => (
          <label
            key={value}
            className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
              mode === value
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-300 bg-white text-slate-800'
            }`}
          >
            <input
              type="radio"
              name="voicemailGreetingMode"
              value={value}
              checked={mode === value}
              onChange={() => setMode(value)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
      {mode === 'text' ? (
        <label className="block text-sm font-bold">
          Greeting text
          <textarea
            name="voicemailGreeting"
            rows={4}
            maxLength={VOICEMAIL_GREETING_MAX_CHARS}
            defaultValue={text}
            placeholder="You have reached Elevate for Humanity. Please leave your name, callback number, and the reason for your call."
            className={field}
          />
          <span className="mt-1 block text-xs font-medium text-slate-500">
            Callers hear this read aloud in the phone system&apos;s voice. Leave it empty to use
            the standard voicemail prompts.
          </span>
        </label>
      ) : (
        <div className="space-y-3">
          <input type="hidden" name="voicemailGreeting" value="" />
          <div className="flex flex-wrap items-center gap-2">
            {recording ? (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white"
              >
                <Square className="h-4 w-4" /> Stop recording
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={uploading}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                <Mic className="h-4 w-4" />
                {recordingPath ? 'Re-record my greeting' : 'Record my greeting'}
              </button>
            )}
            {recording ? (
              <span className="text-sm font-semibold text-rose-700">Recording… speak now.</span>
            ) : uploading ? (
              <span className="text-sm font-semibold text-slate-600">Saving the recording…</span>
            ) : recordingPath ? (
              <span className="text-sm font-semibold text-emerald-700">
                Recording ready — press Save below to use it.
              </span>
            ) : (
              <span className="text-sm font-semibold text-slate-600">No recording yet.</span>
            )}
          </div>
          {previewUrl ? (
            <audio controls src={previewUrl} className="w-full">
              Your browser cannot play the recording preview.
            </audio>
          ) : null}
          {recorderError ? (
            <p role="alert" className="text-sm font-semibold text-rose-700">
              {recorderError}
            </p>
          ) : null}
          <p className="text-xs font-medium text-slate-500">
            Keep it short — name, and what a caller should leave in their message. The recording
            is what callers hear, exactly as recorded.
          </p>
        </div>
      )}
      <input type="hidden" name="voicemailGreetingRecordingPath" value={recordingPath} />
    </div>
  );
}

function ExtensionVoicemailGreetingForm({
  extensions,
}: {
  extensions: ExtensionGreetingOption[];
}) {
  const [state, formAction, pending] = useActionState(
    saveExtensionVoicemailGreetingSettings,
    initial,
  );
  const [selectedId, setSelectedId] = useState(extensions[0]?.id ?? '');
  const selected = extensions.find((item) => item.id === selectedId) ?? extensions[0];
  if (!selected) return null;
  return (
    <form
      action={formAction}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <Voicemail className="h-5 w-5 text-orange-600" />
      <h2 className="mt-2 font-black">One person&apos;s voicemail greeting</h2>
      <p className="mt-1 text-sm text-slate-600">
        A personal greeting replaces the default for that person&apos;s mailbox only. Clear it to
        go back to the default.
      </p>
      <label className="mt-4 block text-sm font-bold">
        Person / extension
        <select
          name="extensionPicker"
          value={selected.id}
          onChange={(event) => setSelectedId(event.target.value)}
          className={field}
        >
          {extensions.map((item) => (
            <option key={item.id} value={item.id}>
              Ext. {item.extension} — {item.name}
              {item.enabled ? '' : ' (paused)'}
            </option>
          ))}
        </select>
      </label>
      <input type="hidden" name="extensionId" value={selected.id} />
      <VoicemailGreetingFields
        key={selected.id}
        scope={selected.id}
        extension={selected.extension}
        text={selected.text}
        mode={selected.mode}
        recordingPath={selected.recordingPath}
        recordingUrl={selected.recordingUrl}
      />
      <button disabled={pending} className={button}>
        {pending ? 'Saving…' : 'Save this greeting'}
      </button>
      <Result state={state} />
    </form>
  );
}

export function PhoneSetupForms({
  settings,
  destinations,
  extensionGreetings = [],
}: {
  settings: PhoneSettings;
  destinations: DestinationOption[];
  extensionGreetings?: ExtensionGreetingOption[];
}) {
  const [saved, saveAction, savePending] = useActionState(savePhoneSettings, initial);
  const [number, numberAction, numberPending] = useActionState(addExternalNumber, initial);
  const [menu, menuAction, menuPending] = useActionState(saveMenuOption, initial);
  const [autoReply, autoReplyAction, autoReplyPending] = useActionState(
    saveSmsAutoReplySettings,
    initial,
  );
  const [voicemailGreeting, voicemailGreetingAction, voicemailGreetingPending] =
    useActionState(saveVoicemailGreetingSettings, initial);

  return (
    <div className="space-y-6">
      <form action={saveAction} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-black">Call experience</h2>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <label className="text-sm font-bold">
              Routing mode
              <select name="routingMode" defaultValue={settings.routingMode} className={field}>
                <option value="menu">Automated menu</option>
                <option value="ai_receptionist">AI receptionist</option>
              </select>
            </label>
            <label className="text-sm font-bold">
              Timezone
              <select name="timezone" defaultValue={settings.timezone} className={field}>
                <option value="America/Indiana/Indianapolis">Indiana — Eastern</option>
                <option value="America/Chicago">Central</option>
                <option value="America/New_York">Eastern</option>
                <option value="America/Denver">Mountain</option>
                <option value="America/Los_Angeles">Pacific</option>
              </select>
            </label>
            <label className="text-sm font-bold">
              Maximum wait (seconds)
              <input
                name="maxQueueSeconds"
                type="number"
                min={15}
                max={600}
                defaultValue={settings.maxQueueSeconds}
                className={field}
              />
            </label>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-bold">
              Business-hours greeting
              <textarea
                name="greeting"
                required
                defaultValue={settings.greeting}
                rows={3}
                className={field}
              />
            </label>
            <label className="text-sm font-bold">
              After-hours message
              <textarea
                name="afterHours"
                required
                defaultValue={settings.afterHours}
                rows={3}
                className={field}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-black">Business hours</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {WEEKDAYS.map(([key, label]) => {
              const hours = settings.businessHours[key];
              return (
                <div key={key} className="rounded-xl border border-slate-200 p-3">
                  <Toggle name={`${key}_enabled`} label={label} defaultChecked={Boolean(hours)} />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      aria-label={`${label} opening time`}
                      type="time"
                      name={`${key}_open`}
                      defaultValue={hours?.[0] ?? '09:00'}
                      className={field}
                    />
                    <input
                      aria-label={`${label} closing time`}
                      type="time"
                      name={`${key}_close`}
                      defaultValue={hours?.[1] ?? '17:00'}
                      className={field}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Voicemail and recording</h2>
            <div className="mt-4 space-y-3">
              <Toggle
                name="voicemailEnabled"
                label="Enable voicemail"
                defaultChecked={settings.voicemailEnabled}
              />
              <Toggle
                name="voicemailTranscriptionEnabled"
                label="Transcribe voicemail"
                defaultChecked={settings.voicemailTranscriptionEnabled}
              />
              <Toggle
                name="callRecordingEnabled"
                label="Record calls after disclosure"
                defaultChecked={settings.callRecordingEnabled}
              />
              <label className="block text-sm font-bold">
                Recording disclosure
                <textarea
                  name="recordingDisclosure"
                  rows={2}
                  defaultValue={settings.recordingDisclosure}
                  placeholder="This call may be recorded for quality and training."
                  className={field}
                />
              </label>
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-700" />
              <h2 className="text-lg font-black">AI receptionist</h2>
            </div>
            <div className="mt-4 space-y-3">
              <Toggle
                name="aiEnabled"
                label="Enable AI receptionist"
                defaultChecked={settings.aiEnabled}
              />
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-bold">
                  Assistant name
                  <input name="aiName" defaultValue={settings.aiName} className={field} />
                </label>
                <label className="text-sm font-bold">
                  Language
                  <select name="aiLanguage" defaultValue={settings.aiLanguage} className={field}>
                    <option value="en-US">English</option>
                    <option value="es-US">Spanish</option>
                    <option value="bilingual">English and Spanish</option>
                  </select>
                </label>
              </div>
              <input type="hidden" name="aiVoice" value={settings.aiVoice} />
              <label className="block text-sm font-bold">
                Operating instructions
                <textarea
                  name="aiInstructions"
                  rows={4}
                  defaultValue={settings.aiInstructions}
                  className={field}
                />
              </label>
              <div className="flex flex-wrap gap-4">
                <Toggle
                  name="aiAllowInterruptions"
                  label="Allow callers to interrupt"
                  defaultChecked={settings.aiAllowInterruptions}
                />
                <Toggle
                  name="aiHumanHandoffEnabled"
                  label="Transfer to a person"
                  defaultChecked={settings.aiHumanHandoffEnabled}
                />
              </div>
            </div>
          </div>
        </section>
        <button disabled={savePending} className={button}>
          {savePending ? 'Saving preferences…' : 'Save phone preferences'}
        </button>
        <p className="text-sm text-amber-900">
          These preferences are saved to the database. Live PBX application and verification are
          separate.
        </p>
        <Result state={saved} />
      </form>

      <section className="grid gap-5 xl:grid-cols-2">
        <form
          action={numberAction}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <PhoneForwarded className="h-5 w-5 text-orange-600" />
          <h2 className="mt-2 font-black">Existing forwarding number</h2>
          <p className="mt-1 text-sm text-slate-600">
            Record a number owned elsewhere. This does not port or change it.
          </p>
          <label className="mt-4 block text-sm font-bold">
            Label
            <input
              name="label"
              required
              placeholder="Name this external number"
              className={field}
            />
          </label>
          <label className="mt-3 block text-sm font-bold">
            Phone number
            <input
              name="phone"
              inputMode="tel"
              required
              placeholder="Enter the external phone number"
              className={field}
            />
          </label>
          <button disabled={numberPending} className={button}>
            {numberPending ? 'Adding…' : 'Add forwarding number'}
          </button>
          <Result state={number} />
        </form>
        <form
          action={menuAction}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <ChevronDown className="h-5 w-5 text-orange-600" />
          <h2 className="mt-2 font-black">Menu route</h2>
          <p className="mt-1 text-sm text-slate-600">
            Map a keypad digit or spoken department to a PWA extension.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="mt-4 block text-sm font-bold">
              Digit
              <select name="digit" className={field}>
                {Array.from({ length: 10 }, (_, digit) => (
                  <option key={digit}>{digit}</option>
                ))}
              </select>
            </label>
            <label className="col-span-2 mt-4 block text-sm font-bold">
              Label
              <input name="label" required placeholder="Route label" className={field} />
            </label>
          </div>
          <label className="mt-3 block text-sm font-bold">
            Destination
            <select name="destinationId" required className={field}>
              <option value="">Choose PWA extension</option>
              {destinations
                .filter((item) => item.enabled)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.destination ? ` — ${item.destination}` : ''}
                  </option>
                ))}
            </select>
          </label>
          <label className="mt-3 block text-sm font-bold">
            Spoken keywords
            <input
              name="keywords"
              placeholder="Comma-separated spoken keywords"
              className={field}
            />
          </label>
          <button disabled={menuPending || destinations.length === 0} className={button}>
            {menuPending ? 'Saving…' : 'Save menu route'}
          </button>
          <Result state={menu} />
        </form>
        <form
          action={autoReplyAction}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <MessageSquareText className="h-5 w-5 text-orange-600" />
          <h2 className="mt-2 font-black">Text message auto-reply</h2>
          <p className="mt-1 text-sm text-slate-600">
            When someone texts your business number, this reply is sent back right away — at most
            once per person per day, and never in response to another auto-reply.
          </p>
          <div className="mt-4 space-y-3">
            <Toggle
              name="smsAutoReplyEnabled"
              label="Auto-reply to incoming texts"
              defaultChecked={settings.smsAutoReplyEnabled}
            />
            <label className="block text-sm font-bold">
              Auto-reply message
              <textarea
                name="smsAutoReplyMessage"
                rows={3}
                maxLength={480}
                defaultValue={settings.smsAutoReplyMessage}
                className={field}
              />
            </label>
          </div>
          <button disabled={autoReplyPending} className={button}>
            {autoReplyPending ? 'Saving…' : 'Save auto-reply'}
          </button>
          <Result state={autoReply} />
        </form>
      </section>
      <section className="grid gap-5 xl:grid-cols-2">
        <form
          action={voicemailGreetingAction}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <Voicemail className="h-5 w-5 text-orange-600" />
          <h2 className="mt-2 font-black">Voicemail greeting</h2>
          <p className="mt-1 text-sm text-slate-600">
            What a caller hears when a call goes to voicemail — including pressing 0 for Admin.
            Type it and the phone system reads it aloud, or record it in your own voice.
          </p>
          <VoicemailGreetingFields
            scope="system"
            extension="0"
            text={settings.voicemailGreetingText}
            mode={settings.voicemailGreetingMode}
            recordingPath={settings.voicemailGreetingRecordingPath}
            recordingUrl={settings.voicemailGreetingRecordingUrl}
          />
          <button disabled={voicemailGreetingPending} className={button}>
            {voicemailGreetingPending ? 'Saving…' : 'Save voicemail greeting'}
          </button>
          <Result state={voicemailGreeting} />
        </form>
        <ExtensionVoicemailGreetingForm extensions={extensionGreetings} />
      </section>
    </div>
  );
}

export function CapabilityGuide() {
  const sections = [
    [
      'Business numbers',
      'Give each organization a dedicated number while keeping external numbers forwarding-only.',
    ],
    [
      'PWA ringing',
      'Ring one person or department through the installed dashboard app without using personal cell-phone forwarding.',
    ],
    [
      'Extensions and transfers',
      'Assign staff extensions, warm transfer, cold transfer, and invite a team member into an active call.',
    ],
    [
      'Meetings and screen sharing',
      'Start browser meetings, invite guests, share a tab or screen, chat, and track attendance.',
    ],
    [
      'AI reception',
      'Answer approved questions, identify caller intent, collect information, and hand off to staff.',
    ],
    [
      'Voicemail and history',
      'Transcribe voicemail and keep calls, notes, meetings, and follow-up activity connected to the dashboard.',
    ],
  ];
  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer list-none text-lg font-black">
        Step-by-step guide and capabilities
      </summary>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {sections.map(([title, body], index) => (
          <div key={title} className="rounded-xl bg-slate-50 p-4">
            <p className="flex items-center gap-2 font-black">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {index + 1}. {title}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm font-semibold text-indigo-700">
        Ask Paris: “Walk me through setting up my phone system” or “How do I start a team meeting?”
      </p>
    </details>
  );
}
