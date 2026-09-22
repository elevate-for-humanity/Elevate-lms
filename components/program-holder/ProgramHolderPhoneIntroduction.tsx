'use client';

import { useEffect, useState } from 'react';
import {
  BellRing,
  Bot,
  CheckCircle2,
  Download,
  HelpCircle,
  PhoneCall,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';

const STORAGE_KEY = 'program-holder-phone-introduction-v1';

const guide = [
  {
    title: 'Your extension and business identity',
    body: 'Your assigned three-digit extension belongs to your Program Holder account. Incoming calls ring inside the Elevate PWA, and returned calls show the Elevate business number. Your personal cell number is not shown to callers and employee extensions never forward to a personal phone.',
  },
  {
    title: 'Ring, Vibrate, Silent, Do Not Disturb, and Off',
    body: 'Ring plays an audible alert, Vibrate uses device vibration when supported, and Silent shows the call screen without sound. Do Not Disturb and Phone Off skip live ringing and send the caller to PARIS. Save after changing modes. Your selected weekly hours can also decide when live calls are offered.',
  },
  {
    title: 'Answering live calls',
    body: 'Open the Phone tab and select Connect phone. When a call appears, use Answer or Decline. During a connected call you can mute and unmute the microphone or hang up. Keep the installed PWA open or recently active for the most reliable live ringing; mobile operating systems can suspend background browser audio.',
  },
  {
    title: 'What PARIS does when you are unavailable',
    body: 'PARIS tells the caller that you are unavailable, discloses recording and transcription, asks for a name, callback number, reason, program or department, urgency, and preferred callback time, and confirms the number. PARIS may answer approved general Elevate questions. It does not invent eligibility, pricing, dates, approvals, or application status and does not request highly sensitive information.',
  },
  {
    title: 'Your secure call inbox',
    body: 'Every PARIS interview or voicemail appears under Calls to return. The dashboard can include a summary, transcript, recording, urgency, and preferred callback time. Update each item from New to Acknowledged, Contacted, or Resolved so follow-up is visible and organized.',
  },
  {
    title: 'Missed-call alerts',
    body: 'Enable missed-call alerts so the PWA can notify you after PARIS finishes an interview. A brief email can also direct you to the secure inbox. Private caller details and recording links are not placed in email; sign in to review them.',
  },
  {
    title: 'Returning a call',
    body: 'Select Return call from an inbox item or enter a valid ten-digit number in the dial box. You must connect the phone first. The call is placed through Elevate Phone with the business caller ID rather than your personal service.',
  },
  {
    title: 'Immediate administrator assistance',
    body: 'Callers can press 0 or dial extension 100 for the administrator. The administrator PWA rings first. Only that administrator extension may fall back to 317-760-7908; all other extensions remain PWA-only. If the administrator is unavailable, PARIS securely collects the request.',
  },
  {
    title: 'Privacy and emergencies',
    body: 'Use the secure dashboard for transcripts and recordings. Do not copy protected caller information into personal messages. PARIS tells callers to hang up and call 911 for emergencies; Elevate Phone is not an emergency service.',
  },
];

export function ProgramHolderPhoneIntroduction() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    setShowWelcome(window.localStorage.getItem(STORAGE_KEY) !== 'complete');
  }, []);

  function completeIntroduction() {
    window.localStorage.setItem(STORAGE_KEY, 'complete');
    setShowWelcome(false);
  }

  return (
    <>
      {showWelcome && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-phone-title"
        >
          <section className="relative my-6 w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={completeIntroduction}
              aria-label="Close introduction"
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-orange-800">
              New system
            </span>
            <h2 id="new-phone-title" className="mt-4 text-3xl font-black text-slate-950">
              Your Elevate dashboard now includes your work phone
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Install the Program Holder PWA, connect your extension, choose how and when it rings,
              and manage every missed call from one secure dashboard. Calls do not forward to your
              personal cell.
            </p>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                'Install the PWA on this device.',
                'Open Phone and choose your ring mode.',
                'Set weekly hours or stay in manual mode.',
                'Select Connect phone and allow microphone access.',
                'Enable missed-call notifications.',
                'Use the PARIS inbox to return and resolve calls.',
              ].map((item, index) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-800"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white">
                    {index + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="font-black text-blue-950">Install on your phone</p>
              <p className="mt-1 text-sm leading-6 text-blue-900">
                On iPhone, open this page in Safari, tap Share, then Add to Home Screen. On Android
                or desktop Chrome/Edge, use the install button.
              </p>
              <PwaInstallButton
                label="Install Program Holder PWA"
                installedLabel="Program Holder PWA installed"
                className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-black text-white"
              />
            </div>
            <button
              onClick={completeIntroduction}
              className="mt-6 min-h-12 w-full rounded-xl bg-slate-950 px-5 font-black text-white"
            >
              I understand — open my phone dashboard
            </button>
          </section>
        </div>
      )}

      <section className="rounded-3xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-100 p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-orange-600 p-3 text-white">
              <Smartphone className="h-7 w-7" />
            </div>
            <div>
              <span className="rounded-full bg-orange-600 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
                New
              </span>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Install the Program Holder PWA for live calls
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                The installed app gives you the quickest access to incoming calls, your PARIS inbox,
                students, meetings, documents, and other Program Holder tools.
              </p>
              <p className="mt-2 text-xs font-bold text-slate-600">
                iPhone/iPad: Safari → Share → Add to Home Screen. Android/Chrome/Edge: select
                Install below or use the browser menu → Install app.
              </p>
            </div>
          </div>
          <PwaInstallButton
            label="Download / Install PWA"
            installedLabel="PWA installed"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-700 px-6 py-3 font-black text-white"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-violet-200 bg-violet-50 p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <Bot className="mt-1 h-7 w-7 shrink-0 text-violet-700" />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-violet-700">
              Complete phone dashboard guide
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              What the new system does and how to use it
            </h2>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {guide.map((item, index) => (
            <details
              key={item.title}
              open={index < 2}
              className="rounded-2xl border border-violet-200 bg-white p-4"
            >
              <summary className="cursor-pointer list-none font-black text-slate-950">
                <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-sm text-violet-800">
                  {index + 1}
                </span>
                {item.title}
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-700">{item.body}</p>
            </details>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <PhoneCall className="h-6 w-6 text-blue-700" />
            <p className="mt-2 font-black">Before taking calls</p>
            <p className="mt-1 text-sm text-slate-600">
              Install the PWA, allow microphone access, save a live mode, and confirm the green
              Online for calls status.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <BellRing className="h-6 w-6 text-orange-700" />
            <p className="mt-2 font-black">If a call does not ring</p>
            <p className="mt-1 text-sm text-slate-600">
              Check Phone mode, weekly hours, internet access, microphone permission, notifications,
              and whether the PWA says Online.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <ShieldCheck className="h-6 w-6 text-emerald-700" />
            <p className="mt-2 font-black">Automatic safety net</p>
            <p className="mt-1 text-sm text-slate-600">
              Offline, outside-hours, declined, and unanswered calls automatically go to PARIS so
              the caller is not left without a response.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowWelcome(true)}
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-400 bg-white px-4 font-black text-violet-900"
        >
          <HelpCircle className="h-5 w-5" />
          Replay the new-phone introduction
        </button>
      </section>
    </>
  );
}
