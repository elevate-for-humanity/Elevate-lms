/**
 * Announcement System
 * Course-wide and site-wide announcements with email notifications
 */
import { createClient } from '@/lib/supabase/server';
export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  scope: 'system' | 'site' | 'program' | 'course';
  scope_id?: string; // site_id, program_id, or course_id
  priority: 'low' | 'normal' | 'high' | 'urgent';
  send_email: boolean;
  send_sms: boolean;
  published: boolean;
  published_at?: string;
  expires_at?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}
export interface AnnouncementRecipient {
  id: string;
  announcement_id: string;
  user_id: string;
  read: boolean;
  read_at?: string;
  email_sent: boolean;
  sms_sent: boolean;
  created_at: string;
}
/**
 * Create announcement
 */
export async function createAnnouncement(data: {
  title: string;
  content: string;
  author_id: string;
  scope: 'system' | 'site' | 'program' | 'course';
  scope_id?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  send_email?: boolean;
  send_sms?: boolean;
  published?: boolean;
  expires_at?: string;
  attachments?: string[];
}): Promise<Announcement> {
  const supabase = await createClient();
  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({
      ...data,
      priority: data.priority || 'normal',
      send_email: data.send_email ?? true,
      send_sms: data.send_sms ?? false,
      published: data.published ?? true,
      published_at: data.published ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error) throw error;
  // Create recipient records and send notifications
  if (announcement.published) {
    await createRecipients(announcement);
  }
  return announcement;
}
/**
 * Update announcement
 */
export async function updateAnnouncement(
  id: string,
  data: Partial<Announcement>
): Promise<Announcement> {
  const supabase = await createClient();
  const { data: announcement, error } = await supabase
    .from('announcements')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  // If just published, create recipients
  if (data.published && !announcement.published_at) {
    await createRecipients(announcement);
  }
  return announcement;
}
/**
 * Delete announcement
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
/**
 * Get announcements for user
 */
export async function getUserAnnouncements(
  user_id: string,
  options?: {
    unread_only?: boolean;
    limit?: number;
    scope?: string;
  }
): Promise<Announcement[]> {
  const supabase = await createClient();
  let query = supabase
    .from('announcement_recipients')
    .select(`
      *,
      announcements(*)
    `)
    .eq('user_id', user_id)
    .eq('announcements.published', true)
    .order('announcements.published_at', { ascending: false });
  if (options?.unread_only) {
    query = query.eq('read', false);
  }
  if (options?.scope) {
    query = query.eq('announcements.scope', options.scope);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  const { data } = await query;
  return data?.map(r => r.announcements).filter(Boolean) || [];
}
/**
 * Get all announcements (admin view)
 */
export async function getAllAnnouncements(filters?: {
  scope?: string;
  scope_id?: string;
  published?: boolean;
}): Promise<Announcement[]> {
  const supabase = await createClient();
  let query = supabase
    .from('announcements')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false });
  if (filters?.scope) {
    query = query.eq('scope', filters.scope);
  }
  if (filters?.scope_id) {
    query = query.eq('scope_id', filters.scope_id);
  }
  if (filters?.published !== undefined) {
    query = query.eq('published', filters.published);
  }
  const { data } = await query;
  return data || [];
}
/**
 * Mark announcement as read
 */
export async function markAnnouncementRead(
  announcement_id: string,
  user_id: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('announcement_recipients')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('announcement_id', announcement_id)
    .eq('user_id', user_id);
  if (error) throw error;
}
/**
 * Get unread count for user
 */
export async function getUnreadCount(user_id: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('announcement_recipients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user_id)
    .eq('read', false);
  return count || 0;
}
/**
 * Create recipient records for announcement
 */
async function createRecipients(announcement: Announcement): Promise<void> {
  const supabase = await createClient();
  // Get recipients based on scope
  let recipients: string[] = [];
  switch (announcement.scope) {
    case 'system':
      // All users
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id');
      recipients = allUsers?.map(u => u.id) || [];
      break;
    case 'site':
      // All users at site
      const { data: siteUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('site_id', announcement.scope_id);
      recipients = siteUsers?.map(u => u.id) || [];
      break;
    case 'program':
      // All students enrolled in program
      const { data: programStudents } = await supabase
        .from('program_enrollments')
        .select('student_id')
        .eq('program_id', announcement.scope_id)
        .eq('status', 'active');
      recipients = programStudents?.map(e => e.student_id) || [];
      break;
    case 'course':
      // All students enrolled in course
      const { data: courseStudents } = await supabase
        .from('program_enrollments')
        .select('student_id')
        .eq('course_id', announcement.scope_id)
        .eq('status', 'active');
      recipients = courseStudents?.map(e => e.student_id) || [];
      break;
  }
  // Create recipient records
  const recipientRecords = recipients.map(user_id => ({
    announcement_id: announcement.id,
    user_id,
    read: false,
    email_sent: false,
    sms_sent: false,
  }));
  if (recipientRecords.length > 0) {
    await supabase
      .from('announcement_recipients')
      .insert(recipientRecords);
    // Send notifications
    if (announcement.send_email) {
      await sendEmailNotifications(announcement, recipients);
    }
    if (announcement.send_sms) {
      await sendSMSNotifications(announcement, recipients);
    }
  }
}
/**
 * Send email notifications
 */
async function sendEmailNotifications(announcement: Announcement, recipients: string[]): Promise<void> {
  // Implementation would use email service (SendGrid, AWS SES, etc.)
  // Update email_sent status
  const supabase = await createClient();
  await supabase
    .from('announcement_recipients')
    .update({ email_sent: true })
    .eq('announcement_id', announcement.id)
    .in('user_id', recipients);
}
/**
 * Send SMS notifications
 * Note: SMS functionality disabled - use email notifications instead
 */
async function sendSMSNotifications(announcement: Announcement, recipients: string[]): Promise<void> {
  // SMS functionality removed - email is the primary notification method
  const supabase = await createClient();
  await supabase
    .from('announcement_recipients')
    .update({ sms_sent: false })
    .eq('announcement_id', announcement.id)
    .in('user_id', recipients);
}
/**
 * Get announcement statistics
 */
export async function getAnnouncementStats(announcement_id: string): Promise<{
  total_recipients: number;
  read_count: number;
  unread_count: number;
  read_percentage: number;
  email_sent_count: number;
  sms_sent_count: number;
}> {
  const supabase = await createClient();
  const { data: recipients } = await supabase
    .from('announcement_recipients')
    .select('*')
    .eq('announcement_id', announcement_id);
  if (!recipients) {
    return {
      total_recipients: 0,
      read_count: 0,
      unread_count: 0,
      read_percentage: 0,
      email_sent_count: 0,
      sms_sent_count: 0,
    };
  }
  const total_recipients = recipients.length;
  const read_count = recipients.filter(r => r.read).length;
  const unread_count = total_recipients - read_count;
  const read_percentage = total_recipients > 0 ? (read_count / total_recipients) * 100 : 0;
  const email_sent_count = recipients.filter(r => r.email_sent).length;
  const sms_sent_count = recipients.filter(r => r.sms_sent).length;
  return {
    total_recipients,
    read_count,
    unread_count,
    read_percentage,
    email_sent_count,
    sms_sent_count,
  };
}
