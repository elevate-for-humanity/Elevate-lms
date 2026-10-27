import 'server-only';
import {sendEmail} from '@/lib/email/sendgrid';
import {deliverPhoneNotification,phoneEmailReady} from '@/lib/phone/notification-delivery';
import {PushNotificationService} from '@/lib/notifications/push-service';
import {sendSMS} from '@/lib/notifications/sms';
type System={id:string;admin_extension?:string|null};
const push=new PushNotificationService();
function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function appUrl(path: string) {
  const base =
    process.env.NEXT_PUBLIC_LMS_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://app.elevateforhumanity.org';
  return new URL(path, base).toString();
}

async function defaultAdminRoute(db: any, system: System) {
  const { data: workspace } = await db
    .from('communication_workspaces')
    .select('id')
    .eq('phone_system_id', system.id)
    .maybeSingle();
  if (!workspace) return {};
  const { data: extension } = await db
    .from('communication_extensions')
    .select('id,profile_id')
    .eq('workspace_id', workspace.id)
    .eq('extension', system.admin_extension || '0')
    .eq('enabled', true)
    .maybeSingle();
  return extension
    ? { extensionId: extension.id as string, profileId: extension.profile_id as string | undefined }
    : {};
}

async function notifyRecipient(
  db: any,
  input: {
    profileId?: string;
    taskId: string;
    caller: string;
    urgency: string;
    extension?: string;
    program?: string;
    reason?: string;
    summary?: string;
    transcript?: string;
    callbackNumber?: string;
    preferredCallbackTime?: string;
    adminCopy?: boolean;
    source?: 'voicemail' | 'paris';
    responsibleHolder?: string;
    awaitingTranscript?: boolean;
  },
) {
  const url = input.adminCopy
    ? new URL('/phone/inbox', process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org').toString()
    : input.profileId ? appUrl('/communications/phone') : appUrl('/phone/inbox');
  const messageType = input.source === 'voicemail' ? 'a voicemail' : 'details with PARIS';
  if (!input.profileId || !input.taskId) return;
  const identity = { taskId: input.taskId, profileId: input.profileId, kind: input.source || 'paris' as const };
  const deliveries: Array<Promise<unknown>> = [];
  const sendPush = () => deliverPhoneNotification(db, { ...identity, channel: 'push' }, async () => {
    const acceptedDeviceCount = await push.sendToUserWithDatabase(db, input.profileId!, {
    title: input.adminCopy ? 'Admin copy: new phone message' : input.urgency === 'urgent' ? 'Urgent call for your extension' : 'New call to return',
    body: `${input.caller} left ${messageType}. ${input.adminCopy ? 'The assigned holder remains responsible for follow-up.' : 'Open your secure phone inbox.'}`,
    icon: '/icon-192x192.png',
    badge: '/icon-72.png',
    url,
    tag: `phone-callback-${input.taskId}`,
    requireInteraction: input.urgency === 'urgent',
    vibrate: [200, 100, 200],
  });
    return { accepted: acceptedDeviceCount > 0, acceptedDeviceCount };
  });

  const [profileResult, preferencesResult] = input.profileId
    ? await Promise.all([
        db.from('profiles').select('email,full_name').eq('id', input.profileId).maybeSingle(),
        db.from('notification_preferences').select('email_missed_calls,sms_missed_calls,sms_phone').eq('user_id', input.profileId).maybeSingle(),
      ])
    : [{ data: null, error: null }, { data: null, error: null }];
  if (profileResult.error || preferencesResult.error) throw new Error('Phone notification preferences unavailable');
  const profile = profileResult.data;
  const preferences = preferencesResult.data;
  deliveries.push(sendPush());
  const detailLines = [
    input.adminCopy ? 'Admin oversight copy — callback responsibility remains with the assigned holder.' : '',
    input.source === 'voicemail' ? 'A voicemail was left. Open the secure inbox to listen.' : '',
    input.responsibleHolder ? `Responsible holder: ${input.responsibleHolder}` : '',
    `Callback reference: ${input.taskId}`,
    `Caller: ${input.caller}`,
    input.callbackNumber ? `Callback: ${input.callbackNumber}` : '',
    input.extension ? `Extension attempted: ${input.extension}` : '',
    input.program ? `Program/department: ${input.program}` : '',
    input.reason ? `Reason: ${input.reason}` : '',
    input.preferredCallbackTime ? `Preferred callback: ${input.preferredCallbackTime}` : '',
    input.summary ? `${input.source === 'voicemail' ? 'Voicemail' : 'PARIS'} summary: ${input.summary}` : '',
    input.transcript ? `Transcript: ${input.transcript}` : '',
  ].filter(Boolean);
  const readableDetails = detailLines.join('\n');
  if (preferences?.sms_missed_calls === true && preferences?.sms_phone) {
    deliveries.push(deliverPhoneNotification(db, { ...identity, channel: 'sms' }, async () => {
      const result = await sendSMS(preferences.sms_phone,
        `${input.urgency === 'urgent' ? 'URGENT: ' : ''}A new phone message is in your secure Elevate inbox. ${url}`);
      return { accepted: result.success, providerMessageId: result.messageId };
    }));
  }
  if (profile?.email && preferences?.email_missed_calls !== false && phoneEmailReady(input)) {
    deliveries.push(deliverPhoneNotification(db, { ...identity, channel: 'email' }, async () => {
      const result = await sendEmail({
        from: 'Elevate Phone <noreply@elevateforhumanity.org>', to: profile.email,
        subject: input.adminCopy ? 'Admin copy: phone message and callback follow-up' : input.urgency === 'urgent'
          ? 'Urgent call requires follow-up' : input.source === 'voicemail' ? (input.transcript ? 'New voicemail — transcript inside' : 'New voicemail — recording available') : 'New call in your Elevate Phone inbox',
        text: `${readableDetails}\n\nFull call record: ${url}`,
        html: `<p><strong>Call details</strong></p><pre style="white-space:pre-wrap;font-family:Arial,sans-serif">${escapeHtml(readableDetails)}</pre><p><a href="${escapeHtml(url)}">Open the full call record</a></p>`,
        singleAttempt: true,
      });
      return { accepted: result.success, providerMessageId: result.data?.messageId };
    }));
  }
  const results = await Promise.allSettled(deliveries);
  if (results.some(result => result.status === 'rejected' || result.value === 'review_required')) {
    throw new Error('Phone notification requires delivery review');
  }
}

export async function notifyAssignee(db: any, input: Parameters<typeof notifyRecipient>[1], system: System) {
  const admin = await defaultAdminRoute(db, system);
  const { data: holder } = input.profileId
    ? await db.from('profiles').select('full_name').eq('id', input.profileId).maybeSingle()
    : { data: null };
  input = { ...input, responsibleHolder: holder?.full_name || input.responsibleHolder };
  const recipients = [notifyRecipient(db, { ...input, adminCopy: Boolean(admin.profileId && admin.profileId === input.profileId) })];
  if (admin.profileId && admin.profileId !== input.profileId) {
    recipients.push(notifyRecipient(db, { ...input, profileId: admin.profileId, adminCopy: true }));
  }
  // One recipient's delivery failure must not prevent the other recipient's
  // notification. The shared call/task remains the durable inbox copy.
  for (const result of await Promise.allSettled(recipients)) {
    if (result.status === 'rejected') console.error('Phone message notification requires review; inspect durable delivery evidence.');
  }
}

