/**
 * Grant Notification System
 * Multi-channel notifications: Dashboard + Email + SMS
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { EmailService } from '@/lib/notifications/email';
import { SMSService } from '@/lib/notifications/sms';

export type GrantNotificationType =
  | 'draft_generated'
  | 'ready_for_review'
  | 'package_ready'
  | 'submitted'
  | 'deadline_7_days'
  | 'deadline_72_hours'
  | 'deadline_24_hours'
  | 'deadline_3_hours'
  | 'award_decision'
  | 'eligibility_issue';

export interface GrantNotification {
  id?: string;
  type: GrantNotificationType;
  grantId: string;
  applicationId?: string;
  entityId: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface NotificationRecipient {
  userId?: string;
  email: string;
  phone?: string;
  name: string;
  role: 'founder' | 'admin' | 'staff' | 'finance';
}

/**
 * Create in-system notification
 */
export async function createNotification(
  notification: Omit<GrantNotification, 'id' | 'createdAt' | 'read'>
): Promise<GrantNotification> {
  const { data, error }: any = await supabaseAdmin
    .from('grant_notifications')
    .insert({
      type: notification.type,
      grant_id: notification.grantId,
      application_id: notification.applicationId,
      entity_id: notification.entityId,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      read: false,
      metadata: notification.metadata || {},
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Error: $1
    throw error;
  }

  return {
    id: data.id,
    type: data.type,
    grantId: data.grant_id,
    applicationId: data.application_id,
    entityId: data.entity_id,
    title: data.title,
    message: data.message,
    priority: data.priority,
    read: data.read,
    createdAt: new Date(data.created_at),
    metadata: data.metadata,
  };
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  recipient: NotificationRecipient,
  notification: GrantNotification,
  grantTitle: string,
  entityName: string
): Promise<void> {
  const subject = `${getNotificationEmoji(notification.type)} ${notification.title}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .notification-box { background: white; border-left: 4px solid ${getPriorityColor(notification.priority)}; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    .metadata { background: #e5e7eb; padding: 15px; border-radius: 4px; margin-top: 15px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${getNotificationEmoji(notification.type)} Grant Autopilot Alert</h1>
    </div>
    <div class="content">
      <h2>Hello ${recipient.name},</h2>

      <div class="notification-box">
        <h3>${notification.title}</h3>
        <p>${notification.message}</p>
      </div>

      <div class="metadata">
        <strong>Grant:</strong> ${grantTitle}<br>
        <strong>Entity:</strong> ${entityName}<br>
        <strong>Priority:</strong> ${notification.priority.toUpperCase()}<br>
        <strong>Time:</strong> ${notification.createdAt.toLocaleString()}
      </div>

      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/grants/workflow" class="button">
        View in Dashboard →
      </a>

      <div class="footer">
        <p>Elevate for Humanity Grant Autopilot System</p>
        <p>You're receiving this because you're a grant administrator.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/settings/notifications">Manage Notification Preferences</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const emailService = EmailService.getInstance();
  await emailService.send({
    to: recipient.email,
    subject,
    html,
    text: notification.message,
  });
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(
  recipient: NotificationRecipient,
  notification: GrantNotification,
  grantTitle: string
): Promise<void> {
  if (!recipient.phone) return;

  const message = `EFH GRANT ALERT: ${notification.title}\n\nGrant: ${grantTitle}\n\nPriority: ${notification.priority.toUpperCase()}\n\nView: ${process.env.NEXT_PUBLIC_APP_URL}/admin/grants/workflow`;

  const smsService = SMSService.getInstance();
  await smsService.send({
    to: recipient.phone,
    message,
  });
}

/**
 * Get notification recipients
 */
async function getNotificationRecipients(): Promise<NotificationRecipient[]> {
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, email, phone, full_name, role')
    .in('role', ['founder', 'admin', 'grant_admin']);

  if (!users) return [];

  return users.map((user) => ({
    userId: user.id,
    email: user.email,
    phone: user.phone,
    name: user.full_name || 'Team Member',
    role: user.role,
  }));
}

/**
 * Send notification to all channels
 */
export async function sendGrantNotification(
  notification: Omit<GrantNotification, 'id' | 'createdAt' | 'read'>,
  options: {
    sendEmail?: boolean;
    sendSMS?: boolean;
    recipients?: NotificationRecipient[];
  } = {}
): Promise<void> {
  const { sendEmail: emailEnabled = true, sendSMS: smsEnabled = false } = options;

  const createdNotification = await createNotification(notification);

  const { data: grant } = await supabaseAdmin
    .from('grant_opportunities')
    .select('title')
    .eq('id', notification.grantId)
    .single();

  const { data: entity } = await supabaseAdmin
    .from('entities')
    .select('name')
    .eq('id', notification.entityId)
    .single();

  const grantTitle = grant?.title || 'Unknown Grant';
  const entityName = entity?.name || 'Unknown Entity';

  const recipients = options.recipients || (await getNotificationRecipients());

  for (const recipient of recipients) {
    if (emailEnabled) {
      try {
        await sendEmailNotification(
          recipient,
          createdNotification,
          grantTitle,
          entityName
        );
      } catch (error) { /* Error handled silently */ 
        // Error: $1
      }
    }

    if (smsEnabled && notification.priority === 'urgent') {
      try {
        await sendSMSNotification(recipient, createdNotification, grantTitle);
      } catch (error) { /* Error handled silently */ 
        // Error: $1
      }
    }
  }

  await supabaseAdmin.from('grant_notification_log').insert({
    notification_id: createdNotification.id,
    sent_at: new Date().toISOString(),
    recipients_count: recipients.length,
    email_sent: emailEnabled,
    sms_sent: smsEnabled && notification.priority === 'urgent',
  });
}

/**
 * Notify when draft is generated
 */
export async function notifyDraftGenerated(
  applicationId: string
): Promise<void> {
  const { data: app } = await supabaseAdmin
    .from('grant_applications')
    .select('*, grant:grant_opportunities(title), entity:entities(name)')
    .eq('id', applicationId)
    .single();

  if (!app) return;

  await sendGrantNotification({
    type: 'draft_generated',
    grantId: app.grant_id,
    applicationId: app.id,
    entityId: app.entity_id,
    title: 'Grant Draft Generated',
    message: `AI has generated a complete draft for "${app.grant.title}" for ${app.entity.name}. Ready for review.`,
    priority: 'medium',
    metadata: {
      grantTitle: app.grant.title,
      entityName: app.entity.name,
    },
  });
}

/**
 * Notify when package is ready
 */
export async function notifyPackageReady(applicationId: string): Promise<void> {
  const { data: app } = await supabaseAdmin
    .from('grant_applications')
    .select('*, grant:grant_opportunities(title, due_date), entity:entities(name)')
    .eq('id', applicationId)
    .single();

  if (!app) return;

  await sendGrantNotification({
    type: 'package_ready',
    grantId: app.grant_id,
    applicationId: app.id,
    entityId: app.entity_id,
    title: 'Grant Package Ready for Submission',
    message: `Complete submission package for "${app.grant.title}" is ready. All forms, narratives, and attachments are included.`,
    priority: 'high',
    metadata: {
      grantTitle: app.grant.title,
      entityName: app.entity.name,
      dueDate: app.grant.due_date,
    },
  });
}

/**
 * Notify when grant is submitted
 */
export async function notifyGrantSubmitted(
  applicationId: string,
  submittedBy: string,
  confirmationNumber?: string
): Promise<void> {
  const { data: app } = await supabaseAdmin
    .from('grant_applications')
    .select('*, grant:grant_opportunities(title), entity:entities(name)')
    .eq('id', applicationId)
    .single();

  if (!app) return;

  await sendGrantNotification(
    {
      type: 'submitted',
      grantId: app.grant_id,
      applicationId: app.id,
      entityId: app.entity_id,
      title: '✅ Grant Submitted Successfully',
      message: `"${app.grant.title}" for ${app.entity.name} has been submitted by ${submittedBy}.${confirmationNumber ? ` Confirmation: ${confirmationNumber}` : ''}`,
      priority: 'high',
      metadata: {
        grantTitle: app.grant.title,
        entityName: app.entity.name,
        submittedBy,
        confirmationNumber,
        submittedAt: new Date().toISOString(),
      },
    },
    { sendSMS: true }
  );
}

/**
 * Notify about deadline approaching
 */
export async function notifyDeadlineApproaching(
  grantId: string,
  daysRemaining: number
): Promise<void> {
  const { data: grant } = await supabaseAdmin
    .from('grant_opportunities')
    .select('*, applications:grant_applications(id, entity:entities(name))')
    .eq('id', grantId)
    .single();

  if (!grant || !grant.applications || grant.applications.length === 0) return;

  const type =
    daysRemaining === 7
      ? 'deadline_7_days'
      : daysRemaining === 3
        ? 'deadline_72_hours'
        : daysRemaining === 1
          ? 'deadline_24_hours'
          : 'deadline_3_hours';

  const priority = daysRemaining <= 1 ? 'urgent' : daysRemaining <= 3 ? 'high' : 'medium';

  for (const app of grant.applications) {
    await sendGrantNotification(
      {
        type,
        grantId: grant.id,
        applicationId: app.id,
        entityId: app.entity_id,
        title: `⏰ Grant Deadline: ${daysRemaining <= 1 ? `${daysRemaining * 24} hours` : `${daysRemaining} days`} remaining`,
        message: `"${grant.title}" deadline is approaching. Due: ${new Date(grant.due_date).toLocaleDateString()}`,
        priority,
        metadata: {
          grantTitle: grant.title,
          dueDate: grant.due_date,
          daysRemaining,
        },
      },
      { sendSMS: priority === 'urgent' }
    );
  }
}

/**
 * Helper functions
 */
function getNotificationEmoji(type: GrantNotificationType): string {
  const emojiMap: Record<GrantNotificationType, string> = {
    draft_generated: '🟢',
    ready_for_review: '🔵',
    package_ready: '🟣',
    submitted: '✅',
    deadline_7_days: '⏰',
    deadline_72_hours: '⚠️',
    deadline_24_hours: '🚨',
    deadline_3_hours: '🔴',
    award_decision: '🎉',
    eligibility_issue: '❌',
  };
  return emojiMap[type] || '📢';
}

function getPriorityColor(priority: string): string {
  const colorMap: Record<string, string> = {
    low: '#10b981',
    medium: '#3b82f6',
    high: '#f59e0b',
    urgent: '#ef4444',
  };
  return colorMap[priority] || '#6b7280';
}
