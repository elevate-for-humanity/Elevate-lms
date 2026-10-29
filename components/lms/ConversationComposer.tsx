'use client';

import { useActionState, useState } from 'react';
import { Send } from 'lucide-react';

type SendResult = { error: string | null };
export default function ConversationComposer({ recipientId, action }: {
  recipientId: string;
  action: (formData: FormData) => Promise<SendResult>;
}) {
  const [content, setContent] = useState('');
  const [result, submit, pending] = useActionState(async (_previous: SendResult, formData: FormData): Promise<SendResult> => {
    try {
      return await action(formData);
    } catch (error) {
      // Next redirects are handled by the server action transport. A transport
      // failure can happen after a write; keep the draft and avoid claiming it
      // was definitely not delivered.
      if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) throw error;
      return { error: 'We could not confirm whether your message was sent. Review the conversation before trying again.' };
    }
  }, { error: null });

  return <form action={submit} aria-busy={pending} className="sticky bottom-0 border-t border-slate-200 bg-white py-4">
    {result.error && <p role="alert" id="conversation-send-error" className="mb-3 text-sm text-red-700">{result.error}</p>}
    <div className="flex gap-2">
      <input type="hidden" name="recipient_id" value={recipientId} />
      <textarea name="content" aria-label="Message" aria-describedby={result.error ? 'conversation-send-error' : undefined} required maxLength={5000} rows={2} value={content} onChange={event => setContent(event.target.value)} readOnly={pending} placeholder="Write a message…" className="min-w-0 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-blue-500" />
      <button type="submit" disabled={pending || !content.trim()} className="inline-flex items-center gap-2 self-end rounded-xl bg-brand-blue-600 px-5 py-3 font-bold text-white hover:bg-brand-blue-700 disabled:opacity-50"><Send className="h-4 w-4" />{pending ? 'Sending…' : 'Send'}</button>
    </div>
  </form>;
}
