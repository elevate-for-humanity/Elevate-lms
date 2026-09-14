'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  IMAGE_RELEASE_TEXT,
  IMAGE_RELEASE_VERSION,
} from '@/lib/profile/image-release-constants';

const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function revalidateProfilePaths() {
  revalidatePath('/account/profile');
  revalidatePath('/lms/profile');
  revalidatePath('/lms/settings/profile');
  revalidatePath('/program-holder/dashboard');
  revalidatePath('/program-holder/settings');
  revalidatePath('/employer/dashboard');
  revalidatePath('/host-shop/dashboard');
  revalidatePath('/staff/dashboard');
  revalidatePath('/apprentice/dashboard');
}

export async function uploadProfileAvatar(file: File) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in again before uploading your profile photo.' };

  if (!ALLOWED_AVATAR_TYPES.has(file.type) || file.size > MAX_AVATAR_BYTES) {
    return { error: 'Choose a JPG, PNG, or WebP image no larger than 2 MB.' };
  }

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const objectPath = `${user.id}/profile-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(objectPath, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: `Photo upload failed: ${uploadError.message}` };

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(objectPath);
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select('id')
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.storage.from('avatars').remove([objectPath]);
    return { error: 'The photo uploaded, but the profile record could not be updated.' };
  }

  revalidateProfilePaths();
  return { success: true, url: publicUrl };
}

export async function getImageReleaseStatus() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in again to review the image release.' };

  const { data, error } = await (supabase as any)
    .from('image_release_consents')
    .select('id,participant_name,signed_name,signer_capacity,guardian_relationship,consent_scope,document_version,signed_at,granted,revoked_at')
    .eq('user_id', user.id)
    .eq('granted', true)
    .is('revoked_at', null)
    .order('signed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { error: 'The image-release status could not be loaded.' };
  return { consent: data ?? null };
}

export async function signImageRelease(input: {
  participantName: string;
  signedName: string;
  signerCapacity: 'self' | 'parent_guardian';
  guardianRelationship?: string;
  consentScope: 'internal_only' | 'internal_and_public';
}) {
  const participantName = input.participantName.trim();
  const signedName = input.signedName.trim();
  const guardianRelationship = input.guardianRelationship?.trim() || null;

  if (participantName.length < 2 || signedName.length < 2) {
    return { error: 'Enter the participant name and the signer’s full legal name.' };
  }
  if (input.signerCapacity === 'parent_guardian' && !guardianRelationship) {
    return { error: 'Enter the parent or guardian relationship.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in again before signing the image release.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const allowedRoles = new Set([
    'program_holder',
    'staff',
    'employee',
    'instructor',
    'apprentice',
    'student',
    'learner',
    'host_shop',
    'employer',
    'admin',
    'super_admin',
  ]);
  const role = String(profile?.role || 'learner');
  if (!allowedRoles.has(role)) return { error: 'This account role cannot sign this release.' };

  const { data: active } = await (supabase as any)
    .from('image_release_consents')
    .select('id,document_version')
    .eq('user_id', user.id)
    .eq('granted', true)
    .is('revoked_at', null)
    .maybeSingle();

  if (active?.id && active.document_version === IMAGE_RELEASE_VERSION) {
    return { success: true, alreadySigned: true };
  }
  if (active?.id) {
    await (supabase as any)
      .from('image_release_consents')
      .update({ granted: false, revoked_at: new Date().toISOString(), revoked_reason: 'Superseded by a newer document version', updated_at: new Date().toISOString() })
      .eq('id', active.id)
      .eq('user_id', user.id);
  }

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
  const { error } = await (supabase as any).from('image_release_consents').insert({
    user_id: user.id,
    role,
    participant_name: participantName,
    signed_name: signedName,
    signer_capacity: input.signerCapacity,
    guardian_relationship: input.signerCapacity === 'parent_guardian' ? guardianRelationship : null,
    consent_scope: input.consentScope,
    document_version: IMAGE_RELEASE_VERSION,
    release_text: IMAGE_RELEASE_TEXT,
    granted: true,
    signed_at: new Date().toISOString(),
    ip_address: forwardedFor,
    user_agent: requestHeaders.get('user-agent'),
  });

  if (error) return { error: `Image release could not be saved: ${error.message}` };
  revalidateProfilePaths();
  return { success: true };
}

export async function revokeImageRelease(reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in again before changing the image release.' };

  const { error } = await (supabase as any)
    .from('image_release_consents')
    .update({
      granted: false,
      revoked_at: new Date().toISOString(),
      revoked_reason: reason?.trim() || 'Revoked by signer from dashboard',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('granted', true)
    .is('revoked_at', null);

  if (error) return { error: 'The image release could not be revoked.' };
  revalidateProfilePaths();
  return { success: true };
}
