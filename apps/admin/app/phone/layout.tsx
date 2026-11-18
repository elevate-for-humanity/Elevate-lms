import Link from 'next/link';
import type { ReactNode } from 'react';

const tools = [
  { label: 'Phone & connection', href: '/phone/dial-pad' },
  { label: 'Ringer', href: '/phone/dial-pad#incoming-call-alert-mode' },
  { label: 'Phone settings', href: '/phone/dial-pad#phone-settings' },
  { label: 'Voicemail', href: '/phone/dial-pad#phone-voicemail' },
  { label: 'Texts', href: '/phone/texts' },
  { label: 'Dashboard', href: '/dashboard' },
];

export default function PhoneLayout({ children }: { children: ReactNode }) {
  return (
    <>
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
