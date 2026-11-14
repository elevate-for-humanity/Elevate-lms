'use client';

import { useEffect, useState } from 'react';
import { LifeBuoy, Loader2 } from 'lucide-react';
import Link from 'next/link';

type Ticket = {
  id: string;
  ticket_number: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-brand-green-100 text-brand-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-slate-100 text-slate-600',
  closed: 'bg-slate-100 text-slate-500',
};

export default function SupportTicketsList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/support/tickets?limit=5')
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading tickets…
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-slate-700">
        <LifeBuoy className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p>No support tickets yet</p>
        <Link href="/support/ticket" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
          Submit a ticket
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-slate-900">{ticket.subject}</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[ticket.status] ?? 'bg-slate-100 text-slate-600'}`}>
              {ticket.status}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>#{ticket.ticket_number}</span>
            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
      <Link href="/support/ticket" className="block text-center text-sm text-blue-600 hover:underline mt-2">
        Submit a new ticket →
      </Link>
    </div>
  );
}
