'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Video, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';

interface Advisor {
  id: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  advisor: { full_name: string } | null;
}

interface Props {
  userId: string;
  userProfile: any;
  advisors: Advisor[];
  existingAppointments: Appointment[];
}

const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

export default function ScheduleForm({ userId, userProfile, advisors, existingAppointments }: Props) {
  const router = useRouter();
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [meetingType, setMeetingType] = useState('video');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async () => {
    if (!selectedAdvisor || !selectedDate || !selectedTime) {
      setMessage({ type: 'error', text: 'Please select an advisor, date, and time' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('appointments')
        .insert({
          student_id: userId,
          advisor_id: selectedAdvisor,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          meeting_type: meetingType,
          notes: notes,
          status: 'scheduled',
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Appointment scheduled successfully!' });
      router.refresh();
      
      // Reset form
      setSelectedAdvisor('');
      setSelectedDate('');
      setSelectedTime('');
      setNotes('');
    } catch (err: any) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Existing Appointments */}
      {existingAppointments.length > 0 && (
        <div className="bg-brand-blue-50 rounded-xl p-4 border border-brand-blue-200">
          <h3 className="font-medium text-brand-blue-900 mb-3">Your Upcoming Appointments</h3>
          <div className="space-y-2">
            {existingAppointments.map(apt => (
              <div key={apt.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                <div>
                  <p className="font-medium">{apt.advisor?.full_name || 'Advisor'}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  apt.status === 'scheduled' ? 'bg-brand-green-100 text-brand-green-700' :
                  apt.status === 'completed' ? 'bg-brand-blue-100 text-brand-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-brand-green-50 text-brand-green-700 border border-brand-green-200' : 'bg-brand-red-50 text-brand-red-700 border border-brand-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Step 1: Select Advisor */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">1. Select an Advisor</h2>
        {advisors.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {advisors.map(advisor => (
              <button key={advisor.id} onClick={() => setSelectedAdvisor(advisor.id)}
                className={`p-4 rounded-lg border text-left transition ${
                  selectedAdvisor === advisor.id ? 'border-brand-orange-500 bg-brand-orange-50' : 'hover:border-gray-300'
                }`}>
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                  {advisor.avatar_url ? (
                    <Image src={advisor.avatar_url} alt={advisor.full_name || 'Advisor'} width={48} height={48} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <p className="font-medium">{advisor.full_name}</p>
                <p className="text-sm text-gray-500 capitalize">{advisor.role}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No advisors available at this time.</p>
        )}
      </div>

      {/* Step 2: Select Date & Time */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">2. Select Date & Time</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              min={minDate}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Times</label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map(time => (
                <button key={time} onClick={() => setSelectedTime(time)}
                  className={`px-3 py-2 text-sm rounded-lg border ${
                    selectedTime === time ? 'bg-brand-orange-500 text-white border-brand-orange-500' : 'hover:border-gray-300'
                  }`}>
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Meeting Type */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">3. Meeting Type</h2>
        <div className="flex gap-4">
          {[
            { id: 'video', icon: Video, label: 'Video Call' },
            { id: 'phone', icon: Phone, label: 'Phone Call' },
            { id: 'inperson', icon: MapPin, label: 'In Person' },
          ].map(type => (
            <button key={type.id} onClick={() => setMeetingType(type.id)}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border ${
                meetingType === type.id ? 'border-brand-orange-500 bg-brand-orange-50' : 'hover:border-gray-300'
              }`}>
              <type.icon className="w-5 h-5" />
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">4. Additional Notes (Optional)</h2>
        <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="What would you like to discuss?"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-orange-500" />
      </div>

      {/* Summary & Confirm */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Appointment Summary</h2>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Advisor</p>
              <p className="font-medium">
                {advisors.find(a => a.id === selectedAdvisor)?.full_name || 'Not selected'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Date & Time</p>
              <p className="font-medium">
                {selectedDate && selectedTime 
                  ? `${new Date(selectedDate).toLocaleDateString()} at ${selectedTime}` 
                  : 'Not selected'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Meeting Type</p>
              <p className="font-medium capitalize">{meetingType === 'inperson' ? 'In Person' : meetingType}</p>
            </div>
          </div>
        </div>
        <button onClick={handleSubmit} 
          disabled={!selectedAdvisor || !selectedDate || !selectedTime || isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-orange-500 text-white rounded-lg hover:bg-brand-orange-600 disabled:opacity-50 disabled:cursor-not-allowed">
          <span className="text-slate-400 flex-shrink-0">•</span>
          {isSubmitting ? 'Scheduling...' : 'Confirm Appointment'}
        </button>
      </div>
    </div>
  );
}
