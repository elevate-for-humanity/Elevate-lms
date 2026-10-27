import 'server-only';
import webpush from 'web-push';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getSecrets } from '@/lib/secrets';
import { ALERT_PHRASES, isPushEndpoint } from './pwa-alert-settings';
export async function processPwaAlerts() {
  const db = await requireAdminClient();
  const { error: emitError } = await db.rpc('emit_recorded_student_alerts');
  if (emitError) throw Error('Student alert generation unavailable');
  const config = await getSecrets(['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY']);
  const publicKey = config.VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY,
    privateKey = config.VAPID_PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return { configured: false, accepted: 0, review: 0 };
  const { data: rows, error } = await db.rpc('claim_pwa_alert_deliveries', { batch_size: 4 });
  if (error) throw Error('PWA delivery claim unavailable');
  let accepted = 0,
    review = 0;
  await Promise.all(
    (rows || []).map(async (row: any) => {
      let state = 'skipped',
        acceptedDevices = 0;
      try {
        const { data: preferences } = await db
          .from('pwa_alert_preferences')
          .select('sound,volume,profile:profiles!user_id(role)')
          .eq('user_id', row.user_id)
          .maybeSingle();
        const profile = Array.isArray(preferences?.profile)
          ? preferences.profile[0]
          : preferences?.profile;
        const { data: devices, error: deviceError } = await db
          .from('push_subscriptions')
          .select('endpoint,p256dh,auth')
          .eq('user_id', row.user_id)
          .eq('active', true)
          .limit(5);
        if (deviceError) throw Error('Device list unavailable');
        if (devices?.length) {
          const results = await Promise.allSettled(
            devices
              .filter((device: any) => isPushEndpoint(device.endpoint))
              .map(async (device: any) => {
                await webpush.sendNotification(
                  { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
                  JSON.stringify({
                    title: 'PARIS · Elevate',
                    silent: preferences?.sound === 'silent' || Number(preferences?.volume) === 0,
                    body: ALERT_PHRASES[row.kind as keyof typeof ALERT_PHRASES],
                    url:
                      row.kind === 'email'
                        ? ['admin', 'super_admin'].includes(profile?.role)
                          ? 'https://admin.elevateforhumanity.org/phone/email'
                          : 'https://app.elevateforhumanity.org/communications/email'
                        : row.kind === 'inactive'
                          ? 'https://admin.elevateforhumanity.org/at-risk'
                          : 'https://admin.elevateforhumanity.org/students',
                    tag: 'pwa-alert-' + row.notification_id,
                  }),
                  {
                    TTL: 300,
                    timeout: 5000,
                    vapidDetails: {
                      subject: 'mailto:admin@elevateforhumanity.org',
                      publicKey,
                      privateKey,
                    },
                  },
                );
              }),
          );
          acceptedDevices = results.filter((r) => r.status === 'fulfilled').length;
          state = !results.length
            ? 'skipped'
            : results.some((r) => r.status === 'rejected')
              ? 'review_required'
              : 'accepted';
        }
      } catch {
        state = 'review_required';
      }
      const { error: saveError } = await db
        .from('pwa_alert_deliveries')
        .update({
          status: state,
          accepted_devices: acceptedDevices,
          finished_at: new Date().toISOString(),
        })
        .eq('notification_id', row.notification_id)
        .eq('status', 'processing');
      if (saveError || state === 'review_required') review++;
      else if (state === 'accepted') accepted++;
    }),
  );
  return { configured: true, accepted, review };
}
