'use client';

import { useState } from 'react';
import { Calendar, Video, MapPin, CheckCircle2 } from 'lucide-react';

type SessionType = 'virtual' | 'barbershop';

// Available time slots — 2 hours apart so meetings never overlap
const TIME_SLOTS: Record<SessionType, string[]> = {
  virtual: ['09:00', '11:00', '13:00', '15:00'],
  barbershop: ['10:00', '12:00', '14:00', '16:00'],
};

const SESSION_LABELS: Record<SessionType, { label: string; desc: string; icon: React.ReactNode; duration: number }> = {
  virtual: {
    label: 'Virtual Orientation (Zoom)',
    desc: 'For prospective students — learn about programs, funding, and next steps. ~45 minutes.',
    icon: <Video className="w-5 h-5" />,
    duration: 45,
  },
  barbershop: {
    label: 'Barbershop Walk-Through',
    desc: 'For barbershop owners interested in hosting apprentices. Site visit via Zoom or in-person. ~60 minutes.',
    icon: <MapPin className="w-5 h-5" />,
    duration: 60,
  },
};

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1); // earliest = tomorrow
  return d.toISOString().split('T')[0];
}

export default function OrientationScheduleClient() {
  const [sessionType, setSessionType] = useState<SessionType>('virtual');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [zoomUrl, setZoomUrl] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !date || !time) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orientation/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, date, time, sessionType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to schedule. Please call (317) 314-3757.');
        return;
      }

      const meetingUrl = data.meetingUrl || '';
      setZoomUrl(meetingUrl);

      // Open Google Calendar invite
      const duration = SESSION_LABELS[sessionType].duration;
      const startDT = `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
      const endMs = new Date(`${date}T${time}:00`).getTime() + duration * 60 * 1000;
      const endDate = new Date(endMs);
      const endDT = `${endDate.toISOString().slice(0, 10).replace(/-/g, '')}T${endDate.toTimeString().slice(0, 5).replace(':', '')}00`;
      const title = sessionType === 'barbershop'
        ? 'Elevate for Humanity — Barbershop Walk-Through'
        : 'Elevate for Humanity — Orientation';
      const details = `Session for ${name} (${email})%0A%0AZoom Link: ${meetingUrl}`;
      const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDT}/${endDT}&details=${details}&add=${encodeURIComponent(email)}`;
      window.open(calUrl, '_blank');

      setSuccess(true);
    } catch {
      setError('Something went wrong. Please call (317) 314-3757.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-brand-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-brand-green-600" />
        </div>
        <h2 className="text-2xl font-black text-black">You're Scheduled!</h2>
        <p className="text-black">
          A confirmation email with your Zoom link has been sent to <strong>{email}</strong>.
          A Google Calendar invite just opened in a new tab.
        </p>
        {zoomUrl && (
          <a
            href={zoomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-brand-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-blue-700 transition-colors"
          >
            Open Zoom Link
          </a>
        )}
        <p className="text-black text-sm">
          Questions? Call <a href="tel:3173143757" className="text-brand-blue-600 font-semibold hover:underline">(317) 314-3757</a>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Session type toggle */}
      <div className="grid grid-cols-2 border-b border-slate-200">
        {(Object.keys(SESSION_LABELS) as SessionType[]).map((type) => (
          <button
            key={type}
            onClick={() => { setSessionType(type); setTime(''); }}
            className={`flex items-center justify-center gap-2 py-4 px-3 text-sm font-bold transition-colors ${
              sessionType === type
                ? 'bg-brand-blue-600 text-white'
                : 'bg-white text-black hover:bg-slate-50'
            }`}
          >
            {SESSION_LABELS[type].icon}
            <span className="hidden sm:inline">{type === 'virtual' ? 'Virtual Orientation' : 'Barbershop Walk-Through'}</span>
            <span className="sm:hidden">{type === 'virtual' ? 'Virtual' : 'Walk-Through'}</span>
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Session description */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <p className="text-black text-sm leading-relaxed">{SESSION_LABELS[sessionType].desc}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-black mb-1">
              Your Name <span className="text-brand-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-black"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-1">
              Email Address <span className="text-brand-red-600">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-black"
              placeholder="you@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1">
                Date <span className="text-brand-red-600">*</span>
              </label>
              <input
                type="date"
                required
                min={getMinDate()}
                value={date}
                onChange={(e) => { setDate(e.target.value); setTime(''); }}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-1">
                Time <span className="text-brand-red-600">*</span>
              </label>
              <select
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-black"
              >
                <option value="">Select...</option>
                {TIME_SLOTS[sessionType].map((slot) => (
                  <option key={slot} value={slot}>{formatTime(slot)}</option>
                ))}
              </select>
              <p className="text-xs text-black mt-1">All times Eastern</p>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Creating meeting...</>
            ) : (
              <><Calendar className="w-5 h-5" /> Book & Add to Google Calendar</>
            )}
          </button>

          <p className="text-center text-black text-xs">
            A Zoom link and Google Calendar invite will be sent to your email immediately.
          </p>
        </form>
      </div>
    </div>
  );
}
