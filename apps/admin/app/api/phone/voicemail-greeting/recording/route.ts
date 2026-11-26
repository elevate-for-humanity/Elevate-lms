import { NextRequest, NextResponse } from 'next/server';
import { apiRequireRoles } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';
import { PHONE_MANAGER_ROLES } from '@/lib/phone/access';
import {
  VOICEMAIL_GREETING_BUCKET,
  voicemailGreetingRecordingPath,
} from '@/lib/phone/voicemail-greeting';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_RECORDING_BYTES = 2 * 1024 * 1024; // ~2 MB ≈ several minutes of voice
const MIME_EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'mp4',
  'audio/x-m4a': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
};

/**
 * POST /api/phone/voicemail-greeting/recording — store a voicemail greeting
 * the admin recorded in the dashboard (Communications Hub → Phone).
 *
 * The browser captures the admin's voice with MediaRecorder and posts the
 * audio here; the file lands in the private `phone-greetings` bucket and
 * the returned path is saved with the greeting settings form. The PBX-side
 * greeting applier later converts and installs it as the mailbox greeting.
 * Uploading does not change any setting by itself — the form's save does.
 *
 * Form fields: audio (file), scope ('system' or an extension row id),
 * extension (the mailbox number the greeting belongs to, for the path).
 */
export async function POST(request: NextRequest) {
  const auth = await apiRequireRoles(request, PHONE_MANAGER_ROLES);
  if (auth.error) return auth.error;

  const formData = await request.formData().catch(() => null);
  if (!formData) return safeError('Expected an audio upload.', 400);
  const audio = formData.get('audio');
  if (!(audio instanceof File)) return safeError('Attach the recorded greeting audio.', 400);
  if (audio.size === 0) return safeError('That recording is empty — record it again.', 400);
  if (audio.size > MAX_RECORDING_BYTES)
    return safeError('That recording is too long. Keep the greeting under a minute or so.', 400);
  const mime = (audio.type || '').split(';')[0].trim().toLowerCase();
  const extension = MIME_EXTENSIONS[mime];
  if (!extension)
    return safeError('That audio type is not supported. Try recording again in this browser.', 400);

  const scopeRaw = String(formData.get('scope') ?? 'system');
  const scope = /^[0-9a-f-]{36}$/i.test(scopeRaw) ? scopeRaw : 'system';
  const mailbox = String(formData.get('extension') ?? '');

  const db = await requireAdminClient();
  if (!db) return safeError('Database unavailable', 503);

  // The bucket is created by the voicemail_greeting_config migration; make
  // sure it exists either way, with the same private posture the internal
  // voicemail route enforces for phone-voicemails.
  const { data: bucket, error: bucketError } = await db.storage.getBucket(
    VOICEMAIL_GREETING_BUCKET,
  );
  if (bucketError && !bucket) {
    const { error: createError } = await db.storage.createBucket(VOICEMAIL_GREETING_BUCKET, {
      public: false,
      fileSizeLimit: MAX_RECORDING_BYTES,
      allowedMimeTypes: Object.keys(MIME_EXTENSIONS),
    });
    if (createError) return safeError('Greeting audio storage is unavailable.', 503);
  } else if (bucket?.public) {
    return safeError('Greeting audio storage is misconfigured.', 503);
  }

  const path = voicemailGreetingRecordingPath(
    scope === 'system' ? 'system' : 'extensions',
    mailbox,
    crypto.randomUUID(),
    extension,
  );
  const { error: uploadError } = await db.storage
    .from(VOICEMAIL_GREETING_BUCKET)
    .upload(path, audio, { contentType: mime, upsert: false });
  if (uploadError) return safeError('The recording could not be stored. Try again.', 502);

  return NextResponse.json({ path });
}
