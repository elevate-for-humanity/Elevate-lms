import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'How to Use Interoffice Email | Elevate LMS',
  robots: { index: false, follow: false },
};

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-black text-white">
        {n}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-7 text-slate-800">{children}</div>
    </section>
  );
}

export default async function InterofficeEmailHelpPage() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect('/login?redirect=%2Fcommunications%2Femail%2Fhelp');

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-700">
        Elevate Communications Hub
      </p>
      <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">
        How to Use Interoffice Email
      </h1>
      <p className="text-[15px] leading-7 text-slate-700">
        Interoffice Email is Elevate&apos;s own built-in email system, inside the Elevate app. It
        is <strong>not Gmail</strong> — you do not need a separate email app or a Google account
        to use it. Every active staff member, learner, and apprentice gets a personal Elevate
        mailbox automatically. Approved program holders and host shops get an organization mailbox
        automatically. A message you send to another Elevate person lands in their Interoffice
        Email inbox. A message to an outside address is also delivered as a regular email.
      </p>
      <p>
        <Link
          href="/communications/email"
          className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-5 text-sm font-black text-white"
        >
          Back to Email
        </Link>
      </p>

      <Section title="1. Open Interoffice Email">
        <ol className="space-y-3">
          <Step n={1}>Sign in to the Elevate app at app.elevateforhumanity.org with your Elevate account.</Step>
          <Step n={2}>
            In the menu, tap <strong>Interoffice Email</strong> (students and apprentices) or{' '}
            <strong>Email</strong> (host shops and program holders).
          </Step>
          <Step n={3}>Your inbox opens. Your own email address shows at the top of the page.</Step>
        </ol>
      </Section>

      <Section title="2. Read a message">
        <ol className="space-y-3">
          <Step n={1}>
            New messages appear at the top of the list. A <strong>blue dot</strong> next to a
            message means it is unread.
          </Step>
          <Step n={2}>Tap a conversation to open it. Opening it marks it as read.</Step>
          <Step n={3}>Tap the <strong>Refresh</strong> button (top right) to check for new mail.</Step>
        </ol>
        <p>
          <strong>Find an old message:</strong> type a name, a subject, or a word in the{' '}
          <strong>Search messages</strong> box at the top of the list and press Enter. Tap{' '}
          <strong>Clear</strong> to go back to the full list.
        </p>
      </Section>

      <Section title="3. Send a new email">
        <ol className="space-y-3">
          <Step n={1}>Tap the orange <strong>Compose</strong> button (top right).</Step>
          <Step n={2}>
            Choose who it goes to: tap the <strong>“Choose a student or office contact”</strong>{' '}
            dropdown and pick a name, <strong>or</strong> type an email address in the{' '}
            <strong>To</strong> box. You can add more than one person, separated by commas.
          </Step>
          <Step n={3}>
            Add people in <strong>Cc</strong> if you want them copied, or <strong>Bcc</strong> if
            you want them copied without the other recipients seeing their address.
          </Step>
          <Step n={4}>
            Type a <strong>Subject</strong> (required) — say what the email is about.
          </Step>
          <Step n={5}>Type your <strong>Message</strong>.</Step>
          <Step n={6}>
            To attach a file, tap <strong>Attach files</strong> and choose the file or files.
          </Step>
          <Step n={7}>
            Tap <strong>Send email</strong>. You will see “Email sent” (or a note that it was
            queued). Check the <strong>Sent</strong> folder to confirm it went out.
          </Step>
        </ol>
        <p>
          <strong>Tip:</strong> you can dictate your message instead of typing. Tap the
          microphone button in the compose window and speak. Your browser will ask for microphone
          permission the first time.
        </p>
      </Section>

      <Section title="4. Reply to a message">
        <ol className="space-y-3">
          <Step n={1}>Open the conversation.</Step>
          <Step n={2}>Tap the blue <strong>Reply</strong> button at the top.</Step>
          <Step n={3}>
            The recipient and subject are filled in for you (the subject starts with “Re:”). Type
            your reply and tap <strong>Send email</strong>.
          </Step>
        </ol>
      </Section>

      <Section title="5. Forward a message">
        <ol className="space-y-3">
          <Step n={1}>Open the conversation and tap <strong>Forward</strong>.</Step>
          <Step n={2}>
            Choose or type who should receive it, add a note if you like, and tap{' '}
            <strong>Send email</strong>.
          </Step>
          <Step n={3}>
            <strong>Note:</strong> the forwarded text comes along, but attached files do not.
            Download any file you want to forward and attach it again.
          </Step>
        </ol>
      </Section>

      <Section title="6. Save a draft">
        <p>
          Tap <strong>Save draft</strong> instead of Send. Find it later in the{' '}
          <strong>Drafts</strong> folder and tap it to keep writing.
        </p>
        <p>
          <strong>Note:</strong> files you attached are not saved with a draft. Attach them again
          when you reopen it.
        </p>
      </Section>

      <Section title="7. Organize your mail">
        <p>
          Your folders are listed on the left: <strong>Inbox, Starred, Sent, Drafts, Archive, All
          mail, Spam, Trash</strong>.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Star (flag) a message:</strong> tap the star next to a conversation. Find it
            later in <strong>Starred</strong>.
          </li>
          <li>
            <strong>Archive or delete:</strong> tick the checkbox next to one or more
            conversations, then tap the archive icon or the trash icon.
          </li>
          <li>
            <strong>Restore from Trash:</strong> open <strong>Trash</strong>, select the
            conversation, then choose <strong>Inbox / Restore</strong> from the “Move to…” menu.
            Messages in Trash stay recoverable.
          </li>
          <li>
            <strong>Make your own folder:</strong> tap <strong>New folder</strong>, give it a
            name, and move conversations into it with the “Move to…” menu.
          </li>
          <li>
            <strong>Automatic filing:</strong> tap <strong>Filters &amp; copy rules</strong> to
            set a rule — for example, anything with a word in the subject goes to a folder
            automatically. Rules never delete the original email.
          </li>
        </ul>
      </Section>

      <Section title="8. If you have more than one mailbox">
        <p>
          Some people have more than one mailbox — for example, a personal mailbox and a shop
          mailbox. They are listed on the left under <strong>Mailboxes</strong>. Tap one to switch
          to it. The address you are sending from always shows at the top of the page and in the
          compose window.
        </p>
      </Section>

      <Section title="9. If something is wrong">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>“Email could not be loaded”</strong> — tap <strong>Retry email</strong>. If it
            keeps failing, sign out and sign back in.
          </li>
          <li>
            <strong>“No active Elevate mailbox”</strong> — you do not have a mailbox yet. Active
            staff, learners, and apprentices get one automatically; program holders and host shops
            get theirs when approved. If you should have one, contact the office.
          </li>
          <li>
            <strong>“Send result is unknown”</strong> — <strong>refresh before sending again</strong>,
            so you do not send the same email twice.
          </li>
          <li>
            <strong>“Administrator preview is read-only”</strong> — you are looking at someone
            else&apos;s mailbox as a preview. Sign in with the account that owns the mailbox to
            send email.
          </li>
          <li>
            <strong>A message says “Delivery failed”</strong> — check the address and try again.
            If it keeps failing, contact the office.
          </li>
          <li>
            <strong>A message you expected is not there</strong> — tap <strong>Refresh</strong>,
            then check <strong>Spam</strong> and <strong>All mail</strong>. If it is still missing,
            ask the sender to resend it.
          </li>
        </ul>
      </Section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
        <h2 className="text-base font-black text-slate-950">Need help?</h2>
        <p className="mt-2">
          Elevate for Humanity · 120 East Market Street, Suite 930, Indianapolis, IN 46204
          <br />
          admissions@elevateforhumanity.org · (463) 240-1404
        </p>
      </section>
    </main>
  );
}
