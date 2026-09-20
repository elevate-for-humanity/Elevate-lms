'use client';

import { useActionState } from 'react';
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  PhoneForwarded,
  Route,
  Sparkles,
  Users,
} from 'lucide-react';
import { WEEKDAYS, type BusinessHours } from '@/lib/phone/config';
import {
  addDestination,
  addExternalNumber,
  saveMenuOption,
  savePhoneSettings,
  type PhoneActionState,
} from './actions';

const initial: PhoneActionState = { ok: false, message: '' };
const field =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950';
const button =
  'mt-4 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50';

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
    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-slate-300"
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
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
              Give your organization a business number, ring staff cell phones, assign extensions,
              route callers, hold browser video meetings, share your screen, and keep communications
              connected to the dashboard.
            </p>
          </div>
        </div>
        <form action={dismissAction}>
          <button className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-800">
            Dismiss
          </button>
        </form>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm font-semibold text-slate-800"
          >
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-xs font-black ${
                item.complete
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-900'
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

export function PhoneSetupForms({
  settings,
  destinations,
}: {
  settings: PhoneSettings;
  destinations: DestinationOption[];
}) {
  const [saved, saveAction, savePending] = useActionState(savePhoneSettings, initial);
  const [number, numberAction, numberPending] = useActionState(addExternalNumber, initial);
  const [destination, destinationAction, destinationPending] = useActionState(
    addDestination,
    initial,
  );
  const [menu, menuAction, menuPending] = useActionState(saveMenuOption, initial);

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
                <option value="direct_forward">Direct forwarding</option>
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
          {savePending ? 'Saving configuration…' : 'Save phone configuration'}
        </button>
        <Result state={saved} />
      </form>

      <section className="grid gap-5 xl:grid-cols-3">
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
            <input name="label" required placeholder="Name this external number" className={field} />
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
          action={destinationAction}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <Users className="h-5 w-5 text-orange-600" />
          <h2 className="mt-2 font-black">Team cell phone</h2>
          <p className="mt-1 text-sm text-slate-600">
            Add a cell phone that can ring for business calls.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="mt-4 block text-sm font-bold">
              Team member
              <input name="name" required placeholder="Elizabeth" className={field} />
            </label>
            <label className="mt-4 block text-sm font-bold">
              Department
              <input name="department" placeholder="Department name" className={field} />
            </label>
          </div>
          <label className="mt-3 block text-sm font-bold">
            Cell phone
            <input
              name="destination"
              inputMode="tel"
              required
              placeholder="Enter the team member’s cell phone"
              className={field}
            />
          </label>
          <label className="mt-3 block text-sm font-bold">
            Ring seconds
            <input
              name="ringSeconds"
              type="number"
              min={5}
              max={120}
              defaultValue={25}
              className={field}
            />
          </label>
          <div className="mt-3">
            <Toggle
              name="fallbackToVoicemail"
              label="Send unanswered calls to voicemail"
              defaultChecked
            />
          </div>
          <button disabled={destinationPending} className={button}>
            {destinationPending ? 'Adding…' : 'Add team phone'}
          </button>
          <Result state={destination} />
        </form>
        <form
          action={menuAction}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <ChevronDown className="h-5 w-5 text-orange-600" />
          <h2 className="mt-2 font-black">Menu route</h2>
          <p className="mt-1 text-sm text-slate-600">
            Map a keypad digit or spoken department to a team phone.
          </p>
          <div className="grid grid-cols-3 gap-3">
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
              <option value="">Choose team phone</option>
              {destinations
                .filter((item) => item.enabled)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="mt-3 block text-sm font-bold">
            Spoken keywords
            <input name="keywords" placeholder="Comma-separated spoken keywords" className={field} />
          </label>
          <button disabled={menuPending || destinations.length === 0} className={button}>
            {menuPending ? 'Saving…' : 'Save menu route'}
          </button>
          <Result state={menu} />
        </form>
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
      'Cell-phone ringing',
      'Ring one person, a department, or several team members without publishing personal cell numbers.',
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
