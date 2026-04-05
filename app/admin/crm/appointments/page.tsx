'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Calendar, Plus, Clock, User, Search, RefreshCw } from 'lucide-react';

interface Appointment {
  id: string;
  title: string;
  contact_name: string;
  scheduled_at: string;
  status: string;
  notes: string;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments ?? data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = appointments.filter((a) =>
    (a.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.contact_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white p-6">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'CRM', href: '/admin/crm' },
            { label: 'Appointments' },
          ]} />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-sm text-gray-500 mt-1">{appointments.length} scheduled appointments</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchAppointments} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link href="/admin/crm/appointments/new" className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
              <Plus className="w-4 h-4" /> New Appointment
            </Link>
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search appointments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <RefreshCw className="w-6 h-6 text-gray-300 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-gray-500">Loading appointments...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">{search ? 'No matching appointments.' : 'No appointments scheduled.'}</p>
              <Link href="/admin/crm/appointments/new" className="inline-block mt-4 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium">
                Schedule an appointment
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{a.title || 'Untitled'}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400" /> {a.contact_name || '—'}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {a.scheduled_at ? new Date(a.scheduled_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        a.status === 'completed' ? 'bg-brand-green-100 text-brand-green-700' :
                        a.status === 'cancelled' ? 'bg-brand-red-100 text-brand-red-700' :
                        'bg-brand-blue-100 text-brand-blue-700'
                      }`}>{a.status || 'scheduled'}</span>
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
