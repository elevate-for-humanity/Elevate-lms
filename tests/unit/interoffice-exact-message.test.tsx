import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';
import { emailAlertUrl } from '@/lib/notifications/pwa-alert-settings';
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
