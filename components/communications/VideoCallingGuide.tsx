'use client';

import { useId, useState } from 'react';
import { CalendarDays, Video, Mic, Volume2, MonitorUp, MessageSquare, PhoneOff, Wrench, LogIn } from 'lucide-react';

const slides = [
  { title: '1. Find or schedule your meeting', icon: CalendarDays, cue: 'Calendar → Meeting → Join', steps: ['Open Calendar & Video or Team Meetings in your dashboard, or open your meeting invitation.', 'Hosts: choose the intended participants, date and time, and video meeting method where your scheduling form offers it.', 'Attendees: use the meeting assigned to your own signed-in account.'], tip: 'Check your calendar and local time zone before scheduling.' },
  { title: '2. Enter the video room', icon: LogIn, cue: 'Join room → Join meeting', steps: ['Open the meeting and select Join meeting.', 'Your camera and microphone start off.', 'Wait until Meeting connection says connected before beginning.'], tip: 'You can join and listen even if no camera is connected.' },
  { title: '3. Turn on your microphone', icon: Mic, cue: 'Microphone → Allow → Speak', steps: ['Select Microphone in the meeting toolbar.', 'Allow microphone access if your browser asks.', 'Use the device menu beside the control to choose the correct microphone. Mute when you are not speaking.'], tip: 'Use headphones to reduce echo. Close other apps that are using your microphone.' },
  { title: '4. Turn on your camera', icon: Video, cue: 'Camera → Allow → Check picture', steps: ['Select Camera in the meeting toolbar.', 'Allow camera access if your browser asks.', 'Choose your camera from the device menu and check your picture. Select Camera again to turn it off.'], tip: 'If no camera is found, connect one or continue with audio.' },
  { title: '5. Hear the other person', icon: Volume2, cue: 'Enable meeting audio → Check volume', steps: ['Select Enable meeting audio or Start Audio if the browser asks you to enable sound.', 'Check your device volume, headphones, and speaker output.', 'Ask the other person to unmute. Avoid joining the same room with two nearby speakers on.'], tip: 'Browser autoplay rules may require this extra tap before you hear meeting audio.' },
  { title: '6. Share your screen', icon: MonitorUp, cue: 'Share screen → Choose → Share', steps: ['On a supported desktop browser, select Share screen.', 'Choose the tab, window, or screen you want participants to see, then confirm Share in the browser picker.', 'Select Stop sharing when finished. Close private material before sharing.'], tip: 'Mobile browsers may not support presenting a screen. Screen sharing can also be disabled for a room or participant.' },
  { title: '7. Use meeting chat', icon: MessageSquare, cue: 'Chat → Type → Send', steps: ['Select Chat in the meeting toolbar.', 'Type your message and use the send control.', 'Use the microphone when you need to discuss the message with everyone.'], tip: 'Only use chat when it is available for your meeting.' },
  { title: '8. Leave when finished', icon: PhoneOff, cue: 'Stop sharing → Leave', steps: ['Stop screen sharing before you finish.', 'Select Leave in the meeting toolbar.', 'Return to your dashboard. To rejoin an available room, open it and select Join meeting again.'], tip: 'Leaving disconnects your own session; it does not cancel the appointment for everyone.' },
  { title: '9. Fix a connection problem', icon: Wrench, cue: 'Check → Retry → Get help', steps: ['If the room reports an error, check your internet connection and select Retry meeting connection.', 'For device errors, check browser site permissions and choose an available camera or microphone.', 'If you cannot enter the room, confirm you are signed in with the invited account. Contact Elevate support if the problem continues.'], tip: 'A room that loads is not proof audio works. Before training, ask the other person to confirm they can hear and see you.' },
] as const;

export function VideoCallingGuide({ compact = false }: { compact?: boolean }) {
  const [index, setIndex] = useState(0);
  const id = useId();
  const slide = slides[index];
  const Icon = slide.icon;
  const content = <section aria-label="Video calling slideshow" aria-roledescription="carousel" className="overflow-hidden rounded-2xl border border-indigo-200 bg-white text-slate-950 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-950 px-5 py-4 text-white"><h2 className="text-lg font-black">How to use video calling</h2><p className="text-sm" role="status" aria-live="polite">Step {index + 1} of {slides.length}</p></div>
    <div id={id} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}: ${slide.title}`} className="grid gap-5 p-5 sm:grid-cols-[180px_1fr] sm:p-6">
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-indigo-50 p-5 text-center text-indigo-950"><Icon aria-hidden="true" className="h-14 w-14"/><p className="text-sm font-black">{slide.cue}</p><span className="text-xs">Illustrated steps · use the actual room controls below</span></div>
      <div><h3 className="text-xl font-black">{slide.title}</h3><ol className="mt-4 list-decimal space-y-3 pl-5 text-base leading-7">{slide.steps.map(step => <li key={step}>{step}</li>)}</ol><p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6">{slide.tip}</p></div>
    </div>
    <nav aria-label="Slideshow steps" className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><button type="button" aria-controls={id} disabled={index === 0} onClick={() => setIndex(value => value - 1)} className="min-h-11 rounded-lg border px-4 font-bold disabled:opacity-40">Previous</button><button type="button" onClick={() => setIndex(0)} className="min-h-11 rounded-lg px-4 text-sm font-bold underline">Start over</button><button type="button" aria-controls={id} disabled={index === slides.length - 1} onClick={() => setIndex(value => value + 1)} className="min-h-11 rounded-lg bg-indigo-700 px-5 font-bold text-white disabled:opacity-40">Next</button></nav>
  </section>;
  return compact ? <details className="mb-4 rounded-xl border bg-white p-4 text-slate-950"><summary className="cursor-pointer font-bold">Video calling directions · step-by-step slideshow</summary><div className="mt-4">{content}</div></details> : content;
}
