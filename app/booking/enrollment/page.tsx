'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User, Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'
];

export default function EnrollmentBookingPage() {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    program: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Generate next 14 days
  const getAvailableDates = () => {
    const dates = [];
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
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatDateValue = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/booking/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: selectedDate,
          time: selectedTime,
          type: 'enrollment_consultation'
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-brand-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-500 flex-shrink-0">•</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Appointment Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Your enrollment consultation is scheduled for <strong>{selectedDate}</strong> at <strong>{selectedTime}</strong>.
          </p>
          <div className="bg-white rounded-xl border p-6 mb-6 text-left">
            <h3 className="font-semibold mb-3">What to expect:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 30-minute consultation with an enrollment advisor</li>
              <li>• Discussion of your career goals and program options</li>
              <li>• Information about funding and financial aid</li>
              <li>• Next steps for enrollment</li>
            </ul>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            A confirmation email has been sent to {formData.email}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/programs" className="text-brand-blue-600 hover:text-brand-blue-700 font-medium">
              Browse Programs
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-700 font-medium">
              Return Home
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
          <Breadcrumbs items={[{ label: 'Booking', href: '/booking' }, { label: 'Enrollment' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-brand-blue-700 text-white py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/booking" className="inline-flex items-center gap-2 text-brand-blue-200 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Booking
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">Schedule Enrollment Consultation</h1>
          <p className="text-brand-blue-200 mt-2">30-minute session with an enrollment advisor</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? 'bg-brand-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {s}
                </div>
                <span className={`ml-2 text-sm hidden sm:inline ${step >= s ? 'text-brand-blue-600 font-medium' : 'text-gray-500'}`}>
                  {s === 1 ? 'Select Date' : s === 2 ? 'Select Time' : 'Your Info'}
                </span>
                {s < 3 && <div className={`w-12 sm:w-24 h-1 mx-2 ${step > s ? 'bg-brand-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step 1: Select Date */}
        {step === 1 && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-blue-600" />
              Select a Date
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {getAvailableDates().map((date) => (
                <button
                  key={formatDateValue(date)}
                  onClick={() => {
                    setSelectedDate(formatDate(date));
                    setStep(2);
                  }}
                  className="p-4 border rounded-lg hover:border-brand-blue-500 hover:bg-brand-blue-50 transition-colors text-center"
                >
                  <div className="text-sm text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="text-lg font-semibold">{date.getDate()}</div>
                  <div className="text-sm text-gray-500">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Time */}
        {step === 2 && (
          <div className="bg-white rounded-xl border p-6">
            <button onClick={() => setStep(1)} className="text-brand-blue-600 hover:text-brand-blue-700 text-sm mb-4 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Change date
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-blue-600" />
              Select a Time
            </h2>
            <p className="text-gray-600 mb-4">Available times for {selectedDate}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => {
                    setSelectedTime(time);
                    setStep(3);
                  }}
                  className="p-3 border rounded-lg hover:border-brand-blue-500 hover:bg-brand-blue-50 transition-colors text-center font-medium"
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Your Information */}
        {step === 3 && (
          <div className="bg-white rounded-xl border p-6">
            <button onClick={() => setStep(2)} className="text-brand-blue-600 hover:text-brand-blue-700 text-sm mb-4 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Change time
            </button>
            
            <div className="bg-brand-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-brand-blue-800">
                <strong>Appointment:</strong> {selectedDate} at {selectedTime}
              </p>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-blue-600" />
              Your Information
            </h2>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="(555) 555-5555"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program of Interest</label>
                <select
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                >
                  <option value="">Select a program (optional)</option>
                  <option value="cna">CNA Certification</option>
                  <option value="medical-assistant">Medical Assistant</option>
                  <option value="phlebotomy">Phlebotomy</option>
                  <option value="barber">Barber Apprenticeship</option>
                  <option value="hvac">HVAC Technician</option>
                  <option value="cdl">CDL Training</option>
                  <option value="tax-preparation">Tax Preparation</option>
                  <option value="other">Other / Not Sure</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Questions or Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="Anything you'd like us to know before your appointment?"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.firstName || !formData.lastName || !formData.email || !formData.phone}
                className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        )}

        {/* Help CTA */}
        <div className="mt-8 bg-white rounded-xl p-6 text-center">
          <p className="text-gray-600 mb-2">Need help with your enrollment?</p>
          <a href="/faq" className="inline-flex items-center gap-2 text-xl font-bold text-brand-blue-600 hover:text-brand-blue-700">
            Visit our FAQ & Help Center →
          </a>
        </div>
      </div>
    </div>
  );
}
