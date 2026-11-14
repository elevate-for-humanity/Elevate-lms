import type { SupabaseClient } from '@supabase/supabase-js';
import {
  programHolderMailboxDisplayName,
  selectPrimaryMailbox,
  type CommunicationMailboxKind,
  type CommunicationMailboxSummary,
} from './communication-email';

export interface ActorMailbox extends CommunicationMailboxSummary {
  address: string;
  displayName: string;
  active: boolean;
}

function relationRow<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export async function ensureActorMailboxes(
  db: SupabaseClient<any>,
  userId: string,
): Promise<ActorMailbox[]> {
  // Mailbox reads must not change identity or membership. Provisioning is handled
  // by the database lifecycle triggers and explicit administrative workflows.

  const [{ data, error }, { data: profile, error: profileError }, { data: holderRecords, error: holderError }] = await Promise.all([
    db
      .from('communication_email_mailbox_members')
      .select(
        'access_level, mailbox:communication_email_mailboxes!inner(id,address,display_name,mailbox_kind,active)',
      )
      .eq('user_id', userId)
      .eq('mailbox.active', true),
    db.from('profiles').select('full_name,role').eq('id', userId).maybeSingle(),
    // Match the session role guard: any archived holder record must hide its
    // historical mailbox, even when it is not the first record returned.
    db.from('program_holders').select('features').eq('user_id', userId),
  ]);
  // Never authorize a historical mailbox when the canonical actor role is
  // unknown. A transient profile read error otherwise bypasses archived-role
  // filtering and exposes the Program Holder mailbox in a Host Shop session.
  if (error || profileError || holderError) throw error || profileError || holderError;
  if (!profile?.role) throw new Error('MAILBOX_PROFILE_UNAVAILABLE');
  // Archived Program Holder mail remains stored for later administrative
  // restoration, but a Host Shop-only account must not access that mailbox
  // through its current dashboard or interoffice API.
  const holderPortalArchived = profile?.role === 'host_shop' &&
    (holderRecords ?? []).some((holder: any) => holder?.features?.portal_access_archived === true);

  const mailboxes = (data ?? [])
    .map((membership: any) => {
      const mailbox = relationRow<any>(membership.mailbox);
      if (!mailbox) return null;
      return {
        id: String(mailbox.id),
        address: String(mailbox.address),
        displayName:
          mailbox.mailbox_kind === 'program_holder'
            ? programHolderMailboxDisplayName(profile?.full_name || mailbox.display_name)
            : String(mailbox.display_name),
        mailboxKind: mailbox.mailbox_kind as CommunicationMailboxKind,
        active: mailbox.active !== false,
        accessLevel: membership.access_level,
      } satisfies ActorMailbox;
    })
    .filter((mailbox) => mailbox !== null &&
      !(holderPortalArchived && mailbox.mailboxKind === 'program_holder')) as ActorMailbox[];
  return mailboxes.sort((a, b) => a.address.localeCompare(b.address));
}

export function actorPrimaryMailbox(mailboxes: ActorMailbox[]): ActorMailbox | null {
  return selectPrimaryMailbox(mailboxes);
}
