import { requireAdmin } from '@/lib/auth';
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Inbox, 
  Clock, 
  
  AlertCircle, 
  Filter,
  Search,
  MessageSquare,
  User,
  Calendar
} from 'lucide-react';

interface Ticket {
  id: string;
  ticket_number: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  support_messages?: { id: string }[];
}

const statusColors: Record<string, string> = {
  open: 'bg-brand-blue-100 text-brand-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  waiting: 'bg-brand-blue-100 text-brand-blue-700',
  resolved: 'bg-brand-green-100 text-brand-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-brand-blue-100 text-brand-blue-600',
  high: 'bg-brand-orange-100 text-brand-orange-600',
  urgent: 'bg-brand-red-100 text-brand-red-600',
};



export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', category: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.category) params.set('category', filter.category);
      
      const response = await fetch(`/api/support/tickets?${params}`);
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
  };

  const filteredTickets = tickets.filter(ticket => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        ticket.subject.toLowerCase().includes(searchLower) ||
        ticket.name.toLowerCase().includes(searchLower) ||
        ticket.email.toLowerCase().includes(searchLower) ||
        ticket.ticket_number.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white p-6">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Support" }]} />
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">Support Dashboard</h1>
          <p className="text-gray-600">Manage customer support tickets</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Inbox className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{stats.open}</p>
                <p className="text-sm text-gray-600">Open</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{stats.inProgress}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{stats.resolved}</p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-brand-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-black">{stats.urgent}</p>
                <p className="text-sm text-gray-600">Urgent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 text-black"
              />
            </div>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 text-black"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting">Waiting</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 text-black"
            >
              <option value="">All Categories</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="enrollment">Enrollment</option>
              <option value="program">Program</option>
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-brand-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No tickets found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Ticket</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/support/${ticket.id}`}
                        className="font-mono text-sm text-brand-blue-600 hover:underline"
                      >
                        {ticket.ticket_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/support/${ticket.id}`}
                        className="font-medium text-black hover:text-brand-blue-600 line-clamp-1"
                      >
                        {ticket.subject}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 capitalize">{ticket.category}</span>
                        {ticket.support_messages && ticket.support_messages.length > 1 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MessageSquare className="w-3 h-3" />
                            {ticket.support_messages.length}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black">{ticket.name}</p>
                          <p className="text-xs text-gray-500">{ticket.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-2 text-xs font-medium rounded-full capitalize ${statusColors[ticket.status]}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-2 text-xs font-medium rounded-full capitalize ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
