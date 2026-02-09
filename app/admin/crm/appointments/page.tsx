import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Calendar, Clock, User, MapPin, Video, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Appointments | CRM Admin',
  description: 'Manage CRM appointments and meetings.',
  robots: { index: false, follow: false },
};

const appointments = [
  { id: 1, title: 'Enrollment Consultation', contact: 'Marcus Johnson', time: '9:00 AM', duration: '30 min', type: 'video', status: 'confirmed' },
  { id: 2, title: 'WOTC Review Meeting', contact: 'ABC Healthcare', time: '11:00 AM', duration: '1 hour', type: 'in-person', status: 'confirmed' },
  { id: 3, title: 'Training Progress Check', contact: 'Sarah Williams', time: '2:00 PM', duration: '30 min', type: 'phone', status: 'pending' },
  { id: 4, title: 'Partnership Discussion', contact: 'Tech Solutions', time: '4:00 PM', duration: '1 hour', type: 'video', status: 'confirmed' },
];

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CRMAppointmentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Appointments" }]} />
      </div>
<div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600">Manage your meetings and consultations</p>
          </div>
          <Link
            href="/admin/crm/appointments/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">January 2025</h2>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
                    Today
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 2;
                  const isCurrentMonth = day > 0 && day <= 31;
                  const isToday = day === 18;
                  const hasAppointment = [15, 18, 22, 25].includes(day);
                  
                  return (
                    <div
                      key={i}
                      className={`aspect-square p-2 rounded-lg ${
                        isToday ? 'bg-blue-600 text-white' :
                        isCurrentMonth ? 'hover:bg-gray-100 cursor-pointer' : 'text-gray-300'
                      }`}
                    >
                      <span className="text-sm">{isCurrentMonth ? day : ''}</span>
                      {hasAppointment && isCurrentMonth && !isToday && (
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mx-auto mt-1" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Today - January 18</h3>
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="p-4 border rounded-xl hover:border-purple-300 transition">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{apt.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {apt.contact}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {apt.time} ({apt.duration})
                      </div>
                      <div className="flex items-center gap-2">
                        {apt.type === 'video' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                        {apt.type === 'video' ? 'Video Call' : apt.type === 'in-person' ? 'In Person' : 'Phone Call'}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
                        {apt.type === 'video' ? 'Join Call' : 'View Details'}
                      </button>
                      <button className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition text-sm">
                        Reschedule
                      </button>
                    </div>
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
