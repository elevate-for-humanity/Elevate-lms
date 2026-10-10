export const TESTING_TIME_ZONE = 'America/New_York';

export function testingAppointmentLabel(start: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full', timeStyle: 'short', timeZone: TESTING_TIME_ZONE,
  }).format(new Date(start)) + ' Eastern Time';
}

export function testingCalendarUrl(appointment: {
  examName: string; confirmationCode: string; start: string; end: string; location: string;
}): string {
  const stamp = (date: string) => new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: 'TEMPLATE', text: `${appointment.examName} — Elevate Testing Center`,
    dates: `${stamp(appointment.start)}/${stamp(appointment.end)}`,
    ctz: TESTING_TIME_ZONE,
    details: `Reserved, paid testing appointment. Confirmation code: ${appointment.confirmationCode}.`,
    location: appointment.location,
  }).toString()}`;
}

export function validTestingReference(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
