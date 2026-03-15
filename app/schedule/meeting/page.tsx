'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Video, 
  Phone, 
  Clock, 
  ArrowLeft, 
  ArrowRight,
  
  User,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type MeetingType = 'virtual' | 'phone';

interface TimeSlot {
  time: string;
  display: string;
}

const TIME_SLOTS: TimeSlot[] = [
  { time: '09:00', display: '9:00 AM' },
  { time: '10:00', display: '10:00 AM' },
  { time: '11:00', display: '11:00 AM' },
  { time: '12:00', display: '12:00 PM' },
  { time: '13:00', display: '1:00 PM' },
  { time: '14:00', display: '2:00 PM' },
  { time: '15:00', display: '3:00 PM' },
  { time: '16:00', display: '4:00 PM' },
];

function getNextTwoWeeks(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    // Skip weekends
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      dates.push(date);
    }
  }
  
  return dates;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatDateFull(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
}

export default function ScheduleMeetingPage() {
  const [step, setStep] = useState(1);
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const availableDates = getNextTwoWeeks();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/booking/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          meetingType,
          date: selectedDate?.toISOString(),
          time: selectedTime,
          duration: 60, // 1 hour
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      }
    } catch (error) {
      console.error('Booking error:', error);
    }

    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-500 flex-shrink-0">•</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Meeting Scheduled!</h1>
          <p className="text-gray-600 mb-6">
            Your {meetingType === 'virtual' ? 'virtual meeting' : 'phone call'} has been scheduled for:
          </p>
          <div className="bg-white rounded-xl p-4 mb-6">
            <p className="font-semibold text-gray-900">{selectedDate && formatDateFull(selectedDate)}</p>
            <p className="text-gray-600">
              {TIME_SLOTS.find(s => s.time === selectedTime)?.display} (1 hour)
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {meetingType === 'virtual' ? 'Via Google Meet' : 'We will call you'}
            </p>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            A confirmation email has been sent to <strong>{formData.email}</strong>
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-full bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              Return Home
            </Link>
            <Link
              href="/programs"
              className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-white transition"
            >
              Browse Programs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Schedule', href: '/schedule' }, { label: 'Meeting' }]} />
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 1 ? 'bg-brand-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-20 h-1 ${step >= 2 ? 'bg-brand-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 2 ? 'bg-brand-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
            <div className={`w-20 h-1 ${step >= 3 ? 'bg-brand-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 3 ? 'bg-brand-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Meeting Type */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Schedule a Meeting</h1>
              <p className="text-gray-600">Choose how you'd like to meet with our team</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => {
                  setMeetingType('virtual');
                  setStep(2);
                }}
                className={`p-8 bg-white rounded-2xl border-2 hover:border-brand-blue-500 hover:shadow-lg transition text-left ${
                  meetingType === 'virtual' ? 'border-brand-blue-500 shadow-lg' : 'border-gray-200'
                }`}
              >
                <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Video className="w-7 h-7 text-brand-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Virtual Meeting</h3>
                <p className="text-gray-600 mb-4">
                  Meet face-to-face via Google Meet video call. Screen sharing available.
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-2" />
                  1 hour
                </div>
              </button>

              <button
                onClick={() => {
                  setMeetingType('phone');
                  setStep(2);
                }}
                className={`p-8 bg-white rounded-2xl border-2 hover:border-brand-green-500 hover:shadow-lg transition text-left ${
                  meetingType === 'phone' ? 'border-brand-green-500 shadow-lg' : 'border-gray-200'
                }`}
              >
                <div className="w-14 h-14 bg-brand-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Phone className="w-7 h-7 text-brand-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Phone Call</h3>
                <p className="text-gray-600 mb-4">
                  We'll call you at your preferred number. No video required.
                </p>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-2" />
                  1 hour
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Select Date & Time</h1>
              <p className="text-gray-600">
                {meetingType === 'virtual' ? 'Virtual Meeting' : 'Phone Call'} • 1 Hour
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
              {/* Date Selection */}
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-brand-blue-600" />
                Select a Date
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
                {availableDates.map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 rounded-xl text-center transition ${
                      selectedDate?.toDateString() === date.toDateString()
                        ? 'bg-brand-blue-600 text-white'
                        : 'bg-white hover:bg-white text-gray-900'
                    }`}
                  >
                    <div className="text-xs font-medium opacity-75">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-lg font-bold">
                      {date.getDate()}
                    </div>
                    <div className="text-xs opacity-75">
                      {date.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </button>
                ))}
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-brand-blue-600" />
                    Select a Time (1 Hour Slots)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`p-3 rounded-xl text-center font-medium transition ${
                          selectedTime === slot.time
                            ? 'bg-brand-blue-600 text-white'
                            : 'bg-white hover:bg-white text-gray-900'
                        }`}
                      >
                        {slot.display}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="px-8 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact Info */}
        {step === 3 && (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Information</h1>
              <p className="text-gray-600">
                {formatDateFull(selectedDate!)} at {TIME_SLOTS.find(s => s.time === selectedTime)?.display}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name <span className="text-brand-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email <span className="text-brand-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="you@elevateforhumanity.org"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number <span className="text-brand-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="(317) 314-3757"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    What would you like to discuss? (Optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="Tell us about your goals or questions..."
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-white rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-2">Meeting Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Type:</strong> {meetingType === 'virtual' ? 'Virtual Meeting (Google Meet)' : 'Phone Call'}</p>
                  <p><strong>Date:</strong> {selectedDate && formatDateFull(selectedDate)}</p>
                  <p><strong>Time:</strong> {TIME_SLOTS.find(s => s.time === selectedTime)?.display}</p>
                  <p><strong>Duration:</strong> 1 Hour</p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition disabled:bg-gray-400 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      Confirm Meeting
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
