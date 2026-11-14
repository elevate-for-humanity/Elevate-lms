'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, ChevronDown, ChevronUp, Loader2, CheckCircle, MapPin, AlertCircle } from 'lucide-react';

const FUNDING_PHASES = [
  { value: 'PRE_WIOA', label: 'Pre-WIOA' },
  { value: 'WIOA', label: 'WIOA Funded' },
  { value: 'POST_CERT', label: 'Post-Certification' },
];

const CATEGORIES = [
  'Haircut Techniques',
  'Razor & Shaving Services',
  'Sanitation & Safety',
  'Client Consultation',
  'Shop Operations',
  'Other',
];

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

export default function OjtHoursLogger() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [fundingPhase, setFundingPhase] = useState('PRE_WIOA');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Location state
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Get location when opening the form
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setLocationLoading(false);
      },
      (err) => {
        let errorMsg = 'Unable to get location';
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied. Please enable location to clock in.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errorMsg = 'Location unavailable';
        } else if (err.code === err.TIMEOUT) {
          errorMsg = 'Location request timed out';
        }
        setLocationError(errorMsg);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Request location when form opens
  useEffect(() => {
    if (open && !location) {
      getLocation();
    }
  }, [open, location, getLocation]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const parsedHours = Number.parseFloat(hours);

    if (!Number.isFinite(parsedHours)) {
      setError('Enter a valid number of hours');
      return;
    }

    if (parsedHours < 0.5) {
      setError('Minimum entry is 0.5 hours');
      return;
    }

    if (parsedHours > 12) {
      setError('Daily hour limit is 12 hours');
      return;
    }

    if ((parsedHours * 2) % 1 !== 0) {
      setError('Hours must be entered in 0.5 hour increments');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch('/api/time/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry_date: date,
        hours_claimed: parsedHours,
        category,
        funding_phase: fundingPhase,
        notes,
        source_type: 'learner_self_report',
        // Include location data
        clock_in_latitude: location?.latitude,
        clock_in_longitude: location?.longitude,
        clock_in_accuracy: location?.accuracy,
        clock_in_timestamp: location?.timestamp,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? 'Failed to log hours');
    } else {
      setSuccess(true);
      setHours('');
      setNotes('');
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  }

  return (
    <div>
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && !location) getLocation();
        }}
        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        <Clock className="w-4 h-4" />
        Clock In / Log OJT Hours
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <form onSubmit={submit} className="mt-3 space-y-3 bg-slate-50 rounded-lg p-4 border border-slate-200">
          {/* Location Status */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
            {locationLoading ? (
              <>
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-xs text-slate-600">Getting your location...</span>
              </>
            ) : location ? (
              <>
                <MapPin className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-700">Location verified (accuracy: {Math.round(location.accuracy)}m)</span>
                <button
                  type="button"
                  onClick={getLocation}
                  className="ml-auto text-xs text-blue-600 hover:text-blue-700"
                >
                  Refresh
                </button>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-amber-700 flex-1">{locationError || 'Location not set'}</span>
                <button
                  type="button"
                  onClick={getLocation}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Enable Location
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hours Worked</label>
              <input
                type="number"
                min="0.5"
                max="12"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 4"
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Work Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Funding Phase</label>
              <select
                value={fundingPhase}
                onChange={(e) => setFundingPhase(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FUNDING_PHASES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Skills practiced, supervisor name…"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && (
            <p className="text-xs text-brand-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Hours logged — pending supervisor approval
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
            {saving ? 'Submitting…' : 'Submit Hours'}
          </button>
        </form>
      )}
    </div>
  );
}
