/**
 * Calendar Integration Service
 * Stub for future calendar integrations (Google Calendar, Outlook)
 */

import { logger } from '@/lib/logger';

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
    const eventId = `cal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
