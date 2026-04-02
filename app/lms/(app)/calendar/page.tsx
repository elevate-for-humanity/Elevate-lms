import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CalendarWidget } from '@/components/CalendarWidget';
import { CalendarIntegration } from '@/components/CalendarIntegration';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Video, 
  BookOpen,
  Users,
  Bell,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Calendar | Student Portal',
  description: 'View your class schedule, assignments, exams, and important dates.',
};

export const dynamic = 'force-dynamic';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let events: any[] = [];
  let upcomingAssignments: any[] = [];
  let enrolledCourses: any[] = [];

  try {
    const { data: enrollments } = await supabase
      .from('program_enrollments')
      .select('*, courses (id, title, description, start_date, end_date)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (enrollments) {
      enrolledCourses = enrollments.map(e => e.courses).filter(Boolean);
    }

    const { data: calendarEvents } = await supabase
      .from('calendar_events')
      .select('*')
      .or(`user_id.eq.${user.id},is_public.eq.true`)
      .gte('start_time', new Date(currentYear, currentMonth, 1).toISOString())
      .lte('start_time', new Date(currentYear, currentMonth + 1, 0).toISOString())
      .order('start_time');

    if (calendarEvents) {
      events = calendarEvents;
    }

    const { data: assignments } = await supabase
      .from('assignments')
      .select('*, courses (title)')
      .in('course_id', enrolledCourses.map(c => c.id))
      .gte('due_date', now.toISOString())
      .order('due_date')
      .limit(5);

    if (assignments) {
      upcomingAssignments = assignments;
    }
  } catch (error) {
    // Tables may not exist
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarDays: (number | null)[] = [];
  
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentMonth && 
             eventDate.getFullYear() === currentYear;
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Calendar" }]} />
      </div>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Calendar</h1>
            <p className="text-slate-600 mt-1">Track your classes, assignments, and important dates</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-white transition">
              <Bell className="w-4 h-4" />
              Reminders
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition">
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <button className="p-2 hover:bg-white rounded-lg transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-slate-900">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <button className="p-2 hover:bg-white rounded-lg transition">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 border-b border-slate-200">
                {dayNames.map(day => (
                  <div key={day} className="p-3 text-center text-sm font-semibold text-slate-600 bg-white">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dayEvents = day ? getEventsForDay(day) : [];
                  const isToday = day === currentDay;
                  
                  return (
                    <div 
                      key={index} 
                      className={`min-h-[100px] p-2 border-b border-r border-slate-100 ${
                        day ? 'hover:bg-white cursor-pointer' : 'bg-white'
                      }`}
                    >
                      {day && (
                        <>
                          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
                            isToday ? 'bg-brand-blue-600 text-white' : 'text-slate-700'
                          }`}>
                            {day}
                          </div>
                          <div className="mt-1 space-y-1">
                            {dayEvents.slice(0, 2).map((event, i) => (
                              <div 
                                key={i}
                                className={`text-xs px-2 py-1 rounded truncate ${
                                  event.event_type === 'class' ? 'bg-brand-blue-100 text-brand-blue-700' :
                                  event.event_type === 'assignment' ? 'bg-brand-orange-100 text-brand-orange-700' :
                                  event.event_type === 'exam' ? 'bg-brand-red-100 text-brand-red-700' :
                                  'bg-brand-green-100 text-brand-green-700'
                                }`}
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-slate-500 px-2">+{dayEvents.length - 2} more</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-brand-blue-500"></div>
                <span className="text-slate-600">Classes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-brand-orange-500"></div>
                <span className="text-slate-600">Assignments</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-brand-red-500"></div>
                <span className="text-slate-600">Exams</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-brand-green-500"></div>
                <span className="text-slate-600">Events</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-brand-blue-600" />
                Today&apos;s Schedule
              </h3>
              
              {events.filter(e => new Date(e.start_time).toDateString() === now.toDateString()).length > 0 ? (
                <div className="space-y-3">
                  {events.filter(e => new Date(e.start_time).toDateString() === now.toDateString()).map((event, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                      <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {event.event_type === 'class' ? <BookOpen className="w-5 h-5 text-brand-blue-600" /> :
                         event.is_virtual ? <Video className="w-5 h-5 text-brand-blue-600" /> :
                         <MapPin className="w-5 h-5 text-brand-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{event.title}</div>
                        <div className="text-sm text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.start_time)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No events scheduled for today</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-orange-600" />
                Upcoming Assignments
              </h3>
              
              {upcomingAssignments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAssignments.map((assignment, i) => (
                    <Link key={i} href={`/lms/assignments/${assignment.id}`} className="block p-3 bg-white rounded-lg hover:bg-white transition">
                      <div className="font-medium text-slate-900 truncate">{assignment.title}</div>
                      <div className="text-sm text-slate-600">{assignment.courses?.title}</div>
                      <div className="text-sm text-brand-orange-600 font-medium mt-1">Due: {formatDate(assignment.due_date)}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No upcoming assignments</p>
                </div>
              )}
            </div>

            <div className="bg-brand-blue-600 rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/lms/assignments" className="block w-full text-center bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                  View All Assignments
                </Link>
                <Link href="/lms/grades" className="block w-full text-center bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                  Check Grades
                </Link>
                <Link href="/lms/support" className="block w-full text-center bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                  Get Help
                </Link>
              </div>
            </div>
          </div>

          {/* Calendar Widget */}
          <div className="mt-8">
            <CalendarWidget userId={user.id} />
          </div>

          {/* Calendar Integration */}
          <div className="mt-8">
            <CalendarIntegration />
          </div>
        </div>
      </div>
    </div>
  );
}
