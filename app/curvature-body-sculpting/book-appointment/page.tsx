'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  price: number;
  category: string;
}

// Fallback services if DB not available
const fallbackServices = [
  { id: 'consultation', name: 'Free Consultation', duration: '30 min', price: 'FREE' },
  { id: 'body-contouring', name: 'Body Contouring', duration: '60 min', price: '$199' },
  { id: 'skin-tightening', name: 'Skin Tightening', duration: '45 min', price: '$149' },
  { id: 'cellulite-reduction', name: 'Cellulite Reduction', duration: '45 min', price: '$129' },
  { id: 'lymphatic-drainage', name: 'Lymphatic Drainage', duration: '60 min', price: '$89' },
  { id: 'package-3', name: 'Body Sculpting Package (3 sessions)', duration: '60 min each', price: '$499' },
  { id: 'package-6', name: 'Body Sculpting Package (6 sessions)', duration: '60 min each', price: '$899' },
];

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
];

export default function BookAppointmentPage() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch services from database
  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch('/api/curvature/appointments');
        const data = await response.json();
        if (data.services && data.services.length > 0) {
          setServices(data.services);
        }
      } catch (error) {
        console.error('Failed to fetch services:', error);
      }
      setLoading(false);
    }
    fetchServices();
  }, []);

  // Fetch booked times when date changes
  useEffect(() => {
    async function fetchBookedTimes() {
      if (!selectedDate) return;
      try {
        const dateStr = getAvailableDates().find(d => formatDate(d) === selectedDate);
        if (dateStr) {
          const response = await fetch(`/api/curvature/appointments?date=${formatDateValue(dateStr)}`);
          const data = await response.json();
          setBookedTimes(data.bookedTimes || []);
        }
      } catch (error) {
        console.error('Failed to fetch booked times:', error);
      }
    }
    fetchBookedTimes();
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const dateObj = getAvailableDates().find(d => formatDate(d) === selectedDate);
      
      const response = await fetch('/api/curvature/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          appointment_date: dateObj ? formatDateValue(dateObj) : selectedDate,
          appointment_time: selectedTime,
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.error || 'Failed to book appointment. Please try again.');
      }
    } catch (error) {
      alert('Failed to book appointment. Please try again.');
    }
    
    setSubmitting(false);
  };

  // Generate next 14 days for date selection
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Skip Sundays
      if (date.getDay() !== 0) {
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Appointment Requested!</h1>
          <p className="text-gray-600 mb-6">
            We've received your appointment request. You'll receive a confirmation email at{' '}
            <strong>{formData.email}</strong> within 24 hours.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600">
              <strong>Service:</strong> {services.find(s => s.id === selectedService)?.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Date:</strong> {selectedDate}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Time:</strong> {selectedTime}
            </p>
          </div>
          <Link
            href="/curvature-body-sculpting"
            className="inline-flex items-center gap-2 text-purple-600 font-medium hover:text-purple-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Curvature Body Sculpting
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/curvature-body-sculpting" className="text-pink-200 hover:text-white text-sm mb-2 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Curvature Body Sculpting
          </Link>
          <h1 className="text-3xl font-bold">Book an Appointment</h1>
          <p className="text-pink-100 mt-2">Schedule your body sculpting or wellness service</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              <span className={`text-sm ${step >= s ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                {s === 1 ? 'Service' : s === 2 ? 'Date & Time' : 'Your Info'}
              </span>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-purple-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Select Service */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Select a Service</h2>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  <span className="ml-3 text-gray-600">Loading services...</span>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {(services.length > 0 ? services : fallbackServices).map((service: any) => {
                    const isDbService = 'duration_minutes' in service;
                    const duration = isDbService ? `${service.duration_minutes} min` : service.duration;
                    const price = isDbService 
                      ? (service.price === 0 ? 'FREE' : `$${service.price}`)
                      : service.price;
                    
                    return (
                      <button
                        key={service.id}
                        onClick={() => setSelectedService(service.id)}
                        className={`p-4 rounded-xl border-2 text-left transition ${
                          selectedService === service.id
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-600">{duration}</p>
                          </div>
                          <span className={`font-bold ${price === 'FREE' ? 'text-green-600' : 'text-purple-600'}`}>
                            {price}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedService}
                  className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Select Date & Time</h2>
              
              {/* Date Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">Select a Date</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {getAvailableDates().map((date) => (
                    <button
                      key={formatDateValue(date)}
                      onClick={() => setSelectedDate(formatDate(date))}
                      className={`p-3 rounded-lg border text-center transition ${
                        selectedDate === formatDate(date)
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-xs text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="font-bold">{date.getDate()}</div>
                      <div className="text-xs text-gray-500">{date.toLocaleDateString('en-US', { month: 'short' })}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">Select a Time</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {timeSlots.map((time) => {
                    const isBooked = bookedTimes.includes(time);
                    return (
                      <button
                        key={time}
                        onClick={() => !isBooked && setSelectedTime(time)}
                        disabled={isBooked}
                        className={`p-3 rounded-lg border text-center transition ${
                          isBooked
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                            : selectedTime === time
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedDate || !selectedTime}
                  className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Contact Info */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h2 className="text-xl font-bold mb-6">Your Information</h2>
              
              {/* Summary */}
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-purple-700">
                  <strong>{services.find(s => s.id === selectedService)?.name}</strong> on{' '}
                  <strong>{selectedDate}</strong> at <strong>{selectedTime}</strong>
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special requests or concerns..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition flex items-center gap-2 disabled:bg-pink-400"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5" />
                      Book Appointment
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
