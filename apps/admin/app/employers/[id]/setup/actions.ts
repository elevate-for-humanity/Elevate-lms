'use server';
import type { User } from '@supabase/supabase-js';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { redirect } from 'next/navigation';
import { resolveDocumentStorageLocator } from '@/lib/admin/document-record';

/** Prepare a limited employer identity. Never confirms email, approves onboarding, or sends mail. */
export async function prepareEmployerAccount(form: FormData) {
  const { user: actor } = await requireRole(['admin']);
  const id = String(form.get('employerId') || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    throw new Error('Invalid employer');
  const db = await requireAdminClient();
  const { data: employer, error } = await db
    .from('employers')
    .select('id,owner_user_id,email,contact_email,contact_name,company_name')
    .eq('id', id)
    .single();
  if (error || !employer) throw new Error('Employer could not be loaded');
  const email = String(employer.email || employer.contact_email || '')
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /@example\.(com|org|net)$/i.test(email))
    throw new Error('A verified contact address is required');
  let userId: string | null = employer.owner_user_id;
  let created = false;
  if (!userId) {
    // Auth owns identity creation. Search all pages so a retry cannot duplicate an orphaned account.
    let existing: User | null = null;
    for (let page = 1; ; page++) {
      const result = await db.auth.admin.listUsers({ page, perPage: 200 });
      if (result.error) throw new Error('Existing accounts could not be checked');
      existing =
        (result.data.users as User[]).find((account) => account.email?.toLowerCase() === email) ||
        null;
      if (existing || result.data.users.length < 200) break;
    }
    if (existing) {
      // Reuse only an identity this employer preparation already created. Never repurpose another account.
      if (existing.app_metadata?.employer_id !== id || existing.app_metadata?.role !== 'employer')
        throw new Error('An existing account requires an explicit ownership review before linking');
      userId = existing.id;
      created = true;
    } else {
      const result = await db.auth.admin.createUser({
        email,
        email_confirm: false,
        app_metadata: { role: 'employer', employer_id: id },
        user_metadata: {
          full_name: employer.contact_name || '',
          company_name: employer.company_name || '',
        },
      });
      if (result.error || !result.data.user)
        throw new Error('Employer login could not be prepared');
      userId = result.data.user.id;
      created = true;
    }
    const { error: profileError } = await db.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: employer.contact_name || '',
        company_name: employer.company_name || '',
        role: 'employer',
        verified: false,
      },
      { onConflict: 'id' },
    );
    if (profileError)
      throw new Error(
        'Employer profile could not be prepared. Retry without sending an invitation.',
      );
    // Profile provisioning may already have claimed this pending employer by exact email.
    const { data: currentOwner, error: ownerError } = await db
      .from('employers')
      .select('owner_user_id')
      .eq('id', id)
      .single();
    if (ownerError || !currentOwner) throw new Error('Employer ownership could not be checked.');
    if (currentOwner.owner_user_id && currentOwner.owner_user_id !== userId)
      throw new Error('Employer ownership changed. Review the account before continuing.');
    if (!currentOwner.owner_user_id) {
      const { data: linked, error: linkError } = await db
        .from('employers')
        .update({ owner_user_id: userId })
        .eq('id', id)
        .is('owner_user_id', null)
        .select('id')
        .maybeSingle();
      if (linkError || !linked)
        throw new Error('Employer ownership could not be linked. Reload before retrying.');
    }
  }
  const { data: documents, error: documentError } = await db
    .from('documents')
    .select('id,user_id,file_path,file_url,metadata')
    .eq('owner_type', 'employer')
    .eq('owner_id', id);
  if (documentError) throw new Error('Employer files could not be loaded.');
  for (const document of documents || []) {
    if (document.user_id && document.user_id !== userId)
      throw new Error('A file belongs to another login. Review ownership before continuing.');
    const locator = resolveDocumentStorageLocator(document);
    if (!locator || locator.bucket !== 'documents')
      throw new Error('A recovered file requires storage review.');
    let path = locator.path;
    if (!path.startsWith(`${userId}/`)) {
      const extension =
        path
          .split('.')
          .pop()
          ?.replace(/[^a-z0-9]/gi, '')
          .slice(0, 10) || 'bin';
      path = `${userId}/recovered/${document.id}.${extension}`;
      const copied = await db.storage.from('documents').copy(locator.path, path);
      // A retry may find the exact deterministic copy already created. Never overwrite it.
      if (
        copied.error &&
        (!('statusCode' in copied.error) || String(copied.error.statusCode) !== '409')
      )
        throw new Error(
          'A recovered file could not be copied into the employer account. Retry before inviting.',
        );
    }
    const linked = await db
      .from('documents')
      .update({
        user_id: userId,
        file_path: path,
        storage_path: path,
        file_url: null,
        metadata: { ...document.metadata, storage_bucket: 'documents', storage_path: path },
      })
      .eq('id', document.id)
      .eq('owner_type', 'employer')
      .eq('owner_id', id)
      .select('id')
      .maybeSingle();
    if (linked.error || !linked.data)
      throw new Error('Employer file linkage failed. Retry before inviting.');
  }
  await logAdminAudit({
    action: AdminAction.EMPLOYER_CREATED,
    actorId: actor.id,
    entityType: 'employers',
    entityId: id,
    metadata: {
      operation: 'prepare_employer_account',
      user_id: userId,
      identity_prepared: created,
      invitation_sent: false,
    },
  });
  redirect(`/employers/${id}/setup?prepared=1`);
}
