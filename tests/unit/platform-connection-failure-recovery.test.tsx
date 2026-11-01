import {afterEach,describe,it,expect,vi} from 'vitest';
import {cleanup,render,screen,fireEvent,waitFor} from '@testing-library/react';
import AuditLogs from '@/apps/admin/app/audit-logs/PageClient';
import Incentives from '@/apps/admin/app/incentives/PageClient';
import JobMatch from '@/apps/lms/app/ai/job-match/JobMatchClient';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status});
describe('connection errors remain distinct from empty platform data',()=>{
 it.each([{Component:AuditLogs,key:'logs',title:'Audit Logs'},{Component:Incentives,key:'incentives',title:'Employer Incentives'}])('$title surfaces failure and retries the real request',async({Component,key,title})=>{
  const fetch=vi.fn().mockResolvedValueOnce(json({error:'unavailable'},503)).mockResolvedValueOnce(json({[key]:[]}));
  vi.stubGlobal('fetch',fetch);render(<Component/>);
  expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
  expect(screen.queryByRole('heading',{name:title})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Retry'}));
  expect(await screen.findByRole('heading',{name:title})).toBeVisible();
  expect(fetch).toHaveBeenCalledTimes(2);
 });
 it.each([503,200])('job matching rejects an unavailable or invalid response (%s) and supports retry',async status=>{
  const fetch=vi.fn().mockResolvedValueOnce(json({error:'not a matches receipt'},status)).mockResolvedValueOnce(json({matches:[]}));
  vi.stubGlobal('fetch',fetch);render(<JobMatch/>);
  fireEvent.change(screen.getByPlaceholderText(/CNA certification/),{target:{value:'Customer service'}});
  fireEvent.click(screen.getByRole('button',{name:/Find|Match/i}));
  expect(await screen.findByRole('alert')).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:/Find|Match/i}));
  await waitFor(()=>expect(screen.queryByRole('alert')).toBeNull());
  expect(fetch).toHaveBeenCalledTimes(2);
 });
});
