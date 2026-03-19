import { logger } from '@/lib/logger';
/**
 * Real-Time Notification System for Elevate for Humanity
 * In-app notifications with database persistence
 */

import { createClient } from '@/lib/supabase/server';

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'requirement'
  | 'appointment'
  | 'verification'
  | 'funding'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  read: boolean;
  created_at: string;
  read_at?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification
 */
export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}): Promise<string | null> {
  const supabase = await createClient();

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      action_url: data.actionUrl,
      action_label: data.actionLabel,
      metadata: data.metadata || {},
      read: false,
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Error creating notification:', error);
    return null;
  }

  return notification?.id || null;
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching unread notifications:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50
): Promise<Notification[]> {
  const supabase = await createClient();

  const { data, error }: any = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error fetching user notifications:', error);
    return [];
  }

  return data || [];
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    logger.error('Error marking notification as read:', error);
    return false;
  }

  return true;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    logger.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    logger.error('Error deleting notification:', error);
    return false;
  }

  return true;
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) {
    logger.error('Error getting unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Notification Templates
 */

/**
 * Notify student of new requirement
 */
export async function notifyNewRequirement(
  studentId: string,
  requirementTitle: string,
  dueDate: string,
  requirementId: string
): Promise<void> {
  await createNotification({
    userId: studentId,
    type: 'requirement',
    title: 'New Requirement Added',
    message: `You have a new requirement: ${requirementTitle}. Due: ${dueDate}`,
    actionUrl: `/lms/dashboard`,
    actionLabel: 'View Requirements',
    metadata: {
      requirement_id: requirementId,
      due_date: dueDate,
    },
  });
}

/**
 * Notify student of upcoming requirement deadline
 */
export async function notifyRequirementDeadline(
  studentId: string,
  requirementTitle: string,
  daysUntilDue: number,
  requirementId: string
): Promise<void> {
  await createNotification({
    userId: studentId,
    type: 'warning',
    title: 'Requirement Due Soon',
    message: `"${requirementTitle}" is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
    actionUrl: `/lms/dashboard`,
    actionLabel: 'Complete Now',
    metadata: {
      requirement_id: requirementId,
      days_until_due: daysUntilDue,
    },
  });
}

/**
 * Notify student of overdue requirement
 */
export async function notifyOverdueRequirement(
  studentId: string,
  requirementTitle: string,
  daysOverdue: number,
  requirementId: string
): Promise<void> {
  await createNotification({
    userId: studentId,
    type: 'error',
    title: 'Overdue Requirement',
    message: `"${requirementTitle}" is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue. Please complete as soon as possible.`,
    actionUrl: `/lms/dashboard`,
    actionLabel: 'Complete Now',
    metadata: {
      requirement_id: requirementId,
      days_overdue: daysOverdue,
    },
  });
}

/**
 * Notify student of requirement verification
 */
export async function notifyRequirementVerified(
  studentId: string,
  requirementTitle: string,
  approved: boolean,
  reason?: string
): Promise<void> {
  await createNotification({
    userId: studentId,
    type: approved ? 'success' : 'warning',
    title: approved ? 'Requirement Approved' : 'Requirement Needs Revision',
    message: approved
      ? `Your "${requirementTitle}" has been verified and approved.`
      : `Your "${requirementTitle}" needs revision. ${reason || 'Please review and resubmit.'}`,
    actionUrl: `/lms/dashboard`,
    actionLabel: approved ? 'View Progress' : 'Revise Requirement',
    metadata: {
      approved,
      reason,
    },
  });
}

/**
 * Notify student of appointment confirmation
 */
export async function notifyAppointmentConfirmed(
  studentId: string,
  appointmentType: string,
  scheduledTime: string,
  appointmentId: string
): Promise<void> {
  await createNotification({
    userId: studentId,
    type: 'appointment',
    title: 'Appointment Confirmed',
    message: `Your ${appointmentType} appointment is scheduled for ${scheduledTime}`,
    actionUrl: `/lms/appointments`,
    actionLabel: 'View Details',
    metadata: {
      appointment_id: appointmentId,
      scheduled_time: scheduledTime,
    },
  });
}

/**
 * Notify student of appointment reminder
 */
export async function notifyAppointmentReminder(
  studentId: string,
  appointmentType: string,
  hoursUntil: number,
  appointmentId: string
): Promise<void> {
  await createNotification({
    userId: studentId,
    type: 'appointment',
    title: 'Appointment Reminder',
    message: `Your ${appointmentType} appointment is in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`,
    actionUrl: `/lms/appointments`,
    actionLabel: 'View Details',
    metadata: {
      appointment_id: appointmentId,
      hours_until: hoursUntil,
    },
  });
}

/**
 * Notify program holder of pending verification
 */
export async function notifyPendingVerification(
  programHolderId: string,
  studentName: string,
  requirementTitle: string,
  requirementId: string
): Promise<void> {
  await createNotification({
    userId: programHolderId,
    type: 'verification',
    title: 'Verification Needed',
    message: `${studentName} has completed "${requirementTitle}" and needs verification`,
    actionUrl: `/program-holder/verifications`,
    actionLabel: 'Review Now',
    metadata: {
      requirement_id: requirementId,
      student_name: studentName,
    },
  });
}

/**
 * Notify advisor of at-risk student
 */
export async function notifyAtRiskStudent(
  advisorId: string,
  studentName: string,
  riskFactors: string[],
  studentId: string
): Promise<void> {
  await createNotification({
    userId: advisorId,
    type: 'warning',
    title: 'Student At-Risk Alert',
    message: `${studentName} has been flagged as at-risk. Immediate intervention recommended.`,
    actionUrl: `/admin/at-risk`,
    actionLabel: 'View Details',
    metadata: {
      student_id: studentId,
      risk_factors: riskFactors,
    },
  });
}

/**
 * Notify user of funding assignment
 */
export async function notifyFundingAssigned(
  studentId: string,
  fundingSource: string,
  amount: number
): Promise<void> {
  await createNotification({
    userId: studentId,
    type: 'funding',
    title: 'Funding Approved',
    message: `You've been approved for ${fundingSource} funding: $${amount.toFixed(2)}`,
    actionUrl: `/lms/dashboard`,
    actionLabel: 'View Details',
    metadata: {
      funding_source: fundingSource,
      amount,
    },
  });
}

/**
 * Notify user of enrollment confirmation
 */
export async function notifyEnrollmentConfirmed(
  studentId: string,
  programName: string,
  startDate: string
): Promise<void> {
  await createNotification({
    userId: studentId,
    type: 'success',
    title: 'Enrollment Confirmed',
    message: `You're enrolled in ${programName}. Start date: ${startDate}`,
    actionUrl: `/lms/dashboard`,
    actionLabel: 'View Dashboard',
    metadata: {
      program_name: programName,
      start_date: startDate,
    },
  });
}

/**
 * Notify user of system message
 */
export async function notifySystemMessage(
  userId: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionLabel?: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'system',
    title,
    message,
    actionUrl,
    actionLabel,
  });
}

/**
 * Cleanup old notifications
 * Should be run as a scheduled job
 */
export async function cleanupOldNotifications(retentionDays: number = 90): Promise<number> {
  const supabase = await createClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const { data, error }: any = await supabase
    .from('notifications')
    .delete()
    .eq('read', true)
    .lt('created_at', cutoffDate.toISOString())
    .select('id');

  if (error) {
    logger.error('Error cleaning up old notifications:', error);
    return 0;
  }

  return data?.length || 0;
}
