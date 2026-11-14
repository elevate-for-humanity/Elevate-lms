import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act, waitFor } from '@testing-library/react';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';
import { emailAlertUrl, alertPresentation } from '@/lib/notifications/pwa-alert-settings';
const mailboxId='25235365-1df4-4bee-b904-f615196c517b';
const threadId='4ce8b846-2ffd-48ae-81af-6869a27ca57b';
afterEach(()=>{ cleanup(); vi.unstubAllGlobals(); });
const data=(id=mailboxId)=>({mailboxes:[{id:mailboxId,address:'info@example.org',displayName:'Information',mailboxKind:'department'},{id:'second',address:'support@example.org',displayName:'Support',mailboxKind:'department'}],selectedMailboxId:id,threads:[],folders:[],filters:[],drafts:[]});
it('loads the exact mailbox and thread supplied by the notification',async()=>{
 const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>data()});vi.stubGlobal('fetch',fetch);
 render(<EmailWorkspace initialMailboxId={mailboxId} initialThreadId={threadId}/>);
 await screen.findByText('Information');
 const url=new URL(fetch.mock.calls[0][0],'https://app.example.org');
 expect(url.searchParams.get('mailboxId')).toBe(mailboxId);
 expect(url.searchParams.get('threadId')).toBe(threadId);
});
it('discards an old mailbox response when a newer selection has finished',async()=>{
 let finishOld:(value:any)=>void=()=>{};
 const fetch=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>data()})
 .mockImplementationOnce(()=>new Promise(resolve=>{finishOld=resolve;}))
 .mockResolvedValueOnce({ok:true,json:async()=>data('second')});vi.stubGlobal('fetch',fetch);
 render(<EmailWorkspace initialMailboxId={mailboxId}/>);await screen.findByText('Information');
 fireEvent.click(screen.getByRole('button',{name:'Refresh'}));
 fireEvent.click(screen.getByRole('button',{name:/Support/}));
 await act(async()=>{});
 await act(async()=>finishOld({ok:true,json:async()=>data()}));
 expect(screen.getByRole('button',{name:/Support/})).toHaveClass('bg-blue-700');
});
it('preserves mailbox and thread on admin push links without trusting arbitrary destinations',()=>{
 const notice={action_url:`https://app.elevateforhumanity.org/communications/email?mailboxId=${mailboxId}&threadId=${threadId}`};
 const url=new URL(emailAlertUrl(notice,true));
 expect(url.origin).toBe('https://admin.elevateforhumanity.org');
 expect(url.searchParams.get('threadId')).toBe(threadId);
 expect(url.searchParams.get('mailboxId')).toBe(mailboxId);
 expect(emailAlertUrl({action_url:'https://evil.example/communications/email?mailboxId='+mailboxId},false)).toBe('https://app.elevateforhumanity.org/communications/email');
});

it('shows a readable authorized email preview and retains the exact secure deep link',()=>{
 const notice={
   metadata:{alert_kind:'email',sender_email:'student@example.com',subject:'Nail technician reply',preview:'I need a training location.',mailbox_id:mailboxId,thread_id:threadId},
   action_url:'https://app.elevateforhumanity.org/communications/email',
 };
 const presentation=alertPresentation(notice,'email');
 expect(presentation.title).toContain('student@example.com');
 expect(presentation.body).toContain('I need a training location.');
 const destination=new URL(emailAlertUrl(notice,true));
 expect(destination.pathname).toBe('/phone/email');
 expect(destination.searchParams.get('mailboxId')).toBe(mailboxId);
 expect(destination.searchParams.get('threadId')).toBe(threadId);
});

it('persists the new sent conversation ID so a refresh cannot reopen the previous email', async () => {
  const sentThread = 'e6f0b16d-374e-4712-8627-25a09bc08012';
  window.history.replaceState(null, '', `/communications/email?mailboxId=${mailboxId}&threadId=${threadId}`);
  const fetch = vi.fn(async (url: string, options?: { method?: string }) => {
    if (options?.method === 'POST') {
      return { ok: true, json: async () => ({ threadId: sentThread }) };
    }
    const requestedThread = new URL(String(url), 'https://app.elevateforhumanity.org').searchParams.get('threadId');
    return { ok: true, json: async () => ({
      ...data(),
      readOnly: false,
      selectedThread: requestedThread
        ? { id: requestedThread, subject: 'Conversation', messages: [] }
        : null,
    }) };
  });
  vi.stubGlobal('fetch', fetch);
  const view = render(<EmailWorkspace initialMailboxId={mailboxId} initialThreadId={threadId} />);
  await screen.findByText('Information');
  fireEvent.click(screen.getByRole('button', { name: /Compose/ }));
  fireEvent.change(screen.getByRole('textbox', { name: 'To' }), { target: { value: 'student@example.com' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Subject' }), { target: { value: 'New conversation' } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Message' }), { target: { value: 'Requested information' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send email' }));
  await waitFor(() => expect(new URL(window.location.href).searchParams.get('threadId')).toBe(sentThread));
  expect(new URL(window.location.href).searchParams.get('mailboxId')).toBe(mailboxId);
  view.unmount();
  const resumed = new URL(window.location.href);
  render(<EmailWorkspace
    initialMailboxId={resumed.searchParams.get('mailboxId') || undefined}
    initialThreadId={resumed.searchParams.get('threadId') || undefined}
  />);
  await waitFor(() => expect(fetch.mock.calls.some(([url]) =>
    String(url).includes(`threadId=${sentThread}`)
  )).toBe(true));
});
