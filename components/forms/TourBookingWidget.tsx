'use client';

import { useState } from 'react';
import { Calendar, MapPin, Video, Users, Clock, ChevronDown, Loader2, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TourOption {
  id: string;
  type: string;
  duration: string;
  icon: React.ReactNode;
  description: string;
}

const TOUR_OPTIONS: TourOption[] = [
  {
    id: 'in-person',
    type: 'In-Person Tour',
    duration: '30-45 minutes',
    icon: <MapPin className="w-5 h-5" />,
    description: 'Visit our campus, meet instructors, see the training facilities'
  },
  {
    id: 'virtual',
    type: 'Virtual Tour',
    duration: '20-30 minutes',
    icon: <Video className="w-5 h-5" />,
    description: 'Live video walkthrough with Q&A from our admissions team'
  },
  {
    id: 'shadow',
    type: 'Shadow a Student',
    duration: '2-4 hours',
    icon: <Users className="w-5 h-5" />,
    description: 'Spend time with a current student during their training'
  }
];

export function TourBookingWidget() {
  const [tourType, setTourType] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Generate available dates (next 14 days, weekdays only)
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const day = date.getDay();
    if (day === 0 || day === 6) return null; // Skip weekends
    return {
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    };
  }).filter(Boolean);

  // Generate time slots
  const timeSlots: TimeSlot[] = [
    { time: '9:00 AM', available: true },
    { time: '10:00 AM', available: true },
    { time: '11:00 AM', available: true },
    { time: '1:00 PM', available: true },
    { time: '2:00 PM', available: true },
    { time: '3:00 PM', available: false },
    { time: '4:00 PM', available: true },
  ];

  const handleSubmit = async () => {
    if (!tourType || !selectedDate || !selectedTime || !name || !email) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Tour Scheduled!
        </h3>
        <p className="text-gray-600 mb-4">
          We've sent a confirmation to {email}. Our admissions team will contact you 
          to confirm your {tourType === 'virtual' ? 'virtual' : 'in-person'} tour on {selectedDate} at {selectedTime}.
        </p>
        <p className="text-sm text-gray-500">
          Questions? Call us at (317) 314-3757
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 md:p-8 bg-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-brand-blue-100 rounded-xl">
          <Calendar className="w-6 h-6 text-brand-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Schedule a Tour</h3>
          <p className="text-gray-600 text-sm">See our campus and meet the team</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tour Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tour Type *
          </label>
          <div className="grid gap-3">
            {TOUR_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTourType(option.id)}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  tourType === option.id
                    ? 'border-brand-blue-500 bg-brand-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  tourType === option.id ? 'bg-brand-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{option.type}</p>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {option.duration}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Date *
          </label>
          <div className="relative">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 appearance-none"
            >
              <option value="">Select a date</option>
              {availableDates.map((date) => (
                <option key={date!.value} value={date!.value}>
                  {date!.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Time Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Time *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available}
                onClick={() => setSelectedTime(slot.time)}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  selectedTime === slot.time
                    ? 'border-brand-blue-500 bg-brand-blue-50 text-brand-blue-700 font-semibold'
                    : slot.available
                    ? 'border-gray-200 hover:border-gray-300 text-gray-700'
                    : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed line-through'
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Grayed out times are unavailable</p>
        </div>

        {/* Contact Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone (Optional)
          </label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(317) 314-3757"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </p>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold text-lg py-4"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Scheduling...
            </>
          ) : (
            'Schedule My Tour'
          )}
        </Button>

        <p className="text-center text-xs text-gray-500">
          Or call us directly at (317) 314-3757
        </p>
      </div>
    </Card>
  );
}

export default TourBookingWidget;
