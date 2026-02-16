'use client';

import { ZOOM_MEETING_URL } from '@/lib/config/zoom';

export default function OrientationFormClient() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const date = fd.get('orientDate') as string;
        const time = fd.get('orientTime') as string;
        const name = fd.get('orientName') as string;
        const email = fd.get('orientEmail') as string;

        if (!date || !time || !name || !email) return;

        const startDT = `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
        const endH = (parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0');
        const endDT = `${date.replace(/-/g, '')}T${endH}${time.split(':')[1]}00`;
        const details = `Orientation for ${name} (${email})%0A%0AZoom Link: ${ZOOM_MEETING_URL}`;
        const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Elevate for Humanity — Orientation')}&dates=${startDT}/${endDT}&details=${details}&add=${encodeURIComponent(email)},${encodeURIComponent('elevate4humanityedu@gmail.com')}&location=Zoom`;

        window.open(calUrl, '_blank');
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="orientName" className="block text-sm font-medium text-gray-700 mb-1">
          Your Name <span className="text-red-500">*</span>
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
          Your Email <span className="text-red-500">*</span>
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
            Date <span className="text-red-500">*</span>
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
            Time <span className="text-red-500">*</span>
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
      <button
        type="submit"
        className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
      >
        Book Orientation via Google Calendar
      </button>
    </form>
  );
}
