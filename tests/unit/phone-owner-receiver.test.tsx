import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { ProgramHolderPhoneReceiver } from '@/components/program-holder/ProgramHolderPhoneReceiver';
const mock = vi.hoisted(() => ({ path: '/host-shop/dashboard/apprentices', create: vi.fn(), handlers: {} as Record<string, (...args:any[])=>void> }));
vi.mock('next/navigation', () => ({ usePathname: () => mock.path }));
vi.mock('@/components/communications/DashboardVideoCalls', () => ({ DashboardVideoCalls: () => null }));
vi.mock('@/lib/phone/browser-client', () => ({ createPhoneClient: mock.create }));
beforeEach(() => {
  mock.path = '/host-shop/dashboard/apprentices'; mock.handlers = {}; mock.create.mockReset();
  localStorage.setItem('elevate-program-holder-phone-device','12345678901234567890123456789012');
  mock.create.mockResolvedValue({ on: (event:string, callback:any) => { mock.handlers[event] = callback; }, connect: async () => mock.handlers.ready(), disconnect: vi.fn().mockResolvedValue(undefined) });
  vi.stubGlobal('fetch', vi.fn(async (_url, options) => Response.json(options?.method === 'POST' ? { provider:'asterisk' } : { readOnly:false, extension:{ringMode:'ring'} })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('connects a host shop receiver and reports online only after its heartbeat succeeds', async () => {
 render(<ProgramHolderPhoneReceiver phoneHref="/host-shop/dashboard/phone" />);
 expect((await screen.findByRole('link',{name:'Work phone online'})).getAttribute('href')).toBe('/host-shop/dashboard/phone');
 expect(fetch).toHaveBeenCalledWith('/api/program-holder/phone/token',expect.objectContaining({body:JSON.stringify({deviceId:'12345678901234567890123456789012_receiver'})}));
});
it('does not enroll a device or send heartbeats in administrator previews', async () => {
 vi.mocked(fetch).mockResolvedValue(Response.json({readOnly:true,extension:{ringMode:'ring'}}));
 render(<ProgramHolderPhoneReceiver />);
 await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));
 expect(mock.create).not.toHaveBeenCalled();
});
it('leaves the host shop dial pad as the only phone client on its phone page', () => {
 mock.path='/host-shop/dashboard/phone'; render(<ProgramHolderPhoneReceiver phoneHref="/host-shop/dashboard/phone" />);
 expect(fetch).not.toHaveBeenCalled();
});
it('does not promote a disconnected client with a late heartbeat', async () => {
 let reply!:(value:Response)=>void;
 vi.mocked(fetch).mockImplementation(async (_url, options) => {
  if(options?.method==='PATCH') return new Promise<Response>(resolve=>{reply=resolve;});
  return Response.json(options?.method==='POST'?{}:{readOnly:false,extension:{ringMode:'ring'}});
 });
 render(<ProgramHolderPhoneReceiver />);
 await waitFor(()=>expect(reply).toBeTypeOf('function'));
 await act(async()=>{mock.handlers.offline(); reply(Response.json({}));});
 expect(screen.queryByText('Work phone online')).toBeNull();
});
it('mounts a host shop receiver only in the authenticated owner branch', () => {
 const source=readFileSync('apps/lms/app/host-shop/dashboard/layout.tsx','utf8');
 expect(source.match(/<ProgramHolderPhoneReceiver/g)).toHaveLength(1);
 expect(source.indexOf('<ProgramHolderPhoneReceiver')).toBeGreaterThan(source.indexOf('if (!partnerApproved) redirect'));
});
