/**
 * Calendly Integration for Elevate for Humanity
 * Real appointment scheduling with automated tracking
 */

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { sendAppointmentConfirmationEmail } from '@/lib/email/automated-triggers';

export interface CalendlyEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  location: {
    type: string;
    join_url?: string;
    phone_number?: string;
  };
  invitees_counter: {
    total: number;
    active: number;
    limit: number;
  };
}

export interface CalendlyInvitee {
  uri: string;
  email: string;
  name: string;
  status: string;
  questions_and_answers: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * Calendly Configuration
 * Update these with your real Calendly links
 */
export const CALENDLY_LINKS = {
  // General advising appointments
  advising: 'https://calendly.com/elevateforhumanity/advising',

  // Program-specific appointments
  barbering: 'https://calendly.com/elevateforhumanity/barbering-consultation',
  hvac: 'https://calendly.com/elevateforhumanity/hvac-consultation',
  cdl: 'https://calendly.com/elevateforhumanity/cdl-consultation',
  medicalAssistant: 'https://calendly.com/elevateforhumanity/medical-assistant-consultation',
  welding: 'https://calendly.com/elevateforhumanity/welding-consultation',

  // Tax services
  taxVita: 'https://calendly.com/elevateforhumanity/free-tax-prep',
  taxPaid: 'https://calendly.com/elevateforhumanity/paid-tax-services',

  // Support services
  caseManagement: 'https://calendly.com/elevateforhumanity/case-management',
  financialAid: 'https://calendly.com/elevateforhumanity/financial-aid',

  // Workforce board
  workforceIntake: 'https://calendly.com/elevateforhumanity/workforce-intake',
};

/**
 * Get Calendly link for appointment type
 */
export function getCalendlyLink(appointmentType: string): string {
  const type = appointmentType.toLowerCase().replace(/\s+/g, '');

  // Map appointment types to Calendly links
  const linkMap: Record<string, string> = {
    'advising': CALENDLY_LINKS.advising,
    'generaladvising': CALENDLY_LINKS.advising,
    'barbering': CALENDLY_LINKS.barbering,
    'barberingconsultation': CALENDLY_LINKS.barbering,
    'hvac': CALENDLY_LINKS.hvac,
    'hvacconsultation': CALENDLY_LINKS.hvac,
    'cdl': CALENDLY_LINKS.cdl,
    'cdlconsultation': CALENDLY_LINKS.cdl,
    'medicalassistant': CALENDLY_LINKS.medicalAssistant,
    'medicalassistantconsultation': CALENDLY_LINKS.medicalAssistant,
    'welding': CALENDLY_LINKS.welding,
    'weldingconsultation': CALENDLY_LINKS.welding,
    'taxvita': CALENDLY_LINKS.taxVita,
    'freetaxprep': CALENDLY_LINKS.taxVita,
    'taxpaid': CALENDLY_LINKS.taxPaid,
    'paidtaxservices': CALENDLY_LINKS.taxPaid,
    'casemanagement': CALENDLY_LINKS.caseManagement,
    'financialaid': CALENDLY_LINKS.financialAid,
    'workforceintake': CALENDLY_LINKS.workforceIntake,
  };

  return linkMap[type] || CALENDLY_LINKS.advising;
}

/**
 * Create appointment record in database
 */
export async function createAppointment(data: {
  studentId: string;
  appointmentType: string;
  scheduledTime: Date;
  meetingType: 'phone' | 'zoom' | 'in_person';
  meetingLink?: string;
  phoneNumber?: string;
  location?: string;
  notes?: string;
  calendlyEventUri?: string;
}): Promise<string | null> {
  const supabase = await createClient();

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      student_id: data.studentId,
      appointment_type: data.appointmentType,
      scheduled_time: data.scheduledTime.toISOString(),
      meeting_type: data.meetingType,
      meeting_link: data.meetingLink,
      phone_number: data.phoneNumber,
      location: data.location,
      notes: data.notes,
      calendly_event_uri: data.calendlyEventUri,
      status: 'scheduled'
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Error creating appointment:', error);
    return null;
  }

  return appointment?.id || null;
}

/**
 * Handle Calendly webhook event
 * Called when Calendly sends webhook notifications
 */
export async function handleCalendlyWebhook(
  eventType: string,
  payload: any
): Promise<boolean> {
  const supabase = await createClient();

  try {
    if (eventType === 'invitee.created') {
      // New appointment booked
      const event = payload.event as CalendlyEvent;
      const invitee = payload.invitee as CalendlyInvitee;

      // Extract student info from invitee
      const studentEmail = invitee.email;
      const studentName = invitee.name;

      // Find student in database
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name')
        .eq('email', studentEmail)
        .single();

      if (!profile) {
        return false;
      }

      // Determine meeting type and details
      const meetingType = event.location.type === 'zoom' ? 'zoom' :
                         event.location.type === 'phone' ? 'phone' :
                         'in_person';

      // Create appointment record
      const appointmentId = await createAppointment({
        studentId: profile.id,
        appointmentType: event.name,
        scheduledTime: new Date(event.start_time),
        meetingType,
        meetingLink: event.location.join_url,
        phoneNumber: event.location.phone_number,
        calendlyEventUri: event.uri
      });

      if (appointmentId) {
        // Send confirmation email
        await sendAppointmentConfirmationEmail(
          studentEmail,
          profile.first_name,
          event.name,
          new Date(event.start_time).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          }),
          event.location.join_url,
          event.location.phone_number
        );
      }

      return true;
    }

    if (eventType === 'invitee.canceled') {
      // Appointment canceled
      const event = payload.event as CalendlyEvent;

      // Update appointment status
      await supabase
        .from('appointments')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString()
        })
        .eq('calendly_event_uri', event.uri);

      return true;
    }

    return false;
  } catch (error) { /* Error handled silently */ 
    logger.error('Error handling Calendly webhook:', error);
    return false;
  }
}

/**
 * Get upcoming appointments for a student
 */
export async function getUpcomingAppointments(studentId: string) {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('appointments')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'scheduled')
    .gte('scheduled_time', new Date().toISOString())
    .order('scheduled_time', { ascending: true });

  if (error) {
    logger.error('Error fetching appointments:', error);
    return [];
  }

  return data || [];
}

/**
 * Get past appointments for a student
 */
export async function getPastAppointments(studentId: string, limit: number = 10) {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('appointments')
    .select('*')
    .eq('student_id', studentId)
    .lt('scheduled_time', new Date().toISOString())
    .order('scheduled_time', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error fetching past appointments:', error);
    return [];
  }

  return data || [];
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(
  appointmentId: string,
  reason?: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      cancellation_reason: reason
    })
    .eq('id', appointmentId);

  if (error) {
    logger.error('Error canceling appointment:', error);
    return false;
  }

  return true;
}

/**
 * Mark appointment as completed
 */
export async function completeAppointment(
  appointmentId: string,
  notes?: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes: notes
    })
    .eq('id', appointmentId);

  if (error) {
    logger.error('Error completing appointment:', error);
    return false;
  }

  return true;
}

/**
 * Mark appointment as no-show
 */
export async function markNoShow(appointmentId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'no_show',
      no_show_at: new Date().toISOString()
    })
    .eq('id', appointmentId);

  if (error) {
    logger.error('Error marking no-show:', error);
    return false;
  }

  return true;
}

/**
 * Get appointments needing reminders
 * Used by scheduled job to send reminder emails
 */
export async function getAppointmentsNeedingReminders(
  hoursBeforeAppointment: number
): Promise<any[]> {
  const supabase = await createClient();

  const targetTime = new Date();
  targetTime.setHours(targetTime.getHours() + hoursBeforeAppointment);

  const windowStart = new Date(targetTime);
  windowStart.setMinutes(windowStart.getMinutes() - 30);

  const windowEnd = new Date(targetTime);
  windowEnd.setMinutes(windowEnd.getMinutes() + 30);

  const { data, error }: any = await supabase
    .from('appointments')
    .select(`
      *,
      profiles!appointments_student_id_fkey(
        first_name,
        email
      )
    `)
    .eq('status', 'scheduled')
    .gte('scheduled_time', windowStart.toISOString())
    .lte('scheduled_time', windowEnd.toISOString());

  if (error) {
    logger.error('Error fetching appointments for reminders:', error);
    return [];
  }

  return data || [];
}

/**
 * Real contact information for appointments
 */
export const APPOINTMENT_CONTACT = {
  phone: '(317) 314-3757',
  email: 'info@elevateforhumanity.org',
  address: '8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240',
  hours: 'Monday-Friday, 9:00 AM - 5:00 PM EST'
};
