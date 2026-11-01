/**
 * Calendar Integration Service
 * Durable internal calendar events. Google busy-time synchronization has its
 * own per-user OAuth adapter; saving here never claims an external invitation.
 */

import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';

export interface CalendarEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  location?: string;
  reminders?: number[];
  eventType?: 'orientation' | 'class' | 'appointment' | 'reminder' | 'deadline';
}

export class CalendarService {
  name = 'Elevate Internal';

  async createEvent(event: CalendarEvent, userId: string): Promise<string> {
    if (!userId || !event.title?.trim() ||
        !Number.isFinite(event.startTime.getTime()) || !Number.isFinite(event.endTime.getTime()) ||
        event.endTime <= event.startTime) throw new Error('A valid calendar event and owner are required.');
    const db = await requireAdminClient();
    const start = event.startTime.toISOString();
    const { data, error } = await db.from('calendar_events').insert({
      user_id: userId,
      title: event.title.trim(),
      description: event.description || null,
      date: start.slice(0, 10),
      time: start.slice(11, 19),
      start_at: start,
      end_at: event.endTime.toISOString(),
      duration: Math.ceil((event.endTime.getTime() - event.startTime.getTime()) / 60000),
      event_type: event.eventType || 'event',
      location: event.location || null,
      reminder_minutes: event.reminders?.[0] ?? null,
    }).select('id').single();
    if (error || !data?.id) throw new Error('Calendar event could not be saved.');
    const eventId = data.id;
    logger.info('[calendar] Event created', {
      eventId,
      userId,
      title: event.title,
      startTime: event.startTime.toISOString(),
      type: event.eventType,
    });
    return eventId;
  }

  async scheduleOrientationReminder(userId: string, orientationDate: Date, userEmail: string): Promise<void> {
    const reminderTime = new Date(orientationDate);
    reminderTime.setDate(reminderTime.getDate() - 1);
    await this.createEvent({
      title: 'Orientation Reminder - Complete Before Tomorrow!',
      description: `Your orientation is tomorrow at ${orientationDate.toLocaleTimeString()}`,
      startTime: reminderTime,
      endTime: new Date(reminderTime.getTime() + 30 * 60 * 1000),
      attendees: [userEmail],
      eventType: 'reminder',
    }, userId);
  }

  async scheduleEnrollmentMilestone(userId: string, milestone: string, dueDate: Date, userEmail: string): Promise<string> {
    const reminderTime = new Date(dueDate);
    reminderTime.setHours(9, 0, 0, 0);
    return this.createEvent({
      title: `Action Required: ${milestone}`,
      description: milestone,
      startTime: reminderTime,
      endTime: new Date(reminderTime.getTime() + 30 * 60 * 1000),
      attendees: [userEmail],
      eventType: 'deadline',
      reminders: [1440, 60],
    }, userId);
  }
}

export const calendarService = new CalendarService();
