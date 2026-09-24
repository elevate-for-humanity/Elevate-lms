import Link from 'next/link';
import { Mail, MessageSquareText, Phone, Video } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function HostShopCommunicationsPage() {
  const tools = [
    { href: '/host-shop/email', title: 'Host Shop email', detail: 'Read, reply, compose, and manage official shop email.', icon: Mail },
    { href: '/host-shop/dashboard/apprentices', title: 'Apprentice messages', detail: 'Open assigned apprentices and use their communication actions without leaving the Host Shop scope.', icon: MessageSquareText },
    { href: '/program-holder/phone', title: 'Elevate phone', detail: 'Open the assigned Elevate extension and review routed calls and PARIS callback intake when a phone extension is assigned to this account.', icon: Phone },
    { href: '/program-holder/meetings', title: 'Meetings & screen share', detail: 'Use the shared communications service for browser meetings, camera, microphone, chat, and screen sharing.', icon: Video },
  ];
  return (
    <main className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Host Shop communications</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Calls, email, messages & meetings</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-700">These communication tools remain inside the Host Shop operating workflow. Access to a phone extension or meeting service is resolved from the signed-in account rather than hardcoded per shop.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map(({ href,title,detail,icon:Icon }) => <Link key={title} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300"><Icon className="h-6 w-6 text-blue-700"/><h2 className="mt-3 font-black text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{detail}</p></Link>)}
      </div>
    </main>
  );
}
