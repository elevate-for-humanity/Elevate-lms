import { parseEmailList } from './communication-email';
export type MailFilter = {
  field: 'sender' | 'subject' | 'body';
  contains: string;
  action: 'skip' | 'folder' | 'archive' | 'spam';
  folder_id?: string | null;
  enabled: boolean;
};
export function applyMailFilters(
  filters: MailFilter[],
  mail: { sender: string; subject: string; body: string },
) {
  const rule = filters.find(
    (rule) => rule.enabled && mail[rule.field].toLowerCase().includes(rule.contains.toLowerCase()),
  );
  return rule
    ? {
        skip: rule.action === 'skip',
        folder: rule.action === 'spam' ? 'spam' : rule.action === 'archive' ? 'archive' : 'inbox',
        folderId: rule.folder_id || null,
      }
    : null;
}
export function isAutomatedMail(sender: string, headers = '', subject = '') {
  return (
    /(^|[._-])(no[._-]?reply|mailer-daemon|postmaster)([.@_-]|$)/i.test(sender) ||
    /^(auto-submitted:\s*(?!no\b)\S+|list-id:|precedence:\s*(bulk|list))/im.test(headers) ||
    /unsubscribe|newsletter|password reset|verification code|security alert|invoice|payment receipt|github|cloud billing/i.test(
      subject,
    )
  );
}
export function isGmailCopy(headers = '') {
  return /^(delivered-to|x-forwarded-to|x-forwarded-for):[^\r\n]*elevate4humanityedu@gmail\.com/im.test(
    headers,
  );
}
export function isRelevantCopy(
  mail: { sender: string; subject: string; body: string; headers?: string },
  knownContact = false,
) {
  if (isAutomatedMail(mail.sender, mail.headers, mail.subject)) return false;
  return (
    knownContact ||
    /admission|application|applicant|enrollment|apprentice|barber|cosmetolog|esthetic|nail technician|host shop|program holder|workone|career navigator|student training|training program/i.test(
      mail.subject + ' ' + mail.body.slice(0, 4000),
    )
  );
}
export function canParisRespond(mail: {
  from: string;
  subject: string;
  headers?: string;
  replyTo?: string;
}) {
  const sender = parseEmailList(mail.from)[0] || '';
  return (
    !!sender &&
    !/@(?:[a-z0-9-]+\.)*elevateforhumanity\.org$/i.test(sender) &&
    !['elevate4humanityedu@gmail.com', 'elevateforhumanity@gmail.com'].includes(sender) &&
    !isAutomatedMail(sender, mail.headers, mail.subject)
  );
}
