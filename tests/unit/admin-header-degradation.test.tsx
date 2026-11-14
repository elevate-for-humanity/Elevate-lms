import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AdminNavShell } from '@/components/admin/AdminNavShell';
vi.mock('@/components/admin/AdminNav',()=>({default:({notifs}:any)=><nav>{notifs.map((n:any)=><span key={n.id}>{n.title}</span>)}</nav>}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('admin header failure handling',()=>{
 it('shows incomplete notification data instead of implying no pending work',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>({ok:true,json:async()=>url.includes('header-data')?{status:'degraded',userName:'Admin',notifs:[]}:{sections:[]}})));
  render(<AdminNavShell navSections={[]}/>);
  expect(await screen.findByRole('status')).toHaveTextContent('Notification counts are incomplete.');
 });
 it('shows a failed request and recovers through the retry control',async()=>{
  let fail=true;
  vi.stubGlobal('fetch',vi.fn(async(url:string)=>url.includes('header-data')?{ok:!fail,json:async()=>({status:'ok',notifs:[{id:'pending',title:'3 applications pending'}]})}:{ok:true,json:async()=>({sections:[]})}));
  render(<AdminNavShell navSections={[]}/>);
  expect(await screen.findByRole('status')).toHaveTextContent('could not load');
  fail=false;fireEvent.click(screen.getByRole('button',{name:'Retry notifications'}));
  expect(await screen.findByText('3 applications pending')).toBeInTheDocument();
  await waitFor(()=>expect(screen.queryByRole('status')).toBeNull());
 });
 it('treats malformed success responses as unavailable',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({})})));
  render(<AdminNavShell navSections={[]}/>);
  expect(await screen.findByRole('status')).toHaveTextContent('could not load');
 });
});
