'use client';

import { useState } from 'react';

export default function OrientationFormClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (loading) return;

        const fd = new FormData(e.currentTarget);
        const date = fd.get('orientDate') as string;
        const time = fd.get('orientTime') as string;
        const name = fd.get('orientName') as string;
        const email = fd.get('orientEmail') as string;

        if (!date || !time || !name || !email) return;

        setLoading(true);
        setError('');

        try {
          // Create a real Zoom meeting via API
          const res = await fetch('/api/orientation/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, date, time }),
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.error || 'Failed to schedule. Please call (317) 314-3757.');
            return;
          }

          const zoomLink = data.meetingUrl || '';

          // Open Google Calendar with the real Zoom link
          const startDT = `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
          const endH = (parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0');
          const endDT = `${date.replace(/-/g, '')}T${endH}${time.split(':')[1]}00`;
          const details = `Orientation for ${name} (${email})%0A%0AZoom Link: ${zoomLink}`;
          const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Elevate for Humanity — Orientation')}&dates=${startDT}/${endDT}&details=${details}&add=${encodeURIComponent(email)}&location=Zoom`;

          window.open(calUrl, '_blank');
        } catch {
          setError('Something went wrong. Please call (317) 314-3757.');
        } finally {
          setLoading(false);
        }
      }}
      className="space-y-4"
      aria-busy={loading}
    >
      <div>
        <label htmlFor="orientName" className="block text-sm font-medium text-gray-700 mb-1">
          Your Name <span className="text-brand-red-500">*</span>
        </label>
        <input
          type="text"
          id="orientName"
          name="orientName"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
        />
      </div>
      <div>
        <label htmlFor="orientEmail" className="block text-sm font-medium text-gray-700 mb-1">
          Your Email <span className="text-brand-red-500">*</span>
        </label>
        <input
          type="email"
          id="orientEmail"
          name="orientEmail"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="orientDate" className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-brand-red-500">*</span>
          </label>
          <input
            type="date"
            id="orientDate"
            name="orientDate"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          />
        </div>
        <div>
          <label htmlFor="orientTime" className="block text-sm font-medium text-gray-700 mb-1">
            Time <span className="text-brand-red-500">*</span>
          </label>
          <select
            id="orientTime"
            name="orientTime"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          >
            <option value="">Select...</option>
            <option value="09:00">9:00 AM</option>
            <option value="10:00">10:00 AM</option>
            <option value="11:00">11:00 AM</option>
            <option value="13:00">1:00 PM</option>
            <option value="14:00">2:00 PM</option>
            <option value="15:00">3:00 PM</option>
          </select>
        </div>
      </div>
      {error && (
        <p className="text-brand-red-600 text-sm font-medium">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-red-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating meeting...' : 'Book Orientation via Google Calendar'}
      </button>
    </form>
  );
}
