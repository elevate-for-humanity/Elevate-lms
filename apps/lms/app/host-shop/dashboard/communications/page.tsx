import Link from 'next/link';
import { Mail, MessageSquareText, Phone, Video } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function HostShopCommunicationsPage() {
  const tools = [
    { href: '/host-shop/email', title: 'Host Shop email', detail: 'Read, reply, compose, and manage official shop email.', icon: Mail },
    { href: '/host-shop/dashboard/apprentices', title: 'Apprentice messages', detail: 'Open assigned apprentices and use their communication actions without leaving the Host Shop scope.', icon: MessageSquareText },
    { href: '/host-shop/dashboard/phone', title: 'Elevate phone', detail: 'Open the assigned Host Shop extension, answer calls in the PWA, and review PARIS callback intake.', icon: Phone },
    { href: '/host-shop/dashboard/schedule', title: 'Training schedule', detail: 'Open the Host Shop schedule for supervised training sessions and apprentice follow-up.', icon: Video },
  ];
  return (
    <main className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Host Shop communications</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Calls, email, messages & meetings</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-700">These communication tools remain inside the Host Shop operating workflow. Access to a phone extension or meeting service is resolved from the signed-in account rather than hardcoded per shop.</p>
      </div>
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
        <h2 className="font-black">Your Host Shop communication center</h2>
        <p className="mt-2 text-sm font-semibold leading-6">Every active Host Shop receives an Elevate email mailbox and phone extension. Use the Elevate mailbox for apprenticeship and inter-office communication instead of sending routine program messages directly to an administrator. Install the Host Shop PWA so calls can ring on your device. Keep your phone available during the business hours you choose; use the phone settings to set a weekly schedule or switch Ring, Vibrate, Silent, Do Not Disturb, or Offline when needed. Missed calls and PARIS callback intake remain in your communications inbox.</p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map(({ href,title,detail,icon:Icon }) => <Link key={title} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300"><Icon className="h-6 w-6 text-blue-700"/><h2 className="mt-3 font-black text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p></Link>)}
      </div>
    </main>
  );
}
