import Link from 'next/link';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PhonePwaRegistration } from '@/components/pwa/PhonePwaRegistration';
import { PushRegistration } from '@/components/notifications/PushRegistration';

// The /phone subtree is the Elevate Phone app: its own manifest, its own
// service worker (scope /phone/), and its own install identity, separate
// from the Admin PWA. Opening the installed app lands on the dial pad with
// calls, voicemail, texts and video one tap away.
export const metadata: Metadata = {
  manifest: '/manifest-phone.json',
  appleWebApp: { capable: true, title: 'Elevate Phone', statusBarStyle: 'default' },
};

const tools = [
  { label: 'Dial pad', href: '/phone/dial-pad' },
  { label: 'Calls', href: '/phone/inbox' },
  { label: 'Voicemail', href: '/phone/dial-pad#phone-voicemail' },
  { label: 'Texts', href: '/phone/texts' },
  { label: 'Video', href: '/phone/meetings' },
  { label: 'Ringer', href: '/phone/dial-pad#incoming-call-alert-mode' },
  { label: 'Settings', href: '/phone/dial-pad#phone-settings' },
  { label: 'Admin dashboard', href: '/dashboard' },
];

export default async function PhoneLayout({ children }: { children: ReactNode }) {
  if ((await headers()).get('x-elevate-staff-inbox') === '1') return children;
  return (
    <>
      <PhonePwaRegistration />
      <PushRegistration />
      <nav aria-label="Phone app navigation" className="flex flex-wrap gap-2 border-b border-slate-200 bg-white p-4">
        {tools.map(({ label, href }) => (
          <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-3 py-2 font-bold text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </>
  );
}
