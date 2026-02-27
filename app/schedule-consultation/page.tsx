'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
];

const MEETING_TYPES = [
  { value: 'enrollment', label: 'Enrollment Consultation', duration: '30 min', desc: 'Discuss programs, eligibility, and next steps' },
  { value: 'funding', label: 'Financial Aid & Funding Review', duration: '30 min', desc: 'WIOA, JRI, grants, and payment options' },
  { value: 'info', label: 'Program Information Session', duration: '20 min', desc: 'Learn about a specific training program' },
  { value: 'career', label: 'Career Advising', duration: '30 min', desc: 'Explore career paths and program fit' },
];

function getNextWeekdays(count: number): string[] {
  const dates: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (dates.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      dates.push(d.toISOString().split('T')[0]);
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ScheduleConsultationPage() {
  const [step, setStep] = useState(1);
  const [meetingType, setMeetingType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  const dates = getNextWeekdays(10);

  const handleSubmit = async () => {
    if (!name || !email || !meetingType || !selectedDate || !selectedTime) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/schedule-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone, notes,
          appointment_type: meetingType,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
        }),
      });
      if (!res.ok) throw new Error('Failed to book');
      setConfirmed(true);
    } catch {
      setError('Something went wrong. Please try again or call us at (317) 314-3757.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">&#x2714;</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Meeting Scheduled</h1>
          <p className="text-slate-600 mb-4">
            Your {MEETING_TYPES.find(m => m.value === meetingType)?.label} is booked for{' '}
            <strong>{formatDate(selectedDate)}</strong> at <strong>{selectedTime}</strong>.
          </p>
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-4 text-left">
            <div className="font-semibold text-brand-blue-900 mb-1">Join via Zoom</div>
            <p className="text-brand-blue-700 text-sm">Your unique Zoom meeting link has been sent to your email.</p>
          </div>
          <p className="text-slate-500 text-sm mb-6">
            Check your inbox at <strong>{email}</strong> for the confirmation with your Zoom link.
            Our enrollment team will reach out before your appointment.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/programs" className="bg-brand-red-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-red-700 transition-colors">
              Browse Programs
            </Link>
            <Link href="/" className="text-slate-600 hover:text-slate-900 text-sm">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative h-40 sm:h-48 overflow-hidden">
        <Image src="/images/heroes-hq/career-services-hero.jpg" alt="Schedule enrollment consultation" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 to-slate-900/90" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Schedule a Consultation</h1>
          <p className="text-slate-300 text-sm mt-1">Meet with our enrollment team to discuss your training goals</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-brand-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{s}</div>
              <span className={`text-sm hidden sm:inline ${step >= s ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                {s === 1 ? 'Meeting Type' : s === 2 ? 'Date & Time' : 'Your Info'}
              </span>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-brand-red-600' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
        )}

        {/* Step 1: Meeting Type */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">What would you like to discuss?</h2>
            <div className="space-y-3">
              {MEETING_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => { setMeetingType(type.value); setStep(2); }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${meetingType === type.value ? 'border-brand-red-600 bg-brand-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{type.label}</div>
                      <div className="text-slate-500 text-sm">{type.desc}</div>
                    </div>
                    <span className="text-slate-400 text-sm flex-shrink-0 ml-4">{type.duration}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Pick a date</h2>
            <div className="grid grid-cols-5 gap-2 mb-6">
              {dates.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`p-3 rounded-xl text-center text-sm font-medium transition-colors ${selectedDate === date ? 'bg-brand-red-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-brand-red-300'}`}
                >
                  {formatDate(date)}
                </button>
              ))}
            </div>

            {selectedDate && (
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Pick a time</h2>
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      onClick={() => { setSelectedTime(time); setStep(3); }}
                      className={`p-3 rounded-xl text-center text-sm font-medium transition-colors ${selectedTime === time ? 'bg-brand-red-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-brand-red-300'}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </>
            )}

            <button onClick={() => setStep(1)} className="text-slate-500 text-sm hover:text-slate-700">
              ← Back to meeting type
            </button>
          </div>
        )}

        {/* Step 3: Contact Info */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Your Information</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
              <div className="text-sm text-slate-500">
                <strong>{MEETING_TYPES.find(m => m.value === meetingType)?.label}</strong> · {formatDate(selectedDate)} at {selectedTime}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500" placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500" placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500" placeholder="(555) 000-0000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">What program are you interested in?</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500" placeholder="Tell us about your goals or questions..." />
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-brand-red-600 text-white font-bold py-3 rounded-lg hover:bg-brand-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Booking...' : 'Confirm Appointment'}
              </button>
              <button onClick={() => setStep(2)} className="w-full text-slate-500 text-sm hover:text-slate-700">
                ← Change date/time
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
