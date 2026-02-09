import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User, Video, MapPin, Save } from 'lucide-react';

export const metadata: Metadata = {
  title: 'New Appointment | CRM Admin',
  description: 'Schedule a new appointment.',
  robots: { index: false, follow: false },
};

export default function NewAppointmentPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "New" }]} />
      </div>
<div className="max-w-2xl mx-auto">
        <Link href="/admin/crm/appointments" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Appointments
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>
            <p className="text-gray-600">Schedule a meeting or consultation</p>
          </div>
        </div>

        <form className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Enrollment Consultation"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="time"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>45 minutes</option>
                    <option>1 hour</option>
                    <option>1.5 hours</option>
                    <option>2 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Video Call</option>
                    <option>Phone Call</option>
                    <option>In Person</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location / Meeting Link</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter location or paste meeting link"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add any notes or agenda items..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="reminder" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                <label htmlFor="reminder" className="text-sm text-gray-700">
                  Send reminder email to contact
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/admin/crm/appointments"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Schedule Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
