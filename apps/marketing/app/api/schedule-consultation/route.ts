// PUBLIC ROUTE: creates consultation records and returns a Google Calendar event link.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AppointmentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  appointment_type: z.enum([
    'host-shop-tour',
    'website-app-build',
    'enrollment',
    'funding',
    'info',
    'career',
  ]),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{1,2}:\d{2} (AM|PM)$/),
});

const LABELS: Record<z.infer<typeof AppointmentSchema>['appointment_type'], string> = {
  'host-shop-tour': 'Elevate Host Shop Tour',
  'website-app-build': 'Website, App & Subscription Build Consultation',
  enrollment: 'Enrollment Consultation',
  funding: 'Financial Aid & Funding Review',
  info: 'Program Information Session',
  career: 'Career Advising',
};

function calendarStamp(date: string, time: string, addMinutes = 0) {
  const [, hourText, minuteText, period] = time.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/) || [];
  let hour = Number(hourText);
  const minute = Number(minuteText) + addMinutes;
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  const local = new Date(`${date}T00:00:00`);
  local.setHours(hour, minute, 0, 0);
  const yyyy = local.getFullYear();
  const mm = String(local.getMonth() + 1).padStart(2, '0');
  const dd = String(local.getDate()).padStart(2, '0');
  const hh = String(local.getHours()).padStart(2, '0');
  const min = String(local.getMinutes()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${min}00`;
}

function googleCalendarUrl(data: z.infer<typeof AppointmentSchema>) {
  const label = LABELS[data.appointment_type];
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: label,
    dates: `${calendarStamp(data.appointment_date, data.appointment_time)}/${calendarStamp(data.appointment_date, data.appointment_time, 30)}`,
    ctz: 'America/New_York',
    details: `Appointment with Elevate for Humanity. ${data.notes || 'Our team will contact you with any additional details.'}`,
    location:
      data.appointment_type === 'host-shop-tour'
        ? 'Participating Elevate Host Shop — location confirmed by staff'
        : 'Elevate for Humanity',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function requestedAppointment(data: z.infer<typeof AppointmentSchema>) {
  const [, hourText, minuteText, period] = data.appointment_time.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/) || [];
  let hour = Number(hourText);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return new Date(`${data.appointment_date}T${String(hour).padStart(2, '0')}:${minuteText}:00-04:00`);
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] || character,
  );
}

export async function POST(request: Request) {
  const limited = await applyRateLimit(request, 'contact');
  if (limited) return limited;

  const parsed = AppointmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please provide a valid appointment type, date, time, name, and email.' },
      { status: 400 },
    );
  }

  const data = parsed.data;
  if (requestedAppointment(data).getTime() < Date.now() + 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: 'Appointments require at least 24 hours advance notice.' }, { status: 409 });
  }
  const label = LABELS[data.appointment_type];
  const eventUrl = googleCalendarUrl(data);
  const db = await getAdminClient();
  if (!db)
    return NextResponse.json({ error: 'Scheduling is temporarily unavailable.' }, { status: 503 });

  const { error: appointmentError } = await db.from('appointments').insert({
    appointment_date: data.appointment_date,
    appointment_time: data.appointment_time,
    appointment_type: data.appointment_type,
    email: data.email,
    location:
      data.appointment_type === 'host-shop-tour'
        ? 'Participating Host Shop'
        : 'Elevate for Humanity',
    service_type: 'consultation',
    stage: 'new',
    status: 'scheduled',
    subject: `${label} — ${data.name}`,
    all: JSON.stringify({ name: data.name, phone: data.phone || null, notes: data.notes || null }),
  });

  if (appointmentError) {
    if (appointmentError.code === '23505') {
      return NextResponse.json({ error: 'That time was just booked. Please choose another available time.' }, { status: 409 });
    }
    logger.error('[schedule-consultation] appointment insert failed', appointmentError);
    return NextResponse.json(
      { error: 'The appointment could not be saved. Please choose another time or call us.' },
      { status: 503 },
    );
  }

  const safeName = escapeHtml(data.name);
  const safeLabel = escapeHtml(label);
  const safeDate = escapeHtml(data.appointment_date);
  const safeTime = escapeHtml(data.appointment_time);
  const safePhone = escapeHtml(data.phone || 'Not provided');
  const safeNotes = escapeHtml(data.notes || 'None');
  const calendarLink = escapeHtml(eventUrl);

  const confirmation = await sendEmail({
    to: data.email,
    bcc: 'elevate4humanityedu@gmail.com',
    subject: `${label} scheduled for ${data.appointment_date}`,
    html: `<h2>${safeLabel} confirmed</h2><p>Hello ${safeName},</p><p>Your appointment is scheduled for <strong>${safeDate}</strong> at <strong>${safeTime} Eastern Time</strong>.</p><p><a href="${calendarLink}">Add this appointment to Google Calendar</a></p><hr><p><strong>Phone:</strong> ${safePhone}</p><p><strong>Notes:</strong> ${safeNotes}</p>`,
  });

  if (!confirmation.success) {
    logger.warn('[schedule-consultation] confirmation email unavailable', { email: data.email });
  }

  return NextResponse.json({ ok: true, googleCalendarUrl: eventUrl });
}

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get('date') || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'A valid date is required.' }, { status: 400 });
  }
  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'Scheduling is temporarily unavailable.' }, { status: 503 });
  const { data, error } = await db
    .from('appointments')
    .select('appointment_time')
    .eq('appointment_date', date)
    .eq('service_type', 'consultation')
    .in('status', ['active', 'scheduled']);
  if (error) return NextResponse.json({ error: 'Availability could not be loaded.' }, { status: 503 });
  return NextResponse.json({ bookedTimes: (data || []).map((row) => row.appointment_time).filter(Boolean) });
}
