"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState } from 'react';
import { Plus, Save, X } from 'lucide-react';

interface ServiceCount {
  haircuts: number;
  beard_trims: number;
  shaves: number;
  color_services: number;
  chemical_services: number;
  styling: number;
  consultations: number;
  sanitation: number;
  other: number;
}

interface ServiceLoggingFormProps {
  enrollmentId: string;
  onSuccess?: () => void;
}

const SERVICE_TYPES = [
  { key: 'haircuts', label: 'Haircuts', icon: '✂️' },
  { key: 'beard_trims', label: 'Beard Trims', icon: '🧔' },
  { key: 'shaves', label: 'Straight Razor Shaves', icon: '🪒' },
  { key: 'color_services', label: 'Color Services', icon: '🎨' },
  { key: 'chemical_services', label: 'Chemical Services', icon: '⚗️' },
  { key: 'styling', label: 'Styling Services', icon: '💇' },
  { key: 'consultations', label: 'Client Consultations', icon: '💬' },
  { key: 'sanitation', label: 'Sanitation Tasks', icon: '🧼' },
  { key: 'other', label: 'Other Services', icon: '📋' },
];

export default function ServiceLoggingForm({
  enrollmentId,
  onSuccess,
}: ServiceLoggingFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('8');
  const [services, setServices] = useState<ServiceCount>({
    haircuts: 0,
    beard_trims: 0,
    shaves: 0,
    color_services: 0,
    chemical_services: 0,
    styling: 0,
    consultations: 0,
    sanitation: 0,
    other: 0,
  });
  const [notes, setNotes] = useState('');

  const handleServiceChange = (key: keyof ServiceCount, value: string) => {
    const numValue = parseInt(value) || 0;
    setServices((prev) => ({ ...prev, [key]: Math.max(0, numValue) }));
  };

  const incrementService = (key: keyof ServiceCount) => {
    setServices((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  };

  const decrementService = (key: keyof ServiceCount) => {
    setServices((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }));
  };

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Direct DB insert for service log
      const { error: dbError } = await supabase
        .from('apprentice_service_logs')
        .insert({
          enrollment_id: enrollmentId,
          user_id: user?.id,
          date,
          hours: parseFloat(hours),
          services_performed: services,
          total_services: Object.values(services).reduce((sum, count) => sum + count, 0),
          notes,
          logged_at: new Date().toISOString()
        });

      if (!dbError) {
        // Update cumulative hours
        await supabase.rpc('update_apprentice_cumulative_hours', {
          p_enrollment_id: enrollmentId,
          p_hours: parseFloat(hours)
        });
      }

      // Also call API as fallback
      const response = await fetch('/api/student/log-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          date,
          hours: parseFloat(hours),
          services_performed: services,
          notes,
        }),
      });

      if (response.ok || !dbError) {
        // Reset form
        setServices({
          haircuts: 0,
          beard_trims: 0,
          shaves: 0,
          color_services: 0,
          chemical_services: 0,
          styling: 0,
          consultations: 0,
          sanitation: 0,
          other: 0,
        });
        setNotes('');
        setIsOpen(false);
        if (onSuccess) onSuccess();
      } else {
        alert('Failed to log hours. Please try again.');
      }
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalServices = Object.values(services).reduce(
    (sum, count) => sum + count,
    0
  );

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
      >
        <Plus className="w-5 h-5" />
        Log Today's Hours & Services
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-black">
          Log Hours & Services
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-black transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date and Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Hours Worked
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Service Counters */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-semibold text-black">
              Services Performed
            </label>
            <span className="text-sm text-black">
              Total:{' '}
              <span className="font-bold text-blue-600">{totalServices}</span>{' '}
              services
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICE_TYPES.map(({ key, label, icon }) => (
              <div
                key={key}
                className="bg-slate-50 rounded-lg p-4 border border-slate-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-black">
                    {icon} {label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => decrementService(key as keyof ServiceCount)}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors text-black font-bold"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={services[key as keyof ServiceCount]}
                    onChange={(e) =>
                      handleServiceChange(
                        key as keyof ServiceCount,
                        e.target.value
                      )
                    }
                    className="flex-1 text-center px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => incrementService(key as keyof ServiceCount)}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors text-black font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="What did you learn today? Any challenges or achievements?"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Entry'}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-6 py-3 border border-slate-300 text-black rounded-lg hover:bg-slate-50 transition-colors font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
