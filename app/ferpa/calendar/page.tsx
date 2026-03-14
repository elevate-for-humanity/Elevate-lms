import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ChevronRight,
  Calendar,
  Clock,
  AlertCircle,
  Plus,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Calendar | FERPA Portal',
  description: 'FERPA compliance calendar and important deadlines.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  status: string;
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  training: { label: 'Training', color: 'bg-brand-blue-100 text-brand-blue-700' },
  audit: { label: 'Audit', color: 'bg-brand-blue-100 text-brand-blue-700' },
  deadline: { label: 'Deadline', color: 'bg-brand-red-100 text-brand-red-700' },
  review: { label: 'Review', color: 'bg-brand-orange-100 text-brand-orange-700' },
  notification: { label: 'Notification', color: 'bg-brand-green-100 text-brand-green-700' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-700' },
};

export default async function FerpaCalendarPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Database connection failed.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/ferpa/calendar');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowedRoles = ['admin', 'super_admin', 'ferpa_officer', 'registrar', 'staff'];
  if (!profile || !allowedRoles.includes(profile.role)) redirect('/unauthorized');

  // Fetch upcoming events
  const { data: events } = await db
    .from('ferpa_calendar_events')
    .select('*')
    .gte('start_date', new Date().toISOString())
    .order('start_date')
    .limit(20);

  // Fetch overdue/past events that aren't completed
  const { data: overdueEvents } = await db
    .from('ferpa_calendar_events')
    .select('*')
    .lt('start_date', new Date().toISOString())
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .order('start_date', { ascending: false })
    .limit(5);

  // Standard FERPA deadlines
  const standardDeadlines = [
    {
      title: 'Annual FERPA Notice',
      description: 'Publish annual notification of student rights',
      date: 'Start of academic year',
      recurring: true,
    },
    {
      title: 'Directory Information Opt-Out Deadline',
      description: 'Deadline for students to opt out of directory information',
      date: '2 weeks after term start',
      recurring: true,
    },
    {
      title: 'Staff FERPA Training',
      description: 'Annual FERPA training for all staff with record access',
      date: 'Within 30 days of hire / annually',
      recurring: true,
    },
    {
      title: 'Records Access Response',
      description: 'Respond to student records requests',
      date: 'Within 45 days of request',
      recurring: false,
    },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/ferpa-page-1.jpg" alt="FERPA compliance" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/ferpa" className="hover:text-gray-700">FERPA Portal</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Calendar</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Compliance Calendar</h1>
              <p className="text-gray-600 mt-1">Important dates and deadlines</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overdue Items */}
        {overdueEvents && overdueEvents.length > 0 && (
          <div className="mb-8 bg-brand-red-50 border border-brand-red-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-brand-red-600" />
              <h2 className="text-lg font-semibold text-brand-red-800">Overdue Items</h2>
            </div>
            <div className="space-y-3">
              {(overdueEvents as CalendarEvent[]).map((event) => (
                <div key={event.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-brand-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <p className="text-sm text-brand-red-600">Due: {formatDate(event.start_date)}</p>
                  </div>
                  <button className="text-sm text-brand-blue-600 hover:text-brand-blue-700">Mark Complete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Events */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
              </div>
              {events && events.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {(events as CalendarEvent[]).map((event) => {
                    const typeConfig = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.other;
                    return (
                      <div key={event.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 text-center">
                              <p className="text-2xl font-bold text-gray-900">
                                {new Date(event.start_date).getDate()}
                              </p>
                              <p className="text-xs text-gray-500 uppercase">
                                {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short' })}
                              </p>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{event.title}</h3>
                              {event.description && (
                                <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig.color}`}>
                                  {typeConfig.label}
                                </span>
                                {!event.all_day && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(event.start_date)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {event.status === 'completed' && (
                            <span className="text-slate-400 flex-shrink-0">•</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-6 py-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming events</p>
                </div>
              )}
            </div>
          </div>

          {/* Standard Deadlines */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Standard Deadlines</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {standardDeadlines.map((deadline, index) => (
                  <div key={index} className="px-6 py-4">
                    <h3 className="font-medium text-gray-900">{deadline.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{deadline.description}</p>
                    <p className="text-xs text-brand-blue-600 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {deadline.date}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
