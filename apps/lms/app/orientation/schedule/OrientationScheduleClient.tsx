import { organization } from '@/lib/config/organization';
import { MARKETING_HOST } from '@/lib/routing/portal-map';

/** Booking is handled by the existing appointment service, not a missing Zoom endpoint. */
export default function OrientationScheduleClient() {
  return <nav aria-label="Orientation booking options" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
    <h2 className="text-xl font-black">Choose your appointment</h2>
    <p className="leading-7 text-slate-700">The booking page shows available consultation times. Select Program Information for orientation or Host Shop Tour for a walk-through. Staff will confirm the meeting location or connection details.</p>
    <a href={`${MARKETING_HOST}/schedule-consultation`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-blue-800 px-5 py-3 font-bold text-white">Open appointment booking in a new tab</a>
    <p className="text-sm text-slate-700">Your dashboard stays open. A meeting is booked only after the booking page confirms it was saved.</p>
    <a href={`tel:${organization.phone}`} className="block font-bold text-blue-800 underline">Booking help: {organization.phone}</a>
  </nav>;
}
