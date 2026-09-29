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
  const { error: provisionError } = await db.rpc('communication_email_provision_user', {
    p_user_id: userId,
  });
  if (provisionError) throw provisionError;

  const [{ data, error }, { data: profile }] = await Promise.all([
    db
      .from('communication_email_mailbox_members')
      .select(
        'access_level, mailbox:communication_email_mailboxes!inner(id,address,display_name,mailbox_kind,active)',
      )
      .eq('user_id', userId)
      .eq('mailbox.active', true),
    db.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
  ]);
  if (error) throw error;

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
    .filter((mailbox) => mailbox !== null) as ActorMailbox[];
  return mailboxes.sort((a, b) => a.address.localeCompare(b.address));
}

export function actorPrimaryMailbox(mailboxes: ActorMailbox[]): ActorMailbox | null {
  return selectPrimaryMailbox(mailboxes);
}
